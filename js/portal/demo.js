const S={
role:null, view:'home', thread:0,
student:{name:'Grace Kim',grade:'Grade 10',id:'CCA-2026-0142',dob:'March 14, 2011',entered:'August 2024'},
announcements:[
{id:1,title:'Christmas Program & Lessons and Carols',date:'Nov 18',tag:'Event',aud:'All Families',body:'Join us Thursday, December 4 at 6:30 PM in the Sanctuary. Students should arrive by 6:00 PM in Sunday dress. Please RSVP by Nov 28.',read:false},
{id:2,title:'Thanksgiving Break — No School Nov 24–28',date:'Nov 15',tag:'Urgent',aud:'All Families',body:'Campus will be closed for Thanksgiving Break. Classes resume Monday, December 1. Residential students: dormitory schedule has been sent separately.',read:false},
{id:3,title:'Upper School Semester Exam Schedule',date:'Nov 10',tag:'Academics',aud:'Upper School',body:'Semester exams run December 15–18. A detailed schedule and study guides are posted in each course.',read:true},
],
grades:[
{c:'English II (Honors)',t:'Mrs. Taylor',g:'A',p:96},{c:'Algebra II',t:'Mr. Collins',g:'A-',p:92},{c:'Biology',t:'Dr. Reyes',g:'A',p:95},
{c:'World History',t:'Mr. Bennett',g:'B+',p:89},{c:'Bible: Life of Christ',t:'Pastor Hale',g:'A',p:98},{c:'Spanish II',t:'Sra. Morales',g:'A-',p:91}
],
attendance:{present:62,absent:1,tardy:0},
events:[{d:'04',m:'DEC',t:'Christmas Program',s:'6:30 PM · Sanctuary'},{d:'15',m:'DEC',t:'Semester exams begin',s:'Upper School'},{d:'19',m:'DEC',t:'Christmas break begins',s:'Noon dismissal'},{d:'06',m:'FEB',t:'Parent–Teacher Conferences',s:'Book a time slot'}],
docTypes:['Enrollment Verification Letter','Certificate of Attendance','Official Transcript','Report Card (Certified Copy)','Letter of Good Standing','Immunization Record Copy','I-20 Support Letter (International)'],
requests:[
{id:101,type:'Enrollment Verification Letter',purpose:'Visa / consulate',lang:'English',copies:1,date:'Nov 12',status:2,by:'The Kim Family'},
{id:102,type:'Official Transcript',purpose:'Summer program application',lang:'English',copies:2,date:'Nov 17',status:1,by:'The Kim Family'},
],
threads:[
{with:'Mrs. Sarah Taylor',role:'English II · Homeroom',ini:'ST',unreadP:true,unreadT:false,msgs:[
{from:'teacher',text:'Hello Mr. and Mrs. Kim — Grace’s essay on Hebrews 11 was outstanding. I’d love to enter it in the regional writing competition. May I?',time:'Nov 18 · 3:12 PM'}]},
{with:'Front Office',role:'Administration',ini:'FO',unreadP:false,unreadT:false,msgs:[
{from:'teacher',text:'Your Enrollment Verification Letter is ready to download in Documents.',time:'Nov 14 · 10:02 AM'},
{from:'parent',text:'Thank you so much!',time:'Nov 14 · 10:40 AM'}]},
{with:'Mr. Collins',role:'Algebra II',ini:'MC',unreadP:false,unreadT:false,msgs:[
{from:'parent',text:'Could Grace get extra practice for the Unit 4 test?',time:'Nov 6 · 7:15 PM'},
{from:'teacher',text:'Absolutely — I’ve posted a practice set and I’m available Tuesdays after school.',time:'Nov 7 · 8:01 AM'}]}
]
};
const STEPS=['Submitted','In review','Ready'];
const ICON={
home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
ann:'<path d="M4 10v4h3l6 4V6L7 10H4zM17 9a4 4 0 0 1 0 6"/>',
msg:'<path d="M4 5h16v11H8l-4 4z"/>',
acad:'<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"/>',
doc:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
cal:'<path d="M4 6h16v15H4zM4 10h16M8 3v5M16 3v5"/>',
inbox:'<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5"/>'
};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${ICON[k]}</svg>`;
function navItems(){
if(S.role==='parent'){
const ua=S.announcements.filter(a=>!a.read).length, um=S.threads.filter(t=>t.unreadP).length, rd=S.requests.filter(r=>r.status===2&&!r.dl).length;
return [['home','Home','home'],['ann','Announcements','ann',ua],['msg','Messages','msg',um],['acad','Academics','acad'],['doc','Documents','doc',rd],['cal','Calendar','cal']];
}
const pend=S.requests.filter(r=>r.status<2).length, um=S.threads.filter(t=>t.unreadT).length;
return [['home','Dashboard','home'],['ann','Post Notice','ann'],['msg','Messages','msg',um],['doc','Requests','inbox',pend],['acad','Gradebook','acad']];
}
function renderNav(){
const items=navItems();
const html=items.map(([k,l,i,c])=>`<button class="${S.view===k?'on':''}" onclick="go('${k}')">${ic(i)}<span>${l}</span>${c?`<span class="ct">${c}</span>`:''}</button>`).join('');
document.getElementById('pnav').innerHTML=html;
document.getElementById('mtab').innerHTML=items.slice(0,5).map(([k,l,i,c])=>`<button class="${S.view===k?'on':''}" onclick="go('${k}')">${ic(i)}<span>${l.split(' ')[0]}</span>${c?`<span class="ct">${c}</span>`:''}</button>`).join('');
}
function go(v){S.view=v;render();document.getElementById('pmain').scrollTop=0}
function closeLogin(){document.getElementById('login').classList.remove('open')}
function enter(r){S.role=r;S.view='home';closeLogin();document.getElementById('portal').classList.add('open');document.body.style.overflow='hidden';
document.getElementById('meAv').textContent=r==='parent'?'KF':'ST';document.getElementById('meAv').style.background=r==='parent'?'var(--gold)':'var(--navy3)';
document.getElementById('meName').textContent=r==='parent'?'The Kim Family':'Mrs. Sarah Taylor';document.getElementById('meRole').textContent=r==='parent'?'Parent · Grace, Gr. 10':'Teacher · Upper School';
render();toast(r==='parent'?'Signed in as Parent (demo)':'Signed in as Teacher (demo)')}
function switchRole(){enter(S.role==='parent'?'teacher':'parent')}
function exitPortal(){location.href='../'}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tagCls=t=>t==='Urgent'?'urgent':t==='Event'?'gold':t==='Academics'?'':'green';
function render(){
renderNav();
const titles={home:S.role==='parent'?'Home':'Dashboard',ann:S.role==='parent'?'Announcements':'Post a Notice',msg:'Messages',acad:S.role==='parent'?'Academics':'Gradebook',doc:S.role==='parent'?'Documents & Certificates':'Document Requests',cal:'Calendar'};
document.getElementById('ptitle').textContent=titles[S.view];
const b=document.getElementById('pbody');
b.innerHTML=(S.role==='parent'?P:T)[S.view]();
}

const P={
home(){
const ua=S.announcements.filter(a=>!a.read).length;
const avg=Math.round(S.grades.reduce((a,g)=>a+g.p,0)/S.grades.length);
const att=S.attendance; const pct=(att.present/(att.present+att.absent)*100).toFixed(0);
return `
<div class="welcome"><div class="img" style="background-image:url(../img/3.jpg)"></div>
<div class="eyebrow">Good afternoon</div><h2>Welcome back, Kim Family.</h2>
<p>${S.student.name} · ${S.student.grade} · Student ID ${S.student.id}</p>
<div class="qa"><button onclick="go('doc')">Request a certificate</button><button onclick="go('msg')">Message a teacher</button><button onclick="go('acad')">View grades</button></div></div>
<div class="grid3" style="margin-bottom:24px">
<div class="box kpi"><span>Average</span><b>${avg}%</b><small>Across ${S.grades.length} courses</small></div>
<div class="box kpi"><span>Attendance</span><b>${pct}%</b><small>${att.absent} absence this semester</small></div>
<div class="box kpi"><span>Unread notices</span><b>${ua}</b><small><a href="#" onclick="go('ann');return false" style="color:var(--gold)">Read now →</a></small></div>
</div>
<div class="grid2">
<div class="box"><h3>Latest announcements</h3><div class="sub">From the school office and teachers</div>${S.announcements.slice(0,3).map(annRow).join('')}</div>
<div class="box"><h3>Upcoming</h3><div class="sub">School calendar</div><div class="cal">${S.events.map(e=>`<p><span class="dd">${e.d}<small>${e.m}</small></span><span><b style="font-weight:600">${e.t}</b><br><small style="color:var(--muted)">${e.s}</small></span></p>`).join('')}</div></div>
</div>`;
},
ann(){return `<div class="box">${S.announcements.map(a=>{a.read=true;return annRow(a,true)}).join('')||'<div class="empty">No announcements</div>'}</div>`},
msg(){return msgView('parent')},
acad(){
const att=S.attendance;
return `<div class="grid2"><div class="box"><h3>Fall Semester 2026</h3><div class="sub">${S.student.name} · ${S.student.grade} · Updated daily</div>
<div class="tbl-wrap"><table><tr><th>Course</th><th>Teacher</th><th>Progress</th><th>Grade</th></tr>
${S.grades.map(g=>`<tr><td><b style="font-weight:600">${g.c}</b></td><td style="color:var(--muted)">${g.t}</td><td><div class="bar2"><i style="width:${g.p}%"></i></div><small style="color:var(--muted)">${g.p}%</small></td><td class="grade">${g.g}</td></tr>`).join('')}
</table></div></div>
<div><div class="box kpi" style="margin-bottom:18px"><span>Present</span><b>${att.present}</b><small>days this semester</small></div>
<div class="box kpi" style="margin-bottom:18px"><span>Absent · Tardy</span><b>${att.absent} · ${att.tardy}</b><small>1 excused absence (Oct 9)</small></div>
<div class="box"><h3>Need a report?</h3><div class="sub">Request a certified report card or transcript.</div><button class="sbtn gold" onclick="go('doc')">Request document</button></div></div></div>`;
},
doc(){
return `<div class="grid2">
<div class="box"><h3>Request a document</h3><div class="sub">Issued by the school office, usually within 1–2 business days.</div>
<label>Document type</label><select id="rqType">${S.docTypes.map(d=>`<option>${d}</option>`).join('')}</select>
<div class="row2"><div><label>Purpose</label><input id="rqPurpose" placeholder="e.g. Visa renewal, scholarship"></div>
<div><label>Copies</label><select id="rqCopies"><option>1</option><option>2</option><option>3</option></select></div></div>
<div class="row2"><div><label>Language</label><select id="rqLang"><option>English</option><option>English + Korean translation</option></select></div>
<div><label>Delivery</label><select id="rqDel"><option>Digital (PDF in portal)</option><option>Pick up at front office</option><option>Mail sealed copy</option></select></div></div>
<label>Notes for the office</label><textarea id="rqNote" placeholder="Anything we should know?"></textarea>
<button class="sbtn pri" style="margin-top:18px;padding:13px 22px" onclick="submitReq()">Submit request</button>
</div>
<div class="box"><h3>My requests</h3><div class="sub">Track status and download when ready</div>
${S.requests.filter(r=>r.by==='The Kim Family').slice().reverse().map(r=>`<div class="req"><div><h4>${r.type}</h4><small>#${r.id} · ${r.date} · ${esc(r.purpose)} · ${r.copies} cop${r.copies>1?'ies':'y'}</small>
<div class="rq-track">${STEPS.map((s,i)=>`<i class="${i<=r.status?'on':''}"></i>`).join('')}</div><small>${STEPS[r.status]}</small></div>
<div>${r.status===2?`<button class="sbtn gold" onclick="openDoc(${r.id})">Download</button>`:`<span class="tag">${STEPS[r.status]}</span>`}</div></div>`).join('')||'<div class="empty">No requests yet</div>'}
</div></div>`;
},
cal(){return `<div class="box"><h3>School calendar</h3><div class="sub">2026–2027 · Fall & Spring</div><div class="cal">${S.events.concat([{d:'05',m:'JAN',t:'Spring semester begins',s:'All grades'},{d:'17',m:'MAR',t:'Spring break',s:'No school Mar 16–20'},{d:'22',m:'MAY',t:'Commencement',s:'Class of 2027'}]).map(e=>`<p><span class="dd">${e.d}<small>${e.m}</small></span><span style="flex:1"><b style="font-weight:600">${e.t}</b><br><small style="color:var(--muted)">${e.s}</small></span><button class="sbtn" onclick="toast('Added to your calendar')">Add</button></p>`).join('')}</div></div>`}
};
function annRow(a,full){return `<div class="ann"><div class="t"><span class="tag ${tagCls(a.tag)}">${a.tag}</span>${a.date} · ${a.aud}${!a.read&&!full?' · <b style="color:var(--gold)">New</b>':''}</div><h4>${esc(a.title)}</h4>${full?`<p>${esc(a.body)}</p>`:''}</div>`}
function submitReq(){
const type=document.getElementById('rqType').value, purpose=document.getElementById('rqPurpose').value.trim()||'General',
copies=+document.getElementById('rqCopies').value, lang=document.getElementById('rqLang').value;
const id=Math.max(...S.requests.map(r=>r.id))+1;
S.requests.push({id,type,purpose,lang,copies,date:'Nov 20',status:0,by:'The Kim Family'});
toast('Request submitted — the office has been notified');render();
}

const T={
home(){
const pend=S.requests.filter(r=>r.status<2), um=S.threads.filter(t=>t.unreadT).length;
return `<div class="welcome"><div class="img" style="background-image:url(../img/8.jpg)"></div>
<div class="eyebrow">Staff dashboard</div><h2>Good afternoon, Mrs. Taylor.</h2><p>Here is what needs your attention today.</p>
<div class="qa"><button onclick="go('ann')">Post a notice</button><button onclick="go('doc')">Review requests</button><button onclick="go('msg')">Open messages</button></div></div>
<div class="grid3" style="margin-bottom:24px">
<div class="box kpi"><span>Pending requests</span><b>${pend.length}</b><small>Certificates & records</small></div>
<div class="box kpi"><span>Unread messages</span><b>${um}</b><small>From families</small></div>
<div class="box kpi"><span>Notices posted</span><b>${S.announcements.length}</b><small>This month</small></div>
</div>
<div class="box"><h3>Request queue</h3><div class="sub">Approve and issue documents</div>${reqQueue()}</div>`;
},
ann(){
return `<div class="grid2"><div class="box"><h3>New notice</h3><div class="sub">Families are notified instantly in the portal.</div>
<label>Title</label><input id="anT" placeholder="e.g. Field trip permission forms due Friday">
<div class="row2"><div><label>Audience</label><select id="anA"><option>All Families</option><option>Lower School</option><option>Middle School</option><option>Upper School</option><option>International Families</option></select></div>
<div><label>Category</label><select id="anC"><option>Academics</option><option>Event</option><option>Urgent</option><option>Community</option></select></div></div>
<label>Message</label><textarea id="anB" placeholder="Write your notice…"></textarea>
<button class="sbtn pri" style="margin-top:18px;padding:13px 22px" onclick="postAnn()">Publish notice</button></div>
<div class="box"><h3>Published</h3><div class="sub">Most recent first</div>${S.announcements.map(a=>annRow(a,true)).join('')}</div></div>`;
},
msg(){return msgView('teacher')},
doc(){return `<div class="box"><h3>All document requests</h3><div class="sub">Move each request forward — families see status changes immediately.</div>${reqQueue(true)}</div>`},
acad(){return `<div class="box"><h3>English II (Honors) · Period 2</h3><div class="sub">Gradebook preview</div><div class="tbl-wrap"><table><tr><th>Student</th><th>Essay: Hebrews 11</th><th>Unit 3 Test</th><th>Average</th></tr>
${[['Grace Kim',98,95,96],['Daniel Park',91,88,90],['Emma Johnson',94,90,92],['Noah Williams',86,84,85],['Hannah Lee',97,93,95]].map(s=>`<tr><td><b style="font-weight:600">${s[0]}</b></td><td>${s[1]}</td><td>${s[2]}</td><td class="grade">${s[3]}%</td></tr>`).join('')}</table></div></div>`}
};
function reqQueue(all){
const list=S.requests.filter(r=>all||r.status<2).slice().reverse();
if(!list.length)return '<div class="empty">All caught up ✦</div>';
return list.map(r=>`<div class="req"><div><h4>${r.type}</h4><small>#${r.id} · ${r.by} · ${S.student.name} · ${esc(r.purpose)} · ${r.lang}</small>
<div class="rq-track">${STEPS.map((s,i)=>`<i class="${i<=r.status?'on':''}"></i>`).join('')}</div><small>${STEPS[r.status]}</small></div>
<div style="display:flex;gap:8px">${r.status===0?`<button class="sbtn" onclick="adv(${r.id})">Start review</button>`:r.status===1?`<button class="sbtn gold" onclick="adv(${r.id})">Approve & issue</button>`:`<button class="sbtn" onclick="openDoc(${r.id})">Preview</button><span class="tag green" style="align-self:center">Issued</span>`}</div></div>`).join('');
}
function adv(id){const r=S.requests.find(x=>x.id===id);r.status=Math.min(2,r.status+1);toast(r.status===2?'Issued — the family can now download it':'Marked as in review');render()}
function postAnn(){
const t=document.getElementById('anT').value.trim(),body=document.getElementById('anB').value.trim();
if(!t||!body){toast('Please add a title and message');return}
S.announcements.unshift({id:Date.now(),title:t,body,date:'Nov 20',tag:document.getElementById('anC').value,aud:document.getElementById('anA').value,read:false});
toast('Notice published to families');render();
}

function msgView(role){
const th=S.threads[S.thread];
if(role==='parent')th.unreadP=false;else th.unreadT=false;
setTimeout(()=>{renderNav();const cb=document.getElementById('cb');if(cb)cb.scrollTop=cb.scrollHeight},0);
const name=t=>role==='parent'?t.with:'The Kim Family';
const sub=t=>role==='parent'?t.role:'re: Grace Kim · '+t.with;
return `<div class="msgs"><div class="th-list">${S.threads.map((t,i)=>`<div class="th ${i===S.thread?'on':''}" onclick="S.thread=${i};render()"><div class="av" style="background:${role==='parent'?'var(--navy3)':'var(--gold)'}">${role==='parent'?t.ini:'KF'}</div><div style="min-width:0"><b>${name(t)}</b><small>${esc(t.msgs[t.msgs.length-1].text)}</small></div>${(role==='parent'?t.unreadP:t.unreadT)?'<span class="dot"></span>':''}</div>`).join('')}</div>
<div class="conv"><div class="conv-h"><div class="av" style="background:${role==='parent'?'var(--navy3)':'var(--gold)'}">${role==='parent'?th.ini:'KF'}</div><div><b>${name(th)}</b><br><small style="color:var(--muted)">${sub(th)}</small></div></div>
<div class="conv-b" id="cb">${th.msgs.map(m=>`<div class="bub ${m.from===role?'me':''}">${esc(m.text)}<small>${m.time}</small></div>`).join('')}</div>
<div class="conv-f"><input id="mIn" placeholder="Write a message…" onkeydown="if(event.key==='Enter')send()"><button class="sbtn pri" onclick="send()">Send</button></div></div></div>`;
}
function send(){
const v=document.getElementById('mIn').value.trim(); if(!v)return;
const th=S.threads[S.thread], d=new Date();
th.msgs.push({from:S.role,text:v,time:'Today · '+d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})});
if(S.role==='parent')th.unreadT=true;else th.unreadP=true;
render(); toast(S.role==='parent'?'Sent — switch to Teacher to see it arrive':'Reply sent to the family');
}

function openDoc(id){
const r=S.requests.find(x=>x.id===id); r.dl=true; const s=S.student;
const bodies={
'Enrollment Verification Letter':`<p>This letter certifies that <b>${s.name}</b> (Date of Birth: ${s.dob}; Student ID: ${s.id}) is currently enrolled as a full-time student in <b>${s.grade}</b> at Brazos Valley Cornerstone Christian Academy for the 2026–2027 academic year.</p><p>${s.name} has been enrolled continuously since ${s.entered} and is in good academic and disciplinary standing.</p>`,
'Certificate of Attendance':`<p>This is to certify that <b>${s.name}</b> (Student ID: ${s.id}) has attended Brazos Valley Cornerstone Christian Academy in ${s.grade} during the Fall Semester 2026, with an attendance rate of 98%.</p>`,
'Letter of Good Standing':`<p>This letter confirms that <b>${s.name}</b>, a ${s.grade} student (Student ID: ${s.id}), is a student in good standing academically, spiritually and behaviorally at Brazos Valley Cornerstone Christian Academy.</p>`
};
const body=bodies[r.type]||`<p>This document certifies the requested record — <b>${r.type}</b> — for <b>${s.name}</b> (Student ID: ${s.id}), ${s.grade}, issued by the Office of the Registrar of Brazos Valley Cornerstone Christian Academy.</p>`;
document.getElementById('doc').innerHTML=`
<div class="doc-actions"><button onclick="document.getElementById('docModal').classList.remove('open')">Close</button><button class="pri" onclick="window.print()">Print / Save PDF</button></div>
<div class="lh"><svg viewBox="0 0 44 52"><use href="#crest"/></svg>
<div><b>Brazos Valley Cornerstone Christian Academy</b><small>3200 Cavitt Avenue · Bryan, Texas 77801 · (979) 694-8200</small></div></div>
<p style="text-align:right">November 20, 2026<br><small style="color:#888">Ref. CCA-${r.id}</small></p>
<h2>${r.type.toUpperCase()}</h2>
<p>To Whom It May Concern:</p>${body}
<p>Should you require further information, please contact the school office at (979) 694-8200.</p>
<div class="sig"><div><p style="margin:0">Sincerely,</p><div style="font-family:var(--serif);font-style:italic;font-size:30px;margin:18px 0 4px;color:var(--navy)">Head of School</div><p style="margin:0;border-top:1px solid #ccc;padding-top:6px;font-size:12px">Head of School · Brazos Valley Cornerstone Christian Academy</p></div>
<div class="seal">Official<br>Cornerstone<br>Seal<br>· 2002 ·</div></div>
<p style="margin-top:40px;font-size:11px;color:#999;text-align:center">Demo document — layout preview only. Not an official record.</p>`;
document.getElementById('docModal').classList.add('open');
}
