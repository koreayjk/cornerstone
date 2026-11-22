import os, sys, json
from PIL import Image, ImageOps
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from grade import grade
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
files = {f.split('.')[0]: f for f in os.listdir(src)}
ROT = {'4551': 90}
# slug: (source id, kind, vertical focus 0..1)
JOBS = {
 'hero-about': ('5169', 'hero', .45), 'hero-academics': ('4986', 'hero', .5), 'hero-enrichment': ('4638', 'hero', .35),
 'hero-admissions': ('4971', 'hero', .45), 'hero-student-life': ('5351', 'hero', .45),
 'school-1': ('4636', 'pic', .5), 'school-2': ('3123', 'pic', .45), 'accreditation': ('4000', 'wide', .4), 'pack': ('4987', 'wide', .5),
 'program-1': ('5294', 'pic', .5), 'program-2': ('5237', 'pic', .5), 'kinder-1': ('5240', 'pic', .5), 'kinder-2': ('5039', 'pic', .5),
 'g15-1': ('5241', 'pic', .5), 'g15-2': ('4010', 'pic', .5), 'athletics-1': ('5350', 'pic', .5), 'athletics-2': ('4821', 'pic', .35),
 'afternoons': ('4984', 'wide', .5), 'art-1': ('4008', 'pic', .4), 'art-2': ('4977', 'pic', .5), 'music-1': ('4005', 'pic', .35), 'music-2': ('4001', 'pic', .5),
 'apply': ('4009', 'wide', .3), 'uniforms': ('4923', 'wide', .5), 'chapel': ('5037', 'tall', .5), 'character': ('5034', 'wide', .5),
 'trips': ('5235', 'wide', .5), 'service-1': ('4551', 'pic', .35), 'service-2': ('5234', 'pic', .5),
}
ZOOM = {'hero': .94, 'pic': .88, 'wide': .9, 'tall': .92}
RATIO = {'hero': 1344 / 752, 'pic': 4 / 3, 'wide': 16 / 10, 'tall': 4 / 5}
WIDTHS = {'hero': (800, 1344), 'pic': (800, 1200), 'wide': (800, 1200), 'tall': (800, 1200)}
report = {}
for slug, (sid, kind, fy) in JOBS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(src, files[sid]))).convert('RGB')
    if sid in ROT: im = im.rotate(ROT[sid], expand=True)
    r = RATIO[kind]; w, h = im.size
    if w / h > r:   # too wide: crop sides (centered)
        nw = round(h * r); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    else:           # too tall: crop top/bottom around the focus
        nh = round(w / r); y = max(0, min(h - nh, round(h * fy - nh / 2))); im = im.crop((0, y, w, y + nh))
    z = ZOOM[kind]; cw, ch = round(im.width * z), round(im.height * z)
    cy = min(max(round(im.height * fy), ch // 2), im.height - ch // 2) if kind != 'hero' else im.height // 2
    im = im.crop(((im.width - cw) // 2, cy - ch // 2, (im.width - cw) // 2 + cw, cy - ch // 2 + ch))
    if im.width > 1600: im = im.resize((1600, round(1600 / r)), Image.LANCZOS)
    im = grade(im)
    sizes = []
    for tw in WIDTHS[kind]:
        tw2 = min(tw, im.width)
        v = im.resize((tw2, round(tw2 / r)), Image.LANCZOS)
        v.save(f'{out}/{slug}-{tw}.avif', quality=55)
        v.save(f'{out}/{slug}-{tw}.webp', quality=78, method=6)
        sizes.append(tw2)
    report[slug] = (kind, im.width, sizes)
for k, v in report.items(): print(k, v)
