// Real PDF for issued documents (demo). Builds a US Letter letterhead PDF in the browser
// from docContent(r) in demo.js, using pdf-lib (loaded on first use, version pinned).
// Documents are official English records, so pdf-lib's standard fonts (WinAnsi) suffice.
// In production the office generates the PDF once, stores it in the private `documents`
// bucket and families download it through a signed URL (see supabase/README.md).
const PDFLIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
let pdfLibLoading = null;
function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!pdfLibLoading) pdfLibLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PDFLIB_URL; s.crossOrigin = 'anonymous';
    s.onload = () => res(window.PDFLib); s.onerror = () => { pdfLibLoading = null; rej(new Error('pdf-lib failed to load')) };
    document.head.appendChild(s);
  });
  return pdfLibLoading;
}

// the crest (#crest SVG symbol) rendered to PNG for the letterhead and the seal
function crestPng(scale = 6) {
  const sym = document.getElementById('crest');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 52" width="${44 * scale}" height="${52 * scale}">${sym.innerHTML}</svg>`;
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 44 * scale; c.height = 52 * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? b.arrayBuffer().then(res, rej) : rej(new Error('crest render failed')), 'image/png');
    };
    img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

async function buildDocPdf(c) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const doc = await PDFDocument.create();
  doc.setTitle(`${c.type} — ${c.ref}`); doc.setAuthor(c.school); doc.setSubject(c.type);
  doc.setCreator('Cornerstone Family Portal (demo)'); doc.setCreationDate(new Date());
  const page = doc.addPage([612, 792]); // US Letter
  const F = {
    serif: await doc.embedFont(StandardFonts.TimesRoman), serifB: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifI: await doc.embedFont(StandardFonts.TimesRomanItalic),
    sans: await doc.embedFont(StandardFonts.Helvetica), sansB: await doc.embedFont(StandardFonts.HelveticaBold)
  };
  const ink = rgb(0.11, 0.11, 0.12), muted = rgb(0.43, 0.43, 0.45), navy = rgb(0.04, 0.04, 0.05), gold = rgb(201 / 255, 161 / 255, 59 / 255);
  const L = 72, R = 612 - 72, W = R - L;
  let y = 792 - 64;

  // letterhead
  const crest = await doc.embedPng(await crestPng());
  page.drawImage(crest, { x: L, y: y - 40, width: 34, height: 40 });
  page.drawText(c.school, { x: L + 46, y: y - 16, size: 13, font: F.sansB, color: navy });
  page.drawText(c.address, { x: L + 46, y: y - 31, size: 8.5, font: F.sans, color: muted });
  y -= 54;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1.5, color: gold });

  // date and reference, right-aligned
  y -= 34;
  const right = (text, size, font, color) => page.drawText(text, { x: R - font.widthOfTextAtSize(text, size), y, size, font, color });
  right(c.date, 11, F.serif, ink); y -= 14;
  right(`Ref. ${c.ref}`, 9, F.sans, muted);

  // title
  y -= 42;
  const tw = F.sansB.widthOfTextAtSize(c.title, 15);
  page.drawText(c.title, { x: L + (W - tw) / 2, y, size: 15, font: F.sansB, color: navy });

  // paragraphs: runs of {t, b} wrapped to the text width, bold where marked
  const size = 11.5, lead = 18;
  const paragraph = runs => {
    const words = [];
    runs.forEach(r => r.t.split(/(\s+)/).forEach(w => { if (w) words.push({ w, f: r.b ? F.serifB : F.serif }) }));
    let line = [], width = 0;
    const flush = () => {
      let x = L;
      while (line.length && /^\s+$/.test(line[line.length - 1].w)) line.pop();
      line.forEach(p => { page.drawText(p.w, { x, y, size, font: p.f, color: ink }); x += p.f.widthOfTextAtSize(p.w, size) });
      y -= lead; line = []; width = 0;
    };
    words.forEach(p => {
      const ww = p.f.widthOfTextAtSize(p.w, size);
      if (!line.length && /^\s+$/.test(p.w)) return;
      if (width + ww > W && line.length) flush();
      if (!line.length && /^\s+$/.test(p.w)) return;
      line.push(p); width += ww;
    });
    if (line.length) flush();
    y -= 8;
  };
  y -= 40;
  paragraph([{ t: c.salutation }]);
  c.body.forEach(paragraph);
  paragraph([{ t: c.closing }]);

  // signature and seal
  y -= 18;
  page.drawText('Sincerely,', { x: L, y, size, font: F.serif, color: ink });
  const sigY = y - 40;
  page.drawText(c.signer, { x: L, y: sigY, size: 22, font: F.serifI, color: navy });
  page.drawLine({ start: { x: L, y: sigY - 10 }, end: { x: L + 250, y: sigY - 10 }, thickness: 0.6, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(c.signerLine, { x: L, y: sigY - 24, size: 8.5, font: F.sans, color: muted });
  const cx = R - 52, cy = sigY + 10;
  page.drawCircle({ x: cx, y: cy, size: 46, borderColor: gold, borderWidth: 1.5 });
  page.drawImage(crest, { x: cx - 10, y: cy + 6, width: 20, height: 24 });
  [['OFFICIAL SEAL', 6.5, cy - 8], ['CORNERSTONE', 6.5, cy - 17], ['· 2002 ·', 6.5, cy - 26]].forEach(([s, z, yy]) =>
    page.drawText(s, { x: cx - F.sansB.widthOfTextAtSize(s, z) / 2, y: yy, size: z, font: F.sansB, color: gold }));

  // demo notice
  const dw = F.sans.widthOfTextAtSize(c.demo, 8);
  page.drawText(c.demo, { x: (612 - dw) / 2, y: 48, size: 8, font: F.sans, color: muted });
  return doc.save();
}

async function downloadDocPdf(id, btn) {
  const r = S.requests.find(x => x.id === id), c = docContent(r);
  if (btn) btn.disabled = true;
  try {
    const bytes = await buildDocPdf(c);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = c.file;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(t('docm.pdfDone'));
  } catch (e) {
    console.warn(e); toast(t('docm.pdfFail'));
  } finally { if (btn) btn.disabled = false }
}
