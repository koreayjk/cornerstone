const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// lazy background images: <div class="img" data-bg="img/x.jpg">
const bgo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const el = e.target; el.style.backgroundImage = `url(${el.dataset.bg})`; bgo.unobserve(el) } }), { rootMargin: '600px 600px 600px 600px' });
$$('[data-bg]').forEach(el => bgo.observe(el));
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18});
$$('.rv').forEach(el=>io.observe(el));
// statement: split into words that light up on scroll; data-g lists the gold words
// (per language via data-i18n-g). Chinese has no spaces, so it is split with
// Intl.Segmenter, falling back to single characters.
$$('.lit').forEach(p=>{p.dataset.gEn=p.dataset.g||''});
function splitLit(){
const lang=typeof I18N!=='undefined'?I18N.lang:'en', zh=lang==='zh';
$$('.lit').forEach(p=>{
const g=(lang!=='en'&&p.dataset.i18nG?t(p.dataset.i18nG):p.dataset.gEn).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const txt=p.textContent.trim();
const seg=s=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('zh',{granularity:'word'}).segment(s)].map(x=>x.segment):[...s];
// zh: keep each gold word whole (the segmenter may split it), segment the rest
const words=zh?txt.split(new RegExp(`(${g.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')||'$^'})`)).flatMap(part=>g.includes(part)?[part]:seg(part)).filter(Boolean):txt.split(/\s+/);
const esc=w=>w.replace(/&/g,'&amp;').replace(/</g,'&lt;');
p.innerHTML=words.map(w=>`<span class="w${g.some(x=>w.toLowerCase().startsWith(x))?' g':''}">${esc(w)}</span>`).join(zh?'':' ')});
}
splitLit();
function onScroll(){
const vh=innerHeight;
$('#nav').classList.toggle('solid',scrollY>40);
// reduced motion: every word lit, no zoom; captions still follow scroll position
$$('.lit').forEach(p=>{const r=p.getBoundingClientRect();const prog=reduceMotion?1:Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));const ws=p.querySelectorAll('.w');const n=Math.floor(prog*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))});
$$('.scene').forEach(sc=>{const r=sc.getBoundingClientRect();const prog=Math.min(1,Math.max(0,-r.top/(r.height-vh)));
if(!reduceMotion)sc.querySelector('.bg').style.transform=`scale(${1.18-prog*.18})`;
sc.querySelector('.shade').style.background=`rgba(0,0,0,${.2+prog*.35})`;
const caps=[...sc.querySelectorAll('.cap>div')];let cur=-1;caps.forEach((c,i)=>{if(prog>=+c.dataset.at-.1)cur=i});caps.forEach((c,i)=>c.classList.toggle('on',i===cur))});
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
function slide(d){const t=$('#track');t.scrollBy({left:d*(t.querySelector('.tile').offsetWidth+20),behavior:reduceMotion?'auto':'smooth'})}
// smooth anchors; also move focus so keyboard and screen-reader users land in the section
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');const el=id.length>1&&$(id);if(el){e.preventDefault();el.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');el.focus({preventScroll:true})}}));
// videos play only while on screen; with reduced motion the still poster stays instead
const vo=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play().catch(()=>{})}else v.pause()}),{threshold:.05});
$$('video').forEach(v=>{if(reduceMotion){v.autoplay=false;v.pause();v.preload='none';v.style.display='none'}else vo.observe(v)});
// mobile menu
function openMenu(){const m=$('#mnav');m._back=document.activeElement;m.classList.add('open');$('.burger').setAttribute('aria-expanded','true');m.querySelector('.mclose').focus()}
function closeMenu(){const m=$('#mnav');if(!m.classList.contains('open'))return;m.classList.remove('open');$('.burger').setAttribute('aria-expanded','false');if(m._back&&m._back.focus)m._back.focus()}
addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
// language change: re-split the statement and refresh scroll-driven state
if(typeof I18N!=='undefined')I18N.onChange(()=>{splitLit();onScroll()});
