const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2600)}
