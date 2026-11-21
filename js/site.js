// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18});
$$('.rv').forEach(el=>io.observe(el));
// statement word split
$$('.lit').forEach(p=>{const g=(p.dataset.g||'').split(',');p.innerHTML=p.textContent.trim().split(/\s+/).map(w=>`<span class="w${g.some(x=>x&&w.toLowerCase().startsWith(x))?' g':''}">${w}</span>`).join(' ')});
function onScroll(){
const vh=innerHeight;
$('#nav').classList.toggle('solid',scrollY>40);
$$('.lit').forEach(p=>{const r=p.getBoundingClientRect();const prog=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));const ws=p.querySelectorAll('.w');const n=Math.floor(prog*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))});
$$('.scene').forEach(sc=>{const r=sc.getBoundingClientRect();const prog=Math.min(1,Math.max(0,-r.top/(r.height-vh)));
sc.querySelector('.bg').style.transform=`scale(${1.18-prog*.18})`;
sc.querySelector('.shade').style.background=`rgba(0,0,0,${.2+prog*.35})`;
const caps=[...sc.querySelectorAll('.cap>div')];let cur=-1;caps.forEach((c,i)=>{if(prog>=+c.dataset.at-.1)cur=i});caps.forEach((c,i)=>c.classList.toggle('on',i===cur))});
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
function slide(d){const t=$('#track');t.scrollBy({left:d*(t.querySelector('.tile').offsetWidth+20),behavior:'smooth'})}
// smooth anchor
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id.length>1&&$(id)){e.preventDefault();$(id).scrollIntoView({behavior:'smooth'})}}));
// pause offscreen videos
const vo=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){v.play&&v.play().catch(()=>{})}else v.pause&&v.pause()}),{threshold:.05});
$$('video').forEach(v=>vo.observe(v));
