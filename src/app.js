'use strict';
/* =========================== constants =========================== */
const URLS={three:'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',xlsx:'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',zip:'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'};
const BANKS=[['970436','Vietcombank'],['970415','VietinBank'],['970418','BIDV'],['970405','Agribank'],['970407','Techcombank'],['970422','MB Bank'],['970416','ACB'],['970432','VPBank'],['970423','TPBank'],['970403','Sacombank'],['970441','VIB'],['970443','SHB'],['970437','HDBank'],['970448','OCB'],['970426','MSB'],['970440','SeABank'],['970431','Eximbank'],['970449','LPBank'],['970428','Nam A Bank'],['970409','Bac A Bank'],['970425','ABBANK'],['970419','NCB'],['970412','PVcomBank'],['970452','KienlongBank'],['970454','Viet Capital Bank'],['970433','VietBank'],['970438','BaoViet Bank'],['970400','Saigonbank']];
const DEFAULT_LAYOUT={W:3.5,L:6.0,H:4.2,door:'right',win:{on:true,wall:'front'},ac:{on:false,wall:'right',level:'down',hp:1.5},loft:{on:true,h:2.4,depth:2.8,t:0.1,win:{on:true,wall:'back'}},wc:{on:true,w:1.4,d:1.6,corner:'back-right',doorDir:'long'},stair:{on:true,side:'left',w:0.7,tread:0.22,rail:true},kitchen:{on:true,len:1.6,dep:0.6,h:0.85,wall:'back',off:null}};
const DEFAULT_PRICES={elec:3800,waterMode:'m3',well:0,city:18000,waterPerson:100000,trash:30000,trashMode:'room',wifi:100000,extras:[]};
const STATUS={missing:['Chưa chốt số',''],due:['Chưa thu','warn'],partial:['Thu một phần','warn'],paid:['Đã thu','ok'],carried:['Chuyển kỳ sau','']};

/* =========================== utils =========================== */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid6=()=>Math.random().toString(36).slice(2,7)+Date.now().toString(36).slice(-5);
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO=()=>isoOf(new Date());
const curMonth=()=>todayISO().slice(0,7);
const addDays=(iso,n)=>{const d=new Date(iso+'T00:00:00');d.setDate(d.getDate()+n);return isoOf(d)};
const addMonth=(m,k)=>{let [y,mo]=m.split('-').map(Number);mo+=k;while(mo>12){mo-=12;y++}while(mo<1){mo+=12;y--}return `${y}-${pad(mo)}`};
const monthLabel=m=>{const [y,mo]=m.split('-');return `Tháng ${Number(mo)}/${y}`};
const daysInMonth=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo,0).getDate()};
const dmy=iso=>iso?iso.split('-').reverse().join('/'):'';
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00')-Date.parse(a+'T00:00:00'))/86400000);
const money=n=>Math.round(n||0).toLocaleString('vi-VN')+' đ';
const num=n=>(n==null||n==='')?'—':(Math.round(Number(n)*100)/100).toLocaleString('vi-VN');
const f2=n=>(Math.round(n*100)/100).toLocaleString('vi-VN');
const shortMoney=n=>n>=1e6?(n/1e6).toLocaleString('vi-VN',{maximumFractionDigits:2})+'tr':Math.round(n/1000)+'k';
const toNum=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:null};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ascii=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
const slug=s=>ascii(s).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');
const lastName=s=>String(s||'').trim().split(/\s+/).pop();
const byNo=(a,b)=>String(a.no).localeCompare(String(b.no),'vi',{numeric:true});
const scriptP={};
function loadScript(src){return scriptP[src]||(scriptP[src]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>{delete scriptP[src];rej(new Error('Không tải được thư viện'))};document.head.appendChild(s)}))}
function getPath(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o)}
function setPath(o,p,v){const ks=p.split('.');let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null)a[ks[i]]={};a=a[ks[i]]}a[ks[ks.length-1]]=v}

const IC={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 door:'<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4"/>',
 sliders:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 chev:'<path d="m9 6 6 6-6 6"/>', left:'<path d="m15 6-6 6 6 6"/>', down:'<path d="m6 9 6 6 6-6"/>',
 back:'<path d="M15 5 8 12l7 7"/>',
 cube:'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9zM3 7.5 12 12l9-4.5M12 12v9"/>',
 dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 img:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6M15 9h.01"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 alert:'<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
 check:'<path d="M5 12.5 10 17l9-10"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
 cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
 out:'<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
 grid:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>',
 bank:'<path d="M3 10h18L12 4zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
 building:'<path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18M8 9h.01M8 13h.01M8 17h.01M16 13h.01M16 17h.01"/>',
 tag:'<path d="M3 12V4h8l10 10-8 8zM7.5 8.5h.01"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
 save:'<path d="M5 3h11l3 3v15H5zM8 3v6h8M8 21v-7h8v7"/>',
 upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
 swap:'<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 chart:'<path d="M5 20V11M11 20V5M17 20v-7M3 20h18"/>',
 file:'<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
 msg:'<path d="M4 5h16v11H9l-5 4z"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>'
};
const ic=(n,s=20)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;

/* =========================== state =========================== */
const S={props:{},bills:{},settings:{alertDays:30,activePid:null}};
let dbRef=null,userRef=null,canWrite=null,reportsList=[];const caps={sample:null,assets:null,imgOK:false};
const ui={tab:'home',month:curMonth(),sheets:[],roomFilter:'all'};
let ver=0;const memo=new Map();function touch(){ver++;memo.clear()}
let mode='boot',col=null,myId=null,cloudLoaded=false,loadTimer=null,syncState='idle';
const known={},pending=new Map(),inflight=new Set();let flushT=null;
const LS_LOCAL='sotro.local.v1',LS_CACHE='sotro.cache.v1';
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function snapState(){return{props:S.props,bills:S.bills,settings:S.settings}}
function loadInto(o){S.props=o&&o.props||{};Object.values(S.props).forEach(normProp);S.bills=o&&o.bills||{};S.settings=Object.assign({alertDays:30,activePid:null},o&&o.settings||{});fixActive();touch()}
function fixActive(){if(!S.props[S.settings.activePid]){const f=Object.values(S.props).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''))[0];S.settings.activePid=f?f.id:null}}
function P(){return S.props[S.settings.activePid]||null}
function saveLocal(){if(mode==='local')lsSet(LS_LOCAL,snapState());else if(mode==='cloud')lsSet(LS_CACHE,Object.assign({uid:myId},snapState()))}
const docId=(k,id)=>k==='p'?'p_'+id:k==='b'?'b_'+id:'settings';
function persist(k,id){touch();pending.set(docId(k,id),'set');sched();driveDirty()}
function persistDel(k,id){touch();pending.set(docId(k,id),'del');sched();driveDirty()}
function sched(){setSync(mode==='local'?'local':'saving');clearTimeout(flushT);flushT=setTimeout(flush,450)}
function bodyOf(id){if(id==='settings')return S.settings;if(id.startsWith('p_'))return S.props[id.slice(2)]||null;if(id.startsWith('b_'))return S.bills[id.slice(2)]||null;return null}
async function flush(){
  saveLocal();
  if(mode==='boot'){clearTimeout(flushT);flushT=setTimeout(flush,1000);return}
  if(mode!=='cloud'){pending.clear();setSync('local');return}
  const jobs=[];
  for(const [id,op] of [...pending]){if(inflight.has(id))continue;pending.delete(id);jobs.push(writeDoc(id,op))}
  await Promise.all(jobs);
  scheduleAux();
  if(pending.size){clearTimeout(flushT);flushT=setTimeout(flush,300)}else if(!inflight.size&&syncState!=='error')setSync('saved');
}
async function writeDoc(id,op,attempt=0){
  inflight.add(id);
  try{
    const ref=col.doc(id);const body=op==='del'?null:bodyOf(id);
    if(!body){await ref.delete();delete known[id]}
    else{const json=JSON.stringify(body);await ref.set(JSON.parse(json));known[id]=json}
  }catch(e){
    const c=e&&e.code;
    if(c==='unavailable'&&attempt<1){await new Promise(r=>setTimeout(r,700+Math.random()*700));inflight.delete(id);return writeDoc(id,op,attempt+1)}
    if(c==='quota_exceeded')toast('Bộ nhớ dữ liệu đã đầy. Hãy xóa bớt khu trọ hoặc hóa đơn cũ không dùng.');
    else if(c==='invalid_argument')toast('Không lưu được: dữ liệu quá lớn hoặc bạn chỉ có quyền xem.');
    else toast('Chưa lưu được lên máy chủ. Dữ liệu vẫn còn trên máy này.');
    setSync('error');
  }finally{inflight.delete(id)}
}
function applyDoc(id,data){
  if(id==='settings')S.settings=Object.assign({alertDays:30,activePid:null},data||{});
  else if(id.startsWith('p_')){if(data)S.props[id.slice(2)]=normProp(data);else delete S.props[id.slice(2)]}
  else if(id.startsWith('b_')){if(data)S.bills[id.slice(2)]=data;else delete S.bills[id.slice(2)]}
}
function onSnap(snap){
  let changed=false;const seen=new Set();
  for(const d of snap.docs){seen.add(d.id);if(d.id==='reminders')continue;if(pending.has(d.id)||inflight.has(d.id))continue;const json=JSON.stringify(d.data());if(known[d.id]===json)continue;known[d.id]=json;applyDoc(d.id,JSON.parse(json));changed=true}
  if(!snap.metadata.fromCache){
    const busy=id=>pending.has(id)||inflight.has(id);
    for(const k of Object.keys(S.props))if(!seen.has('p_'+k)&&!busy('p_'+k)){delete S.props[k];changed=true}
    for(const k of Object.keys(S.bills))if(!seen.has('b_'+k)&&!busy('b_'+k)){delete S.bills[k];changed=true}
    if(!cloudLoaded){cloudLoaded=true;clearTimeout(loadTimer);changed=true;if(!pending.size)setSync('saved');scheduleAux()}
  }
  if(changed){fixActive();touch();saveLocal();requestRender()}
}
function setSync(s){syncState=s;const el=document.getElementById('sync');if(el){el.className='sync '+s;el.innerHTML=syncHTML()}}
function syncHTML(){const t={local:'Lưu trên máy này',saving:'Đang lưu…',saved:'Đã lưu',loading:'Đang tải…',offline:'Chưa kết nối',error:'Lỗi lưu',idle:''}[syncState]||'';return t?`<i></i>${t}`:''}

/* =========================== domain =========================== */
function newProp(name,address){return{id:uid6(),name,address,createdAt:new Date().toISOString(),prices:clone(DEFAULT_PRICES),bank:{bin:'',acct:'',holder:''},layout:clone(DEFAULT_LAYOUT),dueDay:5,prorate:false,carryDebt:true,invoiceNote:'',owner:{name:'',phone:'',cccd:'',address:''},readDay:1,terms:'',equipment:'',closedPortals:[],rooms:[]}}
function newRoom(no,floor,rent){return{id:uid6(),no:String(no),floor:floor??1,rent:rent||0,noWifi:false,layout:null,tenant:null,history:[],note:''}}
// Thiết kế 3D: p.layout là "Mẫu chung"; p.designs là các thiết kế có tên (vd. Kiot) dùng chung cho nhiều phòng;
// room.design trỏ tới thiết kế, room.layout là kích thước riêng của một phòng (ưu tiên cao nhất).
function designOf(p,id){return id&&id!=='default'?(p.designs||[]).find(d=>d.id===id)||null:null}
function designLayout(p,id){const d=designOf(p,id);return d?d.layout:p.layout}
function designName(p,id){const d=designOf(p,id);return d?d.name:'Mẫu chung'}
function roomUses(p,r,did){return!r.layout&&(did==='default'?!designOf(p,r.design):r.design===did)}
function roomLayout(p,room){if(room&&room.layout)return room.layout;const base=designLayout(p,room&&room.design);if(room&&room.ac){const l=clone(base);l.ac=Object.assign({},room.ac);return l}return base}
function acOf(p,room){const l=roomLayout(p,room);return l&&l.ac&&l.ac.on?l.ac:null}
function billKey(pid,m){return pid+'_'+m}
function getBill(pid,m){return S.bills[billKey(pid,m)]}
function rowOf(pid,m,key){const b=getBill(pid,m);return b&&b.rooms?b.rooms[key]:null}
function rowsSorted(pid,m){const b=getBill(pid,m);if(!b)return[];return Object.entries(b.rooms).sort((a,c)=>String(a[1].roomNo).localeCompare(String(c[1].roomNo),'vi',{numeric:true}))}
function makeRow(p,room,month){
  const t=room.tenant;const key=room.id+':'+t.id;const prev=rowOf(p.id,addMonth(month,-1),key);
  const last=(a,b)=>prev?(prev[b]!=null?prev[b]:prev[a]):null;
  const r={roomId:room.id,roomNo:room.no,tenantId:t.id,tenantName:t.name,people:t.people||1,rent:room.rent||0,noWifi:!!room.noWifi,
    e0:last('e0','e1')??(t.e0||0),e1:null,w0:last('w0','w1')??(t.w0||0),w1:null,c0:last('c0','c1')??(t.c0||0),c1:null,
    prices:clone(p.prices),adjust:[],paid:0,paidAt:null,note:'',calcAt:todayISO(),prorate:null};
  r.prorate=prorateOf(p,t,month);
  return[key,r];
}
function prorateOf(p,t,month){if(!p.prorate||!t||!t.moveIn||t.moveIn.slice(0,7)!==month)return null;const d=Number(t.moveIn.slice(8));if(d<=1)return null;const dim=daysInMonth(month);return{days:dim-d+1,dim}}
function occupiedFor(p,month){const end=month+'-31';return p.rooms.filter(r=>r.tenant&&(!r.tenant.moveIn||r.tenant.moveIn<=end))}
function missingRooms(p,month){const b=getBill(p.id,month);return occupiedFor(p,month).filter(r=>!(b&&b.rooms[r.id+':'+r.tenant.id]))}
function createRows(pid,month){
  const p=S.props[pid];const k=billKey(pid,month);if(!S.bills[k])S.bills[k]={pid,month,rooms:{},createdAt:todayISO()};
  let n=0;for(const room of missingRooms(p,month)){const [key,r]=makeRow(p,room,month);S.bills[k].rooms[key]=r;n++}
  persist('b',k);return n;
}
function calcCore(r,carry){
  const pr=r.prices||DEFAULT_PRICES;const items=[];const missing=[];const ppl=r.people||1;
  let rent=r.rent||0,rd='';if(r.prorate){rent=Math.round((r.rent||0)*r.prorate.days/r.prorate.dim/1000)*1000;rd=`Ở ${r.prorate.days}/${r.prorate.dim} ngày`}
  items.push({k:'rent',label:'Tiền phòng',amount:rent,detail:rd});
  const meter=(k,a,b,label,price,unit)=>{if(r[b]==null){missing.push(label.toLowerCase());items.push({k,label,amount:0,miss:true,detail:`Chỉ số cũ ${num(r[a])} · chưa nhập số mới`});return}
    const u=Math.round((r[b]-r[a])*100)/100;items.push({k,label,amount:Math.max(0,u)*price,units:u,detail:`${num(r[a])} → ${num(r[b])} = ${num(u)} ${unit} × ${num(price)}`})};
  meter('elec','e0','e1','Tiền điện',pr.elec||0,'kWh');
  if(pr.waterMode==='person'){if(pr.waterPerson)items.push({k:'water',label:'Tiền nước',amount:ppl*pr.waterPerson,detail:`${ppl} người × ${num(pr.waterPerson)}`})}
  else{if(pr.well>0)meter('well','w0','w1','Nước giếng',pr.well,'m³');if(pr.city>0)meter('city','c0','c1','Nước máy',pr.city,'m³')}
  if(pr.trash>0)items.push({k:'trash',label:'Tiền rác',amount:pr.trashMode==='person'?pr.trash*ppl:pr.trash,detail:pr.trashMode==='person'?`${ppl} người × ${num(pr.trash)}`:''});
  if(pr.wifi>0&&!r.noWifi)items.push({k:'wifi',label:'Wifi',amount:pr.wifi,detail:''});
  for(const x of pr.extras||[])if(x&&x.amount)items.push({k:'extra',label:x.name||'Phí khác',amount:x.mode==='person'?x.amount*ppl:x.amount,detail:x.mode==='person'?`${ppl} người × ${num(x.amount)}`:''});
  for(const a of r.adjust||[])if(a&&a.amount)items.push({k:'adj',label:a.name||'Phát sinh',amount:a.amount,detail:''});
  if(carry&&Math.abs(carry.amount)>=1)items.push({k:'carry',label:carry.amount>0?`Nợ ${carry.label}`:`Dư ${carry.label}`,amount:carry.amount,detail:''});
  const total=items.reduce((s,i)=>s+(i.amount||0),0);const paid=r.paid||0;const complete=!missing.length;
  const status=!complete?'missing':paid>=total-0.5?'paid':paid>0?'partial':'due';
  return{items,total,paid,remain:total-paid,complete,missing,status};
}
function carryFor(pid,month,key){
  const p=S.props[pid];if(!p||!p.carryDebt)return null;const pm=addMonth(month,-1);if(!rowOf(pid,pm,key))return null;
  const pc=rowCalc(pid,pm,key,true);if(!pc||!pc.complete)return null;const rem=pc.total-pc.paid;
  return Math.abs(rem)>=1?{amount:rem,label:monthLabel(pm).toLowerCase()}:null;
}
function rowCalc(pid,month,key,raw){
  const mk=`${ver}|${pid}|${month}|${key}|${raw?1:0}`;if(memo.has(mk))return memo.get(mk);
  const r=rowOf(pid,month,key);if(!r)return null;
  const c=calcCore(r,carryFor(pid,month,key));
  if(!raw&&S.props[pid].carryDebt&&(c.status==='due'||c.status==='partial')&&rowOf(pid,addMonth(month,1),key))c.status='carried';
  memo.set(mk,c);return c;
}
function monthSum(pid,month){
  const o={due:0,paid:0,remain:0,rows:0,complete:0,unpaid:0};
  for(const [key] of rowsSorted(pid,month)){const c=rowCalc(pid,month,key);o.rows++;if(c.complete){o.complete++;o.due+=c.total;o.paid+=c.paid;if(c.status==='due'||c.status==='partial'){o.remain+=Math.max(0,c.remain);o.unpaid++}}}
  return o;
}
function tenantDebt(p,room){
  if(!room.tenant)return 0;const key=room.id+':'+room.tenant.id;const ms=Object.values(S.bills).filter(b=>b.pid===p.id&&b.rooms[key]).map(b=>b.month).sort();
  let d=0;for(const m of ms){const c=rowCalc(p.id,m,key);if(c.status==='due'||c.status==='partial')d+=Math.max(0,c.remain)}return d;
}
function endDays(t){return t&&t.endDate?daysBetween(todayISO(),t.endDate):null}
function recalcRow(pid,month,key){
  const p=S.props[pid];const r=rowOf(pid,month,key);if(!r)return;const room=p.rooms.find(x=>x.id===r.roomId);
  r.prices=clone(p.prices);
  if(room){r.rent=room.rent||0;r.noWifi=!!room.noWifi;if(room.tenant&&room.tenant.id===r.tenantId){r.people=room.tenant.people||1;r.tenantName=room.tenant.name;r.prorate=prorateOf(p,room.tenant,month)}}
  r.calcAt=todayISO();
}
function previewRecalc(pid,month,key){
  const p=S.props[pid];const r=clone(rowOf(pid,month,key));const room=p.rooms.find(x=>x.id===r.roomId);
  r.prices=clone(p.prices);if(room){r.rent=room.rent||0;r.noWifi=!!room.noWifi;if(room.tenant&&room.tenant.id===r.tenantId){r.people=room.tenant.people||1;r.prorate=prorateOf(p,room.tenant,month)}}
  return calcCore(r,carryFor(pid,month,key));
}

/* =========================== layout geometry =========================== */
function layoutInfo(l){
  const W=+l.W||0,L=+l.L||0,H=+l.H||0;const warns=[];
  const o={area:W*L,loftA:0,wcA:0,above:null,below:null,steps:0,rise:0,run:0,stairStart:null,warns};
  if(W<1.5||L<2)warns.push('Kích thước phòng quá nhỏ, kiểm tra lại chiều rộng và chiều dài.');
  const lo=l.loft||{};const d=lo.on?Math.min(+lo.depth||0,L-0.6):0;
  if(lo.on){
    o.loftA=W*d;o.above=H-lo.h;o.below=lo.h-(lo.t||0.1);
    if(lo.h>=H-0.3)warns.push('Sàn gác cao gần chạm trần. Giảm cao độ gác hoặc tăng chiều cao trần.');
    else if(o.above<1.5)warns.push(`Khoảng trống trên gác chỉ ${f2(o.above)} m, người lớn khó đứng thẳng. Nên từ 1,6 m trở lên.`);
    if(o.below<2.1)warns.push(`Dưới gác chỉ cao ${f2(o.below)} m, dễ cấn đầu. Nên từ 2,2 m trở lên.`);
    if(+lo.depth>L-0.6)warns.push('Gác gần phủ kín phòng, đã giới hạn để chừa lối lên cầu thang.');
  }
  const st=l.stair||{};const sw=+st.w||0.7;
  if(lo.on&&st.on){
    o.steps=Math.max(2,Math.round(lo.h/0.2));o.rise=lo.h/o.steps;o.run=(o.steps-1)*(+st.tread||0.22);o.stairStart=(L-d)-o.run;
    if(o.stairStart<0)warns.push(`Cầu thang cần dài ${f2(o.run)} m nhưng trước mép gác chỉ còn ${f2(L-d)} m. Tăng chiều dài phòng hoặc giảm độ sâu gác.`);
    if(sw>W*0.45)warns.push('Cầu thang chiếm gần nửa bề ngang phòng.');
  }
  const wc=l.wc||{};
  if(wc.on){
    o.wcA=(+wc.w||0)*(+wc.d||0);const back=(wc.corner||'').startsWith('back'),left=(wc.corner||'').endsWith('left');
    if(wc.w>W-0.6)warns.push('Nhà vệ sinh rộng gần bằng bề ngang phòng.');
    if(wc.w<0.9||wc.d<1.0)warns.push('Nhà vệ sinh nhỏ hơn 0,9 × 1,0 m, khó bố trí bồn cầu và vòi sen.');
    const wx0=left?0:W-wc.w,wx1=wx0+ +wc.w,wz0=back?L-wc.d:0,wz1=wz0+ +wc.d;
    if(lo.on&&st.on&&o.stairStart!=null){const sx0=st.side==='left'?0:W-sw,sx1=sx0+sw;
      if(sx0<wx1&&sx1>wx0&&o.stairStart<wz1&&(L-d)>wz0)warns.push('Cầu thang đang chồng lên nhà vệ sinh. Đổi phía cầu thang hoặc vị trí WC.');}
    if(!back){const dx=doorX(l,W);if(dx-doorHalf(l,W)<wx1&&dx+doorHalf(l,W)>wx0)warns.push('Nhà vệ sinh chắn cửa ra vào. Đổi vị trí cửa hoặc WC.')}
    if(back&&lo.on&&wc.d>d+0.01)warns.push('Nhà vệ sinh sâu hơn phần gác, phần nhô ra sẽ không có sàn gác phía trên.');
  }
  if(lo.on&&st.on&&o.stairStart!=null&&o.stairStart<0.9){const dx=doorX(l,W);const sx0=st.side==='left'?0:W-sw;if(dx-doorHalf(l,W)<sx0+sw&&dx+doorHalf(l,W)>sx0)warns.push('Chân cầu thang sát cửa ra vào, đi lại sẽ vướng.')}
  if(lo.on&&st.on&&st.rail===false&&lo.h>=2)warns.push(`Cầu thang cao ${f2(lo.h)} m mà không có lan can, dễ té ngã. Nên có ít nhất tay vịn một bên.`);
  const wd=wcDoor(l);
  if(wd){if(wd.ddw<0.5)warns.push(`Tường đặt cửa nhà vệ sinh quá ngắn, cửa chỉ rộng được ${f2(Math.max(0,wd.ddw))} m.`);
    const sr=stairRect(l);if(ovl(wd.zone,sr))warns.push('Cầu thang chắn trước cửa nhà vệ sinh. Đổi hướng cửa WC hoặc phía cầu thang.');
    const dx=doorX(l,W);if(ovl(wd.zone,{x0:dx-doorHalf(l,W),x1:dx+doorHalf(l,W),z0:0,z1:0.9}))warns.push('Cửa nhà vệ sinh mở ngay lối cửa ra vào, đi lại sẽ vướng.')}
  const gw=groundWin(l);if(gw&&gw.fail)warns.push(gw.fail==='blocked'?`Tường ${WALLN[gw.wall]} không còn chỗ trống làm cửa sổ (vướng cửa ra vào, nhà vệ sinh hoặc cầu thang). Chọn tường khác.`:gw.fail==='space'?`Tường ${WALLN[gw.wall]} quá ngắn để làm cửa sổ.`:`Tường ${WALLN[gw.wall]} quá thấp để làm cửa sổ (dưới gác hoặc trên bàn bếp).`);
  const lw2=loftWin(l);if(lw2&&lw2.fail)warns.push(lw2.fail==='space'?`Gác quá nông để làm cửa sổ ở tường ${WALLN[lw2.wall]}.`:'Trên gác quá thấp để làm cửa sổ.');
  if(l.ac&&l.ac.on){const sp=acSpot(l);if(sp&&sp.fail)warns.push(sp.fail==='blocked'?`Tường ${WALLN[sp.wall]} không còn chỗ treo máy lạnh (vướng cửa sổ, cầu thang hoặc nhà vệ sinh). Chọn tường khác.`:'Chỗ treo máy lạnh quá thấp (dưới 1,8 m). Thử treo trên gác hoặc tường khác.');
    const rec=acRec(l);if(+l.ac.hp<rec)warns.push(`Máy lạnh ${f2(+l.ac.hp)} HP hơi yếu cho phòng này, nên từ ${f2(rec)} HP.`);
    if(sp&&!sp.fail&&sp.level==='down'&&lo.on&&sp.y1<=lo.h-lo.t)warns.push('Máy lạnh treo dưới gác: tầng dưới mát nhanh nhưng trên gác sẽ nóng hơn.');}
  const k=l.kitchen;const kr=kitchenRect(l);o.kitchenA=0;
  if(kr){o.kitchenA=k.len*k.dep;o.kitchenAuto=kr.auto;
    if(kr.tooLong)warns.push('Bàn bếp dài hơn bức tường đặt nó.');
    if(ovl(kr,wcRect(l)))warns.push('Bàn bếp chồng lên nhà vệ sinh. Đổi tường đặt bếp hoặc khoảng cách.');
    if(ovl(kr,stairRect(l)))warns.push('Bàn bếp chồng lên cầu thang.');
    else{const sr=stairRect(l);if(sr&&sr.z0>0&&ovl(kr,{x0:sr.x0,x1:sr.x1,z0:Math.max(0,sr.z0-0.6),z1:sr.z0}))warns.push('Bàn bếp chắn chân cầu thang.')}
    if(ovl(kr,wd&&wd.zone))warns.push('Bàn bếp chắn cửa nhà vệ sinh.');
    const dx=doorX(l,W);if(ovl(kr,{x0:dx-doorHalf(l,W),x1:dx+doorHalf(l,W),z0:0,z1:0.9}))warns.push('Bàn bếp chắn lối cửa ra vào.');
    if(k.h<0.75||k.h>0.95)warns.push(`Bàn bếp cao ${f2(k.h)} m. Chiều cao dễ nấu thường 0,8–0,9 m.`);
    const d2=lo.on?Math.min(+lo.depth||0,L-0.6):0;const under=lo.on&&kr.z1>L-d2+0.05;if(under&&lo.h-lo.t-k.h<0.6)warns.push(`Bàn bếp nằm dưới gác, khoảng trống phía trên chỉ ${f2(lo.h-lo.t-k.h)} m, khói nóng dễ bám sàn gác.`);
    if(kr.auto&&kr.hits)warns.push('Không tìm được chỗ trống cho bàn bếp trên tường này. Thử tường khác hoặc rút ngắn bàn bếp.');
  }
  return o;
}
function doorX(l,W){return l.door==='left'?0.25+0.45:l.door==='center'||l.door==='shop'?W/2:W-0.25-0.45}
// Nửa bề rộng cửa ra vào: cửa đi 0,9 m, hoặc cửa cuốn kiot gần hết mặt tiền.
function doorHalf(l,W){return l.door==='shop'?Math.max(0.45,(W-0.3)/2):0.45}
function normLayout(l){
  if(!l)return l;
  l.loft=Object.assign({on:false,h:2.4,depth:2.8,t:0.1},l.loft||{});
  // migrate the old window flags: "window" was the high back window, "windowLow" the back window under the loft
  if(!l.win)l.win={on:l.loft.on?!!l.windowLow:!!l.window,wall:'back'};
  if(!l.loft.win)l.loft.win={on:!!(l.loft.on&&l.window),wall:'back'};
  delete l.window;delete l.windowLow;
  l.ac=Object.assign({on:false,wall:'right',level:'down',hp:1.5},l.ac||{});
  l.wc=Object.assign({on:false,w:1.4,d:1.6,corner:'back-right'},l.wc||{});if(!l.wc.doorDir)l.wc.doorDir='long';
  l.stair=Object.assign({on:false,side:'left',w:0.7,tread:0.22},l.stair||{});if(l.stair.rail==null)l.stair.rail=true;
  l.kitchen=Object.assign({on:false,len:1.6,dep:0.6,h:0.85,wall:'back',off:null},l.kitchen||{});
  return l;
}
const ovl=(a,b)=>a&&b&&a.x0<b.x1-1e-6&&a.x1>b.x0+1e-6&&a.z0<b.z1-1e-6&&a.z1>b.z0+1e-6;
function wcRect(l){const wc=l.wc||{};if(!wc.on)return null;const W=+l.W,L=+l.L;const back=(wc.corner||'').startsWith('back'),left=(wc.corner||'').endsWith('left');const w=Math.min(+wc.w,W),d=Math.min(+wc.d,L);const x0=left?0:W-w,z0=back?L-d:0;return{x0,x1:x0+w,z0,z1:z0+d,back,left}}
function wcDoor(l){
  const r=wcRect(l);if(!r)return null;const side=l.wc.doorDir==='side';const span=side?(r.z1-r.z0):(r.x1-r.x0);const ddw=Math.min(0.7,span-0.3);
  if(!side){const c=r.left?r.x1-0.12-ddw/2:r.x0+0.12+ddw/2;const zw=r.back?r.z0:r.z1;return{side,ddw,c,zw,zone:{x0:c-ddw/2,x1:c+ddw/2,z0:r.back?zw-0.6:zw,z1:r.back?zw:zw+0.6}}}
  const c=r.back?r.z0+0.12+ddw/2:r.z1-0.12-ddw/2;const xw=r.left?r.x1:r.x0;return{side,ddw,c,xw,zone:{x0:r.left?xw:xw-0.6,x1:r.left?xw+0.6:xw,z0:c-ddw/2,z1:c+ddw/2}};
}
function stairRect(l){const lo=l.loft||{},st=l.stair||{};if(!lo.on||!st.on)return null;const W=+l.W,L=+l.L;const d=Math.min(+lo.depth||0,L-0.6);const zE=L-d;const n=Math.max(2,Math.round(lo.h/0.2));const run=(n-1)*(+st.tread||0.22);const sw=+st.w||0.7;const x0=st.side==='left'?0:W-sw;return{x0,x1:x0+sw,z0:Math.max(0,zE-run),z1:zE}}
function kitchenRect(l){
  const k=l.kitchen;if(!k||!k.on)return null;const W=+l.W,L=+l.L;const len=+k.len,dep=+k.dep;const side=k.wall==='left'||k.wall==='right';const wallLen=side?L:W;
  const at=o=>side?{x0:k.wall==='left'?0:W-dep,x1:k.wall==='left'?dep:W,z0:o,z1:o+len}:{x0:o,x1:o+len,z0:k.wall==='back'?L-dep:0,z1:k.wall==='back'?L:dep};
  const dx=doorX(l,W);const obs=[wcRect(l),wcDoor(l)&&wcDoor(l).zone,stairRect(l),{x0:dx-doorHalf(l,W),x1:dx+doorHalf(l,W),z0:0,z1:0.9}];
  const sr=stairRect(l);if(sr&&sr.z0>0)obs.push({x0:sr.x0,x1:sr.x1,z0:Math.max(0,sr.z0-0.6),z1:sr.z0});
  const hits=r=>obs.filter(o=>ovl(r,o)).length;const maxO=Math.max(0,wallLen-len);
  if(k.off!=null&&k.off!==''){const o=clamp(+k.off,0,maxO);const r=at(o);return Object.assign(r,{auto:false,hits:hits(r),tooLong:len>wallLen})}
  let best=null;for(let o=0;o<=maxO+1e-9;o+=0.05){const r=at(Math.min(o,maxO));const h=hits(r);if(!best||h<best.h){best={r,h};if(!h)break}}
  return Object.assign(best.r,{auto:true,hits:best.h,tooLong:len>wallLen});
}
const WALLN={front:'trước',back:'sau',left:'trái',right:'phải'};
function wallLen(l,wn){return wn==='front'||wn==='back'?+l.W:+l.L}
function onWall(l,r,wn){if(!r)return null;const W=+l.W,L=+l.L;if(wn==='front'&&r.z0<=0.001)return[r.x0,r.x1];if(wn==='back'&&r.z1>=L-0.001)return[r.x0,r.x1];if(wn==='left'&&r.x0<=0.001)return[r.z0,r.z1];if(wn==='right'&&r.x1>=W-0.001)return[r.z0,r.z1];return null}
function loftZE(l){const lo=l.loft;return lo&&lo.on?+l.L-Math.min(+lo.depth||0,+l.L-0.6):+l.L}
function wallObs(l,wn){
  const W=+l.W,L=+l.L,H=+l.H;const lo=l.loft||{};const out=[];
  if(wn==='front'){const dx=doorX(l,W);const hw=doorHalf(l,W)+0.05;out.push({a0:dx-hw,a1:dx+hw,y0:0,y1:l.door==='shop'?Math.min(3,H):2.3,k:'door'})}
  const wr=wcRect(l);const iw=onWall(l,wr,wn);if(iw){const d=lo.on?Math.min(+lo.depth,L-0.6):0;const under=lo.on&&wr.back&&(wr.z1-wr.z0)<=d+0.01;const wh=under?lo.h-lo.t:Math.min(2.4,H);out.push({a0:iw[0],a1:iw[1],y0:0,y1:wh+0.1,k:'wc'})}
  const is=onWall(l,stairRect(l),wn);if(is)out.push({a0:is[0]-0.1,a1:is[1],y0:0,y1:lo.h+1.0,k:'stair'});
  return out;
}
function bestOnWall(l,wn,len,lo_a,hi_a,yAt,obs,pref){
  let best=null;const n=Math.max(0,Math.floor((hi_a-lo_a-len)/0.05+1e-6));
  for(let i=0;i<=n;i++){const a0=lo_a+i*0.05,a1=a0+len;const y=yAt(a0,a1);const hits=y?obs.filter(o=>a0<o.a1-1e-6&&a1>o.a0+1e-6&&y.y0<o.y1-1e-6&&y.y1>o.y0+1e-6).length:9;
    const sc=hits*100+Math.abs((a0+a1)/2-pref);if(!best||sc<best.sc)best={sc,hits,a0,a1,y,noY:!y}}
  return best;
}
function groundWin(l){
  const w=l.win;if(!w||!w.on)return null;const wn=w.wall||'front';const H=+l.H;const lo=l.loft||{};const len=wallLen(l,wn);const ww=Math.min(1.2,len-0.5);
  if(ww<0.5)return{fail:'space',wall:wn};const zE=loftZE(l);const ki=onWall(l,kitchenRect(l),wn);
  const yAt=(a0,a1)=>{let sill=1.0;if(ki&&a0<ki[1]&&a1>ki[0])sill=Math.max(sill,+l.kitchen.h+0.2);let cap=Math.min(H-0.3,2.2);
    if(lo.on&&(wn==='back'||((wn==='left'||wn==='right')&&a1>zE+0.01)))cap=Math.min(cap,lo.h-lo.t-0.12);const top=Math.min(sill+1.0,cap);return top-sill>=0.45?{y0:sill,y1:top}:null};
  const b=bestOnWall(l,wn,ww,0.15,len-0.15,yAt,wallObs(l,wn),len/2);
  if(!b||b.noY)return{fail:'height',wall:wn};if(b.hits)return{fail:'blocked',wall:wn};
  return{wall:wn,a0:b.a0,a1:b.a1,y0:b.y.y0,y1:b.y.y1};
}
function loftWin(l){
  const lo=l.loft||{};if(!lo.on||!lo.win||!lo.win.on)return null;const wn=lo.win.wall==='left'||lo.win.wall==='right'?lo.win.wall:'back';const W=+l.W,L=+l.L,H=+l.H;
  const room=H-lo.h;if(room<0.9)return{fail:'height',wall:wn};const wh=Math.min(0.7,room-0.3);const yc=clamp(lo.h+room/2,lo.h+wh/2+0.1,H-wh/2-0.1);
  let a0,a1;if(wn==='back'){const ww=Math.min(1.2,W*0.45);a0=W/2-ww/2;a1=W/2+ww/2}else{const zE=loftZE(l);const d=L-zE;const ww=Math.min(1.0,d-0.4);if(ww<0.4)return{fail:'space',wall:wn};a0=zE+d/2-ww/2;a1=a0+ww}
  return{wall:wn,a0,a1,y0:yc-wh/2,y1:yc+wh/2};
}
function acRec(l){const W=+l.W,L=+l.L,H=+l.H;const eq=W*L*Math.max(1,H/3.2);return eq<=15?1:eq<=20?1.5:eq<=30?2:2.5}
function acSpot(l){
  const ac=l.ac;if(!ac||!ac.on)return null;const lo=l.loft||{};const level=lo.on&&ac.level==='loft'?'loft':'down';let wn=ac.wall||'right';if(level==='loft'&&wn==='front')wn='back';
  const H=+l.H;const len=wallLen(l,wn);const u=0.8,uh=0.28;const zE=loftZE(l);const side=wn==='left'||wn==='right';
  let lo_a=0.05,hi_a=len-0.05,pref=len/2;
  if(level==='loft'&&side){lo_a=zE+0.05;pref=(zE+(+l.L))/2}
  if(level==='down'&&lo.on&&side&&zE>u+0.3)pref=zE/2;
  const yAt=(a0,a1)=>{let top;if(level==='loft')top=H-0.1;else{top=Math.min(H-0.1,2.8);if(lo.on&&(wn==='back'||(side&&a1>zE+0.01)))top=lo.h-lo.t-0.05}return top-uh>=1.8?{y0:top-uh,y1:top}:null};
  const obs=wallObs(l,wn);for(const w of [groundWin(l),loftWin(l)])if(w&&!w.fail&&w.wall===wn)obs.push({a0:w.a0-0.1,a1:w.a1+0.1,y0:w.y0,y1:w.y1+0.1,k:'win'});
  const b=bestOnWall(l,wn,u,lo_a,hi_a,yAt,obs,pref);
  if(!b||b.noY)return{fail:'height',wall:wn,level};if(b.hits)return{fail:'blocked',wall:wn,level};
  return{wall:wn,level,a0:b.a0,a1:b.a1,y0:b.y.y0,y1:b.y.y1};
}

/* =========================== demo data =========================== */
function makeDemo(){
  const today=todayISO(),cm=curMonth(),pm=addMonth(cm,-1);
  const A=newProp('Nhà trọ Hoa Sứ','Hẻm 18 đường số 7, P. An Lạc, Q. Bình Tân, TP.HCM');A.demo=true;
  Object.assign(A.prices,{elec:3800,well:5000,city:18000,trash:30000,wifi:100000});
  A.bank={bin:'970436',acct:'0123456789',holder:'NGUYEN VAN A'};A.invoiceNote='Cảm ơn anh chị đã thanh toán đúng hạn.';A.owner={name:'Nguyễn Văn A',phone:'0901 234 567',cccd:'',address:'Hẻm 18 đường số 7, P. An Lạc, TP.HCM'};A.equipment='1 quạt trần, 2 bóng đèn LED, 1 vòi sen, 1 bồn cầu, 1 kệ bếp';A.readDay=1;
  A.rooms=[[101,1,2500000],[102,1,2500000],[103,1,2500000],[104,1,2700000],[201,2,2300000],[202,2,2300000],[203,2,2300000],[204,2,2400000]].map(([n,f,r])=>newRoom(n,f,r));
  A.rooms[3].layout=Object.assign(clone(DEFAULT_LAYOUT),{W:4.0,L:6.5});A.rooms[3].layout.ac={on:true,wall:'right',level:'down',hp:2};A.rooms[0].ac={on:true,wall:'right',level:'down',hp:2};A.rooms[1].ac={on:true,wall:'back',level:'loft',hp:1.5};
  const T=(i,name,people,moveIn,e0,w0,c0,endDate,phone,deposit)=>{A.rooms[i].tenant={id:uid6(),name,phone,cccd:'',moveIn,people,e0,w0,c0,deposit,endDate,note:''}};
  T(0,'Nguyễn Văn Hùng',2,'2025-08-01',1120,4,210,'2027-08-01','0903 123 456',2500000);Object.assign(A.rooms[0].tenant,{dob:'1992-04-18',gender:'Nam',home:'Xã Tân Phước, tỉnh Tiền Giang',members:[{name:'Lê Thị Thu',dob:'1994-09-02',gender:'Nữ',cccd:'',relation:'Vợ'}]});
  T(1,'Trần Thị Mai',1,'2026-03-10',865,2,98,addDays(today,12),'0912 555 018',2500000);
  T(3,'Lê Minh Tuấn',3,'2026-09-15',2310,0,340,'2027-03-15','0938 777 210',2700000);
  T(4,'Phạm Quốc Bảo',2,'2026-01-05',455,1,60,addDays(today,22),'0977 404 112',2300000);
  T(5,'Võ Thị Lan',1,'2025-11-01',3002,6,512,'','0909 880 316',2300000);
  T(6,'Đặng Hoàng Nam',2,'2026-06-01',1500,3,200,'2027-06-01','0868 211 905',2300000);
  A.rooms[2].history=[{id:uid6(),name:'Huỳnh Thanh Tâm',people:1,moveIn:'2025-04-01',moveOut:addMonth(pm,-1)+'-28',e0:640,deposit:2500000}];
  const prevR={0:[1320,1418,10,12,268,281],1:[1010,1072,5,6,121,127],3:[2310,2455,0,2,340,355],4:[702,790,4,6,96,104],5:[4230,4301,18,19,701,707],6:[1880,1985,9,11,248,259]};
  const curR={0:[1418,1509,12,14,281,293],1:[1072,1140,6,8,127,132],5:[4301,4322,19,21,707,712]};
  const bp={pid:A.id,month:pm,rooms:{},createdAt:today},bc={pid:A.id,month:cm,rooms:{},createdAt:today};
  for(const [i,v] of Object.entries(prevR)){const room=A.rooms[i];const key=room.id+':'+room.tenant.id;const [,r]=makeRow(A,room,pm);Object.assign(r,{e0:v[0],e1:v[1],w0:v[2],w1:v[3],c0:v[4],c1:v[5]});r._pay=i==='3'?1500000:'full';if(i==='3')r.prorate=null;bp.rooms[key]=r}
  bp.ledger={elecKwh:640,elecCost:1760000,waterM3:70,waterCost:1150000,expenses:[{id:uid6(),name:'Thay bóng đèn hành lang',amount:120000,cat:'Sửa chữa'},{id:uid6(),name:'Internet cáp quang',amount:330000,cat:'Internet'}]};
  const bills={[billKey(A.id,pm)]:bp,[billKey(A.id,cm)]:bc};
  const B=newProp('Khu trọ Bình An','Tổ 5, KP. Tân Hòa, TP. Dĩ An, Bình Dương');B.demo=true;B.createdAt=new Date(Date.now()+1000).toISOString();
  Object.assign(B.prices,{elec:3500,waterMode:'person',waterPerson:100000,trash:20000,wifi:0,city:0});
  B.owner={name:'Trần Thị B',phone:'0912 345 678',cccd:'',address:'Dĩ An, Bình Dương'};B.layout={W:3.2,L:4.8,H:3.6,door:'center',window:true,ac:{on:false,wall:'left',level:'loft',hp:1},loft:{on:true,h:2.3,depth:2.0,t:0.1},wc:{on:true,w:1.1,d:1.3,corner:'front-right',doorDir:'side'},stair:{on:true,side:'left',w:0.6,tread:0.22,rail:false},kitchen:{on:true,len:1.4,dep:0.55,h:0.85,wall:'back',off:null},windowLow:true};
  B.rooms=[1,2,3,4,5,6].map(n=>newRoom(n,1,1600000));
  B.rooms[0].tenant={id:uid6(),name:'Lý Văn Phước',phone:'0345 220 118',cccd:'',moveIn:'2026-05-02',people:2,e0:310,w0:0,c0:0,deposit:1600000,endDate:addDays(today,-3),note:'Hẹn trả phòng, chưa dọn đi'};
  B.rooms[1].tenant={id:uid6(),name:'Ngô Thị Hằng',phone:'0388 600 742',cccd:'',moveIn:'2026-07-20',people:1,e0:122,w0:0,c0:0,deposit:1600000,endDate:'2027-07-20',note:''};
  B.rooms[3].tenant={id:uid6(),name:'Bùi Đức Long',phone:'0399 115 260',cccd:'',moveIn:'2026-02-14',people:3,e0:870,w0:0,c0:0,deposit:1600000,endDate:'2027-02-14',note:''};
  [A,B].forEach(normProp);
  return{props:{[A.id]:A,[B.id]:B},bills,settings:{alertDays:30,activePid:A.id},_cur:{pid:A.id,cm,curR}};
}
function finalizeDemo(d){
  // create current month rows and fill readings, then settle payments for the demo
  const {pid,cm,curR}=d._cur;const A=S.props[pid];
  for(const [key,r] of Object.entries(getBill(pid,addMonth(cm,-1)).rooms)){touch();const c=rowCalc(pid,addMonth(cm,-1),key,true);r.paid=r._pay==='full'?c.total:r._pay;r.paidAt=addMonth(cm,-1)+'-05';delete r._pay}
  createRows(pid,cm);
  for(const [i,v] of Object.entries(curR)){const room=A.rooms[i];const r=rowOf(pid,cm,room.id+':'+room.tenant.id);Object.assign(r,{e0:v[0],e1:v[1],w0:v[2],w1:v[3],c0:v[4],c1:v[5]})}
  touch();const lan=A.rooms[5];const k=lan.id+':'+lan.tenant.id;const c=rowCalc(pid,cm,k);rowOf(pid,cm,k).paid=c.total;rowOf(pid,cm,k).paidAt=todayISO();touch();
}
function loadDemoInto(){
  const d=makeDemo();Object.assign(S.props,d.props);Object.assign(S.bills,d.bills);S.settings.activePid=d.settings.activePid;touch();finalizeDemo(d);
  for(const id of Object.keys(d.props))persist('p',id);for(const k of Object.keys(S.bills))if(S.bills[k].pid in d.props)persist('b',k);persist('s');
}
function clearDemo(){
  for(const p of Object.values(S.props))if(p.demo){for(const k of Object.keys(S.bills))if(S.bills[k].pid===p.id){delete S.bills[k];persistDel('b',k)}delete S.props[p.id];persistDel('p',p.id)}
  fixActive();persist('s');
}

/* =========================== boot =========================== */
async function boot(){
  const use=window.claude&&typeof window.claude.use==='function'?window.claude.use.bind(window.claude):null;
  if(!use){startLocal();return}
  const cache=lsGet(LS_CACHE);if(cache)loadInto(cache);mode='boot';setSync('loading');render();
  let db=null,user=null;try{[db,user]=await Promise.all([use('db'),use('user')])}catch(e){}
  let id=null;if(db&&user){try{id=await user.id()}catch(e){}}
  if(!db||!id){startLocal();return}
  myId=id;dbRef=db;userRef=user;if(cache&&cache.uid!==id)loadInto(null);
  try{canWrite=await user.can('data.write')}catch(e){canWrite=null}
  mode='cloud';col=db.collection('data/users/'+id);setSync('loading');render();
  initCaps(use);subscribeReports();
  const tk=lsGet(LS_TENANT);if(tk)enterTenant(tk,false);
  loadTimer=setTimeout(()=>{if(!cloudLoaded){setSync('offline');toast('Chưa kết nối được máy chủ dữ liệu. Đang hiển thị bản lưu gần nhất.')}},10000);
  col.onSnapshot(onSnap,err=>{clearTimeout(loadTimer);setSync('error');toast('Mất kết nối dữ liệu. Tải lại trang để kết nối lại.')});
  if(pending.size)sched();
}
function startLocal(){
  mode='local';const d=lsGet(LS_LOCAL);
  if(d&&d.props)loadInto(d);else{loadInto(null);loadDemoInto();saveLocal()}
  setSync('local');render();
  setTimeout(cleanLocalPhotos,8000);
  backupBoot();
}

/* =========================== rendering =========================== */
let pendingRender=false;
const isEditing=()=>{const a=document.activeElement;return a&&a.matches&&a.matches('input,textarea,select')};
function requestRender(){if(isEditing()){pendingRender=true;return}render()}
document.addEventListener('focusout',()=>setTimeout(()=>{if(pendingRender&&!isEditing())render()},60));
function topSheet(){return ui.sheets[ui.sheets.length-1]}
function render(){
  pendingRender=false;
  const top=topSheet();const sb=document.querySelector('.sheet-bd');if(sb&&top&&sb.dataset.sid===top.sid)top.scroll=sb.scrollTop;
  document.getElementById('app').innerHTML=shell();
  const sh=document.getElementById('sheets');sh.innerHTML=top?renderSheet(top):'';
  document.body.classList.toggle('has-sheet',!!top);
  const nsb=document.querySelector('.sheet-bd');if(nsb&&top&&top.scroll)nsb.scrollTop=top.scroll;
  afterRender();
}
function afterRender(){
  const st=document.querySelector('.sheet [data-3d]')||(!topSheet()&&document.querySelector('[data-3d]'));
  if(st)mount3D(st);
  const img=document.getElementById('inv-img');if(img&&!img.getAttribute('src'))genInvoiceImg();
  hydratePhotos();
}
function shell(){
  if(ui.tenant)return tenantShell();
  if(mode==='boot'&&!Object.keys(S.props).length)return`<div class="wrap splash"><div class="stack" style="align-items:center"><div class="plate" style="font-size:20px;padding:8px 14px">Sổ Trọ</div><p>Đang mở sổ…</p></div></div>`;
  const p=P();
  if(!p)return emptyState();
  const alerts=alertCount(p)+openReports(p).length;
  return`<header class="topbar"><div class="wrap">
    <button class="prop-switch" data-act="openProps" aria-label="Đổi khu trọ"><span class="logo">${esc(initials(p.name))}</span><span class="t"><small>Khu trọ${Object.keys(S.props).length>1?' · '+Object.keys(S.props).length+' khu':''}</small><b>${esc(p.name)}</b></span>${ic('down',18)}</button>
    <span id="sync" class="sync ${syncState}">${syncHTML()}</span></div></header>
  <main class="wrap">${p.demo?`<div class="banner wide">${ic('alert',18)}<span class="grow">Đây là dữ liệu mẫu để xem thử.</span><div class="btns"><button class="btn sm" data-act="clearDemo">Xóa dữ liệu mẫu</button><button class="btn sm" data-act="openRestoreHub">${ic('upload',16)}Khôi phục dữ liệu cũ</button></div></div>`:''}${ui.tab==='home'?backupBanner():''}
  ${ui.tab==='home'?tabHome(p):ui.tab==='rooms'?tabRooms(p):ui.tab==='bills'?tabBills(p):ui.tab==='money'?tabMoney(p):tabSettings(p)}</main>
  <nav class="nav"><div class="wrap">${[['home','home','Tổng quan',alerts],['rooms','door','Phòng',0],['bills','receipt','Hóa đơn',0],['money','chart','Thu chi',0],['settings','sliders','Thiết lập',0]].map(([k,i,l,b])=>`<button class="${ui.tab===k?'on':''}" data-act="tab" data-tab="${k}">${ic(i,22)}<span>${l}</span>${b?`<span class="dot">${b}</span>`:''}</button>`).join('')}</div></nav>`;
}
function initials(n){const w=ascii(n).replace(/^(nha tro|khu tro|day tro|phong tro)\s*/i,'').trim().split(/\s+/);return((w[0]||'S')[0]+(w[1]||'')[0]||'').toUpperCase().slice(0,2)}
function emptyState(){
  return`<main class="wrap"><div class="empty" style="min-height:80vh;justify-content:center">
   <svg width="160" height="110" viewBox="0 0 160 110" aria-hidden="true"><rect x="10" y="20" width="140" height="86" rx="6" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/>${[0,1,2,3].map(i=>`<rect x="${22+i*32}" y="34" width="24" height="30" rx="3" fill="var(--accent)" fill-opacity="${i===2?.25:.9}"/><text x="${34+i*32}" y="53" font-size="9" text-anchor="middle" fill="var(--accent-ink)" font-family="IBM Plex Mono,monospace">${101+i}</text>`).join('')}${[0,1,2,3].map(i=>`<rect x="${22+i*32}" y="70" width="24" height="30" rx="3" fill="var(--accent)" fill-opacity="${i===0?.25:.9}"/><text x="${34+i*32}" y="89" font-size="9" text-anchor="middle" fill="var(--accent-ink)" font-family="IBM Plex Mono,monospace">${201+i}</text>`).join('')}<path d="M4 22 80 4l76 18" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/></svg>
   <h2>Sổ Trọ</h2><p>Quản lý nhiều khu trọ, dựng mô hình 3D phòng, chốt số điện nước, tính tiền và gửi hóa đơn cho từng người thuê.</p>
   ${canWrite===false?'':`<div class="stack" style="width:100%;max-width:320px"><button class="btn pri block" data-act="newProp">${ic('plus')}Tạo khu trọ đầu tiên</button><button class="btn block" data-act="loadDemo">Xem thử với dữ liệu mẫu</button>${mode==='local'?`<button class="btn block" data-act="openRestoreHub">${ic('upload',18)}Khôi phục dữ liệu đã sao lưu</button>`:''}</div>`}${dbRef?codeEntry():''}
   <p class="small">${mode==='cloud'?'Dữ liệu được lưu riêng cho tài khoản của bạn.':'Dữ liệu được lưu trên máy này.'}</p></div></main>`;
}
function alertCount(p){const ad=S.settings.alertDays||30;return p.rooms.filter(r=>{const d=endDays(r.tenant);return d!=null&&d<=ad}).length}
function endChip(t){const d=endDays(t);if(d==null)return'';const ad=S.settings.alertDays||30;
  if(d<0)return`<span class="chip bad">Quá hạn ${-d} ngày</span>`;if(d===0)return`<span class="chip bad">Trả phòng hôm nay</span>`;
  if(d<=ad)return`<span class="chip warn">Còn ${d} ngày</span>`;return`<span class="chip">Đến ${dmy(t.endDate)}</span>`}
function statusChip(c,id){const [l,k]=STATUS[c.status];return`<span class="chip ${k}" ${id?`id="${id}"`:''}>${l}</span>`}

/* ---------- tab: home ---------- */
function tabHome(p){
  const m=curMonth();const occ=p.rooms.filter(r=>r.tenant).length;const ad=S.settings.alertDays||30;
  const sum=monthSum(p.id,m);const miss=missingRooms(p,m).length;const pct=sum.due?Math.round(sum.paid/sum.due*100):0;
  const ending=p.rooms.filter(r=>{const d=endDays(r.tenant);return d!=null&&d<=ad}).sort((a,b)=>endDays(a.tenant)-endDays(b.tenant));
  const debts=p.rooms.map(r=>({r,d:tenantDebt(p,r)})).filter(x=>x.d>0).sort((a,b)=>b.d-a.d);
  const others=Object.values(S.props).filter(x=>x.id!==p.id);
  const occBar=p.rooms.slice().sort(byNo).map(r=>{const d=endDays(r.tenant);return`<span class="${r.tenant?(d!=null&&d<=ad?'w':'o'):''}" title="${esc(r.no)}"></span>`}).join('');
  return`<div class="hello"><h1>${esc(p.name)}</h1><p>${esc(p.address||'Chưa có địa chỉ')}</p></div>
  <div class="card hero" style="margin-top:14px">
    <div class="row"><b class="grow">${occ}/${p.rooms.length} phòng đang thuê</b><span class="muted small">${p.rooms.length-occ} trống</span></div>
    <div class="occ">${occBar||'<span></span>'}</div>
  </div>${homeExtras(p)}
  <div class="sec-h"><h3>${monthLabel(m)}</h3><span class="spacer"></span><button class="btn sm soft" data-act="goBills" data-m="${m}">Mở hóa đơn ${ic('chev',16)}</button></div>
  <div class="card">
    <div class="kpis"><div class="kpi"><small>Phải thu</small><b>${shortMoney(sum.due)}</b></div><div class="kpi"><small>Đã thu</small><b class="ok">${shortMoney(sum.paid)}</b></div><div class="kpi"><small>Còn lại</small><b class="${sum.remain?'bad':''}">${shortMoney(sum.remain)}</b></div></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <p class="small muted" style="margin-top:8px">${sum.rows?`${sum.complete}/${sum.rows} phòng đã chốt số điện nước`:'Chưa tạo hóa đơn tháng này'}${miss&&sum.rows?` · ${miss} phòng chưa có trong kỳ`:''}</p>
  </div>
  <div class="sec-h"><h3>Sắp trả phòng</h3><span class="spacer"></span><span class="muted small">trong ${ad} ngày</span></div>
  ${ending.length?`<div class="list">${ending.map(r=>`<button class="li" data-act="openRoom" data-rid="${r.id}"><span class="plate">${esc(r.no)}</span><span class="grow"><b>${esc(r.tenant.name)}</b><span>Hạn trả: ${dmy(r.tenant.endDate)}</span></span>${endChip(r.tenant)}</button>`).join('')}</div>`:`<p class="muted small">Không có phòng nào hết hạn trong ${ad} ngày tới.</p>`}
  <div class="sec-h"><h3>Chưa thu tiền</h3></div>
  ${debts.length?`<div class="list">${debts.map(({r,d})=>`<button class="li" data-act="openRoom" data-rid="${r.id}"><span class="plate">${esc(r.no)}</span><span class="grow"><b>${esc(r.tenant.name)}</b><span>${esc(r.tenant.phone||'')}</span></span><b class="tnum" style="color:var(--bad)">${money(d)}</b></button>`).join('')}</div>`:`<p class="muted small">Tất cả phòng đã thanh toán.</p>`}
  ${others.length?`<div class="sec-h"><h3>Khu trọ khác</h3></div><div class="list">${others.map(o=>{const s=monthSum(o.id,m);const oc=o.rooms.filter(r=>r.tenant).length;return`<button class="li" data-act="switchProp" data-pid="${o.id}"><span class="grow"><b>${esc(o.name)}</b><span>${oc}/${o.rooms.length} phòng thuê${s.remain?` · còn thu ${money(s.remain)}`:''}</span></span>${alertCount(o)?`<span class="chip warn">${alertCount(o)} sắp trả</span>`:''}<span class="chev">${ic('chev',18)}</span></button>`}).join('')}</div>`:''}`;
}

/* ---------- tab: rooms ---------- */
function tabRooms(p){
  const ad=S.settings.alertDays||30;const f=ui.roomFilter;
  const flt={all:()=>true,occ:r=>r.tenant,vac:r=>!r.tenant,end:r=>{const d=endDays(r.tenant);return d!=null&&d<=ad},debt:r=>tenantDebt(p,r)>0};
  const rooms=p.rooms.filter(flt[f]).sort(byNo);
  const floors=[...new Set(rooms.map(r=>r.floor))].sort((a,b)=>a-b);
  const counts={all:p.rooms.length,occ:p.rooms.filter(flt.occ).length,vac:p.rooms.filter(flt.vac).length,end:p.rooms.filter(flt.end).length,debt:p.rooms.filter(flt.debt).length};
  return`<div class="filters">${[['all','Tất cả'],['occ','Đang thuê'],['vac','Trống'],['end','Sắp trả'],['debt','Còn nợ']].map(([k,l])=>`<button class="${f===k?'on':''}" data-act="roomFilter" data-f="${k}">${l} · ${counts[k]}</button>`).join('')}</div>
  ${rooms.length?floors.map(fl=>`<div class="floor-h">${floors.length>1||fl>1?'Tầng '+fl:'Dãy phòng'}</div><div class="tiles">${rooms.filter(r=>r.floor===fl).map(r=>tile(p,r)).join('')}</div>`).join(''):`<p class="muted" style="padding:24px 0;text-align:center">Không có phòng nào trong mục này.</p>`}
  <div class="btns" style="margin-top:18px"><button class="btn" data-act="addRooms">${ic('plus')}Thêm phòng</button><button class="btn" data-act="openDesigns">${ic('cube')}Thiết kế 3D</button><button class="btn" data-act="openSite">${ic('building')}Sơ đồ dãy 3D</button></div>`;
}
function tile(p,r){
  const t=r.tenant;const d=endDays(t);const ad=S.settings.alertDays||30;const debt=t?tenantDebt(p,r):0;
  if(!t)return`<button class="tile vacant" data-act="openRoom" data-rid="${r.id}"><span class="no">${esc(r.no)}</span><span class="nm">Trống</span><span class="mt">${shortMoney(r.rent)}/tháng</span></button>`;
  return`<button class="tile ${d!=null&&d<=ad?'ending':''}" data-act="openRoom" data-rid="${r.id}">${debt?'<span class="debt" title="Còn nợ"></span>':''}<span class="no">${esc(r.no)}</span><span class="nm">${esc(lastName(t.name))}</span><span class="mt">${t.people} người · ${shortMoney(r.rent)}</span>${d!=null&&d<=ad?`<span class="fl">${endChip(t)}</span>`:''}</button>`;
}

/* ---------- tab: bills ---------- */
function tabBills(p){
  const m=ui.month;const b=getBill(p.id,m);const rows=rowsSorted(p.id,m);const miss=missingRooms(p,m);const has=b&&Object.keys(b.rooms).length;
  let h=`<div class="monthnav"><button class="iconbtn" data-act="month" data-d="-1" aria-label="Tháng trước">${ic('left')}</button><b>${monthLabel(m)}</b><button class="iconbtn" data-act="month" data-d="1" aria-label="Tháng sau">${ic('chev')}</button></div>`;
  h+=`<div id="msum">${monthSumHTML(p.id,m)}</div>`;
  if(miss.length)h+=`<div class="card" style="margin-top:12px;display:flex;gap:12px;align-items:center"><span class="grow small">${has?`${miss.length} phòng đang thuê chưa có trong kỳ này.`:`Chưa có hóa đơn ${monthLabel(m).toLowerCase()}. Tạo kỳ thu để chốt số điện nước cho ${miss.length} phòng đang thuê.`}</span><button class="btn pri sm" data-act="createRows">${has?'Thêm vào kỳ':'Tạo hóa đơn'}</button></div>`;
  if(rows.length){
    h+=`<div class="btns" style="margin:12px 0"><button class="btn sm pri" data-act="openRun">${ic('camera',16)}Chốt số bằng ảnh</button><button class="btn sm" data-act="openRecalc">${ic('refresh',16)}Tính lại</button><button class="btn sm" data-act="excel">${ic('grid',16)}Excel tiền điện</button><button class="btn sm" data-act="zipImgs">${ic('img',16)}Ảnh tất cả</button></div>`;
    h+=`<div class="stack">${rows.map(([key,r])=>billCard(p,m,key,r)).join('')}</div>`;
  }else if(!miss.length)h+=`<p class="muted" style="text-align:center;padding:30px 0">Không có phòng nào đang thuê trong ${monthLabel(m).toLowerCase()}.</p>`;
  return h;
}
function monthSumHTML(pid,m){const s=monthSum(pid,m);const pct=s.due?Math.round(s.paid/s.due*100):0;
  return`<div class="card"><div class="kpis" style="margin-top:0"><div class="kpi"><small>Phải thu</small><b>${money(s.due)}</b></div><div class="kpi"><small>Đã thu</small><b class="ok">${money(s.paid)}</b></div><div class="kpi"><small>Còn lại</small><b class="${s.remain?'bad':''}">${money(s.remain)}</b></div></div><div class="bar"><i style="width:${pct}%"></i></div><p class="small muted" style="margin-top:8px">${s.complete}/${s.rows} phòng đã chốt số · ${s.unpaid} phòng chưa thu đủ</p></div>`}
function meterRow(pid,m,key,r,f,label,cls,icn){
  const a=f+'0',b=f+'1';const u=r[b]!=null?Math.round((r[b]-r[a])*100)/100:null;const unit=f==='e'?'kWh':'m³';
  return`<div class="mrow"><span class="mi ${cls}">${ic(icn,14)}</span><span class="lab"><b>${label}</b><span id="u-${f}-${key}">cũ ${num(r[a])}${u!=null?` · ${num(u)} ${unit}`:''}</span></span><input type="number" inputmode="decimal" step="any" id="in-${f}-${key}" class="${u!=null&&u<0?'bad':''}" data-in="read" data-pid="${pid}" data-m="${m}" data-key="${key}" data-f="${b}" value="${r[b]??''}" placeholder="Số mới" aria-label="${label} số mới phòng ${esc(r.roomNo)}">${camBtn(pid,m,key,f,r)}</div>`;
}
function billCard(p,m,key,r){
  const c=rowCalc(p.id,m,key);const pr=r.prices||{};
  return`<div class="bcard"><div class="hd"><span class="plate">${esc(r.roomNo)}</span><span class="grow"><b>${esc(r.tenantName)}</b><span class="small muted">${r.people} người${r.final?' · trả phòng':''}</span></span><span id="chip-${key}">${statusChip(c)}</span></div>
   ${meterRow(p.id,m,key,r,'e','Điện','e','bolt')}
   ${pr.waterMode!=='person'&&pr.well>0?meterRow(p.id,m,key,r,'w','Giếng','w','drop'):''}
   ${pr.waterMode!=='person'&&pr.city>0?meterRow(p.id,m,key,r,'c','N. máy','w','drop'):''}
   <div class="ft"><span class="small muted">Tổng</span><b id="tot-${key}">${c.complete?money(c.total):'—'}</b><span class="spacer"></span><button class="btn sm" data-act="openBill" data-key="${key}">Chi tiết ${ic('chev',16)}</button></div></div>`;
}
function refreshLive(pid,m,key){
  const c=rowCalc(pid,m,key);const r=rowOf(pid,m,key);if(!c)return;
  const t=document.getElementById('tot-'+key);if(t)t.textContent=c.complete?money(c.total):'—';
  const ch=document.getElementById('chip-'+key);if(ch)ch.innerHTML=statusChip(c);
  for(const f of ['e','w','c']){const u=document.getElementById('u-'+f+'-'+key);if(u){const v=r[f+'1']!=null?Math.round((r[f+'1']-r[f+'0'])*100)/100:null;u.textContent='cũ '+num(r[f+'0'])+(v!=null?' · '+num(v)+(f==='e'?' kWh':' m³'):'')}}
  const ms=document.getElementById('msum');if(ms)ms.innerHTML=monthSumHTML(pid,m);
  const bi=document.getElementById('bill-items');if(bi)bi.innerHTML=itemsHTML(c);
  const bp=document.getElementById('bill-paid-info');if(bp)bp.innerHTML=paidInfo(c);
}

/* ---------- tab: settings ---------- */
function tabSettings(p){
  const bank=BANKS.find(b=>b[0]===p.bank.bin);const pr=p.prices;
  const li=(act,icn,title,sub,extra='')=>`<button class="li" data-act="${act}" ${extra}><span class="mi e" style="background:var(--accent-soft);color:var(--accent);width:32px;height:32px;border-radius:9px">${ic(icn,18)}</span><span class="grow"><b>${title}</b><span>${sub}</span></span><span class="chev">${ic('chev',18)}</span></button>`;
  return`<div class="sec-h" style="margin-top:4px"><h3>${esc(p.name)}</h3></div><div class="list">
   ${li('editProp','building','Thông tin khu trọ & chủ trọ',esc(p.address||'Tên, địa chỉ, chủ trọ, hạn thanh toán'))}
   ${li('openPrices','tag','Bảng giá dịch vụ',`Điện ${num(pr.elec)}đ · ${pr.waterMode==='person'?`nước ${num(pr.waterPerson)}đ/người`:`nước máy ${num(pr.city)}đ${pr.well?` · giếng ${num(pr.well)}đ`:''}`}`)}
   ${li('openDesigns','cube','Thiết kế phòng 3D',`Mẫu chung ${f2(p.layout.W)} × ${f2(p.layout.L)} m${p.designs.length?` · thêm ${p.designs.length} thiết kế`:''}`)}
   ${li('openSite','building','Sơ đồ dãy trọ 3D',p.site.mode==='two'?`Hai dãy, hành lang ${f2(p.site.cw)} m`:`Một dãy, lối đi ${f2(p.site.cw)} m`)}
   ${li('openBank','bank','Tài khoản nhận tiền',bank&&p.bank.acct?`${bank[1]} · ${esc(p.bank.acct)}`:'Thêm để in mã QR chuyển khoản lên hóa đơn')}
   ${li('openRemind','bell','Nhắc trên điện thoại','Ngày chốt số, hạn thu tiền, hết hạn hợp đồng')}
  </div>
  <div class="sec-h"><h3>Cảnh báo</h3></div>
  <div class="card"><label class="fld"><span class="fl">Báo trước ngày trả phòng</span><span class="fi"><input type="number" inputmode="numeric" id="set-alert" data-in="alertDays" value="${S.settings.alertDays||30}" min="1"><span class="sfx">ngày</span></span><span class="hint">Phòng có hạn trả trong khoảng này sẽ hiện ở Tổng quan và được tô màu cam.</span></label></div>
  <div class="sec-h"><h3>Dữ liệu</h3></div>
  <div class="list">
   ${li('openReadSet','camera','Đọc số trên ảnh',readEngine()?'Tự đọc: '+ENGINE_NAME[readEngine()]:'Đang tắt, nhập số bằng tay')}
   ${androidVersion()?li('checkUpdate','refresh','Kiểm tra cập nhật',`App Android bản ${esc(androidVersion())} · tự kiểm tra mỗi ngày`):''}
   ${mode==='local'?li('openDrive','upload','Sao lưu Google Drive',driveStatusText()):''}
   ${li('backup','save','Sao lưu ra tệp',`Tệp .json chứa toàn bộ khu trọ và hóa đơn`)}
   ${li('backupZip','img','Sao lưu kèm ảnh đồng hồ',`Tệp .zip gồm dữ liệu và ảnh đồng hồ lưu trên máy này`)}
   <label class="li" style="cursor:pointer"><span class="mi" style="background:var(--accent-soft);color:var(--accent);width:32px;height:32px;border-radius:9px">${ic('upload',18)}</span><span class="grow"><b>Khôi phục từ tệp</b><span>Thay toàn bộ dữ liệu hiện tại bằng tệp sao lưu</span></span><input type="file" accept=".json,.zip,application/json,application/zip" id="restore-file" data-ch="restore" hidden></label>
   ${li('newProp','plus','Thêm khu trọ mới','Mỗi khu có bảng giá và mẫu phòng riêng')}
  </div>
  <p class="small muted" style="margin-top:12px">${mode==='cloud'?'Dữ liệu lưu riêng theo tài khoản của bạn, mở trên máy khác vẫn thấy.':'Dữ liệu đang lưu trên trình duyệt của máy này. Hãy sao lưu định kỳ.'}</p>
  <button class="btn danger block" style="margin-top:18px" data-act="deleteProp">${ic('trash',18)}Xóa khu trọ này</button>`;
}

/* =========================== sheets =========================== */
let sidN=0;
function push(type,params={},draft=null){ui.sheets.push({sid:'s'+(++sidN),type,params,draft,scroll:0});render()}
function pop(n=1){for(let i=0;i<n;i++)ui.sheets.pop();render()}
function renderSheet(sh){
  const f=SHEETS[sh.type];const o=f(sh)||{};
  return`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(o.title||'')}"><div class="sheet-hd"><div class="wrap"><button class="iconbtn" data-act="back" aria-label="Quay lại">${ic('back',22)}</button><h2>${o.title||''}</h2>${o.right||''}</div></div>
  <div class="sheet-bd" data-sid="${sh.sid}"><div class="wrap">${o.body||''}</div></div>${o.foot?`<div class="sheet-ft"><div class="wrap">${o.foot}</div></div>`:''}</div>`;
}
const fid=p=>'f-'+p.replace(/\./g,'-');
function fld(label,path,val,o={}){
  const t=o.type||'text';
  return`<label class="fld ${o.full?'full':''}"><span class="fl">${label}${o.req?' <b class="req">*</b>':''}</span><span class="fi"><input id="${fid(path)}" data-draft="${path}" data-type="${t==='number'?'num':'str'}" type="${t}" ${t==='number'?`inputmode="${o.mode||'decimal'}" step="any"`:''} ${o.mode&&t!=='number'?`inputmode="${o.mode}"`:''} value="${esc(val??'')}" placeholder="${esc(o.ph||'')}" style="--sfx:${o.sfx?o.sfx.length:0}">${o.sfx?`<span class="sfx">${o.sfx}</span>`:''}</span>${o.hint?`<span class="hint">${o.hint}</span>`:''}</label>`;
}
function sel(label,path,val,opts,o={}){return`<label class="fld ${o.full?'full':''}"><span class="fl">${label}</span><select id="${fid(path)}" data-draft="${path}" data-type="str" ${o.rr?'data-rr="1"':''}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`}
function tog(title,path,val,sub=''){return`<label class="tog"><span class="grow"><b>${title}</b>${sub?`<span>${sub}</span>`:''}</span><input type="checkbox" id="${fid(path)}" data-draft="${path}" data-type="bool" data-rr="1" ${val?'checked':''}></label>`}
function seg(path,val,opts){return`<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" class="${String(v)===String(val)?'on':''}" data-act="seg" data-path="${path}" data-v="${esc(v)}">${l}</button>`).join('')}</div>`}

const SHEETS={
 props(){
  const m=curMonth();
  return{title:'Khu trọ của bạn',body:`<div class="list">${Object.values(S.props).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')).map(p=>{const oc=p.rooms.filter(r=>r.tenant).length;const s=monthSum(p.id,m);return`<button class="li" data-act="switchProp" data-pid="${p.id}"><span class="prop-switch" style="flex:none"><span class="logo">${esc(initials(p.name))}</span></span><span class="grow"><b>${esc(p.name)}</b><span>${oc}/${p.rooms.length} phòng thuê${s.remain?' · còn thu '+money(s.remain):''}</span></span>${p.id===S.settings.activePid?`<span class="chip acc">${ic('check',14)}Đang xem</span>`:''}</button>`}).join('')}</div>
   <button class="btn pri block" data-act="newProp">${ic('plus')}Thêm khu trọ</button>`};
 },
 propForm(sh){
  const d=sh.draft;const isNew=!sh.params.pid;
  if(isNew)return{title:'Khu trọ mới',body:`<div class="fgrid">${fld('Tên khu trọ','name',d.name,{req:1,full:1,ph:'VD: Nhà trọ Hoa Sứ'})}${fld('Địa chỉ','address',d.address,{full:1,ph:'Số nhà, hẻm, phường, quận'})}</div>
   <div class="group"><h4>${ic('door',18)}Phòng</h4><div class="fgrid">${fld('Số tầng','floors',d.floors,{type:'number',mode:'numeric'})}${fld('Phòng mỗi tầng','perFloor',d.perFloor,{type:'number',mode:'numeric'})}
   ${sel('Cách đánh số','numbering',d.numbering,[['floor','Theo tầng: 101, 102, 201…'],['seq','Liên tiếp: 1, 2, 3…']],{full:1})}${fld('Giá thuê mỗi phòng','rent',d.rent,{type:'number',mode:'numeric',sfx:'đ',full:1,hint:d.rent?money(d.rent)+' / tháng':''})}</div>
   <p class="hint">Sẽ tạo ${Math.max(0,(d.floors||0)*(d.perFloor||0))} phòng: ${previewNos(d).join(', ')}${(d.floors||0)*(d.perFloor||0)>6?'…':''}</p></div>
   <div class="group"><h4>${ic('tag',18)}Giá dịch vụ chính</h4><div class="fgrid">${fld('Giá điện','elec',d.elec,{type:'number',sfx:'đ/kWh'})}${fld('Nước máy','city',d.city,{type:'number',sfx:'đ/m³',hint:'Để 0 nếu không dùng'})}${fld('Nước giếng','well',d.well,{type:'number',sfx:'đ/m³',hint:'Để 0 nếu không dùng'})}${fld('Rác','trash',d.trash,{type:'number',sfx:'đ'})}${fld('Wifi mỗi phòng','wifi',d.wifi,{type:'number',sfx:'đ'})}</div><p class="hint">Có thể đổi chi tiết trong Thiết lập · Bảng giá dịch vụ.</p></div>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveProp">Tạo và thiết lập mẫu phòng</button>`};
  return{title:'Thông tin khu trọ',body:`<div class="fgrid">${fld('Tên khu trọ','name',d.name,{req:1,full:1})}${fld('Địa chỉ','address',d.address,{full:1})}
   ${fld('Hạn thanh toán','dueDay',d.dueDay,{type:'number',mode:'numeric',sfx:'hằng tháng',hint:'Ngày trong tháng kế tiếp, in trên hóa đơn'})}${fld('Ngày chốt số điện nước','readDay',d.readDay,{type:'number',mode:'numeric',sfx:'hằng tháng',hint:'Dùng để nhắc trên điện thoại'})}</div>
   <div class="group"><h4>${ic('user',18)}Chủ trọ</h4><div class="fgrid">${fld('Họ tên','owner.name',d.owner.name,{full:1})}${fld('Điện thoại','owner.phone',d.owner.phone,{type:'tel',mode:'tel'})}${fld('CCCD','owner.cccd',d.owner.cccd,{mode:'numeric'})}${fld('Địa chỉ thường trú','owner.address',d.owner.address,{full:1})}</div><p class="hint">In trên hợp đồng, tờ khai tạm trú. Số điện thoại hiện trên trang người thuê.</p></div>
   <label class="fld"><span class="fl">Trang thiết bị trong phòng</span><textarea id="f-equipment" data-draft="equipment" data-type="str" placeholder="VD: 1 quạt trần, 2 bóng đèn LED, 1 vòi sen, 1 bồn cầu, 1 kệ bếp">${esc(d.equipment||'')}</textarea><span class="hint">Cách nhau bằng dấu phẩy. Dùng cho hợp đồng và biên bản bàn giao.</span></label>
   <label class="fld"><span class="fl">Thỏa thuận thêm trong hợp đồng</span><textarea id="f-terms" data-draft="terms" data-type="str" placeholder="Mỗi dòng một ý. VD: Giờ đóng cổng 23h. Không nuôi thú cưng.">${esc(d.terms||'')}</textarea></label>
   <div class="group">${tog('Tính tiền phòng theo ngày ở tháng đầu','prorate',d.prorate,'Người dọn vào giữa tháng chỉ trả số ngày đã ở')}${tog('Cộng dồn nợ kỳ trước','carryDebt',d.carryDebt,'Số còn thiếu tháng trước tự cộng vào hóa đơn tháng sau')}</div>
   <label class="fld"><span class="fl">Lời nhắn cuối hóa đơn</span><textarea id="f-invoiceNote" data-draft="invoiceNote" data-type="str" placeholder="VD: Vui lòng chuyển khoản đúng nội dung để chủ trọ đối soát.">${esc(d.invoiceNote||'')}</textarea></label>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveProp">Lưu</button>`};
 },
 bank(sh){const d=sh.draft;
  return{title:'Tài khoản nhận tiền',body:`<div class="fgrid">${sel('Ngân hàng','bin',d.bin,[['','Chọn ngân hàng'],...BANKS.map(b=>[b[0],b[1]])],{full:1})}${fld('Số tài khoản','acct',d.acct,{full:1,mode:'numeric'})}${fld('Tên chủ tài khoản','holder',d.holder,{full:1,ph:'NGUYEN VAN A',hint:'Viết hoa không dấu, đúng như trên app ngân hàng'})}</div>
  <p class="small muted">Hóa đơn sẽ có mã QR VietQR kèm sẵn số tiền và nội dung chuyển khoản (VD: P101 T11-2026). Hãy quét thử một hóa đơn bằng app ngân hàng của bạn trước khi gửi cho người thuê.</p>`,
  foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveBank">Lưu</button>`};
 },
 prices(sh){const d=sh.draft;
  return{title:'Bảng giá dịch vụ',body:`<div class="group"><h4><span class="mi e">${ic('bolt',14)}</span>Điện</h4><div class="fgrid">${fld('Giá điện','elec',d.elec,{type:'number',sfx:'đ/kWh',full:1})}</div></div>
  <div class="group"><h4><span class="mi w">${ic('drop',14)}</span>Nước</h4>${seg('waterMode',d.waterMode,[['m3','Theo đồng hồ (m³)'],['person','Theo đầu người']])}
   <div class="fgrid">${d.waterMode==='person'?fld('Mỗi người / tháng','waterPerson',d.waterPerson,{type:'number',sfx:'đ',full:1}):fld('Nước máy','city',d.city,{type:'number',sfx:'đ/m³',hint:'0 = không dùng'})+fld('Nước giếng','well',d.well,{type:'number',sfx:'đ/m³',hint:'0 = không dùng'})}</div></div>
  <div class="group"><h4>${ic('trash',16)}Rác & Wifi</h4><div class="fgrid">${fld('Tiền rác','trash',d.trash,{type:'number',sfx:'đ'})}${sel('Tính rác theo','trashMode',d.trashMode,[['room','Mỗi phòng'],['person','Mỗi người']])}${fld('Wifi mỗi phòng','wifi',d.wifi,{type:'number',sfx:'đ',full:1,hint:'Phòng không dùng wifi: bật "Không dùng wifi" trong thông tin phòng'})}</div></div>
  <div class="group"><h4>${ic('plus',16)}Phí khác</h4>${(d.extras||[]).map((x,i)=>`<div class="adj" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,.9fr) 40px"><input type="text" data-draft="extras.${i}.name" data-type="str" value="${esc(x.name)}" placeholder="Tên phí" id="ex-n-${i}"><input type="number" inputmode="numeric" data-draft="extras.${i}.amount" data-type="num" value="${x.amount??''}" placeholder="Số tiền" id="ex-a-${i}"><select data-draft="extras.${i}.mode" data-type="str" id="ex-m-${i}"><option value="room" ${x.mode!=='person'?'selected':''}>/phòng</option><option value="person" ${x.mode==='person'?'selected':''}>/người</option></select><button class="iconbtn" data-act="delExtra" data-i="${i}" aria-label="Xóa">${ic('x',18)}</button></div>`).join('')}
   <button class="btn sm" data-act="addExtra">${ic('plus',16)}Thêm khoản phí (giữ xe, vệ sinh…)</button></div>
  <p class="small muted">Giá mới chỉ áp dụng cho hóa đơn tạo sau này. Hóa đơn đã tạo giữ giá cũ cho đến khi bạn bấm Tính lại.</p>`,
  foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="savePrices">Lưu bảng giá</button>`};
 },
 recalc(sh){
  const {pid,month,fromPrices}=sh.params;const p=S.props[pid];const rows=rowsSorted(pid,month);const d=sh.draft;
  const selN=rows.filter(([k])=>d.sel[k]).length;let diff=0;
  const list=rows.map(([k,r])=>{const o=rowCalc(pid,month,k);const n=previewRecalc(pid,month,k);if(d.sel[k]&&o.complete)diff+=n.total-o.total;const ch=Math.round(n.total-o.total);
   return`<label class="ck"><input type="checkbox" data-act="recalcSel" data-key="${k}" ${d.sel[k]?'checked':''}><span class="plate">${esc(r.roomNo)}</span><span class="grow"><b style="display:block;font-weight:600">${esc(r.tenantName)}</b><span class="small muted">${o.complete?`${money(o.total)} → ${money(n.total)}`:'Chưa chốt số, sẽ áp giá mới khi nhập'}</span></span>${o.complete&&ch?`<span class="chip ${ch>0?'warn':'ok'}">${ch>0?'+':''}${shortMoney(Math.abs(ch))}</span>`:''}</label>`}).join('');
  return{title:'Tính lại hóa đơn',body:`${fromPrices?`<div class="banner" style="background:var(--ok-soft);color:var(--ok)">${ic('check',18)}<span>Đã lưu bảng giá mới. Chọn phòng cần áp dụng cho ${monthLabel(month).toLowerCase()}.</span></div>`:''}
   <p class="small muted">Tính lại sẽ lấy giá điện, nước, rác, wifi, phí khác hiện tại của khu, giá thuê và số người hiện tại của từng phòng. Chỉ số điện nước đã nhập được giữ nguyên.</p>
   <div class="row"><button class="btn sm" data-act="recalcAll" data-v="1">Chọn tất cả</button><button class="btn sm" data-act="recalcAll" data-v="0">Bỏ chọn</button><span class="spacer"></span><span class="small muted">Chênh lệch: <b class="tnum">${diff>0?'+':''}${money(diff)}</b></span></div>
   <div class="list">${list}</div>`,
   foot:`<button class="btn" data-act="back">${fromPrices?'Để sau':'Hủy'}</button><button class="btn pri" data-act="doRecalc" ${selN?'':'disabled'}>${selN===rows.length?`Tính lại toàn khu (${selN})`:`Tính lại ${selN} phòng`}</button>`};
 },
 layout(sh){
  const {pid,rid,did}=sh.params;const p=S.props[pid];const room=rid?p.rooms.find(r=>r.id===rid):null;const d=sh.draft;const l=d.l;
  const useDef=rid&&d.design!=='custom';const named=did&&did!=='default';
  const body=`${rid?`<div class="group"><label class="fld"><span class="fl">Thiết kế của phòng ${esc(room.no)}</span><select data-ch="roomDesign">${[['default','Mẫu chung'],...p.designs.map(x=>[x.id,x.name]),['custom','Kích thước riêng cho phòng này']].map(([v,t])=>`<option value="${esc(v)}" ${v===d.design?'selected':''}>${esc(t)}</option>`).join('')}</select><span class="hint">${useDef?'Sửa thiết kế dùng chung ở mục Thiết kế 3D. Ở đây chỉ chỉnh máy lạnh riêng cho phòng.':'Chỉ phòng này dùng kích thước bên dưới.'}</span></label></div>`
   :named?`<div class="group">${fld('Tên thiết kế','name',d.name,{full:1,ph:'VD: Kiot mặt tiền, Phòng có gác'})}</div>`
   :`<p class="small muted">Mẫu chung dùng cho mọi phòng chưa chọn thiết kế khác. Tạo thêm thiết kế (vd. cho kiot) ở mục Thiết kế 3D.</p>`}
   <div class="stage-pin"><div class="stage" data-3d="draft">${stageOverlay()}${stageWarnBtn(sh)}</div></div>
   <div id="layout-stats">${statsHTML(draftLayout(sh))}</div>
   ${useDef?'':`<div class="group"><h4>${ic('door',18)}Kích thước phòng</h4><div class="fgrid" style="grid-template-columns:1fr 1fr 1fr">${fld('Rộng','l.W',l.W,{type:'number',sfx:'m'})}${fld('Dài','l.L',l.L,{type:'number',sfx:'m'})}${fld('Cao trần','l.H',l.H,{type:'number',sfx:'m'})}</div>
    <div class="fld"><span class="fl">Cửa ra vào (nhìn từ ngoài vào)</span>${seg('l.door',l.door,[['left','Trái'],['center','Giữa'],['right','Phải'],['shop','Cửa cuốn']])}${l.door==='shop'?'<span class="hint">Cửa cuốn kiot rộng gần hết mặt tiền, cao tới 2,8 m.</span>':''}</div>${tog('Cửa sổ tầng dưới','l.win.on',l.win.on,'Tự tránh cửa ra vào, nhà vệ sinh, cầu thang và nâng lên trên bàn bếp')}${l.win.on?`<div class="fld"><span class="fl">Tường đặt cửa sổ (nhìn từ cửa vào)</span>${seg('l.win.wall',l.win.wall,[['left','Trái'],['back','Sau'],['right','Phải'],['front','Trước']])}</div>`:''}</div>
   <div class="group">${tog('Gác lửng','l.loft.on',l.loft.on,'Sàn gác đặt ở phía sau phòng')}${l.loft.on?`<div class="fgrid">${fld('Cao sàn gác','l.loft.h',l.loft.h,{type:'number',sfx:'m',hint:'Từ sàn nhà lên mặt sàn gác'})}${fld('Sâu gác','l.loft.depth',l.loft.depth,{type:'number',sfx:'m',hint:'Tính từ tường sau ra'})}${fld('Dày sàn gác','l.loft.t',l.loft.t,{type:'number',sfx:'m'})}</div>${tog('Cửa sổ trên gác','l.loft.win.on',l.loft.win.on,'Thoáng và sáng cho chỗ ngủ trên gác')}${l.loft.win.on?`<div class="fld"><span class="fl">Tường đặt cửa sổ gác</span>${seg('l.loft.win.wall',l.loft.win.wall,[['left','Trái'],['back','Sau'],['right','Phải']])}</div>`:''}`:''}</div>
   <div class="group">${tog('Nhà vệ sinh trong phòng','l.wc.on',l.wc.on)}${l.wc.on?`<div class="fgrid">${fld('Rộng','l.wc.w',l.wc.w,{type:'number',sfx:'m'})}${fld('Sâu','l.wc.d',l.wc.d,{type:'number',sfx:'m'})}${sel('Vị trí','l.wc.corner',l.wc.corner,[['back-right','Góc trong, bên phải'],['back-left','Góc trong, bên trái'],['front-right','Góc ngoài, bên phải'],['front-left','Góc ngoài, bên trái']],{full:1,rr:1})}</div><div class="fld"><span class="fl">Hướng cửa nhà vệ sinh</span>${seg('l.wc.doorDir',l.wc.doorDir,l.wc.corner.startsWith('back')?[['long','Quay ra cửa chính'],['side','Quay ngang ra giữa phòng']]:[['long','Quay vào trong phòng'],['side','Quay ngang ra giữa phòng']])}</div>`:''}</div>
   ${l.loft.on?`<div class="group">${tog('Cầu thang lên gác','l.stair.on',l.stair.on,'Số bậc tự tính theo cao độ gác, mỗi bậc khoảng 20 cm')}${l.stair.on?`<div class="fld"><span class="fl">Đặt dọc tường</span>${seg('l.stair.side',l.stair.side,[['left','Bên trái'],['right','Bên phải']])}</div><div class="fgrid">${fld('Bề rộng thang','l.stair.w',l.stair.w,{type:'number',sfx:'m'})}${fld('Mặt bậc','l.stair.tread',l.stair.tread,{type:'number',sfx:'m',hint:'Thang sắt gác lửng thường 0,2–0,25 m'})}</div>${tog('Có lan can tay vịn','l.stair.rail',l.stair.rail,'Tay vịn phía ngoài cầu thang')}`:''}</div>`:''}
   <div class="group">${tog('Bàn bếp nấu ăn','l.kitchen.on',l.kitchen.on,'Có chỗ rửa và bếp nấu')}${l.kitchen.on?`<div class="fgrid" style="grid-template-columns:1fr 1fr 1fr">${fld('Dài','l.kitchen.len',l.kitchen.len,{type:'number',sfx:'m'})}${fld('Rộng','l.kitchen.dep',l.kitchen.dep,{type:'number',sfx:'m'})}${fld('Cao','l.kitchen.h',l.kitchen.h,{type:'number',sfx:'m'})}</div>
    <div class="fld"><span class="fl">Đặt sát tường (nhìn từ cửa vào)</span>${seg('l.kitchen.wall',l.kitchen.wall,[['left','Trái'],['back','Sau'],['right','Phải'],['front','Trước']])}</div>
    ${fld('Cách đầu tường','l.kitchen.off',l.kitchen.off,{type:'number',sfx:'m',ph:'Tự động',hint:l.kitchen.wall==='left'||l.kitchen.wall==='right'?'Tính từ tường có cửa ra vào. Để trống để app tự tìm chỗ không vướng.':'Tính từ tường bên trái. Để trống để app tự tìm chỗ không vướng.'})}`:''}</div>`}
   ${acGroup(useDef?'ac':'l.ac',useDef?d.ac:l.ac,useDef?designLayout(p,d.design):l,!rid)}
   ${rid?'':designRoomsHTML(p,did,d)}${named&&!sh.params.isNew?`<button class="btn danger block" data-act="delDesign" style="margin-top:4px">${ic('trash',18)}Xóa thiết kế này</button>`:''}`;
  return{title:rid?`Thiết kế phòng ${esc(room.no)}`:named?(sh.params.isNew?'Thiết kế mới':esc(d.name||'Thiết kế')):'Mẫu chung',body,foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveLayout">${rid?'Lưu':'Lưu thiết kế'}</button>`};
 },
 room(sh){
  const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);if(!room)return{title:'Phòng',body:'<p class="muted">Phòng này đã bị xóa.</p>'};
  const t=room.tenant;const l=roomLayout(p,room);const li=layoutInfo(l);const pr=p.prices;
  const rows=Object.values(S.bills).filter(b=>b.pid===p.id).flatMap(b=>Object.entries(b.rooms).filter(([,r])=>r.roomId===room.id).map(([k,r])=>({m:b.month,k,r}))).sort((a,b)=>b.m.localeCompare(a.m));
  const debt=tenantDebt(p,room);
  let body=`<div class="rhead"><div class="door">${esc(room.no)}</div><div class="grow"><h2 style="font-size:20px">Phòng ${esc(room.no)}</h2><p class="muted small">Tầng ${room.floor} · ${money(room.rent)}/tháng · ${f2(li.area+li.loftA)} m² sử dụng</p><div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${t?`<span class="chip acc">Đang thuê</span>${endChip(t)}`:'<span class="chip">Trống</span>'}${acOf(p,room)?`<span class="chip">${ic('snow',14)}Máy lạnh ${f2(+acOf(p,room).hp)} HP</span>`:''}${debt?`<span class="chip bad">Nợ ${money(debt)}</span>`:''}</div></div></div>`;
  if(t){
   body+=`<div class="card stack"><div class="row"><span class="mi" style="background:var(--accent-soft);color:var(--accent);width:36px;height:36px;border-radius:10px;display:grid;place-items:center">${ic('user',20)}</span><div class="grow"><b style="font-size:17px">${esc(t.name)}</b><p class="small muted">${t.people} người ở</p></div><button class="btn sm" data-act="editTenant">${ic('edit',16)}Sửa</button></div>
    <dl class="kv" style="margin:0">${t.phone?`<dt>Điện thoại</dt><dd><span class="mono">${esc(t.phone)}</span> <button class="btn sm" style="min-height:28px;padding:0 8px" data-act="copy" data-text="${esc(t.phone)}">Chép</button></dd>`:''}${t.cccd?`<dt>CCCD</dt><dd class="mono">${esc(t.cccd)}</dd>`:''}${t.dob?`<dt>Ngày sinh</dt><dd>${dmy(t.dob)}${t.gender?' · '+esc(t.gender):''}</dd>`:''}<dt>Ngày dọn vào</dt><dd>${dmy(t.moveIn)}</dd>${t.members&&t.members.length?`<dt>Ở cùng</dt><dd>${t.members.map(x=>esc(x.name)).join(', ')}</dd>`:''}<dt>Ngày trả dự kiến</dt><dd>${t.endDate?dmy(t.endDate):'Chưa hẹn'}</dd>${t.deposit?`<dt>Tiền cọc</dt><dd>${money(t.deposit)}</dd>`:''}${t.note?`<dt>Ghi chú</dt><dd>${esc(t.note)}</dd>`:''}</dl>
    <div><p class="fl small muted" style="font-weight:600;margin-bottom:6px">Chỉ số khi dọn vào</p><div class="meters">${odo('Điện','bolt','e',t.e0,'kWh')}${pr.waterMode!=='person'?`${pr.well>0||t.w0?odo('Nước giếng','drop','w',t.w0,'m³'):''}${pr.city>0||t.c0?odo('Nước máy','drop','w',t.c0,'m³'):''}`:''}</div></div>
    <div class="btns"><button class="btn sm" data-act="openDoc" data-kind="contract">${ic('file',16)}Hợp đồng</button><button class="btn sm" data-act="openDoc" data-kind="ct01">${ic('file',16)}Tờ khai tạm trú</button><button class="btn sm" data-act="openDoc" data-kind="handover">${ic('file',16)}Bàn giao</button></div>
    <div class="btns"><button class="btn" data-act="openPortal">${ic('key',18)}Trang người thuê${t.portal?' · đang bật':''}</button><button class="btn" data-act="checkout">${ic('out',18)}Trả phòng</button></div></div>`;
  }else body+=`<div class="card" style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;padding:22px"><p class="muted">Phòng đang trống.</p><button class="btn pri" data-act="addTenant">${ic('plus')}Thêm người thuê</button></div>`;
  body+=`<div class="sec-h" style="margin:8px 0 0"><h3>Mô hình 3D</h3><span class="spacer"></span><button class="btn sm soft" data-act="openLayout" data-rid="${room.id}">${ic('edit',16)}Đổi thiết kế</button></div>
   <div class="stage" data-3d="room" data-rid="${room.id}">${stageOverlay()}</div>${statsHTML(l,true)}<p class="small muted">${room.layout?'Phòng này dùng kích thước riêng.':`Đang dùng thiết kế “${esc(designName(p,room.design))}”.`}</p>`;
  body+=`<div class="sec-h" style="margin:8px 0 0"><h3>Hóa đơn</h3></div>${rows.length?`<div class="list">${rows.slice(0,12).map(x=>{const c=rowCalc(p.id,x.m,x.k);return`<button class="li" data-act="openBill" data-m="${x.m}" data-key="${x.k}"><span class="grow"><b>${monthLabel(x.m)}</b><span>${esc(x.r.tenantName)}</span></span><span style="text-align:right"><b class="tnum" style="display:block">${c.complete?money(c.total):'—'}</b>${statusChip(c)}</span></button>`}).join('')}</div>`:'<p class="small muted">Chưa có hóa đơn nào.</p>'}`;
  if(room.history&&room.history.length)body+=`<div class="sec-h" style="margin:8px 0 0"><h3>Người thuê trước</h3></div><div class="list">${room.history.map(h=>`<div class="li"><span class="grow"><b>${esc(h.name)}</b><span>${dmy(h.moveIn)} → ${dmy(h.moveOut)} · ${h.people||1} người</span></span>${h.finalE!=null?`<span class="small muted mono">${num(h.finalE)} kWh</span>`:''}</div>`).join('')}</div>`;
  body+=`<div class="btns" style="margin-top:8px"><button class="btn" data-act="editRoom">${ic('edit',18)}Sửa phòng</button>${t?'':`<button class="btn danger" data-act="delRoom">${ic('trash',18)}Xóa phòng</button>`}</div>`;
  return{title:'Phòng '+esc(room.no),body};
 },
 roomForm(sh){const d=sh.draft;
  return{title:sh.params.rid?'Sửa phòng':'Thêm phòng',body:`<div class="fgrid">${fld('Số phòng','no',d.no,{req:1})}${fld('Tầng','floor',d.floor,{type:'number',mode:'numeric'})}${fld('Giá thuê','rent',d.rent,{type:'number',mode:'numeric',sfx:'đ',full:1,hint:d.rent?money(d.rent)+' / tháng':''})}</div>
   <div class="group">${tog('Không dùng wifi','noWifi',d.noWifi,'Hóa đơn phòng này sẽ không tính tiền wifi')}</div>
   <label class="fld"><span class="fl">Ghi chú</span><textarea id="f-note" data-draft="note" data-type="str">${esc(d.note||'')}</textarea></label>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveRoom">Lưu</button>`};
 },
 addRooms(sh){const d=sh.draft;const nos=bulkNos(d);
  return{title:'Thêm phòng',body:`<div class="fgrid">${fld('Tầng','floor',d.floor,{type:'number',mode:'numeric'})}${fld('Số phòng bắt đầu','from',d.from,{type:'number',mode:'numeric'})}${fld('Số lượng','count',d.count,{type:'number',mode:'numeric'})}${fld('Giá thuê','rent',d.rent,{type:'number',mode:'numeric',sfx:'đ'})}</div><p class="hint">Sẽ tạo: ${nos.slice(0,12).map(esc).join(', ')}${nos.length>12?'…':''}</p>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveAddRooms" ${nos.length?'':'disabled'}>Thêm ${nos.length} phòng</button>`};
 },
 tenantForm(sh){const d=sh.draft;const p=P();const pr=p.prices;
  return{title:sh.params.edit?'Sửa người thuê':'Người thuê mới',body:`<div class="fgrid">${fld('Họ tên','name',d.name,{req:1,full:1})}${fld('Điện thoại','phone',d.phone,{type:'tel',mode:'tel'})}${fld('CCCD','cccd',d.cccd,{mode:'numeric'})}
    ${fld('Ngày dọn vào','moveIn',d.moveIn,{type:'date'})}${fld('Số người ở','people',d.people,{type:'number',mode:'numeric'})}${fld('Ngày sinh','dob',d.dob,{type:'date'})}${sel('Giới tính','gender',d.gender,[['','Chọn'],['Nam','Nam'],['Nữ','Nữ']])}${fld('Nơi thường trú','home',d.home,{full:1,ph:'Theo CCCD, dùng cho hợp đồng'})}</div>
   <div class="group"><h4>${ic('user',18)}Người ở cùng</h4>${(d.members||[]).map((x,i)=>`<div class="fgrid" style="border-top:1px dashed var(--line);padding-top:10px">${fld('Họ tên','members.'+i+'.name',x.name,{full:1})}${fld('Ngày sinh','members.'+i+'.dob',x.dob,{type:'date'})}${sel('Giới tính','members.'+i+'.gender',x.gender,[['','—'],['Nam','Nam'],['Nữ','Nữ']])}${fld('CCCD','members.'+i+'.cccd',x.cccd,{mode:'numeric'})}${fld('Quan hệ với chủ hộ','members.'+i+'.relation',x.relation,{ph:'Vợ, con, bạn…'})}<button class="btn sm danger full" data-act="delMember" data-i="${i}">Bỏ người này</button></div>`).join('')}<button class="btn sm" data-act="addMember">${ic('plus',16)}Thêm người ở cùng</button><p class="hint">Dùng cho tờ khai tạm trú (mục 11) và hợp đồng.</p></div>
   <div class="group"><h4>Chỉ số đồng hồ khi dọn vào</h4><div class="fgrid">${fld('Số điện','e0',d.e0,{type:'number',sfx:'kWh',req:1,full:1})}${fld('Nước giếng','w0',d.w0,{type:'number',sfx:'m³',hint:'Không bắt buộc'})}${fld('Nước máy','c0',d.c0,{type:'number',sfx:'m³',hint:'Không bắt buộc'})}</div>${pr.waterMode==='person'?'<p class="hint">Khu này đang tính nước theo đầu người, chỉ số nước chỉ để lưu lại.</p>':''}</div>
   <div class="fgrid">${fld('Tiền cọc','deposit',d.deposit,{type:'number',mode:'numeric',sfx:'đ'})}${fld('Ngày trả phòng dự kiến','endDate',d.endDate,{type:'date',hint:'Để trống nếu chưa hẹn'})}</div>
   <div class="row wrapr">${[3,6,12].map(n=>`<button class="btn sm" data-act="endIn" data-n="${n}">Hợp đồng ${n} tháng</button>`).join('')}</div>
   <label class="fld"><span class="fl">Ghi chú</span><textarea id="f-tnote" data-draft="note" data-type="str" placeholder="Biển số xe, người bảo lãnh…">${esc(d.note||'')}</textarea></label>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveTenant">Lưu người thuê</button>`};
 },
 checkout(sh){const d=sh.draft;const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);const t=room.tenant;const pr=p.prices;const debt=tenantDebt(p,room);
  return{title:'Trả phòng '+esc(room.no),body:`<p><b>${esc(t.name)}</b> <span class="muted">· vào ở từ ${dmy(t.moveIn)}</span></p>
   <div class="fgrid">${fld('Ngày trả phòng','date',d.date,{type:'date',full:1})}${fld('Số điện cuối','e1',d.e1,{type:'number',sfx:'kWh',full:1,hint:'Số trước đó: '+num(d.last.e)})}
   ${pr.waterMode!=='person'&&pr.well>0?fld('Nước giếng cuối','w1',d.w1,{type:'number',sfx:'m³'}):''}${pr.waterMode!=='person'&&pr.city>0?fld('Nước máy cuối','c1',d.c1,{type:'number',sfx:'m³'}):''}</div>
   <div class="group">${tog('Lập hóa đơn cuối','makeBill',d.makeBill,`Tạo/ cập nhật hóa đơn ${monthLabel((d.date||todayISO()).slice(0,7)).toLowerCase()} với chỉ số cuối`)}</div>
   <div class="card"><dl class="kv" style="margin:0"><dt>Tiền cọc</dt><dd>${money(t.deposit||0)}</dd><dt>Còn nợ các kỳ trước</dt><dd style="color:${debt?'var(--bad)':'inherit'}">${money(debt)}</dd></dl><p class="hint" style="margin-top:8px">Đối chiếu tiền cọc với hóa đơn cuối trước khi hoàn cọc.</p></div>`,
   foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="doCheckout">Xác nhận trả phòng</button>`};
 },
 bill(sh){
  const {pid,month,key}=sh.params;const p=S.props[pid];const r=rowOf(pid,month,key);if(!r)return{title:'Hóa đơn',body:'<p class="muted">Hóa đơn đã bị xóa.</p>'};
  const c=rowCalc(pid,month,key);const pr=r.prices;const base=p.prices;const diffPrice=JSON.stringify(pr)!==JSON.stringify(base);
  const mi=(f,label,cls,icn,unit)=>`<div class="mrow2"><span class="mi ${cls}">${ic(icn,14)}</span><span class="lab">${label}</span><input type="number" inputmode="decimal" step="any" id="bi-${f}0" data-in="read" data-pid="${pid}" data-m="${month}" data-key="${key}" data-f="${f}0" value="${r[f+'0']??''}" aria-label="${label} số cũ"><span class="arr">→</span><input type="number" inputmode="decimal" step="any" id="bi-${f}1" data-in="read" data-pid="${pid}" data-m="${month}" data-key="${key}" data-f="${f}1" value="${r[f+'1']??''}" placeholder="Số mới" aria-label="${label} số mới">${camBtn(pid,month,key,f,r)}</div>`;
  return{title:`P.${esc(r.roomNo)} · ${monthLabel(month)}`,body:`<div class="row"><div class="grow"><b style="font-size:17px">${esc(r.tenantName)}</b><p class="small muted">Tính ngày ${dmy(r.calcAt)}${r.final?' · hóa đơn trả phòng':''}</p></div><span id="chip-${key}">${statusChip(c)}</span></div>
   <div class="group"><h4>Chỉ số đồng hồ <span class="muted small" style="font-weight:500">cũ → mới</span></h4>${mi('e','Điện','e','bolt')}${pr.waterMode!=='person'&&pr.well>0?mi('w','Giếng','w','drop'):''}${pr.waterMode!=='person'&&pr.city>0?mi('c','Nước máy','w','drop'):''}
    <div class="fgrid">${liveFld('Số người','rpeople',r.people)}${liveFld('Giá thuê','rrent',r.rent,'đ')}</div>${photoThumbs(r.photos,{pid,m:month,key})}</div>
   <div class="card"><div class="items" id="bill-items">${itemsHTML(c)}</div></div>
   <div class="group"><h4>Khoản phát sinh / giảm trừ</h4>${(r.adjust||[]).map((a,i)=>`<div class="adj"><input type="text" id="adj-n-${i}" data-in="adj" data-i="${i}" data-f="name" value="${esc(a.name)}" placeholder="VD: Sửa vòi nước"><input type="number" inputmode="numeric" id="adj-a-${i}" data-in="adj" data-i="${i}" data-f="amount" value="${a.amount??''}" placeholder="Số tiền (âm = giảm)"><button class="iconbtn" data-act="delAdj" data-i="${i}" aria-label="Xóa">${ic('x',18)}</button></div>`).join('')}<button class="btn sm" data-act="addAdj">${ic('plus',16)}Thêm khoản</button></div>
   <div class="group"><h4>Thanh toán</h4><div class="row"><span class="grow">${liveFld('Đã thu','rpaid',r.paid||'','đ')}</span><button class="btn soft" style="align-self:flex-end" data-act="payFull">${ic('check',18)}Thu đủ</button></div><p class="small" id="bill-paid-info">${paidInfo(c)}</p></div>
   <details class="group"><summary style="font-weight:700;cursor:pointer">Đơn giá áp dụng cho hóa đơn này${diffPrice?' <span class="chip warn">khác giá khu</span>':''}</summary>
    <div class="fgrid" style="margin-top:12px">${liveFld('Điện (đ/kWh)','rprice',pr.elec,'','elec')}${pr.waterMode==='person'?liveFld('Nước (đ/người)','rprice',pr.waterPerson,'','waterPerson'):liveFld('Nước máy (đ/m³)','rprice',pr.city,'','city')+liveFld('Nước giếng (đ/m³)','rprice',pr.well,'','well')}${liveFld('Rác','rprice',pr.trash,'','trash')}${liveFld('Wifi','rprice',pr.wifi,'','wifi')}</div>
    <p class="hint">Sửa ở đây chỉ ảnh hưởng hóa đơn này. Bấm Tính lại để lấy lại giá hiện tại của khu.</p></details>
   <label class="fld"><span class="fl">Ghi chú trên hóa đơn</span><textarea id="bi-note" data-in="rnote">${esc(r.note||'')}</textarea></label>
   <div class="btns"><button class="btn" data-act="recalcOne">${ic('refresh',18)}Tính lại phòng này</button><button class="btn danger" data-act="delRow">${ic('trash',18)}Xóa khỏi kỳ</button></div>`,
   foot:`<button class="btn" data-act="copyMsg">${ic('copy',18)}Chép tin nhắn</button><button class="btn pri" data-act="openImage">${ic('img',18)}Ảnh hóa đơn</button>`};
 },
 image(sh){
  if(sh.params.kind==='statement')return statementSheet(sh);
  const {pid,month,key}=sh.params;const r=rowOf(pid,month,key);const c=rowCalc(pid,month,key);
  return{title:'Ảnh hóa đơn P.'+esc(r.roomNo),body:`${c.complete?'':`<div class="banner">${ic('alert',18)}<span>Chưa đủ chỉ số ${c.missing.join(', ')}. Ảnh sẽ ghi rõ phần còn thiếu.</span></div>`}
   <img id="inv-img" class="invimg" alt="Hóa đơn phòng ${esc(r.roomNo)} ${monthLabel(month)}" ${sh.params.url?`src="${sh.params.url}"`:''}>
   <p class="small muted">Lưu ảnh rồi gửi qua Zalo/Messenger cho người thuê. Trên điện thoại, bạn cũng có thể nhấn giữ vào ảnh để lưu hoặc chia sẻ.</p>`,
   foot:`<button class="btn" data-act="copyMsg">${ic('copy',18)}Chép tin nhắn</button><button class="btn pri" data-act="saveImg">${ic('dl',18)}Lưu ảnh</button>`};
 },
 confirm(sh){const o=sh.params;return{title:o.title,body:`<p>${o.text}</p>`,foot:`<button class="btn" data-act="back">Hủy</button><button class="btn ${o.danger?'danger':'pri'}" data-act="confirmOk">${o.ok||'Đồng ý'}</button>`}},
 text(sh){return{title:'Sao chép',body:`<p class="small muted">Không chép tự động được. Chọn toàn bộ nội dung bên dưới rồi sao chép.</p><textarea id="copy-area" style="min-height:300px;font-family:var(--f-mono);font-size:13px" readonly>${esc(sh.params.text)}</textarea>`}}
};
function liveFld(label,inKey,val,sfx='',f=''){return`<label class="fld"><span class="fl">${label}</span><span class="fi"><input type="number" inputmode="decimal" step="any" id="lf-${inKey}${f}" data-in="${inKey}" ${f?`data-f="${f}"`:''} value="${val??''}" style="--sfx:${sfx.length}">${sfx?`<span class="sfx">${sfx}</span>`:''}</span></label>`}
function itemsHTML(c){
  return c.items.map(i=>`<div class="item ${i.amount<0?'neg':''} ${i.miss?'miss':''}"><div class="grow"><b>${esc(i.label)}</b>${i.detail?`<span>${esc(i.detail)}</span>`:''}</div><span class="amt">${i.miss?'chưa có số':money(i.amount)}</span></div>`).join('')+
   `<div class="total"><span class="fl" style="font-weight:700">TỔNG CỘNG</span><b>${c.complete?money(c.total):'—'}</b></div>`;
}
function paidInfo(c){if(!c.complete)return'<span class="muted">Nhập đủ chỉ số để tính tổng tiền.</span>';if(c.paid>=c.total-0.5)return`<span style="color:var(--ok)">Đã thu đủ${c.paid>c.total+0.5?` · dư ${money(c.paid-c.total)}`:''}.</span>`;return`Còn phải thu <b style="color:var(--bad)">${money(c.total-c.paid)}</b>`}
function odo(label,icn,cls,v,unit){const s=String(Math.floor(v||0)).padStart(5,'0');const dec=Math.round(((v||0)%1)*10);return`<div class="meter"><small><span class="mi ${cls}">${ic(icn,12)}</span>${label}</small><div class="odo">${[...s].map(ch=>`<span>${ch}</span>`).join('')}<span class="dec">${dec}</span><em>${unit}</em></div></div>`}
function acGroup(path,ac,lay,isTpl){
  ac=ac||{on:false,wall:'right',level:'down',hp:1.5};const lo=lay&&lay.loft&&lay.loft.on;const rec=lay?acRec(lay):1.5;
  const walls=lo&&ac.level==='loft'?[['left','Trái'],['back','Sau'],['right','Phải']]:[['left','Trái'],['back','Sau'],['right','Phải'],['front','Trước']];
  return`<div class="group">${tog(isTpl?'Máy lạnh (mặc định cho các phòng)':'Máy lạnh (điều hòa)',path+'.on',ac.on,isTpl?'Từng phòng có thể bật, tắt riêng trong trang chi tiết phòng':`Gợi ý công suất cho phòng này: ${f2(rec)} HP`)}${ac.on?`
   ${lo?`<div class="fld"><span class="fl">Treo ở</span>${seg(path+'.level',ac.level,[['down','Tầng dưới'],['loft','Trên gác']])}</div>`:''}
   <div class="fld"><span class="fl">Tường treo máy (nhìn từ cửa vào)</span>${seg(path+'.wall',lo&&ac.level==='loft'&&ac.wall==='front'?'back':ac.wall,walls)}</div>
   <label class="fld"><span class="fl">Công suất</span><select id="${fid(path+'.hp')}" data-draft="${path}.hp" data-type="num">${[[1,'1 HP (9.000 BTU)'],[1.5,'1,5 HP (12.000 BTU)'],[2,'2 HP (18.000 BTU)'],[2.5,'2,5 HP (24.000 BTU)']].map(([v,t])=>`<option value="${v}" ${+ac.hp===v?'selected':''}>${t}</option>`).join('')}</select></label>`:''}</div>`;
}
function setRoomDesign(v){const sh=topSheet();if(!sh||sh.type!=='layout')return;const d=sh.draft;const p=S.props[sh.params.pid];
  if(v==='custom'){if(d.design!=='custom'){d.l=normLayout(clone(designLayout(p,d.design)));d.l.ac=clone(d.ac)}}
  else d.ac=d.design==='custom'?clone(d.l.ac):clone(designLayout(p,v).ac);
  d.design=v;render()}
function draftLayout(sh){const p=S.props[sh.params.pid];const d=sh.draft;if(sh.params.rid&&d.design!=='custom'){const l=normLayout(clone(designLayout(p,d.design)));l.ac=sanitizeAc(d.ac);return l}return sanitizeLayout(d.l)}
// Chọn nhiều phòng dùng chung thiết kế đang sửa.
function designRoomsHTML(p,did,d){
  const rooms=p.rooms.slice().sort(byNo);if(!rooms.length)return'';const isDef=did==='default';
  const n=rooms.filter(r=>d.sel[r.id]).length;
  const tag=r=>r.layout?'Kích thước riêng':designName(p,r.design);
  return`<div class="group"><h4>${ic('grid',18)}Phòng dùng thiết kế này <span class="muted small" style="font-weight:500">${n}/${rooms.length}</span></h4>
   <p class="small muted" style="margin:0 0 6px">${isDef?'Đánh dấu để đưa phòng về mẫu chung. Muốn phòng dùng thiết kế khác, chọn phòng đó trong thiết kế khác.':'Đánh dấu các phòng dùng chung thiết kế này. Bỏ đánh dấu thì phòng quay về mẫu chung.'} Phòng có kích thước riêng sẽ bỏ kích thước riêng.</p>
   ${isDef?'':`<div class="row" style="margin-bottom:6px"><button class="btn sm" data-act="designSelAll" data-v="1">Chọn tất cả</button><button class="btn sm" data-act="designSelAll" data-v="0">Bỏ chọn</button></div>`}
   <div class="list">${rooms.map(r=>{const lock=isDef&&roomUses(p,r,'default');return`<label class="ck"><input type="checkbox" data-act="designSel" data-rid="${r.id}" ${d.sel[r.id]?'checked':''} ${lock?'disabled':''}><span class="plate">${esc(r.no)}</span><span class="grow"><b style="display:block;font-weight:600">Tầng ${r.floor}${(p.site.roles[r.id]||'').startsWith('k')?' · kiot':''}</b><span class="small muted">Đang dùng: ${esc(tag(r))}</span></span></label>`}).join('')}</div></div>`;
}
function stageWarnBtn(sh){const l=draftLayout(sh);const n=layoutInfo(l).warns.length;return`<button class="stage-warn${n?' has':''}" id="stage-warn" data-act="toWarns">${warnBadge(l)}</button>`}
function warnBadge(l){const n=layoutInfo(l).warns.length;return n?`${ic('alert',14)}${n} lưu ý`:`${ic('check',14)}Hợp lý`}
function stageOverlay(site){return`<div class="views"><button data-act="view3d" data-v="iso">Tổng thể</button><button data-act="view3d" data-v="front">${site?'Từ đường':'Từ cửa'}</button><button data-act="view3d" data-v="top">Từ trên</button></div><span class="tip">Kéo để xoay · chụm để phóng</span>`}
function statsHTML(l,compact){
  const o=layoutInfo(l);
  const cells=[['Diện tích sàn',f2(o.area)+' m²'],['Diện tích gác',l.loft.on?f2(o.loftA)+' m²':'—'],['Tổng sử dụng',f2(o.area+o.loftA)+' m²'],['Trên gác',o.above!=null?f2(o.above)+' m':'—'],['Dưới gác',o.below!=null?f2(o.below)+' m':'—'],['Cầu thang',o.steps?`${o.steps} bậc × ${Math.round(o.rise*100)} cm`:'—']];
  if(l.wc.on)cells.push(['Nhà vệ sinh',f2(o.wcA)+' m²']);
  if(l.kitchen&&l.kitchen.on)cells.push(['Bàn bếp',`${f2(l.kitchen.len)} × ${f2(l.kitchen.dep)} m`]);
  if(l.ac&&l.ac.on)cells.push(['Máy lạnh',`${f2(+l.ac.hp)} HP`]);
  return`<div class="stats">${(compact?cells.slice(0,6):cells).map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>${compact?'':`<div class="warns" style="margin-top:10px">${o.warns.length?o.warns.map(w=>`<p>${ic('alert',16)}<span>${esc(w)}</span></p>`).join(''):`<p class="okm">${ic('check',16)}<span>Bố trí hợp lý, không phát hiện xung đột.</span></p>`}</div>`}`;
}
function previewNos(d){const out=[];const F=Math.max(0,Math.min(20,d.floors||0)),N=Math.max(0,Math.min(60,d.perFloor||0));for(let f=1;f<=F;f++)for(let i=1;i<=N;i++)out.push(d.numbering==='seq'?(f-1)*N+i:f*100+i);return out.slice(0,6)}
function genNos(d){const out=[];const F=Math.max(0,Math.min(20,d.floors||0)),N=Math.max(0,Math.min(60,d.perFloor||0));for(let f=1;f<=F;f++)for(let i=1;i<=N;i++)out.push([d.numbering==='seq'?(f-1)*N+i:f*100+i,f]);return out}
function bulkNos(d){const n=Math.max(0,Math.min(60,d.count||0));const out=[];if(d.from==null)return out;for(let i=0;i<n;i++)out.push(String(d.from+i));return out}

/* =========================== actions =========================== */
let confirmFn=null;
function ask(title,text,ok,fn,danger){confirmFn=fn;push('confirm',{title,text,ok,danger})}
const A={
 tab(el){ui.tab=el.dataset.tab;ui.sheets=[];render();window.scrollTo(0,0)},
 back(){pop()},
 openProps(){push('props')},
 switchProp(el){S.settings.activePid=el.dataset.pid;persist('s');ui.sheets=[];ui.tab='home';render();window.scrollTo(0,0)},
 loadDemo(){loadDemoInto();ui.tab='home';render();toast('Đã tạo dữ liệu mẫu')},
 clearDemo(){ask('Xóa dữ liệu mẫu?','Các khu trọ mẫu và hóa đơn mẫu sẽ bị xóa. Dữ liệu bạn tự tạo được giữ nguyên.','Xóa dữ liệu mẫu',()=>{clearDemo();ui.sheets=[];render();toast('Đã xóa dữ liệu mẫu')},true)},
 newProp(){push('propForm',{},{name:'',address:'',floors:2,perFloor:4,numbering:'floor',rent:2000000,elec:DEFAULT_PRICES.elec,city:DEFAULT_PRICES.city,well:0,trash:DEFAULT_PRICES.trash,wifi:DEFAULT_PRICES.wifi})},
 editProp(){const p=P();push('propForm',{pid:p.id},{name:p.name,address:p.address,dueDay:p.dueDay,prorate:p.prorate,carryDebt:p.carryDebt,invoiceNote:p.invoiceNote,readDay:p.readDay,owner:clone(p.owner),equipment:p.equipment,terms:p.terms})},
 saveProp(){
  const sh=topSheet();const d=sh.draft;if(!d.name||!d.name.trim()){toast('Nhập tên khu trọ');focusId('f-name');return}
  if(sh.params.pid){const p=S.props[sh.params.pid];Object.assign(p,{name:d.name.trim(),address:d.address||'',dueDay:clamp(d.dueDay||5,1,28),prorate:!!d.prorate,carryDebt:!!d.carryDebt,invoiceNote:d.invoiceNote||'',readDay:clamp(d.readDay||1,1,28),owner:{name:(d.owner.name||'').trim(),phone:d.owner.phone||'',cccd:d.owner.cccd||'',address:d.owner.address||''},equipment:d.equipment||'',terms:d.terms||''});persist('p',p.id);pop();toast('Đã lưu');return}
  const p=newProp(d.name.trim(),d.address||'');Object.assign(p.prices,{elec:d.elec??p.prices.elec,city:d.city||0,well:d.well||0,trash:d.trash||0,wifi:d.wifi||0});
  p.rooms=genNos(d).map(([n,f])=>newRoom(n,f,d.rent||0));S.props[p.id]=p;S.settings.activePid=p.id;persist('p',p.id);persist('s');
  ui.sheets=[];ui.tab='rooms';const sel={};p.rooms.forEach(r=>{if(roomUses(p,r,'default'))sel[r.id]=true});push('layout',{pid:p.id,did:'default'},{l:clone(p.layout),name:'',sel});toast(`Đã tạo ${p.rooms.length} phòng. Nhập kích thước mẫu phòng.`);
 },
 deleteProp(){const p=P();ask('Xóa '+esc(p.name)+'?',`Toàn bộ ${p.rooms.length} phòng, người thuê và hóa đơn của khu này sẽ bị xóa vĩnh viễn. Nên sao lưu trước khi xóa.`,'Xóa khu trọ',()=>{for(const k of Object.keys(S.bills))if(S.bills[k].pid===p.id){delete S.bills[k];persistDel('b',k)}delete S.props[p.id];persistDel('p',p.id);fixActive();persist('s');ui.sheets=[];ui.tab='home';render();toast('Đã xóa khu trọ')},true)},
 openBank(){const p=P();push('bank',{},clone(p.bank))},
 saveBank(){const d=topSheet().draft;const p=P();p.bank={bin:d.bin||'',acct:(d.acct||'').replace(/\s/g,''),holder:ascii(d.holder||'').toUpperCase()};persist('p',p.id);pop();toast('Đã lưu tài khoản')},
 openPrices(){push('prices',{},clone(P().prices))},
 addExtra(){const d=topSheet().draft;(d.extras=d.extras||[]).push({id:uid6(),name:'',amount:null,mode:'room'});render()},
 delExtra(el){topSheet().draft.extras.splice(+el.dataset.i,1);render()},
 savePrices(){
  const d=topSheet().draft;const p=P();const n=x=>Math.max(0,x||0);
  p.prices={elec:n(d.elec),waterMode:d.waterMode,well:n(d.well),city:n(d.city),waterPerson:n(d.waterPerson),trash:n(d.trash),trashMode:d.trashMode,wifi:n(d.wifi),extras:(d.extras||[]).filter(x=>x.name||x.amount).map(x=>({id:x.id||uid6(),name:x.name||'Phí khác',amount:n(x.amount),mode:x.mode||'room'}))};
  persist('p',p.id);pop();
  const m=getBill(p.id,ui.month)?ui.month:getBill(p.id,curMonth())?curMonth():null;
  const changed=m&&rowsSorted(p.id,m).some(([,r])=>JSON.stringify(r.prices)!==JSON.stringify(p.prices));
  if(changed)openRecalc(p.id,m,true);else toast('Đã lưu bảng giá');
 },
 openRecalc(){openRecalc(P().id,ui.month,false)},
 recalcSel(el){const d=topSheet().draft;d.sel[el.dataset.key]=el.checked;render()},
 recalcAll(el){const sh=topSheet();for(const [k] of rowsSorted(sh.params.pid,sh.params.month))sh.draft.sel[k]=el.dataset.v==='1';render()},
 doRecalc(){const sh=topSheet();const {pid,month}=sh.params;let n=0,diff=0;
  for(const [k] of rowsSorted(pid,month))if(sh.draft.sel[k]){const o=rowCalc(pid,month,k);recalcRow(pid,month,k);touch();const c=rowCalc(pid,month,k);if(o.complete&&c.complete)diff+=c.total-o.total;n++}
  persist('b',billKey(pid,month));pop();toast(`Đã tính lại ${n} phòng · chênh lệch ${diff>0?'+':''}${money(diff)}`)},
 openLayout(el){const p=P();const rid=el&&el.dataset.rid;const did=(el&&el.dataset.did)||'default';
  if(rid){const room=p.rooms.find(r=>r.id===rid);const des=room.layout?'custom':(designOf(p,room.design)?room.design:'default');const l=normLayout(clone(room.layout||designLayout(p,des)));if(!room.layout&&room.ac)l.ac=clone(room.ac);push('layout',{pid:p.id,rid},{l,ac:clone(l.ac),design:des});return}
  const dz=designOf(p,did);const sel={};p.rooms.forEach(r=>{if(roomUses(p,r,did))sel[r.id]=true});push('layout',{pid:p.id,did},{l:normLayout(clone(dz?dz.layout:p.layout)),name:dz?dz.name:'',sel})},
 newDesign(){const p=P();const sel={};push('layout',{pid:p.id,did:'d'+uid6(),isNew:1},{l:normLayout(clone(p.layout)),name:`Thiết kế ${p.designs.length+2}`,sel})},
 openDesigns(){push('designs',{pid:P().id})},
 designSel(el){topSheet().draft.sel[el.dataset.rid]=el.checked;const h=document.querySelector('.sheet .group h4 .muted');if(h){const d=topSheet().draft;const p=S.props[topSheet().params.pid];h.textContent=p.rooms.filter(r=>d.sel[r.id]).length+'/'+p.rooms.length}},
 designSelAll(el){const sh=topSheet();const p=S.props[sh.params.pid];p.rooms.forEach(r=>{sh.draft.sel[r.id]=el.dataset.v==='1'});render()},
 delDesign(){const sh=topSheet();const p=S.props[sh.params.pid];const did=sh.params.did;const dz=designOf(p,did);if(!dz){pop();return}const n=p.rooms.filter(r=>r.design===did).length;
  ask('Xóa thiết kế?',`${esc(dz.name)}${n?` đang dùng cho ${n} phòng. Các phòng này sẽ quay về mẫu chung.`:''}`,'Xóa',()=>{p.rooms.forEach(r=>{if(r.design===did)r.design=null});p.designs=p.designs.filter(x=>x.id!==did);persist('p',p.id);pop();toast('Đã xóa thiết kế')},true)},
 saveLayout(){
  const sh=topSheet();const d=sh.draft;const p=S.props[sh.params.pid];const {rid,did}=sh.params;
  if(rid){const room=p.rooms.find(r=>r.id===rid);
   if(d.design==='custom'){room.layout=sanitizeLayout(d.l);room.ac=null;room.design=null}
   else{room.layout=null;room.design=d.design==='default'?null:d.design;const a=sanitizeAc(d.ac);room.ac=JSON.stringify(a)===JSON.stringify(sanitizeAc(designLayout(p,d.design).ac))?null:a}
   persist('p',p.id);pop();toast('Đã lưu thiết kế phòng '+room.no);return}
  const l=sanitizeLayout(d.l);let name='Mẫu chung';
  if(did==='default')p.layout=l;
  else{name=String(d.name||'').trim();if(!name){toast('Đặt tên cho thiết kế');focusId('f-name');return}
   const dz=designOf(p,did);if(dz){dz.name=name;dz.layout=l}else p.designs.push({id:did,name,layout:l})}
  let n=0;for(const r of p.rooms){const was=roomUses(p,r,did);if(d.sel[r.id]){if(!was){r.layout=null;r.ac=null;r.design=did==='default'?null:did}n++}else if(was&&did!=='default')r.design=null}
  persist('p',p.id);pop();toast(`Đã lưu ${name}${n?` cho ${n} phòng`:''}`);
 },
 seg(el){const sh=topSheet();if(/ac\.level$/.test(el.dataset.path)&&el.dataset.v==='loft'){const wp=el.dataset.path.replace(/level$/,'wall');if(getPath(sh.draft,wp)==='front')setPath(sh.draft,wp,'back')}if(el.dataset.path==='l.kitchen.wall'&&getPath(sh.draft,'l.kitchen.wall')!==el.dataset.v)setPath(sh.draft,'l.kitchen.off',null);if(el.dataset.path==='l.door'&&el.dataset.v==='shop'&&getPath(sh.draft,'l.win.wall')==='front')setPath(sh.draft,'l.win.wall','back');setPath(sh.draft,el.dataset.path,el.dataset.v);render()},
 view3d(el){setView(el.dataset.v)},
 toWarns(){const e=document.getElementById('layout-stats');if(e)e.scrollIntoView({behavior:'smooth',block:'center'})},
 roomFilter(el){ui.roomFilter=el.dataset.f;render()},
 openRoom(el){push('room',{rid:el.dataset.rid})},
 addRooms(){const p=P();const maxF=Math.max(1,...p.rooms.map(r=>r.floor||1));const same=p.rooms.filter(r=>r.floor===maxF).map(r=>parseInt(r.no,10)).filter(n=>!isNaN(n));
  push('addRooms',{},{floor:maxF,from:same.length?Math.max(...same)+1:maxF*100+1,count:1,rent:p.rooms[0]?p.rooms[0].rent:2000000})},
 saveAddRooms(){const d=topSheet().draft;const p=P();const exist=new Set(p.rooms.map(r=>r.no));const nos=bulkNos(d).filter(n=>!exist.has(n));
  if(!nos.length){toast('Các số phòng này đã tồn tại');return}nos.forEach(n=>p.rooms.push(newRoom(n,d.floor||1,d.rent||0)));persist('p',p.id);pop();toast(`Đã thêm ${nos.length} phòng`)},
 editRoom(){const sh=topSheet();const room=P().rooms.find(r=>r.id===sh.params.rid);push('roomForm',{rid:room.id},{no:room.no,floor:room.floor,rent:room.rent,noWifi:room.noWifi,note:room.note})},
 saveRoom(){const sh=topSheet();const d=sh.draft;const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);
  const no=String(d.no||'').trim();if(!no){toast('Nhập số phòng');return}if(p.rooms.some(r=>r.no===no&&r.id!==room.id)){toast('Số phòng '+no+' đã có');return}
  Object.assign(room,{no,floor:d.floor||1,rent:Math.max(0,d.rent||0),noWifi:!!d.noWifi,note:d.note||''});
  for(const b of Object.values(S.bills))if(b.pid===p.id)for(const r of Object.values(b.rooms))if(r.roomId===room.id){r.roomNo=no}
  for(const b of Object.values(S.bills))if(b.pid===p.id&&Object.values(b.rooms).some(r=>r.roomId===room.id))persist('b',billKey(p.id,b.month));
  persist('p',p.id);pop();toast('Đã lưu phòng. Giá mới áp dụng khi tạo hoặc tính lại hóa đơn.')},
 delRoom(){const sh=topSheet();const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);ask('Xóa phòng '+esc(room.no)+'?','Phòng sẽ bị xóa khỏi khu. Hóa đơn cũ của phòng vẫn được giữ.','Xóa phòng',()=>{p.rooms=p.rooms.filter(r=>r.id!==room.id);persist('p',p.id);ui.sheets=[];render();toast('Đã xóa phòng')},true)},
 addTenant(){const sh=topSheet();push('tenantForm',{rid:sh.params.rid},{name:'',phone:'',cccd:'',moveIn:todayISO(),people:1,e0:null,w0:0,c0:0,deposit:null,endDate:'',note:'',dob:'',gender:'',home:'',members:[]})},
 editTenant(){const sh=topSheet();const room=P().rooms.find(r=>r.id===sh.params.rid);push('tenantForm',{rid:room.id,edit:1},clone(room.tenant))},
 endIn(el){const d=topSheet().draft;const base=d.moveIn||todayISO();const dt=new Date(base+'T00:00:00');dt.setMonth(dt.getMonth()+(+el.dataset.n));d.endDate=isoOf(dt);render()},
 saveTenant(){
  const sh=topSheet();const d=sh.draft;const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);
  if(!d.name||!d.name.trim()){toast('Nhập họ tên người thuê');focusId('f-name');return}
  if(d.e0==null||d.e0<0){toast('Nhập số điện khi dọn vào');focusId('f-e0');return}
  if(d.endDate&&d.moveIn&&d.endDate<d.moveIn){toast('Ngày trả phòng phải sau ngày dọn vào');return}
  const mem=(d.members||[]).filter(x=>x&&x.name&&x.name.trim()).map(x=>({name:x.name.trim(),dob:x.dob||'',gender:x.gender||'',cccd:x.cccd||'',relation:x.relation||''}));const t={id:d.id||uid6(),name:d.name.trim(),phone:d.phone||'',cccd:d.cccd||'',moveIn:d.moveIn||todayISO(),people:Math.max(1,d.people||1,1+mem.length),e0:d.e0,w0:d.w0??0,c0:d.c0??0,deposit:d.deposit||0,endDate:d.endDate||'',note:d.note||'',dob:d.dob||'',gender:d.gender||'',home:d.home||'',members:mem,portal:d.portal||''};
  room.tenant=t;
  if(sh.params.edit)for(const b of Object.values(S.bills))if(b.pid===p.id){let ch=false;for(const r of Object.values(b.rooms))if(r.tenantId===t.id){r.tenantName=t.name;ch=true}if(ch)persist('b',billKey(p.id,b.month))}
  persist('p',p.id);pop();toast(sh.params.edit?'Đã cập nhật người thuê':'Đã thêm người thuê vào phòng '+room.no)},
 checkout(){const sh=topSheet();const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);const t=room.tenant;const key=room.id+':'+t.id;
  const ms=Object.values(S.bills).filter(b=>b.pid===p.id&&b.rooms[key]).map(b=>b.month).sort();const lr=ms.length?rowOf(p.id,ms[ms.length-1],key):null;
  const last={e:lr?(lr.e1??lr.e0):t.e0,w:lr?(lr.w1??lr.w0):t.w0,c:lr?(lr.c1??lr.c0):t.c0};
  push('checkout',{rid:room.id},{date:todayISO(),e1:null,w1:null,c1:null,makeBill:true,last})},
 doCheckout(){
  const sh=topSheet();const d=sh.draft;const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);const t=room.tenant;
  if(!d.date){toast('Chọn ngày trả phòng');return}
  if(d.makeBill&&d.e1==null){toast('Nhập số điện cuối để lập hóa đơn');focusId('f-e1');return}
  if(d.makeBill){const month=d.date.slice(0,7);const k=billKey(p.id,month);if(!S.bills[k])S.bills[k]={pid:p.id,month,rooms:{},createdAt:todayISO()};
   const key=room.id+':'+t.id;let r=S.bills[k].rooms[key];if(!r){[,r]=makeRow(p,room,month);S.bills[k].rooms[key]=r}
   r.e1=d.e1;if(d.w1!=null)r.w1=d.w1;if(d.c1!=null)r.c1=d.c1;r.final=true;if(!r.note)r.note=`Trả phòng ngày ${dmy(d.date)}`;persist('b',k)}
  room.history=room.history||[];room.history.unshift(Object.assign({},t,{moveOut:d.date,finalE:d.e1}));room.tenant=null;persist('p',p.id);
  pop();toast(`Phòng ${room.no} đã trống`)},
 goBills(el){ui.tab='bills';ui.month=el.dataset.m||curMonth();render();window.scrollTo(0,0)},
 month(el){ui.month=addMonth(ui.month,+el.dataset.d);render()},
 createRows(){const p=P();const n=createRows(p.id,ui.month);render();toast(`Đã thêm ${n} phòng vào ${monthLabel(ui.month).toLowerCase()}. Nhập số điện nước mới.`)},
 openBill(el){const p=P();push('bill',{pid:p.id,month:el.dataset.m||ui.month,key:el.dataset.key})},
 payFull(){const {pid,month,key}=topSheet().params;const r=rowOf(pid,month,key);const c=rowCalc(pid,month,key);if(!c.complete){toast('Nhập đủ chỉ số trước khi thu');return}r.paid=c.total;r.paidAt=todayISO();persist('b',billKey(pid,month));render();toast('Đã ghi nhận thu đủ '+money(c.total))},
 recalcOne(){const {pid,month,key}=topSheet().params;const o=rowCalc(pid,month,key);recalcRow(pid,month,key);persist('b',billKey(pid,month));const c=rowCalc(pid,month,key);render();toast(o.complete&&c.complete?`Đã tính lại: ${money(o.total)} → ${money(c.total)}`:'Đã áp giá hiện tại của khu')},
 addAdj(){const {pid,month,key}=topSheet().params;const r=rowOf(pid,month,key);(r.adjust=r.adjust||[]).push({name:'',amount:null});persist('b',billKey(pid,month));render();setTimeout(()=>focusId('adj-n-'+(r.adjust.length-1)),30)},
 delAdj(el){const {pid,month,key}=topSheet().params;const r=rowOf(pid,month,key);r.adjust.splice(+el.dataset.i,1);persist('b',billKey(pid,month));render()},
 delRow(){const {pid,month,key}=topSheet().params;const r=rowOf(pid,month,key);ask(`Xóa P.${esc(r.roomNo)} khỏi ${monthLabel(month).toLowerCase()}?`,'Hóa đơn của phòng này trong kỳ sẽ bị xóa, kể cả số tiền đã thu.','Xóa hóa đơn',()=>{delete getBill(pid,month).rooms[key];persist('b',billKey(pid,month));ui.sheets=ui.sheets.filter(s=>s.type!=='bill'&&s.type!=='confirm');render();toast('Đã xóa')},true)},
 copyMsg(){const {pid,month,key}=topSheet().params;copyText(billText(pid,month,key),'Đã chép, dán vào Zalo để gửi')},
 copy(el){copyText(el.dataset.text)},
 openImage(){const {pid,month,key}=topSheet().params;push('image',{pid,month,key})},
 saveImg(){const sh=topSheet();const s=sh.params;if(s.kind==='statement'){const room=S.props[s.pid].rooms.find(x=>x.id===s.rid);statementCanvas(s.pid,s.rid).then(cv=>cv.toBlob(b=>saveFile(`SaoKe_P${slug(room.no)}_${todayISO()}.png`,b),'image/png'));return}const r=rowOf(s.pid,s.month,s.key);invoiceCanvas(s.pid,s.month,s.key).then(cv=>cv.toBlob(b=>saveFile(`HoaDon_P${slug(r.roomNo)}_${s.month}.png`,b),'image/png'))},
 excel(){exportExcel(P().id,ui.month)},
 zipImgs(){zipImages(P().id,ui.month)},
 async backup(){if(await saveFile(`SoTro_saoluu_${todayISO()}.json`,backupJSON()))markBackedUp()},
 async backupZip(){
  const ids=[...photoRefs()].filter(isLocalPh);toast('Đang đóng gói '+ids.length+' ảnh…');
  try{await loadScript(URLS.zip)}catch(e){toast('Không tải được thư viện nén. Kiểm tra kết nối mạng.');return}
  const z=new JSZip();z.file('sotro.json',backupJSON());let n=0;
  for(const id of ids){const v=await phGet(id).catch(()=>null);if(v){z.file('anh/'+id+'.jpg',v.buf);n++}}
  const blob=await z.generateAsync({type:'blob',mimeType:'application/zip'});
  if(await saveFile(`SoTro_saoluu_kemanh_${todayISO()}.zip`,blob))markBackedUp();
 },
 confirmOk(){const fn=confirmFn;confirmFn=null;ui.sheets.pop();if(fn)fn();else render()}
};
function openRecalc(pid,month,fromPrices){const sel={};for(const [k] of rowsSorted(pid,month))sel[k]=true;if(!Object.keys(sel).length){toast('Kỳ này chưa có hóa đơn để tính lại');return}push('recalc',{pid,month,fromPrices},{sel})}
function sanitizeAc(a){a=a||{};return{on:!!a.on,wall:WALLN[a.wall]?a.wall:'right',level:a.level==='loft'?'loft':'down',hp:[1,1.5,2,2.5].includes(+a.hp)?+a.hp:1.5}}
function sanitizeLayout(l){const n=(v,a,b,d)=>{v=toNum(v);return v==null?d:clamp(v,a,b)};
  const W=n(l.W,1,15,3.5),L=n(l.L,1.5,25,6),H=n(l.H,2,8,4);
  l=normLayout(clone(l));const k=l.kitchen;const side=k.wall==='left'||k.wall==='right';const kl=n(k.len,0.4,side?L:W,1.6);const off=toNum(k.off);
  return{W,L,H,door:['left','center','right','shop'].includes(l.door)?l.door:'right',win:{on:!!l.win.on,wall:WALLN[l.win.wall]?l.win.wall:'front'},ac:sanitizeAc(l.ac),loft:{on:!!l.loft.on,h:n(l.loft.h,1,H-0.2,2.4),depth:n(l.loft.depth,0.5,L,2.8),t:n(l.loft.t,0.03,0.4,0.1),win:{on:!!l.loft.win.on,wall:['left','right','back'].includes(l.loft.win.wall)?l.loft.win.wall:'back'}},wc:{on:!!l.wc.on,w:n(l.wc.w,0.6,W,1.4),d:n(l.wc.d,0.6,L,1.6),corner:l.wc.corner||'back-right',doorDir:l.wc.doorDir==='side'?'side':'long'},stair:{on:!!l.stair.on,side:l.stair.side||'left',w:n(l.stair.w,0.4,2,0.7),tread:n(l.stair.tread,0.15,0.35,0.22),rail:l.stair.rail!==false},
    kitchen:{on:!!k.on,len:kl,dep:n(k.dep,0.3,1.2,0.6),h:n(k.h,0.5,1.2,0.85),wall:['left','right','back','front'].includes(k.wall)?k.wall:'back',off:off==null?null:clamp(off,0,Math.max(0,(side?L:W)-kl))}}}
function focusId(id){const e=document.getElementById(id);if(e)e.focus()}

const INPUTS={
 read(el){const {pid,m,key,f}=el.dataset;const r=rowOf(pid,m,key);if(!r)return;r[f]=toNum(el.value);
  if(f.endsWith('1')){const nm=addMonth(m,1);const nr=rowOf(pid,nm,key);if(nr&&r[f]!=null){nr[f[0]+'0']=r[f];persist('b',billKey(pid,nm))}}
  const a=r[f[0]+'0'],b=r[f[0]+'1'];el.classList.toggle('bad',a!=null&&b!=null&&b<a);
  persist('b',billKey(pid,m));refreshLive(pid,m,key)},
 rpeople(el){bm(r=>r.people=Math.max(1,toNum(el.value)||1))},
 rrent(el){bm(r=>r.rent=Math.max(0,toNum(el.value)||0))},
 rpaid(el){bm(r=>{r.paid=Math.max(0,toNum(el.value)||0);if(r.paid&&!r.paidAt)r.paidAt=todayISO()})},
 rprice(el){bm(r=>r.prices[el.dataset.f]=Math.max(0,toNum(el.value)||0))},
 rnote(el){bm(r=>r.note=el.value,true)},
 adj(el){bm(r=>{const a=r.adjust[+el.dataset.i];if(!a)return;if(el.dataset.f==='name')a.name=el.value;else a.amount=toNum(el.value)})},
 alertDays(el){const v=toNum(el.value);if(v&&v>0){S.settings.alertDays=Math.round(v);persist('s')}}
};
function bm(fn,noLive){const {pid,month,key}=topSheet().params;const r=rowOf(pid,month,key);if(!r)return;fn(r);persist('b',billKey(pid,month));if(!noLive)refreshLive(pid,month,key)}

document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const f=A[el.dataset.act];if(!f)return;if(el.tagName!=='INPUT')e.preventDefault();f(el,e)});
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.draft!=null){const sh=topSheet();if(!sh||!sh.draft)return;const t=el.dataset.type;setPath(sh.draft,el.dataset.draft,t==='num'?toNum(el.value):t==='bool'?el.checked:el.value);
    if(sh.type==='layout')update3DFromDraft(sh);
    if(sh.type==='site'){updateSiteFromDraft();return}
    if(sh.type==='meter'||sh.type==='meterRun'){updateMeterInfo(sh);return}
    if(el.dataset.rr){render();return}
    if(sh.type==='propForm'||sh.type==='addRooms'||sh.type==='roomForm'){const h=el.closest('.fld')&&el.closest('.fld').querySelector('.hint');if(h&&(el.dataset.draft==='rent'))h.textContent=toNum(el.value)?money(toNum(el.value))+' / tháng':'';if(sh.type!=='roomForm')softRefreshHints(sh)}
    return}
  if(el.dataset.in&&INPUTS[el.dataset.in])INPUTS[el.dataset.in](el)});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.draft!=null&&el.tagName==='SELECT'&&!el.dataset.rr){const sh=topSheet();if(sh&&sh.draft){setPath(sh.draft,el.dataset.draft,el.value);if(sh.type==='layout')update3DFromDraft(sh)}}
  if(el.dataset.ch==='restore')restoreFile(el);
  if(el.dataset.ch==='roomDesign')setRoomDesign(el.value);
  if(el.dataset.ch==='siteRole'){const sh=topSheet();if(sh&&sh.type==='site'){sh.draft.roles[el.dataset.rid]=el.value;updateSiteFromDraft()}}
  if(el.dataset.ch==='meterPhoto')handleMeterPhoto(el);
  if(el.dataset.ch==='runPhoto')runAddPhotos(el);
  if(el.dataset.ch==='runTarget')runSetTarget(el.value)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.sheets.length&&!isEditing())pop()});
function softRefreshHints(sh){
  // update generated room-number previews without re-rendering inputs
  const ft=document.querySelector('.sheet-ft .btn.pri');const hints=document.querySelectorAll('.sheet .hint');
  if(sh.type==='addRooms'){const nos=bulkNos(sh.draft);const h=hints[hints.length-1];if(h)h.textContent='Sẽ tạo: '+nos.slice(0,12).join(', ')+(nos.length>12?'…':'');if(ft){ft.textContent=`Thêm ${nos.length} phòng`;ft.disabled=!nos.length}}
  if(sh.type==='propForm'&&!sh.params.pid){const d=sh.draft;const all=document.querySelectorAll('.sheet .group .hint');const h=all[all.length?1:0];const tot=Math.max(0,(d.floors||0)*(d.perFloor||0));const g=document.querySelector('.sheet .group p.hint');if(g)g.textContent=`Sẽ tạo ${tot} phòng: ${previewNos(d).join(', ')}${tot>6?'…':''}`}
}

/* =========================== files: save, copy, excel, zip, backup =========================== */
let dlP=null;
function getDownloads(){if(!dlP)dlP=(window.claude&&window.claude.use)?window.claude.use('downloads').catch(()=>null):Promise.resolve(null);return dlP}
async function saveFile(filename,data){
  if(window.SoTroAndroid)return androidSave(filename,data);
  const dl=await getDownloads();
  if(!dl){
    if(!window.claude){try{const b=data instanceof Blob?data:new Blob([data],{type:'application/octet-stream'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Đã lưu '+filename);return true}catch(e){}}
    toast('Chế độ xem này không cho lưu tệp. Hãy mở ứng dụng trên claude.ai hoặc app Claude.');return false}
  try{await dl.save({filename,data});toast('Đã lưu '+filename);return true}
  catch(e){const c=e&&e.code;toast(c==='declined'?'Đã hủy lưu tệp':c==='rate_limited'?'Đang có hộp thoại lưu khác, thử lại sau giây lát':'Không lưu được tệp ('+(c||'lỗi')+')');return false}
}
function copyText(t,okMsg){
  if(window.SoTroAndroid){try{SoTroAndroid.copyText(String(t));toast(okMsg||'Đã chép');return}catch(e){}}
  try{navigator.clipboard.writeText(t).then(()=>toast(okMsg||'Đã chép')).catch(()=>push('text',{text:t}))}catch(e){push('text',{text:t})}
}
function billText(pid,month,key){
  const p=S.props[pid];const r=rowOf(pid,month,key);const c=rowCalc(pid,month,key);const bank=BANKS.find(b=>b[0]===p.bank.bin);
  const L=[`HÓA ĐƠN ${monthLabel(month).toUpperCase()} – PHÒNG ${r.roomNo}`,p.name,`Người thuê: ${r.tenantName}`,''];
  for(const i of c.items)L.push(`• ${i.label}: ${i.miss?'chưa có số':money(i.amount)}${i.detail?` (${i.detail})`:''}`);
  L.push('',`TỔNG CỘNG: ${c.complete?money(c.total):'chưa đủ chỉ số'}`);
  if(c.complete&&c.paid>0)L.push(`Đã thu: ${money(c.paid)} · Còn lại: ${money(Math.max(0,c.total-c.paid))}`);
  if(bank&&p.bank.acct)L.push('',`Chuyển khoản: ${bank[1]} – ${p.bank.acct} – ${p.bank.holder}`,`Nội dung: ${payRef(r,month)}`);
  L.push(`Hạn thanh toán: ${dueDate(p,month)}`);if(r.note)L.push(r.note);if(p.invoiceNote)L.push(p.invoiceNote);
  return L.join('\n');
}
const payRef=(r,month)=>`P${ascii(r.roomNo).replace(/\s/g,'')} T${Number(month.slice(5))}-${month.slice(0,4)}`.toUpperCase();
function dueDate(p,month){const nm=addMonth(month,1);return `${pad(clamp(p.dueDay||5,1,28))}/${nm.slice(5)}/${nm.slice(0,4)}`}
async function exportExcel(pid,month){
  const rows=rowsSorted(pid,month);if(!rows.length){toast('Kỳ này chưa có hóa đơn');return}
  toast('Đang tạo tệp Excel…');
  try{await loadScript(URLS.xlsx)}catch(e){toast('Không tải được thư viện Excel. Kiểm tra kết nối mạng.');return}
  const X=window.XLSX;const p=S.props[pid];const wb=X.utils.book_new();const ML=monthLabel(month);
  const setN=(ws,r,c,v,f,z)=>{const a=X.utils.encode_cell({r,c});ws[a]={t:'n',v:v||0};if(f)ws[a].f=f;ws[a].z=z||'#,##0'};
  // Sheet 1: electricity
  const head=[[`BẢNG TIỀN ĐIỆN ${ML.toUpperCase()}`],[`${p.name} – ${p.address||''}`],[],['STT','Phòng','Người thuê','Chỉ số cũ','Chỉ số mới','Tiêu thụ (kWh)','Đơn giá (đ/kWh)','Thành tiền (đ)','Ghi chú']];
  const data=rows.map(([k,r],i)=>[i+1,r.roomNo,r.tenantName,r.e0,r.e1??'','','','',r.e1==null?'Chưa chốt số':(r.final?'Trả phòng':'')]);
  const ws=X.utils.aoa_to_sheet(head.concat(data));
  rows.forEach(([k,r],i)=>{const R=4+i,ex=R+1;setN(ws,R,3,r.e0,null,'#,##0.##');if(r.e1!=null){setN(ws,R,4,r.e1,null,'#,##0.##');setN(ws,R,5,r.e1-r.e0,`E${ex}-D${ex}`,'#,##0.##');setN(ws,R,7,Math.max(0,r.e1-r.e0)*r.prices.elec,`F${ex}*G${ex}`)}setN(ws,R,6,r.prices.elec)});
  const tr=4+rows.length;const totU=rows.reduce((s,[,r])=>s+(r.e1!=null?r.e1-r.e0:0),0),totM=rows.reduce((s,[,r])=>s+(r.e1!=null?Math.max(0,r.e1-r.e0)*r.prices.elec:0),0);
  ws[X.utils.encode_cell({r:tr,c:2})]={t:'s',v:'TỔNG CỘNG'};setN(ws,tr,5,totU,`SUM(F5:F${tr})`,'#,##0.##');setN(ws,tr,7,totM,`SUM(H5:H${tr})`);
  ws['!ref']=X.utils.encode_range({s:{r:0,c:0},e:{r:tr,c:8}});ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:8}},{s:{r:1,c:0},e:{r:1,c:8}}];
  ws['!cols']=[{wch:5},{wch:8},{wch:24},{wch:11},{wch:11},{wch:14},{wch:15},{wch:15},{wch:14}];
  X.utils.book_append_sheet(wb,ws,'Tiền điện');
  // Sheet 2: water if metered
  const pr=p.prices;if(pr.waterMode!=='person'&&(pr.well>0||pr.city>0)){
    const wh=[[`BẢNG TIỀN NƯỚC ${ML.toUpperCase()}`],[p.name],[],['STT','Phòng','Người thuê','Giếng cũ','Giếng mới','Giếng (m³)','Tiền giếng','Máy cũ','Máy mới','Máy (m³)','Tiền nước máy']];
    const wd=rows.map(([k,r],i)=>{const g=r.w1!=null?r.w1-r.w0:null,m=r.c1!=null?r.c1-r.c0:null;return[i+1,r.roomNo,r.tenantName,r.w0,r.w1??'',g??'',g!=null?Math.max(0,g)*r.prices.well:'',r.c0,r.c1??'',m??'',m!=null?Math.max(0,m)*r.prices.city:'']});
    const w2=X.utils.aoa_to_sheet(wh.concat(wd));rows.forEach((_,i)=>{for(const c of [6,10]){const a=X.utils.encode_cell({r:4+i,c});if(w2[a]&&w2[a].t==='n')w2[a].z='#,##0'}});
    w2['!cols']=[{wch:5},{wch:8},{wch:24},{wch:9},{wch:9},{wch:10},{wch:12},{wch:9},{wch:9},{wch:10},{wch:14}];X.utils.book_append_sheet(wb,w2,'Tiền nước');
  }
  // Sheet 3: summary
  const sh=[[`TỔNG HỢP HÓA ĐƠN ${ML.toUpperCase()}`],[p.name],[],['Phòng','Người thuê','Số người','Tiền phòng','Điện','Nước','Rác','Wifi','Phí khác','Phát sinh','Nợ/Dư kỳ trước','Tổng cộng','Đã thu','Còn lại','Trạng thái']];
  const sum=(c,ks)=>c.items.filter(i=>ks.includes(i.k)).reduce((s,i)=>s+i.amount,0);
  const sd=rows.map(([k,r])=>{const c=rowCalc(pid,month,k);return[r.roomNo,r.tenantName,r.people,sum(c,['rent']),sum(c,['elec']),sum(c,['water','well','city']),sum(c,['trash']),sum(c,['wifi']),sum(c,['extra']),sum(c,['adj']),sum(c,['carry']),c.complete?c.total:'',c.paid,c.complete?Math.max(0,c.total-c.paid):'',STATUS[c.status][0]]});
  const w3=X.utils.aoa_to_sheet(sh.concat(sd));for(let i=0;i<sd.length;i++)for(let c=3;c<=13;c++){const a=X.utils.encode_cell({r:4+i,c});if(w3[a]&&w3[a].t==='n')w3[a].z='#,##0'}
  w3['!cols']=[{wch:8},{wch:24},{wch:8},...Array(11).fill({wch:13}),{wch:14}];X.utils.book_append_sheet(wb,w3,'Tổng hợp');
  const Lg=ledgerOf(pid,month);if(Lg){const st=moneyStats(pid,month);const rl=[[`THU CHI ${ML.toUpperCase()}`],[p.name],[],['Khoản','Số tiền / số lượng'],['Phải thu từ các phòng (đ)',st.due],['Đã thu (đ)',st.paid],['Tiền điện EVN (đ)',Lg.elecCost||0],['Tiền nước (đ)',Lg.waterCost||0],...(Lg.expenses||[]).map(x=>[`${x.name||'Chi phí'} – ${x.cat||''} (đ)`,x.amount||0]),['Tổng chi (đ)',st.cost],['Lãi tạm tính (đ)',st.profit],[],['Điện đồng hồ tổng (kWh)',Lg.elecKwh??''],['Điện các phòng (kWh)',st.kwh],['Chênh lệch (kWh)',Lg.elecKwh!=null?Math.round((Lg.elecKwh-st.kwh)*100)/100:'']];
    const w4=X.utils.aoa_to_sheet(rl);for(let i=4;i<rl.length;i++){const a=X.utils.encode_cell({r:i,c:1});if(w4[a]&&w4[a].t==='n')w4[a].z='#,##0.##'}w4['!cols']=[{wch:38},{wch:18}];X.utils.book_append_sheet(wb,w4,'Thu chi')}
  const out=X.write(wb,{bookType:'xlsx',type:'array'});
  saveFile(`TienDien_${slug(p.name)}_${month}.xlsx`,new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
async function zipImages(pid,month){
  const rows=rowsSorted(pid,month).filter(([k])=>rowCalc(pid,month,k).complete);if(!rows.length){toast('Chưa có phòng nào đủ chỉ số để xuất ảnh');return}
  toast(`Đang tạo ${rows.length} ảnh hóa đơn…`);
  try{await loadScript(URLS.zip)}catch(e){toast('Không tải được thư viện nén. Kiểm tra kết nối mạng.');return}
  const zip=new window.JSZip();for(const [k,r] of rows){const cv=await invoiceCanvas(pid,month,k);const b=await new Promise(res=>cv.toBlob(res,'image/png'));zip.file(`HoaDon_P${slug(r.roomNo)}_${month}.png`,b)}
  const blob=await zip.generateAsync({type:'blob'});saveFile(`HoaDon_${slug(S.props[pid].name)}_${month}.zip`,blob);
}
// Thay toàn bộ dữ liệu bằng bản sao lưu d (đã kiểm d.app==='sotro').
function applyBackup(d){
  for(const k of Object.keys(S.props))if(!d.props[k])persistDel('p',k);for(const k of Object.keys(S.bills))if(!(d.bills||{})[k])persistDel('b',k);
  S.props=d.props;Object.values(S.props).forEach(normProp);S.bills=d.bills||{};S.settings=Object.assign({alertDays:30},d.settings||{});fixActive();
  for(const k of Object.keys(S.props))persist('p',k);for(const k of Object.keys(S.bills))persist('b',k);persist('s');ui.sheets=[];ui.tab='home';render();
  markBackedUp();
}
function backupJSON(){return JSON.stringify({app:'sotro',version:1,exportedAt:new Date().toISOString(),props:S.props,bills:S.bills,settings:S.settings},null,1)}
async function restoreFile(el){
  const f=el.files&&el.files[0];el.value='';if(!f)return;let d,photos=[];
  try{
    if(/\.zip$/i.test(f.name)||/zip/.test(f.type)){
      await loadScript(URLS.zip);const z=await JSZip.loadAsync(f);const j=z.file('sotro.json');if(!j)throw new Error('thiếu sotro.json');d=JSON.parse(await j.async('string'));
      z.forEach((path,file)=>{const m=/^anh\/(l_[\w]+)\.jpg$/.exec(path);if(m&&!file.dir)photos.push([m[1],file])});
    }else d=JSON.parse(await f.text());
  }catch(e){toast('Tệp không đúng định dạng sao lưu');return}
  if(!d||d.app!=='sotro'||!d.props){toast('Đây không phải tệp sao lưu của Sổ Trọ');return}
  ask('Khôi phục dữ liệu?',`Tệp có ${Object.keys(d.props).length} khu trọ${photos.length?` và ${photos.length} ảnh đồng hồ`:''}, sao lưu lúc ${new Date(d.exportedAt).toLocaleString('vi-VN')}. Toàn bộ dữ liệu hiện tại sẽ được thay thế.`,'Khôi phục',async()=>{
    applyBackup(d);
    let ok=0;for(const [id,file] of photos){try{await phPut(id,{buf:await file.async('arraybuffer'),type:'image/jpeg',at:Date.now()});ok++}catch(e){}}
    if(ok)render();toast(photos.length?`Đã khôi phục dữ liệu và ${ok}/${photos.length} ảnh`:'Đã khôi phục dữ liệu')},true);
}

/* =========================== invoice image (canvas) =========================== */
function crc16(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++){c=(c&0x8000)?((c<<1)^0x1021):(c<<1);c&=0xFFFF}}return c.toString(16).toUpperCase().padStart(4,'0')}
const tlv=(id,v)=>id+String(v.length).padStart(2,'0')+v;
function vietQR(bin,acct,amount,info){
  const mai=tlv('00','A000000727')+tlv('01',tlv('00',bin)+tlv('01',acct))+tlv('02','QRIBFTTA');
  let s=tlv('00','01')+tlv('01',amount?'12':'11')+tlv('38',mai)+tlv('53','704')+(amount?tlv('54',String(Math.round(amount))):'')+tlv('58','VN')+(info?tlv('62',tlv('08',info.slice(0,25))):'')+'6304';
  return s+crc16(s);
}
async function genInvoiceImg(){
  const sh=topSheet();if(!sh||sh.type!=='image')return;const {pid,month,key}=sh.params;
  const cv=sh.params.kind==='statement'?await statementCanvas(sh.params.pid,sh.params.rid):await invoiceCanvas(pid,month,key);sh.params.url=cv.toDataURL('image/png');const img=document.getElementById('inv-img');if(img&&topSheet()===sh)img.src=sh.params.url;
}
async function invoiceCanvas(pid,month,key,opts={}){
  try{await Promise.all([document.fonts.load('400 24px "Be Vietnam Pro"'),document.fonts.load('600 24px "Be Vietnam Pro"'),document.fonts.load('700 24px "Be Vietnam Pro"'),document.fonts.load('600 24px "IBM Plex Mono"')])}catch(e){}
  const p=S.props[pid],r=rowOf(pid,month,key),c=rowCalc(pid,month,key);const bank=BANKS.find(b=>b[0]===p.bank.bin);
  const W=1080,PX=72;const cv=document.createElement('canvas');cv.width=W;cv.height=4000;const x=cv.getContext('2d');
  const FB='"Be Vietnam Pro", system-ui, sans-serif',FM='"IBM Plex Mono", ui-monospace, monospace';const F=(w,s,f=FB)=>`${w} ${s}px ${f}`;
  const C={ink:'#13211D',muted:'#5B6D67',line:'#D3DDD8',acc:'#0E6B5F',soft:'#EAF4F1',elec:'#A87700',bad:'#B42318',ok:'#1C7A4B'};
  x.fillStyle='#fff';x.fillRect(0,0,W,4000);x.textBaseline='alphabetic';
  const wrap=(t,X,y,maxW,lh)=>{const words=String(t).split(' ');let line='';for(const w of words){const test=line?line+' '+w:w;if(x.measureText(test).width>maxW&&line){x.fillText(line,X,y);y+=lh;line=w}else line=test}if(line){x.fillText(line,X,y);y+=lh}return y};
  // header band
  x.fillStyle=C.acc;x.fillRect(0,0,W,176);x.fillStyle='#fff';x.font=F(700,46);x.fillText(p.name,PX,92,W-2*PX);x.font=F(400,26);x.globalAlpha=.85;x.fillText(p.address||'',PX,136,W-2*PX);x.globalAlpha=1;
  let y=252;x.fillStyle=C.acc;x.font=F(700,26);x.fillText('HÓA ĐƠN TIỀN PHÒNG',PX,y);x.textAlign='right';x.fillStyle=C.ink;x.font=F(600,30);x.fillText(monthLabel(month),W-PX,y);x.textAlign='left';
  y+=40;x.fillStyle=C.ink;x.beginPath();x.roundRect?x.roundRect(PX,y,250,92,10):x.rect(PX,y,250,92);x.fill();x.fillStyle='#fff';x.font=F(600,52,FM);x.textAlign='center';x.fillText(String(r.roomNo),PX+125,y+66,230);x.textAlign='left';
  x.fillStyle=C.ink;x.font=F(600,34);x.fillText(r.tenantName,PX+282,y+42,W-PX*2-282);x.fillStyle=C.muted;x.font=F(400,25);x.fillText(`${r.people} người ở${r.final?' · hóa đơn trả phòng':''}`,PX+282,y+80);
  y+=136;x.strokeStyle=C.line;x.lineWidth=2;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();
  for(const it of c.items){
    y+=56;x.fillStyle=C.ink;x.font=F(600,30);x.fillText(it.label,PX,y,W-2*PX-300);x.textAlign='right';x.font=F(600,30);x.fillStyle=it.miss?C.muted:it.amount<0?C.ok:C.ink;x.fillText(it.miss?'chưa có số':money(it.amount),W-PX,y);x.textAlign='left';
    if(it.detail){y+=36;x.fillStyle=C.muted;x.font=F(400,23,FM);y=wrap(it.detail,PX,y,W-2*PX-60,32)-32}
    y+=22;x.setLineDash([6,6]);x.strokeStyle=C.line;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();x.setLineDash([]);
  }
  y+=28;const bh=c.complete&&c.paid>0?220:130;x.fillStyle=C.soft;x.fillRect(PX-24,y,W-2*PX+48,bh);
  x.fillStyle=C.acc;x.font=F(700,28);x.fillText('TỔNG CỘNG',PX,y+78);x.textAlign='right';x.font=F(700,56);x.fillStyle=c.complete?C.acc:C.muted;x.fillText(c.complete?money(c.total):'Chưa đủ chỉ số',W-PX,y+86);
  if(c.complete&&c.paid>0){x.font=F(500,27);x.fillStyle=C.ok;x.fillText('Đã thanh toán: '+money(c.paid),W-PX,y+140);const rem=c.total-c.paid;x.fillStyle=rem>0.5?C.bad:C.ok;x.font=F(700,30);x.fillText(rem>0.5?'Còn phải trả: '+money(rem):'ĐÃ THANH TOÁN ĐỦ',W-PX,y+186)}
  x.textAlign='left';y+=bh;
  const due=c.complete?Math.max(0,c.total-c.paid):0;
  if(bank&&p.bank.acct&&window.qrcode){
    y+=48;const ref=payRef(r,month);let drew=false;
    try{const q=window.qrcode(0,'M');q.addData(vietQR(p.bank.bin,p.bank.acct,due>0.5?due:0,ref));q.make();const n=q.getModuleCount();const size=300,cell=Math.floor(size/n),qs=cell*n,ox=PX,oy=y;
      x.fillStyle='#fff';x.fillRect(ox-12,oy-12,qs+24,qs+24);x.strokeStyle=C.line;x.strokeRect(ox-12,oy-12,qs+24,qs+24);x.fillStyle='#000';
      for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(q.isDark(i,j))x.fillRect(ox+j*cell,oy+i*cell,cell,cell);drew=qs}catch(e){}
    const tx=drew?PX+drew+48:PX;let ty=y+30;x.fillStyle=C.muted;x.font=F(500,24);x.fillText('CHUYỂN KHOẢN',tx,ty);ty+=44;x.fillStyle=C.ink;x.font=F(700,30);x.fillText(bank[1],tx,ty,W-PX-tx);ty+=46;x.font=F(600,34,FM);x.fillText(p.bank.acct,tx,ty,W-PX-tx);ty+=40;x.font=F(500,25);x.fillText(p.bank.holder||'',tx,ty,W-PX-tx);ty+=48;x.fillStyle=C.muted;x.font=F(400,24);x.fillText('Nội dung:',tx,ty);x.fillStyle=C.ink;x.font=F(600,26,FM);x.fillText(ref,tx+118,ty,W-PX-tx-118);
    if(drew){ty+=40;x.fillStyle=C.muted;x.font=F(400,22);x.fillText('Quét mã bằng app ngân hàng, số tiền tự điền.',tx,ty,W-PX-tx)}
    y=Math.max(y+(drew||0),ty)+20;
  }
  const ph=Object.entries(r.photos||{}).filter(([,id])=>id);
  if(ph.length&&opts.photos!==false){const imgs=[];for(const [f,id] of ph){try{const u=await photoURL(id);if(!u)continue;const im=new Image();im.src=u;await im.decode();imgs.push([f,im])}catch(e){}}
    if(imgs.length){y+=60;x.fillStyle=C.muted;x.font=F(500,24);x.fillText('ẢNH ĐỒNG HỒ',PX,y);y+=20;const gap=24,n=imgs.length,w=Math.min(300,(W-2*PX-gap*(n-1))/n),h=w*0.75;
      imgs.forEach(([f,im],i)=>{const X=PX+i*(w+gap);const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);const sw=w/sc,shh=h/sc;x.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-shh)/2,sw,shh,X,y,w,h);x.fillStyle=C.ink;x.font=F(500,22);x.fillText(meterName(f),X,y+h+30)});y+=h+40}}
  y+=48;x.fillStyle=C.ink;x.font=F(600,27);x.fillText(`Hạn thanh toán: ${dueDate(p,month)}`,PX,y);
  x.font=F(400,25);x.fillStyle=C.muted;if(r.note){y+=42;y=wrap(r.note,PX,y,W-2*PX,36)-36}if(p.invoiceNote){y+=42;y=wrap(p.invoiceNote,PX,y,W-2*PX,36)-36}
  y+=60;x.strokeStyle=C.line;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();y+=40;x.font=F(400,21);x.fillText(`Lập ngày ${dmy(todayISO())} · Sổ Trọ`,PX,y);
  const out=document.createElement('canvas');out.width=W;out.height=y+44;const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,W,out.height);o.drawImage(cv,0,0);
  if(opts.photos!==false){try{o.getImageData(0,0,1,1)}catch(e){return invoiceCanvas(pid,month,key,{photos:false})}}
  return out;
}

/* =========================== 3D model =========================== */
const R3={renderer:null,scene:null,camera:null,group:null,el:null,walls:[],theta:-2.3,phi:1.02,radius:12,minR:3,maxR:40,target:null,dirty:true,raf:0,key:'',w:0,h:0,span:6};
async function mount3D(el){
  try{await loadScript(URLS.three)}catch(e){el.innerHTML='<p class="muted small" style="padding:16px">Không tải được thư viện 3D. Kiểm tra kết nối mạng rồi mở lại.</p>';return}
  if(!document.body.contains(el))return;
  const site=el.dataset['3d']==='site';const sh=topSheet();
  const l=site?null:layoutForStage(el);if(!site&&!l)return;if(site&&(!sh||sh.type!=='site'))return;
  if(!R3.renderer)threeInit();
  el.appendChild(R3.renderer.domElement);R3.el=el;
  const key=(el.dataset['3d'])+(el.dataset.rid||'');const fresh=key!==R3.key;R3.key=key;
  if(site)buildSite(S.props[sh.params.pid],sh.draft,fresh);else build3D(l,fresh);R3.w=0;loop3D();
}
function layoutForStage(el){const sh=topSheet();if(el.dataset['3d']==='draft'&&sh&&sh.type==='layout'){return draftLayout(sh)}const p=P();const room=p.rooms.find(r=>r.id===el.dataset.rid);return room?roomLayout(p,room):null}
let u3T=null;
function update3DFromDraft(sh){
  clearTimeout(u3T);u3T=setTimeout(()=>{
    const l=draftLayout(sh);
    const st=document.getElementById('layout-stats');if(st)st.innerHTML=statsHTML(l);
    const wb=document.getElementById('stage-warn');if(wb){wb.innerHTML=warnBadge(l);wb.className='stage-warn'+(layoutInfo(l).warns.length?' has':'')}
    if(window.THREE&&R3.renderer&&R3.el&&document.body.contains(R3.el))build3D(l,false);
  },120);
}
function threeInit(){
  const T=THREE;const r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.outputEncoding=T.sRGBEncoding;
  R3.renderer=r;R3.scene=new T.Scene();R3.camera=new T.PerspectiveCamera(40,1,0.05,300);R3.target=new T.Vector3();
  R3.scene.add(new T.HemisphereLight(0xffffff,0x9a9488,0.95));
  const d=new T.DirectionalLight(0xffffff,0.55);d.position.set(-5,10,-7);R3.scene.add(d);
  const d2=new T.DirectionalLight(0xffffff,0.25);d2.position.set(7,5,9);R3.scene.add(d2);
  const c=r.domElement;c.style.touchAction='none';c.setAttribute('aria-label','Mô hình 3D phòng trọ');
  const pts=new Map();let lastD=0;const dist=()=>{const a=[...pts.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1};
  c.addEventListener('pointerdown',e=>{try{c.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2)lastD=dist()});
  c.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(pts.size===1){R3.theta+=dx*0.009;R3.phi=clamp(R3.phi-dy*0.008,0.12,1.5);R3.dirty=true}
    else if(pts.size===2){const dd=dist();if(lastD){R3.radius=clamp(R3.radius*lastD/dd,R3.minR,R3.maxR);R3.dirty=true}lastD=dd}});
  const up=e=>{pts.delete(e.pointerId);lastD=pts.size===2?dist():0};c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
  c.addEventListener('wheel',e=>{e.preventDefault();R3.radius=clamp(R3.radius*(e.deltaY>0?1.08:0.92),R3.minR,R3.maxR);R3.dirty=true},{passive:false});
}
function setView(v){if(v==='iso'){R3.theta=-2.3;R3.phi=1.02;R3.radius=R3.span*2.1}else if(v==='front'){R3.theta=-Math.PI/2;R3.phi=1.32;R3.radius=R3.span*1.9}else if(v==='top'){R3.theta=-Math.PI/2;R3.phi=0.12;R3.radius=R3.span*2.0}R3.dirty=true}
function loop3D(){
  cancelAnimationFrame(R3.raf);
  const tick=()=>{
    if(!R3.el||!document.body.contains(R3.el)){R3.raf=0;return}
    const w=R3.el.clientWidth,h=R3.el.clientHeight;if(w!==R3.w||h!==R3.h){R3.w=w;R3.h=h;R3.renderer.setSize(w,h,false);R3.camera.aspect=w/Math.max(1,h);R3.camera.updateProjectionMatrix();R3.dirty=true}
    if(R3.dirty){const cam=R3.camera,t=R3.target;cam.position.set(t.x+R3.radius*Math.sin(R3.phi)*Math.cos(R3.theta),t.y+R3.radius*Math.cos(R3.phi),t.z+R3.radius*Math.sin(R3.phi)*Math.sin(R3.theta));cam.lookAt(t);
      for(const wl of R3.walls){const v=cam.position.clone().sub(wl.center);const facing=v.dot(wl.normal)>0;const op=facing?0.1:1;if(wl.mat.opacity!==op){wl.mat.opacity=op;wl.mat.transparent=op<1;wl.mat.depthWrite=op===1;wl.mat.needsUpdate=true}}
      R3.renderer.render(R3.scene,cam);R3.dirty=false}
    R3.raf=requestAnimationFrame(tick)};
  tick();
}
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}})}
function build3D(l0,fresh){
  const T=THREE;if(R3.group){R3.scene.remove(R3.group);disposeGroup(R3.group)}
  const walls=[];const g=roomGroup(l0,walls,true);R3.group=g;R3.walls=walls;R3.scene.add(g);
  const W=l0.W,L=l0.L,H=l0.H;
  R3.target.set(W/2,Math.min(H*0.36,1.5),L/2);R3.span=Math.max(W,L,H);R3.minR=R3.span*0.5;R3.maxR=R3.span*5;
  if(fresh){R3.theta=-2.3;R3.phi=1.02;R3.radius=R3.span*2.1}
  R3.dirty=true;
}
// Một phòng trong hệ tọa độ riêng: sàn x∈[0,W], z∈[0,L], cửa ra vào ở tường z=0. full=false: bỏ nhãn, đường kích thước (dùng trong sơ đồ dãy).
function roomGroup(l0,walls,full){
  // three.js looks down +z from the door, so +x shows on the viewer's left: mirror left/right so "bên phải" means the right as seen from the doorway
  const sw_=v=>v==='left'?'right':v==='right'?'left':v;const l=clone(l0);l.door=sw_(l.door);l.stair.side=sw_(l.stair.side);l.wc.corner=l.wc.corner.replace(/left|right/,m=>sw_(m));
  const T=THREE;const g=new T.Group();
  const W=l.W,L=l.L,H=l.H,TW=0.1;const lo=l.loft,wc=l.wc,st=l.stair;const d=lo.on?Math.min(lo.depth,L-0.6):0;const zE=L-d;
  const M=(c,o={})=>new T.MeshLambertMaterial(Object.assign({color:c},o));
  const box=(x0,y0,z0,x1,y1,z1,mat,parent=g)=>{const sx=Math.abs(x1-x0),sy=Math.abs(y1-y0),sz=Math.abs(z1-z0);if(sx<0.001||sy<0.001||sz<0.001)return null;const m=new T.Mesh(new T.BoxGeometry(sx,sy,sz),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);parent.add(m);return m};
  const wall=(normal,center,color=0xEEF0EB)=>{const mat=M(color);const w={mat,normal:new T.Vector3(...normal),center:new T.Vector3(...center)};walls.push(w);return w};
  // floor: 60x60 tiles
  const tc=document.createElement('canvas');tc.width=tc.height=128;const tx=tc.getContext('2d');tx.fillStyle='#DDD0B9';tx.fillRect(0,0,128,128);tx.strokeStyle='#C2B091';tx.lineWidth=3;tx.strokeRect(1.5,1.5,125,125);
  const tex=new T.CanvasTexture(tc);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(W/0.6,L/0.6);tex.encoding=T.sRGBEncoding;
  box(-TW,-0.08,-TW,W+TW,0,L+TW,M(0xBDB6A8));box(0,-0.06,0,W,0.001,L,new T.MeshLambertMaterial({map:tex}));
  // walls in user coordinates (a = along the wall, d = depth outward from the inner face)
  const wb2=(wn,a0,a1,y0,y1,d0,d1,mat)=>wn==='back'?box(W-a1,y0,L+d0,W-a0,y1,L+d1,mat):wn==='front'?box(W-a1,y0,-d1,W-a0,y1,-d0,mat):wn==='left'?box(W+d0,y0,a0,W+d1,y1,a1,mat):box(-d1,y0,a0,-d0,y1,a1,mat);
  const wpos=(wn,a,y,d)=>wn==='back'?new T.Vector3(W-a,y,L+d):wn==='front'?new T.Vector3(W-a,y,-d):wn==='left'?new T.Vector3(W+d,y,a):new T.Vector3(-d,y,a);
  const WALLS={back:wall([0,0,1],[W/2,H/2,L]),front:wall([0,0,-1],[W/2,H/2,0]),left:wall([1,0,0],[W,H/2,L/2]),right:wall([-1,0,0],[0,H/2,L/2])};
  const holes={back:[],front:[],left:[],right:[]};const dxU=doorX(l0,W);const shop=l0.door==='shop';const dw=doorHalf(l0,W)*2,dh=shop?Math.min(2.8,H-0.3):Math.min(2.2,H-0.2);holes.front.push({a0:dxU-dw/2,a1:dxU+dw/2,y0:0,y1:dh,door:1});
  for(const w of [groundWin(l0),loftWin(l0)])if(w&&!w.fail)holes[w.wall].push(w);
  const glass=new T.MeshLambertMaterial({color:0x9CC9E0,transparent:true,opacity:0.45});const fr=M(0x55606A);
  for(const wn of ['back','front','left','right']){const len=wn==='front'||wn==='back'?W:L;const hs=holes[wn];const ys=[...new Set([0,H,...hs.flatMap(h=>[h.y0,h.y1])])].sort((a,b)=>a-b);
    for(let i=0;i<ys.length-1;i++){const ya=ys[i],yb=ys[i+1];if(yb-ya<0.001)continue;const act=hs.filter(h=>h.y0<=ya+1e-6&&h.y1>=yb-1e-6).sort((a,b)=>a.a0-b.a0);let sa=-TW;for(const h of act){if(h.a0>sa)wb2(wn,sa,h.a0,ya,yb,0,TW,WALLS[wn].mat);sa=Math.max(sa,h.a1)}if(sa<len+TW)wb2(wn,sa,len+TW,ya,yb,0,TW,WALLS[wn].mat)}
    for(const h of hs){if(h.door)continue;wb2(wn,h.a0,h.a1,h.y0,h.y1,0.04,0.06,glass);wb2(wn,h.a0,h.a1,h.y0,h.y0+0.04,-0.02,0.08,fr);wb2(wn,h.a0,h.a1,h.y1-0.04,h.y1,0.03,0.07,fr);const nb=Math.max(2,Math.round((h.a1-h.a0)/0.3));for(let k=0;k<=nb;k++){const aa=h.a0+k*((h.a1-h.a0)/nb);wb2(wn,aa-0.012,aa+0.012,h.y0,h.y1,0.04,0.06,fr)}}}
  // door frame
  const dx=W-dxU;const wood=M(shop?0x6B7378:0x7A5232);
  // cửa cuốn kiot: hộp cuốn phía trên và cửa kéo lên một phần
  if(shop){box(dx-dw/2-0.05,dh,-TW-0.18,dx+dw/2+0.05,dh+0.25,-TW,M(0x8C969B));box(dx-dw/2,dh-0.5,-TW-0.06,dx+dw/2,dh,-TW-0.03,M(0xB4BCC0));for(let yy=dh-0.48;yy<dh;yy+=0.08)box(dx-dw/2,yy,-TW-0.07,dx+dw/2,yy+0.01,-TW-0.06,M(0x8C969B))}
  box(dx-dw/2-0.05,0,-TW-0.02,dx-dw/2,dh+0.05,0.02,wood);box(dx+dw/2,0,-TW-0.02,dx+dw/2+0.05,dh+0.05,0.02,wood);box(dx-dw/2-0.05,dh,-TW-0.02,dx+dw/2+0.05,dh+0.05,0.02,wood);
  // air conditioner (indoor unit)
  const acs=acSpot(l0);
  if(acs&&!acs.fail){const wn=acs.wall,a0=acs.a0,a1=acs.a1,y0=acs.y0,y1=acs.y1;wb2(wn,a0,a1,y0,y1,-0.22,0,M(0xF7F8F6));wb2(wn,a0+0.04,a1-0.04,y0+0.025,y0+0.06,-0.226,-0.21,M(0x8E979A));wb2(wn,a1-0.16,a1-0.1,y1-0.06,y1-0.04,-0.226,-0.21,M(0x3FB6E8));
    wb2(wn,a1-0.08,a1-0.03,Math.max(0.05,y0-0.9),y0,-0.06,-0.01,M(0xE4E6E2));
    if(full)g.add(label(`Máy lạnh ${f2(+l0.ac.hp)} HP`,wpos(wn,(a0+a1)/2,y1+0.25,-0.35),(Math.max(W,L)*0.075+0.12)*0.8));}
  // loft
  if(lo.on){const lw=M(0x9B6B43);box(0,lo.h-lo.t,zE,W,lo.h,L,lw);const steel=M(0x3B4542);box(0,lo.h-lo.t-0.12,zE,W,lo.h-lo.t,zE+0.08,steel);
    const sw=st.on?st.w:0;const rx0=st.on&&st.side==='left'?sw:0,rx1=st.on&&st.side==='right'?W-sw:W;
    if(rx1-rx0>0.1){box(rx0,lo.h+0.86,zE,rx1,lo.h+0.9,zE+0.04,steel);box(rx0,lo.h+0.45,zE,rx1,lo.h+0.47,zE+0.03,steel);const n=Math.max(1,Math.round((rx1-rx0)/0.5));for(let i=0;i<=n;i++){const xx=rx0+(rx1-rx0)*i/n;box(xx-0.02,lo.h,zE,xx+0.02,lo.h+0.9,zE+0.04,steel)}}
    if(st.on){const info=layoutInfo(l);const n=info.steps,rise=info.rise,tr=st.tread||0.22;const x0=st.side==='left'?0:W-sw,x1=x0+sw;
      for(let i=1;i<n;i++){const y=i*rise;const z1=zE-(n-i-1)*tr,z0=z1-tr;box(x0+0.04,y-0.035,z0,x1-0.04,y,z1,M(0xB07D4F))}
      const z0=zE-(n-1)*tr;const run=zE-z0,len=Math.hypot(run,lo.h),ang=-Math.atan2(lo.h,run);
      for(const sx of [x0+0.02,x1-0.02]){const s=new T.Mesh(new T.BoxGeometry(0.04,0.14,len),steel);s.position.set(sx,lo.h/2-0.04,(z0+zE)/2);s.rotation.x=ang;g.add(s)}
      if(st.rail!==false){const hx=st.side==='left'?x1-0.02:x0+0.02;const hr=new T.Mesh(new T.BoxGeometry(0.035,0.035,len),steel);hr.position.set(hx,lo.h/2+0.85,(z0+zE)/2);hr.rotation.x=ang;g.add(hr);
      const np=Math.max(2,Math.round(run/0.5)+1);for(let i=0;i<np;i++){const zz=z0+0.1+(run-0.15)*i/(np-1);const yy=(zz-z0)/run*lo.h;box(hx-0.015,yy,zz-0.015,hx+0.015,yy+0.88,zz+0.015,steel)}}
    }}
  // WC
  if(wc.on){const back=wc.corner.startsWith('back'),left=wc.corner.endsWith('left');const ww=Math.min(wc.w,W),wd=Math.min(wc.d,L);
    const x0=left?0:W-ww,x1=x0+ww,z0=back?L-wd:0,z1=z0+wd;const under=lo.on&&back&&wd<=d+0.01;const wh=under?lo.h-lo.t:Math.min(2.4,H);const t=0.08;
    box(x0,0.001,z0,x1,0.012,z1,M(0x9FB7BF));
    const wa=wall([0,0,back?-1:1],[(x0+x1)/2,wh/2,back?z0:z1],0xCFE2E8);const za0=back?z0-t:z1,za1=back?z0:z1+t;
    const wbm=wall([left?1:-1,0,0],[left?x1:x0,wh/2,(z0+z1)/2],0xCFE2E8);const xb0=left?x1:x0-t,xb1=left?x1+t:x0;const zb0=back?z0-t:z0,zb1=back?z1:z1+t;
    const wdr=wcDoor(l);const ddw=Math.max(0.3,wdr.ddw),ddh=Math.min(2.0,wh-0.05);const frm=M(0x7A5232);
    if(!wdr.side){const c=wdr.c;box(x0,0,za0,c-ddw/2,wh,za1,wa.mat);box(c+ddw/2,0,za0,x1,wh,za1,wa.mat);box(c-ddw/2,ddh,za0,c+ddw/2,wh,za1,wa.mat);box(xb0,0,zb0,xb1,wh,zb1,wbm.mat);
      box(c-ddw/2-0.04,0,za0-0.01,c-ddw/2,ddh,za1+0.01,frm);box(c+ddw/2,0,za0-0.01,c+ddw/2+0.04,ddh,za1+0.01,frm);box(c-ddw/2-0.04,ddh,za0-0.01,c+ddw/2+0.04,ddh+0.04,za1+0.01,frm)}
    else{const c=wdr.c;box(x0,0,za0,x1,wh,za1,wa.mat);box(xb0,0,zb0,xb1,wh,c-ddw/2,wbm.mat);box(xb0,0,c+ddw/2,xb1,wh,zb1,wbm.mat);box(xb0,ddh,c-ddw/2,xb1,wh,c+ddw/2,wbm.mat);
      box(xb0-0.01,0,c-ddw/2-0.04,xb1+0.01,ddh,c-ddw/2,frm);box(xb0-0.01,0,c+ddw/2,xb1+0.01,ddh,c+ddw/2+0.04,frm);box(xb0-0.01,ddh,c-ddw/2-0.04,xb1+0.01,ddh+0.04,c+ddw/2+0.04,frm)}
    const wh2=M(0xF6F7F4);const tx0=left?x0+0.12:x1-0.52,tzc=wdr.side?(back?z1-0.32:z0+0.32):(back?z1-0.32:z0+0.32);box(tx0,0,tzc-0.2,tx0+0.4,0.42,tzc+0.2,wh2);
    const tk=back?[tzc+0.12,tzc+0.3]:[tzc-0.3,tzc-0.12];box(tx0+0.02,0.42,tk[0],tx0+0.38,0.78,tk[1],wh2);
    const sxx=left?x0+0.05:x1-0.45;const szz=back?z0+0.1:z1-0.5;if(ww>1.1)box(sxx,0.8,szz,sxx+0.4,0.88,szz+0.4,wh2);
  }
  // kitchen counter (computed in user coordinates, mirrored like the rest)
  const kr=kitchenRect(l0);
  if(kr){const k=l0.kitchen;const X0=W-kr.x1,X1=W-kr.x0,Z0=kr.z0,Z1=kr.z1;const kh=k.h,top=0.04;const side=k.wall==='left'||k.wall==='right';
    box(X0+(side&&k.wall==='right'?0:0),0,Z0,X1,0.1,Z1,M(0x3E3A36));
    box(X0+0.01,0.1,Z0+0.01,X1-0.01,kh-top,Z1-0.01,M(0xE9E4DA));
    const fx=k.wall==='left'?X0:k.wall==='right'?X1:null;const fz=k.wall==='back'?Z0:k.wall==='front'?Z1:null;const doorM=M(0xCFC6B6);
    const nD=Math.max(1,Math.round(k.len/0.45));for(let i=0;i<nD;i++){const a=i/nD,b=(i+1)/nD;if(side){const za=Z0+(Z1-Z0)*a+0.015,zb=Z0+(Z1-Z0)*b-0.015;const xx=k.wall==='left'?X0-0.012:X1;box(xx,0.14,za,xx+0.012,kh-top-0.04,zb,doorM)}else{const xa=X0+(X1-X0)*a+0.015,xb=X0+(X1-X0)*b-0.015;const zz=k.wall==='back'?Z0-0.012:Z1;box(xa,0.14,zz,xb,kh-top-0.04,zz+0.012,doorM)}}
    box(X0-0.02,kh-top,Z0-0.02,X1+0.02,kh,Z1+0.02,M(0x7F8A8C));
    // sink (one end) and two-burner stove (other end), placed along the counter length
    const along=side?[Z0,Z1]:[X0,X1];const across=side?[X0,X1]:[Z0,Z1];const L0=along[0],L1=along[1];const cA=(across[0]+across[1])/2;const sinkL=Math.min(0.5,(L1-L0)*0.35),stoveL=Math.min(0.6,(L1-L0)*0.4);const half=Math.min(0.2,(across[1]-across[0])/2-0.06);
    const put=(a0,a1,c0,c1,y0,y1,mat)=>side?box(c0,y0,a0,c1,y1,a1,mat):box(a0,y0,c0,a1,y1,c1,mat);
    put(L0+0.08,L0+0.08+sinkL,cA-half,cA+half,kh-0.005,kh+0.004,M(0xB9C3C7));put(L0+0.12,L0+0.04+sinkL,cA-half+0.04,cA+half-0.04,kh+0.004,kh+0.008,M(0x6E7B80));
    put(L1-0.08-stoveL,L1-0.08,cA-half,cA+half,kh,kh+0.03,M(0x1E2224));
    for(const f of [0.27,0.73]){const p0=L1-0.08-stoveL+stoveL*f;put(p0-0.07,p0+0.07,cA-0.07,cA+0.07,kh+0.03,kh+0.036,M(0x55585A))}
    if(full)g.add(label(`Bếp ${f2(k.len)}×${f2(k.dep)}×${f2(k.h)}`,new T.Vector3((X0+X1)/2,kh+0.35,(Z0+Z1)/2),(Math.max(W,L)*0.075+0.12)*0.8));
  }
  // dimension lines + labels
  if(!full)return g;
  const lm=new T.LineBasicMaterial({color:0x0E6B5F});const line=(a,b)=>{const ge=new T.BufferGeometry().setFromPoints([new T.Vector3(...a),new T.Vector3(...b)]);g.add(new T.Line(ge,lm))};
  const o=0.35;line([0,0.01,-o],[W,0.01,-o]);line([0,0.01,-o-0.1],[0,0.01,-o+0.1]);line([W,0.01,-o-0.1],[W,0.01,-o+0.1]);
  line([-o,0.01,0],[-o,0.01,L]);line([-o-0.1,0.01,0],[-o+0.1,0.01,0]);line([-o-0.1,0.01,L],[-o+0.1,0.01,L]);
  line([W+o,0,L],[W+o,H,L]);
  const sc=Math.max(W,L)*0.075+0.12;
  g.add(label(`Rộng ${f2(W)} m`,new T.Vector3(W/2,0.05,-o-0.25),sc));g.add(label(`Dài ${f2(L)} m`,new T.Vector3(-o-0.25,0.05,L/2),sc));g.add(label(`Trần ${f2(H)} m`,new T.Vector3(W+o+0.1,H*0.6,L),sc));
  if(lo.on)g.add(label(`Gác +${f2(lo.h)} m`,new T.Vector3(W/2,lo.h+1.15,zE+0.1),sc));
  if(wc.on){const back=wc.corner.startsWith('back'),left=wc.corner.endsWith('left');g.add(label(`WC ${f2(wc.w)}×${f2(wc.d)}`,new T.Vector3(left?wc.w/2:W-wc.w/2,0.5,back?L-wc.d/2:wc.d/2),sc*0.85))}
  return g;
}
/* =========================== sơ đồ cả dãy trọ 3D =========================== */
// Hệ tọa độ: mặt đường ở z<0, đứng ngoài đường nhìn vào là nhìn theo +z, nên bên TRÁI người nhìn là +x.
// Lối đi (hoặc hành lang) chạy từ đường vào: x∈[0,cw]. Dãy A nằm bên trái lối đi (x>cw), dãy B bên phải (x<0).
// Vai trò mỗi phòng: một dãy: 'k' kiot | 'row' dãy phía sau; hai dãy: 'kl'/'kr' kiot trái/phải, 'l'/'r' dãy trái/phải.
function siteRoles(p,d){
  const two=d.mode==='two';const out={};const byFloor={};
  for(const r of p.rooms.slice().sort(byNo))(byFloor[r.floor||1]=byFloor[r.floor||1]||[]).push(r);
  for(const f of Object.keys(byFloor)){const up=+f>1;const auto=[];
    for(const r of byFloor[f]){let v=d.roles[r.id];
      if(two){if(v==='k')v='kl';if(v==='row')v=null;if(!['kl','kr','l','r'].includes(v))v=null}else{v=v==='k'||v==='kl'||v==='kr'?'k':'row'}
      if(up&&v){v=two?(v==='kl'?'l':v==='kr'?'r':v):'row'}
      if(v)out[r.id]=v;else auto.push(r)}
    // Hai dãy, phòng chưa chọn bên: nửa đầu bên trái, nửa sau bên phải.
    auto.forEach((r,i)=>{out[r.id]=i<Math.ceil(auto.length/2)?'l':'r'})}
  return out;
}
let uSiteT=null;
function updateSiteFromDraft(){clearTimeout(uSiteT);uSiteT=setTimeout(()=>{const sh=topSheet();if(!sh||sh.type!=='site')return;
  const info=document.getElementById('site-info');if(info)info.innerHTML=siteInfoHTML(S.props[sh.params.pid],sh.draft);
  if(window.THREE&&R3.renderer&&R3.el&&document.body.contains(R3.el))buildSite(S.props[sh.params.pid],sh.draft,false)},150)}
// Tính vị trí từng phòng (dùng cho cả vẽ 3D và phần tóm tắt).
function siteLayout(p,d){
  const TW=0.1,cw=Math.max(0.6,+d.cw||1.2),two=d.mode==='two';const roles=siteRoles(p,d);
  const rooms=p.rooms.slice().sort(byNo);const floors=[...new Set(rooms.map(r=>r.floor||1))].sort((a,b)=>a-b);
  const band=role=>two?(role==='l'||role==='kl'?'A':'B'):(d.side==='left'?'B':'A');
  const out=[];const floorY={};let y=0;let maxZ=0,minX=0,maxX=cw;const walkEnd={};
  for(const f of floors){
    floorY[f]=y;const fr=rooms.filter(r=>(r.floor||1)===f);let hMax=2.5;
    const z={A:0,B:0},kx={A:cw,B:0};
    for(const r of fr){const role=roles[r.id];if(!role.startsWith('k'))continue;const l=roomLayout(p,r);const b=band(role);hMax=Math.max(hMax,l.H);
      const x=b==='A'?kx.A+TW:kx.B-l.W-TW;kx[b]+=b==='A'?l.W+2*TW:-(l.W+2*TW);
      out.push({room:r,l,kind:'kiosk',band:b,rot:0,pos:[x,y,TW],x0:x-TW,x1:x+l.W+TW,z0:0,z1:l.L+2*TW});z[b]=Math.max(z[b],l.L+2*TW+(two?0:0))}
    for(const r of fr){const role=roles[r.id];if(role.startsWith('k'))continue;const l=roomLayout(p,r);const b=band(role);hMax=Math.max(hMax,l.H);const zc=z[b];
      if(b==='A')out.push({room:r,l,kind:'row',band:b,rot:Math.PI/2,pos:[cw+TW,y,zc+l.W+TW],x0:cw,x1:cw+l.L+2*TW,z0:zc,z1:zc+l.W+2*TW});
      else out.push({room:r,l,kind:'row',band:b,rot:-Math.PI/2,pos:[-TW,y,zc+TW],x0:-l.L-2*TW,x1:0,z0:zc,z1:zc+l.W+2*TW});
      z[b]=zc+l.W+2*TW}
    walkEnd[f]=Math.max(z.A,z.B,1);y+=hMax+0.2;
  }
  for(const o of out){minX=Math.min(minX,o.x0);maxX=Math.max(maxX,o.x1);maxZ=Math.max(maxZ,o.z1)}
  return{items:out,floors,floorY,walkEnd,cw,two,minX,maxX,maxZ,height:y,roles};
}
function siteInfoHTML(p,d){const s=siteLayout(p,d);const k=s.items.filter(o=>o.kind==='kiosk').length;const W=s.maxX-s.minX,D=s.maxZ;
  return`<div class="kpis" style="margin-top:0"><div class="kpi"><small>Mặt tiền</small><b>${f2(W)} m</b></div><div class="kpi"><small>Chiều sâu</small><b>${f2(D)} m</b></div><div class="kpi"><small>Kiot</small><b>${k}</b></div></div><p class="small muted" style="margin:6px 0 0">Đo theo mép tường ngoài, chưa tính khoảng lùi, tường rào. ${s.floors.length>1?s.floors.length+' tầng. ':''}${s.two?'Hành lang':'Lối đi'} rộng ${f2(s.cw)} m.</p>`}
function buildSite(p,d,fresh){
  const T=THREE;if(R3.group){R3.scene.remove(R3.group);disposeGroup(R3.group)}
  const g=new T.Group();R3.group=g;R3.walls=[];
  const s=siteLayout(p,d);const M=(c,o={})=>new T.MeshLambertMaterial(Object.assign({color:c},o));
  const box=(x0,y0,z0,x1,y1,z1,mat)=>{const sx=Math.abs(x1-x0),sy=Math.abs(y1-y0),sz=Math.abs(z1-z0);if(sx<0.001||sy<0.001||sz<0.001)return;const m=new T.Mesh(new T.BoxGeometry(sx,sy,sz),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);g.add(m)};
  const span=Math.max(s.maxX-s.minX,s.maxZ,s.height,4);const sc=span*0.06+0.45;
  // mặt đường, vỉa hè, nền đất
  const ex=2;box(s.minX-ex,-0.12,-5.2,s.maxX+ex,-0.06,-0.6,M(0x5E6366));box(s.minX-ex,-0.1,-0.6,s.maxX+ex,-0.02,0,M(0xC9C4BA));
  for(let x=s.minX-ex+0.5;x<s.maxX+ex-1;x+=2.4)box(x,-0.06,-2.95,x+1.2,-0.055,-2.85,M(0xF2F2EE));
  box(s.minX-ex,-0.14,0,s.maxX+ex,-0.09,s.maxZ+1.2,M(0xB9C2A8));
  g.add(label('Mặt đường',new T.Vector3((s.minX+s.maxX)/2,0.15,-3.6),sc));
  // lối đi / hành lang từng tầng
  for(const f of s.floors){const y=s.floorY[f];const zEnd=s.walkEnd[f];
    if(f===s.floors[0])box(0,-0.09,-0.6,s.cw,-0.01,zEnd,M(0xD9D4C8));
    else{box(0,y-0.18,0,s.cw,y,zEnd,M(0xCFC9BC));const st=M(0x3B4542);
      const rails=s.two?[]:[(d.side==='left'?s.cw-0.03:0.03)];
      for(const rx of rails){box(rx-0.02,y+0.95,0,rx+0.02,y+1.0,zEnd,st);for(let zz=0;zz<=zEnd;zz+=1.2)box(rx-0.02,y,zz,rx+0.02,y+1,zz+0.04,st)}}
    g.add(label(`${s.two?'Hành lang':'Lối đi'} ${f2(s.cw)} m${s.floors.length>1?' · tầng '+f:''}`,new T.Vector3(s.cw/2,y+0.25,Math.min(zEnd*0.5,zEnd-0.5)),sc*0.8))}
  // các phòng
  for(const o of s.items){const walls=[];const rg=roomGroup(o.l,walls,false);const par=new T.Group();par.add(rg);par.rotation.y=o.rot;par.position.set(...o.pos);g.add(par);par.updateMatrixWorld(true);
    for(const w of walls){w.center.applyMatrix4(par.matrixWorld);w.normal.applyQuaternion(par.quaternion);R3.walls.push(w)}
    const cx=(o.x0+o.x1)/2,cz=(o.z0+o.z1)/2;
    g.add(label(`${o.kind==='kiosk'?'Kiot ':'P.'}${o.room.no}`,new T.Vector3(cx,o.pos[1]+o.l.H+0.45,cz),sc));
    if(o.kind==='kiosk')box(o.x0+0.2,o.pos[1]+Math.min(o.l.H-0.1,2.9),-0.45,o.x1-0.2,o.pos[1]+Math.min(o.l.H-0.1,2.9)+0.08,0,M(0x0E6B5F));}
  R3.scene.add(g);
  R3.target.set((s.minX+s.maxX)/2,Math.min(s.height*0.3,2),s.maxZ/2-0.8);R3.span=span;R3.minR=span*0.25;R3.maxR=span*4;
  if(fresh){R3.theta=-2.0;R3.phi=0.95;R3.radius=span*1.5}
  R3.dirty=true;
}
function label(text,pos,scale){
  const T=THREE;const c=document.createElement('canvas');const x=c.getContext('2d');const fs=44;const font=`600 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`;x.font=font;
  const w=Math.ceil(x.measureText(text).width)+36;c.width=w;c.height=fs+28;x.font=font;x.fillStyle='rgba(255,255,255,0.94)';
  const r=16;x.beginPath();x.moveTo(r,0);x.lineTo(w-r,0);x.quadraticCurveTo(w,0,w,r);x.lineTo(w,c.height-r);x.quadraticCurveTo(w,c.height,w-r,c.height);x.lineTo(r,c.height);x.quadraticCurveTo(0,c.height,0,c.height-r);x.lineTo(0,r);x.quadraticCurveTo(0,0,r,0);x.fill();
  x.strokeStyle='rgba(14,107,95,0.5)';x.lineWidth=3;x.stroke();x.fillStyle='#13211D';x.textBaseline='middle';x.fillText(text,18,c.height/2+2);
  const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
  const h=scale*0.5;s.scale.set(h*c.width/c.height,h,1);s.position.copy(pos);s.renderOrder=10;return s;
}

/* =========================== v2: shared helpers =========================== */
const ARTIFACT_URL='https://claude.ai/artifact/VvJjq7PkWZncr7YpEu73R1';
const LS_TENANT='sotro.tenant.v1';
const EXP_CATS=['Sửa chữa','Điện nước chung','Internet','Vệ sinh, rác','Thuế, phí','Khác'];
const assetUrl=id=>'/_blob/'+encodeURIComponent(id);
function normTenant(t){if(t.dob==null)t.dob='';if(t.gender==null)t.gender='';if(t.home==null)t.home='';if(!Array.isArray(t.members))t.members=[];if(t.portal==null)t.portal='';return t}
function normProp(p){if(!p)return p;p.owner=Object.assign({name:'',phone:'',cccd:'',address:''},p.owner||{});if(p.readDay==null)p.readDay=1;if(p.terms==null)p.terms='';if(p.equipment==null)p.equipment='';if(!Array.isArray(p.closedPortals))p.closedPortals=[];normLayout(p.layout);if(!Array.isArray(p.designs))p.designs=[];p.designs.forEach(d=>normLayout(d.layout));p.site=normSite(p.site);
  for(const r of p.rooms||[]){if(r.tenant)normTenant(r.tenant);if(r.layout)normLayout(r.layout);if(r.design&&!designOf(p,r.design))r.design=null}return p}
function normSite(s){s=s||{};const cw=toNum(s.cw);return{mode:s.mode==='two'?'two':'one',side:s.side==='left'?'left':'right',cw:cw==null?1.2:clamp(cw,0.6,6),roles:Object.assign({},s.roles||{})}}
const normCode=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const fmtCode=t=>String(t||'').toUpperCase().slice(0,5)+'-'+String(t||'').toUpperCase().slice(5);
function newToken(){const a='abcdefghjkmnpqrstuvwxyz23456789';const b=new Uint32Array(10);crypto.getRandomValues(b);return[...b].map(x=>a[x%a.length]).join('')}
const meterName=f=>f==='e'?'Điện':f==='w'?'Nước giếng':'Nước máy';

/* =========================== capabilities: sample (read photo) + assets (store photo) =========================== */
async function initCaps(use){
  try{
    const [s,a]=await Promise.all([use('sample').catch(()=>null),use('assets').catch(()=>null)]);
    caps.sample=s;caps.assets=a;
    if(s){try{const l=await s.limits();caps.imgOK=!!(l&&l.images)}catch(e){caps.imgOK=false}}
    if(s||a)requestRender();
  }catch(e){}
}
function camBtn(pid,m,key,f,r){const has=r.photos&&r.photos[f];return`<label class="cam ${has?'has':''}" title="Chụp hoặc chọn ảnh đồng hồ" aria-label="${has?'Đổi ảnh':'Chụp hoặc chọn ảnh'} đồng hồ ${meterName(f)}">${ic('camera',18)}<input type="file" accept="image/*" hidden data-ch="meterPhoto" data-pid="${pid}" data-m="${m}" data-key="${esc(key)}" data-f="${f}"></label>`}
function photoInput(attrs,capture,multiple){return`<input type="file" accept="image/*" ${capture?'capture="environment"':''} ${multiple?'multiple':''} hidden ${attrs}>`}
// Hai nút nhỏ dưới ảnh: chụp lại bằng máy ảnh, hoặc chọn ảnh có sẵn trong máy.
function photoRedo(attrs){return`<div class="photo-redo"><label class="btn sm">${ic('camera',16)}Chụp lại${photoInput(attrs,true)}</label><label class="btn sm">${ic('img',16)}Chọn ảnh khác${photoInput(attrs)}</label></div>`}
function photoThumbs(ph,ctx){const e=Object.entries(ph||{}).filter(([,id])=>id);if(!e.length)return'';const c=ctx?`data-pid="${ctx.pid}" data-m="${ctx.m}" data-key="${esc(ctx.key)}"`:'';return`<div class="thumbs">${e.map(([f,id])=>`<button data-act="viewPhoto" data-id="${esc(id)}" data-f="${f}" ${c}><img ${phSrc(id)} alt="Ảnh đồng hồ ${meterName(f)}" loading="lazy" onerror="this.style.visibility='hidden'"><span>${meterName(f)}</span></button>`).join('')}</div>`}
async function shrink(file,max=1600){
  const url=URL.createObjectURL(file);
  try{const img=new Image();img.src=url;await img.decode();const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*s);c.height=Math.round(img.naturalHeight*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/jpeg',0.85))}
  finally{URL.revokeObjectURL(url)}
}
async function handleMeterPhoto(el){
  const file=el.files&&el.files[0];const {pid,m,key}=el.dataset;const f=el.dataset.f;el.value='';if(!file)return;
  const r=rowOf(pid,m,key);if(!r)return;
  let blob;try{blob=await shrink(file)}catch(e){toast('Không mở được ảnh này, hãy chụp lại.');return}
  const top=topSheet();if(top&&top.type==='meter'){try{URL.revokeObjectURL(top.params.url)}catch(e){}ui.sheets.pop()}
  const st={pid,m,key,f,url:URL.createObjectURL(blob),blob,state:readEngine()?'reading':'manual',engine:readEngine(),conf:'',note:'',photoId:null,upload:'none',applied:false};
  push('meter',st,{value:r[f+'1']});const sh=topSheet();
  storePhoto(st,()=>{if(topSheet()===sh)requestRender()});
  if(readEngine())readMeter(sh);
}
// Lưu ảnh làm bằng chứng: vào kho ảnh của Claude nếu có, nếu không thì lưu ngay trên máy này.
function storePhoto(st,done){
  st.where=caps.assets?'cloud':'local';st.upload='uploading';
  const p=caps.assets?caps.assets.upload(st.blob).then(res=>res.id):localPhotoSave(st.blob);
  return p.then(id=>{st.photoId=id;st.upload='done';if(st.applied)attachPhoto(st)}).catch(()=>{st.upload='fail'}).then(()=>{if(done)done()});
}
function attachPhoto(st){const r=rowOf(st.pid,st.m,st.key);if(!r||!st.photoId)return;const old=r.photos&&r.photos[st.f];r.photos=Object.assign({},r.photos||{},{[st.f]:st.photoId});persist('b',billKey(st.pid,st.m));if(old&&old!==st.photoId)dropLocalPhoto(old)}
const uploadText=st=>({uploading:'Đang lưu ảnh làm bằng chứng…',done:st.where==='local'?'Đã lưu ảnh trên máy này, ảnh sẽ kèm trong hóa đơn.':'Đã lưu ảnh, ảnh sẽ kèm trong hóa đơn và trang người thuê.',fail:'Không lưu được ảnh. Chỉ số vẫn được ghi.',none:''})[st.upload]||'';
const meterFields=r=>{const pr=r.prices||{};return['e'].concat(pr.waterMode!=='person'&&pr.well>0?['w']:[],pr.waterMode!=='person'&&pr.city>0?['c']:[])};

/* =========================== ảnh đồng hồ lưu trên máy (IndexedDB) =========================== */
// Ảnh không nằm trong localStorage (quá nhỏ) mà trong IndexedDB, mã ảnh bắt đầu bằng "l_".
const isLocalPh=id=>typeof id==='string'&&id.startsWith('l_');
let phDbP=null;const phUrls=new Map();
function phDb(){if(!phDbP)phDbP=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('Không có IndexedDB'));const q=indexedDB.open('sotro-photos',1);q.onupgradeneeded=()=>q.result.createObjectStore('photos');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}).catch(e=>{phDbP=null;throw e});return phDbP}
function phTx(mode,fn){return phDb().then(db=>new Promise((res,rej)=>{const t=db.transaction('photos',mode);const rq=fn(t.objectStore('photos'));let out;if(rq)rq.onsuccess=()=>{out=rq.result};t.oncomplete=()=>res(out);t.onerror=t.onabort=()=>rej(t.error)}))}
const phPut=(id,v)=>phTx('readwrite',st=>st.put(v,id));
const phGet=id=>phTx('readonly',st=>st.get(id));
const phDel=id=>phTx('readwrite',st=>st.delete(id));
const phKeys=()=>phTx('readonly',st=>st.getAllKeys());
let askedPersist=false;
async function localPhotoSave(blob){
  // Lưu dạng ArrayBuffer cho chắc chắn trên Safari đời cũ.
  const id='l_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  await phPut(id,{buf:await blob.arrayBuffer(),type:blob.type||'image/jpeg',at:Date.now()});
  if(!askedPersist){askedPersist=true;try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
  return id;
}
async function photoURL(id){
  if(!isLocalPh(id))return assetUrl(id);
  if(phUrls.has(id))return phUrls.get(id);
  const v=await phGet(id).catch(()=>null);if(!v)return null;
  const u=URL.createObjectURL(new Blob([v.buf],{type:v.type||'image/jpeg'}));phUrls.set(id,u);return u;
}
async function photoBlob(id){
  if(isLocalPh(id)){const v=await phGet(id);return v?new Blob([v.buf],{type:v.type||'image/jpeg'}):null}
  const r=await fetch(assetUrl(id));return r.ok?await r.blob():null;
}
// Thuộc tính src cho thẻ <img>: ảnh trên máy được nạp sau khi vẽ (xem hydratePhotos).
function phSrc(id){if(!isLocalPh(id))return`src="${assetUrl(id)}"`;const u=phUrls.get(id);return u?`src="${u}"`:`data-lph="${esc(id)}"`}
function hydratePhotos(){document.querySelectorAll('img[data-lph]').forEach(img=>{const id=img.dataset.lph;img.removeAttribute('data-lph');photoURL(id).then(u=>{if(u)img.src=u;else img.style.visibility='hidden'})})}
function dropLocalPhoto(id){if(!isLocalPh(id))return;const u=phUrls.get(id);if(u){URL.revokeObjectURL(u);phUrls.delete(id)}phDel(id).catch(()=>{})}
function photoRefs(){const ids=new Set();for(const b of Object.values(S.bills||{}))for(const r of Object.values((b&&b.rooms)||{}))for(const id of Object.values(r.photos||{}))if(id)ids.add(id);return ids}
// Xóa ảnh không còn hóa đơn nào dùng (chụp rồi bỏ, ảnh đã thay), chỉ xóa ảnh cũ hơn 1 ngày.
async function cleanLocalPhotos(){
  if(mode!=='local')return;
  try{const refs=photoRefs();const keys=await phKeys();const now=Date.now();
    for(const k of keys){if(refs.has(k))continue;const t=parseInt(String(k).slice(2).split('_')[0],36);if(t&&now-t>864e5)await phDel(k)}}catch(e){}
}
async function readMeter(sh){
  const st=sh.params;const r=rowOf(st.pid,st.m,st.key);const prev=r?r[st.f+'0']:null;const eng=readEngine();st.engine=eng;if(!eng)return;
  try{
    const out=eng==='claude'?await caps.sample.json(meterPrompt(st.f,prev),{images:[st.blob],modelTier:'default'})
      :eng==='api'?await readViaApi(st.blob,meterPrompt(st.f,prev))
      :await readViaOcr(st.blob,prev,r?avgUse(st.pid,st.m,st.key,st.f):null,st.f);
    const v=out&&typeof out.reading==='number'&&isFinite(out.reading)?out.reading:null;
    st.state=v==null?'fail':'done';st.conf=(out&&out.confidence)||'';st.note=(out&&typeof out.note==='string')?out.note:'';
    if(v!=null&&sh.draft&&!st.typed&&sh.params===st)sh.draft.value=v;
  }catch(e){
    st.state='fail';
    st.note=({not_granted:'Bạn chưa cho phép gửi ảnh cho Claude.',rate_limited:'Đang đọc quá nhiều ảnh, thử lại sau ít phút.',image_rejected:'Ảnh không hợp lệ, hãy chụp lại.',images_unavailable:'Chế độ xem này không gửi được ảnh.',invalid_json:'Không đọc rõ được số.',refused:'Không đọc được ảnh này.',
      bad_key:'Khóa API Claude không đúng hoặc đã bị thu hồi, kiểm tra ở Thiết lập › Đọc số trên ảnh.',no_credit:'Tài khoản Claude API hết tiền hoặc khóa không dùng được.',api_error:'Máy chủ Claude đang lỗi, thử lại sau.',
      offline:'Không kết nối được. Kiểm tra mạng.',ocr_load:'Không tải được bộ đọc số (cần mạng lần đầu).'})[e&&e.code]||'Không đọc được số tự động.';
  }
  if(topSheet()===sh&&sh.params===st){const keep=document.activeElement&&document.activeElement.id==='meter-val';if(keep)renderMeterStatus(sh);else render()}
}
function meterPrompt(f,prev){const kind=f==='e'?'electricity meter (kWh)':'water meter (m³)';
  return`Read the cumulative reading on this ${kind}, photographed at a Vietnamese boarding house.
The previous month's reading was ${prev}. The new reading is normally equal to or somewhat higher than that.
Rules: read the main register (the row of number wheels, or the LCD total). Ignore digits that are red, inside a red frame, or after a decimal point, and return only the whole-number part. Ignore serial numbers, model text and small dials. If a wheel is between two digits, take the lower digit.
Reply with only JSON like {"reading": 12345, "confidence": "high", "note": ""}. "confidence" is "high", "medium" or "low". "note" is a short note in Vietnamese when the photo is blurry, has glare, or a digit is mid-roll; otherwise "". If there is no readable meter, reply {"reading": null, "confidence": "low", "note": "<lý do bằng tiếng Việt>"}.`}

/* =========================== tự đọc số: Claude API (khóa của chủ trọ) và bộ đọc chạy trên máy =========================== */
// Thứ tự: Claude trong app Claude > Claude API nếu đã nhập khóa > bộ đọc chữ Tesseract.js chạy ngay trên điện thoại (miễn phí).
const LS_KEY='sotro.claudeKey';
function getApiKey(){try{return(localStorage.getItem(LS_KEY)||'').trim()}catch(e){return''}}
function setApiKey(k){try{k?localStorage.setItem(LS_KEY,k):localStorage.removeItem(LS_KEY)}catch(e){}}
const autoReadOn=()=>S.settings.autoRead!==false;
function readEngine(){if(!autoReadOn())return null;if(caps.imgOK)return'claude';if(window.claude)return null;return getApiKey()?'api':'ocr'}
const ENGINE_NAME={claude:'Claude (trong app Claude)',api:'Claude API, dùng khóa của bạn',ocr:'Bộ đọc trên máy (miễn phí)'};

const SDK_URL='https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
let sdkP=null;
function loadSdk(){if(!sdkP)sdkP=import(SDK_URL).then(m=>m.default||m.Anthropic).catch(e=>{sdkP=null;throw e});return sdkP}
const READ_SCHEMA={type:'object',properties:{reading:{anyOf:[{type:'number'},{type:'null'}]},confidence:{type:'string',enum:['high','medium','low']},note:{type:'string'}},required:['reading','confidence','note'],additionalProperties:false};
async function readViaApi(blob,prompt){
  let Anthropic;try{Anthropic=await loadSdk()}catch(e){throw{code:'offline'}}
  const client=new Anthropic({apiKey:getApiKey(),dangerouslyAllowBrowser:true,maxRetries:1});
  let res;
  try{
    res=await client.beta.messages.create({
      model:'claude-opus-5-5',max_tokens:16000,
      output_config:{effort:'medium',format:{type:'json_schema',schema:READ_SCHEMA}},
      // Nếu bị từ chối vì bộ lọc an toàn, máy chủ tự chuyển sang mẫu dự phòng.
      betas:['server-side-fallback-2026-07-01'],fallbacks:'default',
      messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:blob.type||'image/jpeg',data:await blobToBase64(blob)}},{type:'text',text:prompt}]}]
    });
  }catch(e){
    if(e instanceof Anthropic.AuthenticationError||e instanceof Anthropic.PermissionDeniedError)throw{code:'bad_key'};
    if(e instanceof Anthropic.RateLimitError)throw{code:'rate_limited'};
    if(e instanceof Anthropic.BadRequestError)throw{code:/credit|billing|balance/i.test(String(e.message))?'no_credit':'image_rejected'};
    if(e instanceof Anthropic.APIConnectionError)throw{code:'offline'};
    if(e instanceof Anthropic.APIError)throw{code:'api_error'};
    throw e;
  }
  if(res.stop_reason==='refusal')throw{code:'refused'};
  const t=res.content.find(b=>b.type==='text');
  try{return JSON.parse(t.text)}catch(e){throw{code:'invalid_json'}}
}

const OCR={js:'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js',worker:'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',core:'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',lang:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int'};
let ocrP=null;
function ocrWorker(){
  if(!ocrP)ocrP=(async()=>{
    await loadScript(OCR.js);
    const w=await Tesseract.createWorker('eng',1,{workerPath:OCR.worker,corePath:OCR.core,langPath:OCR.lang});
    await w.setParameters({tessedit_char_whitelist:'0123456789',tessedit_pageseg_mode:'11'});
    return w;
  })().catch(e=>{ocrP=null;throw e});
  return ocrP;
}
// Ảnh xám, kéo giãn tương phản; crop<1 là cắt lấy phần giữa ảnh (thường là ô số khi chụp gần).
async function ocrCanvas(blob,crop){
  const url=URL.createObjectURL(blob);
  try{const img=new Image();img.src=url;await img.decode();
    const sw=img.naturalWidth*crop,sh=img.naturalHeight*crop,sc=Math.min(2,1600/Math.max(sw,sh));
    const c=document.createElement('canvas');c.width=Math.round(sw*sc);c.height=Math.round(sh*sc);const x=c.getContext('2d');
    x.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,0,c.width,c.height);
    const d=x.getImageData(0,0,c.width,c.height),a=d.data;let lo=255,hi=0;
    for(let i=0;i<a.length;i+=4){const g=a[i]*.299+a[i+1]*.587+a[i+2]*.114;a[i]=g;if(g<lo)lo=g;if(g>hi)hi=g}
    const k=255/Math.max(1,hi-lo);for(let i=0;i<a.length;i+=4){const g=(a[i]-lo)*k;a[i]=a[i+1]=a[i+2]=g}
    x.putImageData(d,0,0);return c;
  }finally{URL.revokeObjectURL(url)}
}
// Các dãy số đọc được, kèm cách bỏ 1-4 chữ số cuối (bánh xe số lẻ màu đỏ, đồng hồ nước thường có 3-4 bánh, hay bị đọc lẫn vào).
function ocrCandidates(text,conf){
  const out=[];
  for(const line of String(text).split('\n')){
    const groups=line.trim().split(/\s+/).filter(g=>/^\d+$/.test(g));if(!groups.length)continue;
    const strs=new Set(groups);if(groups.length>1)strs.add(groups.join(''));
    for(const s of strs){if(s.length<2||s.length>9)continue;out.push({s,v:parseInt(s,10),conf,cut:0});
      for(const cut of[1,2,3,4])if(s.length-cut>=2)out.push({s:s.slice(0,-cut),v:parseInt(s.slice(0,-cut),10),conf,cut})}
  }
  return out;
}
// Chọn số hợp lý nhất: không nhỏ hơn số cũ, mức dùng gần mức trung bình các tháng trước.
function pickReading(cands,prev,avg,f){
  if(!cands.length)return null;
  if(prev==null){const b=cands.filter(c=>!c.cut).sort((a,b)=>b.s.length-a.s.length||b.conf-a.conf)[0];return b?{c:b,score:0}:null}
  const exp=avg&&avg>0?avg:(f==='e'?150:10);const hi=prev+Math.max(exp*6,f==='e'?1500:150);
  let best=null;
  for(const c of cands){if(c.v<prev||c.v>hi)continue;
    const score=c.conf/100-Math.abs((c.v-prev)-exp)/(exp*6+1)-c.cut*0.2;
    if(!best||score>best.score)best={c,score}}
  return best;
}
async function readViaOcr(blob,prev,avg,f){
  let w;try{w=await ocrWorker()}catch(e){throw{code:'ocr_load'}}
  let all=[],best=null;
  for(const crop of[1,0.6,0.4]){
    const {data}=await w.recognize(await ocrCanvas(blob,crop));
    all=all.concat(ocrCandidates(data.text,data.confidence||0));best=pickReading(all,prev,avg,f);
    if(best&&best.c.conf>=70&&!best.c.cut)break;
  }
  if(!best)return{reading:null,confidence:'low',note:prev==null?'Không thấy dãy số nào trên ảnh.':'Không đọc chắc được số trên ảnh.'};
  return{reading:best.c.v,confidence:best.c.conf>=75&&!best.c.cut&&best.score>0.4?'medium':'low',note:''};
}
function renderMeterStatus(sh){const el=document.getElementById('meter-status');if(el)el.innerHTML=meterStatus(sh.params)}
function meterStatus(st){
  if(st.state==='reading')return`<div class="banner" style="background:var(--accent-soft);color:var(--accent);margin:0">${ic('refresh',18)}<span>${st.engine==='ocr'?'Đang đọc số trên máy… Lần đầu cần mạng để tải bộ đọc (khoảng 5 MB).':'Claude đang đọc số trên ảnh, thường mất 10–40 giây…'}</span></div>`;
  if(st.state==='done'){const hi=st.conf==='high';return`<div class="banner" style="background:var(--${hi?'ok':'warn'}-soft);color:var(--${hi?'ok':'warn'});margin:0">${ic(hi?'check':'alert',18)}<span>${st.engine==='ocr'?'Đã điền số đọc được vào ô Chỉ số mới. Bộ đọc trên máy có thể nhầm, so kỹ với ảnh trước khi lưu.':hi?'Đã đọc được số và điền vào ô Chỉ số mới. So lại với ảnh trước khi lưu.':'Đã điền số đọc được nhưng chưa chắc chắn, hãy so kỹ với ảnh.'}${st.note?' '+esc(st.note):''}</span></div>`}
  if(st.state==='fail')return`<div class="banner" style="margin:0">${ic('alert',18)}<span>${esc(st.note||'Không đọc được số tự động.')} Nhập số bạn thấy trên ảnh.</span></div>`;
  return`<p class="small muted">Nhập số bạn thấy trên ảnh. Ảnh được lưu kèm hóa đơn làm bằng chứng.</p>`;
}
function avgUse(pid,m,key,f){const h=[];for(let i=1;i<=3;i++){const pr=rowOf(pid,addMonth(m,-i),key);if(pr&&pr[f+'1']!=null)h.push(pr[f+'1']-pr[f+'0'])}return h.length?h.reduce((a,b)=>a+b,0)/h.length:null}
function meterInfo(st,v){
  const r=rowOf(st.pid,st.m,st.key);if(!r)return'';const old=r[st.f+'0'];const unit=st.f==='e'?'kWh':'m³';
  if(v==null)return`Số cũ: ${num(old)} ${unit}`;
  const u=Math.round((v-old)*100)/100;const avg=avgUse(st.pid,st.m,st.key,st.f);let w='';
  if(u<0)w=`<b style="color:var(--bad)">Số mới nhỏ hơn số cũ, kiểm tra lại.</b>`;
  else if(avg&&avg>=5&&u>avg*3)w=`<b style="color:var(--warn)">Cao gấp ${f2(u/avg)} lần trung bình. Kiểm tra lại số trước khi tính tiền.</b>`;
  else if(avg&&avg>=20&&u<avg*0.4)w=`<b style="color:var(--warn)">Thấp bất thường so với các tháng trước.</b>`;
  return`Số cũ ${num(old)} → dùng <b>${num(u)} ${unit}</b>${avg!=null?` · trung bình 3 tháng ${num(Math.round(avg))} ${unit}`:''}${w?'<br>'+w:''}`;
}
function updateMeterInfo(sh){sh.params.typed=true;const el=document.getElementById('meter-info');if(el)el.innerHTML=meterInfo(sh.params,sh.draft.value)}

/* =========================== reminders (phone) =========================== */
function nextDay(day){const today=todayISO();let m=curMonth();let d=`${m}-${pad(Math.min(day,daysInMonth(m)))}`;if(d<today){m=addMonth(m,1);d=`${m}-${pad(Math.min(day,daysInMonth(m)))}`}return d}
function buildReminders(includeDemo){
  const today=todayISO();const items=[];
  for(const p of Object.values(S.props)){
    if(p.demo&&!includeDemo)continue;
    for(const k of [0,1]){const m=addMonth(curMonth(),k);const date=`${m}-${pad(Math.min(p.readDay||1,daysInMonth(m)))}`;if(date<today)continue;items.push({kind:'read',date,notify:[addDays(date,-1),date].filter(x=>x>=today),pid:p.id,prop:p.name,text:`Chốt số điện nước ${p.name}`})}
    const due=`${curMonth()}-${pad(clamp(p.dueDay||5,1,28))}`;const unpaid=[];let amt=0;
    for(const r of p.rooms){const d=tenantDebt(p,r);if(d>0){unpaid.push(r.no);amt+=d}}
    if(unpaid.length&&addDays(due,3)>=today)items.push({kind:'due',date:due,notify:[due,addDays(due,3)].filter(x=>x>=today),pid:p.id,prop:p.name,text:`${p.name}: ${unpaid.length} phòng chưa đóng đủ tiền (${unpaid.join(', ')}), tổng ${money(amt)}`});
    for(const r of p.rooms){const t=r.tenant;if(!t||!t.endDate)continue;const marks=[30,14,7,3,1,0].map(n=>addDays(t.endDate,-n));for(let i=1;i<=7;i++)marks.push(addDays(t.endDate,i));const nf=marks.filter(x=>x>=today);if(!nf.length)continue;
      items.push({kind:'end',date:t.endDate,notify:nf,pid:p.id,prop:p.name,room:r.no,text:`Phòng ${r.no} – ${p.name}: ${t.name} ${t.endDate<today?'đã quá hạn trả phòng từ':'hết hạn thuê ngày'} ${dmy(t.endDate)}`})}
  }
  return items.sort((a,b)=>a.date.localeCompare(b.date));
}
function gcal(title,date,details,rrule){const d=date.replace(/-/g,'');const n=addDays(date,1).replace(/-/g,'');return'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+d+'/'+n+'&details='+encodeURIComponent(details||'')+(rrule?'&recur='+encodeURIComponent('RRULE:'+rrule):'')}

/* =========================== background sync: reminders doc + tenant pages =========================== */
let auxT=null,auxBusy=null,lastRem='';const portalSent={};
function scheduleAux(){if(mode!=='cloud'||!cloudLoaded)return;clearTimeout(auxT);auxT=setTimeout(runAux,1500)}
function portalWant(){
  const want={};
  for(const p of Object.values(S.props)){
    for(const tok of p.closedPortals||[])want[tok]={v:1,closed:true,prop:{name:p.name}};
    for(const room of p.rooms){for(const h of room.history||[])if(h.portal)want[h.portal]={v:1,closed:true,prop:{name:p.name},room:{no:room.no}};if(room.tenant&&room.tenant.portal)want[room.tenant.portal]=portalPayload(p,room,room.tenant)}
  }
  return want;
}
function portalPayload(p,room,t){
  const key=room.id+':'+t.id;const bank=BANKS.find(b=>b[0]===p.bank.bin);
  const ms=Object.values(S.bills).filter(b=>b.pid===p.id&&b.rooms[key]).map(b=>b.month).sort().reverse().slice(0,12);
  return{v:1,prop:{name:p.name,address:p.address||'',owner:p.owner.name||'',phone:p.owner.phone||''},
    bank:bank&&p.bank.acct?{bin:p.bank.bin,name:bank[1],acct:p.bank.acct,holder:p.bank.holder}:null,
    room:{no:room.no,rent:room.rent||0},tenant:{name:t.name,moveIn:t.moveIn,endDate:t.endDate||'',people:t.people||1,deposit:t.deposit||0},
    bills:ms.map(m=>{const r=rowOf(p.id,m,key);const c=rowCalc(p.id,m,key);return{month:m,items:c.items.map(i=>({label:i.label,amount:i.amount,detail:i.detail||'',miss:!!i.miss})),total:c.total,paid:c.paid,complete:c.complete,status:c.status,due:dueDate(p,m),ref:payRef(r,m),photos:r.photos||{}}})};
}
async function runAux(){
  if(mode!=='cloud'||!col)return;
  if(auxBusy){await auxBusy;return runAux()}
  let done;auxBusy=new Promise(r=>done=r);
  try{
    const rem={tz:'Asia/Bangkok',items:buildReminders(false)};const js=JSON.stringify(rem);
    if(js!==lastRem){await col.doc('reminders').set(Object.assign({updatedAt:new Date().toISOString(),about:'Sổ Trọ: lịch nhắc cho thông báo hằng ngày'},rem));lastRem=js}
    if(dbRef){for(const [tok,body] of Object.entries(portalWant())){const j=JSON.stringify(body);if(portalSent[tok]===j)continue;await dbRef.doc(`portal/${tok}/v/data`).set(Object.assign({updatedAt:new Date().toISOString()},body));portalSent[tok]=j}}
  }catch(e){console.warn('aux',e)}
  finally{auxBusy=null;done()}
}

/* =========================== reports from tenants =========================== */
function subscribeReports(){if(!dbRef)return;try{dbRef.collection('reports').onSnapshot(s=>{reportsList=s.docs.map(d=>({uid:d.id,items:(d.data()||{}).items||[]}));requestRender()},()=>{})}catch(e){}}
function tokenRooms(p){const m={};for(const r of p.rooms){if(r.tenant&&r.tenant.portal)m[r.tenant.portal]={no:r.no,name:r.tenant.name};for(const h of r.history||[])if(h.portal)m[h.portal]={no:r.no,name:h.name}}return m}
function openReports(p){const tm=tokenRooms(p);const out=[];for(const d of reportsList)for(const it of d.items)if(it&&it.status==='open'&&tm[it.tok])out.push(Object.assign({uid:d.uid,roomNo:tm[it.tok].no,tname:tm[it.tok].name},it));return out.sort((a,b)=>String(b.at).localeCompare(String(a.at)))}
async function markReport(uid,id){const d=reportsList.find(x=>x.uid===uid);if(!d||!dbRef)return;const items=d.items.map(x=>x.id===id?Object.assign({},x,{status:'done',doneAt:new Date().toISOString()}):Object.assign({},x));try{await dbRef.doc('reports/'+uid).update({items});toast('Đã đánh dấu đã xử lý')}catch(e){toast('Chưa cập nhật được, thử lại sau.')}}

/* =========================== tenant mode =========================== */
function codeEntry(){return`<div class="card stack" style="width:100%;max-width:340px;text-align:left"><b>Bạn là người thuê?</b><p class="small muted">Nhập mã phòng chủ trọ gửi để xem hóa đơn, mã chuyển khoản và báo hỏng hóc.</p><input type="text" id="tenant-code" placeholder="ABCDE-12345" autocomplete="off" autocapitalize="characters" spellcheck="false" style="font-family:var(--f-mono);letter-spacing:.06em;text-transform:uppercase"><button class="btn pri" data-act="enterCode">Xem trang phòng</button></div>`}
function enterTenant(code,preview){
  const tok=normCode(code);if(tok.length!==10){toast('Mã phòng gồm 10 ký tự, ví dụ ABCDE-12345');return}
  if(!dbRef){toast('Mở trang này trên claude.ai và đăng nhập để xem.');return}
  if(ui.tenant&&ui.tenant.unsub)ui.tenant.unsub();
  const T={tok,preview:!!preview,state:'loading',data:null,unsub:null,timer:null,mine:[],saved:ui.tenant?ui.tenant.saved:{sheets:ui.sheets,tab:ui.tab}};
  ui.tenant=T;ui.sheets=[];render();window.scrollTo(0,0);
  T.timer=setTimeout(()=>{if(ui.tenant===T&&T.state==='loading'){T.state='slow';render()}},10000);
  T.unsub=dbRef.doc(`portal/${tok}/v/data`).onSnapshot(s=>{
    if(ui.tenant!==T)return;if(!s.metadata.fromCache)clearTimeout(T.timer);
    if(s.exists){T.data=s.data();T.state='ok';if(!T.preview)lsSet(LS_TENANT,tok)}else if(!s.metadata.fromCache)T.state='missing';
    requestRender();
  },()=>{if(ui.tenant!==T)return;clearTimeout(T.timer);T.state='error';render()});
  if(!preview&&myId){dbRef.doc('reports/'+myId).get().then(s=>{if(ui.tenant===T&&s.exists){T.mine=((s.data()||{}).items||[]).filter(x=>x.tok===tok);requestRender()}}).catch(()=>{})}
}
function exitTenant(){const T=ui.tenant;if(!T)return;if(T.unsub)T.unsub();clearTimeout(T.timer);if(!T.preview)lsSet(LS_TENANT,null);ui.tenant=null;ui.sheets=T.preview&&T.saved?T.saved.sheets:[];if(T.saved)ui.tab=T.saved.tab;render()}
function tChip(b){const [l,k]=STATUS[b.status]||['',''];return l?`<span class="chip ${k}">${l}</span>`:''}
function tItems(b){return`<div class="items">${b.items.map(i=>`<div class="item ${i.amount<0?'neg':''} ${i.miss?'miss':''}"><div class="grow"><b>${esc(i.label)}</b>${i.detail?`<span>${esc(i.detail)}</span>`:''}</div><span class="amt">${i.miss?'chưa có số':money(i.amount)}</span></div>`).join('')}<div class="total"><span class="fl" style="font-weight:700">TỔNG CỘNG</span><b>${b.complete?money(b.total):'—'}</b></div></div>`}
function payBox(d,b,amt){
  let qr='';try{if(window.qrcode){const q=window.qrcode(0,'M');q.addData(vietQR(d.bank.bin,d.bank.acct,amt,b.ref));q.make();qr=q.createSvgTag({cellSize:4,margin:2,scalable:true})}}catch(e){}
  return`<div class="card stack" style="margin-top:12px"><b>Chuyển khoản ${money(amt)}</b><div class="row" style="align-items:flex-start;gap:14px;flex-wrap:wrap">${qr?`<div class="qr">${qr}</div>`:''}<dl class="kv" style="margin:0;flex:1;min-width:170px"><dt>Ngân hàng</dt><dd>${esc(d.bank.name)}</dd><dt>Số TK</dt><dd class="mono" style="user-select:all">${esc(d.bank.acct)}</dd><dt>Chủ TK</dt><dd>${esc(d.bank.holder)}</dd><dt>Nội dung</dt><dd class="mono" style="user-select:all">${esc(b.ref)}</dd></dl></div><p class="small muted">Quét mã bằng app ngân hàng, số tiền và nội dung tự điền.</p><div class="btns"><button class="btn sm" data-act="copy" data-text="${esc(d.bank.acct)}">Chép số tài khoản</button><button class="btn sm" data-act="copy" data-text="${esc(b.ref)}">Chép nội dung</button></div></div>`;
}
function tenantBody(T,d){
  const bills=d.bills||[];const b0=bills[0];
  let h=`<div class="hello"><h1>Chào ${esc(lastName(d.tenant.name))}</h1><p>Phòng ${esc(d.room.no)} · ${esc(d.prop.address||d.prop.name)}</p></div>`;
  if(b0){h+=`<div class="card hero stack" style="margin-top:14px"><div class="row"><b class="grow" style="font-size:17px">Hóa đơn ${monthLabel(b0.month).toLowerCase()}</b>${tChip(b0)}</div>${tItems(b0)}${b0.complete&&b0.paid>0?`<p class="small">Đã đóng ${money(b0.paid)}${b0.total-b0.paid>0.5?` · còn <b style="color:var(--bad)">${money(b0.total-b0.paid)}</b>`:''}</p>`:''}<p class="small muted">Hạn thanh toán: ${esc(b0.due)}</p>${photoThumbs(b0.photos)}</div>`;
    const amt=b0.complete?Math.max(0,b0.total-b0.paid):0;if(d.bank&&amt>0.5)h+=payBox(d,b0,amt)}
  else h+=`<div class="card" style="margin-top:14px"><p class="muted">Chưa có hóa đơn nào.</p></div>`;
  const rest=bills.slice(1);
  if(rest.length)h+=`<div class="sec-h"><h3>Các tháng trước</h3></div><div class="list">${rest.map(b=>`<details class="li" style="display:block"><summary class="row" style="cursor:pointer"><b class="grow">${monthLabel(b.month)}</b><b class="tnum">${b.complete?money(b.total):'—'}</b>${tChip(b)}</summary><div style="margin-top:8px">${tItems(b)}${photoThumbs(b.photos)}</div></details>`).join('')}</div>`;
  h+=`<div class="sec-h"><h3>Thông tin thuê</h3></div><div class="card"><dl class="kv" style="margin:0"><dt>Ngày dọn vào</dt><dd>${dmy(d.tenant.moveIn)}</dd><dt>Hết hạn hợp đồng</dt><dd>${d.tenant.endDate?dmy(d.tenant.endDate):'Chưa hẹn'}</dd><dt>Số người ở</dt><dd>${d.tenant.people}</dd><dt>Giá thuê</dt><dd>${money(d.room.rent)}/tháng</dd><dt>Tiền cọc</dt><dd>${money(d.tenant.deposit)}</dd></dl></div>`;
  h+=`<div class="sec-h"><h3>Báo hỏng hóc, góp ý</h3></div><div class="card stack"><textarea id="rep-text" placeholder="VD: Vòi nước nhà tắm bị rỉ, bóng đèn trên gác không sáng…"></textarea><button class="btn pri" data-act="sendReport" ${T.preview?'disabled title="Chỉ người thuê gửi được"':''}>${ic('msg',18)}Gửi cho chủ trọ</button>
    ${T.mine.length?`<div class="stack" style="gap:8px">${T.mine.slice().reverse().map(x=>`<div class="row small" style="align-items:flex-start"><span class="grow">${esc(x.text)}</span><span class="chip ${x.status==='done'?'ok':'warn'}">${x.status==='done'?'Đã xử lý':'Đã gửi'}</span></div>`).join('')}</div>`:''}
    ${d.prop.phone||d.prop.owner?`<p class="small muted">Chủ trọ: ${esc(d.prop.owner||'')}${d.prop.phone?` · <span class="mono" style="user-select:all">${esc(d.prop.phone)}</span> <button class="btn sm" style="min-height:28px;padding:0 8px" data-act="copy" data-text="${esc(d.prop.phone)}">Chép số</button>`:''}</p>`:''}</div>`;
  if(d.updatedAt)h+=`<p class="small muted" style="margin-top:14px">Cập nhật lúc ${new Date(d.updatedAt).toLocaleString('vi-VN')}</p>`;
  return h;
}
function tenantShell(){
  const T=ui.tenant;const d=T.data;const pn=d&&d.prop?d.prop.name:'Sổ Trọ';
  let body='';
  if(T.preview)body+=`<div class="banner" style="background:var(--accent-soft);color:var(--accent)">${ic('user',18)}<span class="grow">Bạn đang xem thử trang người thuê${d&&d.room?' phòng '+esc(d.room.no):''}.</span></div>`;
  if(T.state==='loading')body+=`<p class="muted" style="padding:48px 0;text-align:center">Đang tải trang phòng…</p>`;
  else if(T.state==='slow')body+=`<p class="muted" style="padding:48px 0;text-align:center">Chưa kết nối được máy chủ. Kiểm tra mạng rồi mở lại trang.</p>`;
  else if(T.state==='missing'||T.state==='error')body+=`<div class="empty"><h2>Không tìm thấy mã phòng</h2><p>Mã ${esc(fmtCode(T.tok))} không đúng hoặc chủ trọ chưa bật trang. Hỏi lại chủ trọ mã phòng.</p>${T.preview?'<p class="small">Nếu vừa tạo mã, đợi vài giây rồi mở lại.</p>':codeEntry()}</div>`;
  else if(d.closed)body+=`<div class="empty"><h2>Trang đã đóng</h2><p>Phòng ${esc(d.room&&d.room.no||'')} đã kết thúc hợp đồng hoặc chủ trọ đã đổi mã. Trang không còn cập nhật.</p></div>`;
  else body+=tenantBody(T,d);
  return`<header class="topbar"><div class="wrap"><span class="prop-switch" style="cursor:default"><span class="logo">${esc(initials(pn))}</span><span class="t"><small>Trang người thuê</small><b>${esc(pn)}</b></span></span><button class="btn sm" data-act="exitTenant">${T.preview?'Quay lại':'Thoát'}</button></div></header><main class="wrap">${body}</main>`;
}
async function sendReport(){
  const T=ui.tenant;if(!T||!T.data||T.preview)return;const ta=document.getElementById('rep-text');const text=(ta&&ta.value||'').trim();
  if(!text){toast('Nhập nội dung cần báo');return}
  const msg=`[${T.data.prop.name} – phòng ${T.data.room.no}] ${text}`;let ok=false;
  if(dbRef&&myId&&canWrite!==false){
    try{const ref=dbRef.doc('reports/'+myId);const s=await ref.get();const cur=s.exists?((s.data()||{}).items||[]).map(x=>Object.assign({},x)):[];
      cur.push({id:uid6(),tok:T.tok,text:text.slice(0,1000),at:new Date().toISOString(),status:'open'});const items=cur.slice(-40);await ref.set({items});T.mine=items.filter(x=>x.tok===T.tok);ok=true}catch(e){}
  }
  if(ok){toast('Đã gửi cho chủ trọ');render()}
  else copyText(msg,'Chưa gửi thẳng được. Đã chép nội dung, hãy dán vào Zalo gửi chủ trọ.');
}

/* =========================== statement image =========================== */
async function statementCanvas(pid,rid){
  try{await Promise.all([document.fonts.load('400 24px "Be Vietnam Pro"'),document.fonts.load('700 24px "Be Vietnam Pro"'),document.fonts.load('600 24px "IBM Plex Mono"')])}catch(e){}
  const p=S.props[pid];const room=p.rooms.find(r=>r.id===rid);const t=room.tenant;const key=room.id+':'+t.id;
  const ms=Object.values(S.bills).filter(b=>b.pid===pid&&b.rooms[key]).map(b=>b.month).sort().reverse().slice(0,12);
  const W=1080,PX=72;const cv=document.createElement('canvas');cv.width=W;cv.height=3200;const x=cv.getContext('2d');
  const FB='"Be Vietnam Pro", system-ui, sans-serif',FM='"IBM Plex Mono", ui-monospace, monospace';const F=(w,s,f=FB)=>`${w} ${s}px ${f}`;
  const C={ink:'#13211D',muted:'#5B6D67',line:'#D3DDD8',acc:'#0E6B5F',soft:'#EAF4F1',bad:'#B42318',ok:'#1C7A4B',warn:'#A35D00'};
  x.fillStyle='#fff';x.fillRect(0,0,W,3200);
  x.fillStyle=C.acc;x.fillRect(0,0,W,176);x.fillStyle='#fff';x.font=F(700,46);x.fillText(p.name,PX,92,W-2*PX);x.font=F(400,26);x.globalAlpha=.85;x.fillText(p.address||'',PX,136,W-2*PX);x.globalAlpha=1;
  let y=252;x.fillStyle=C.acc;x.font=F(700,26);x.fillText('SAO KÊ TIỀN PHÒNG',PX,y);x.textAlign='right';x.fillStyle=C.ink;x.font=F(500,26);x.fillText('Ngày '+dmy(todayISO()),W-PX,y);x.textAlign='left';
  y+=40;x.fillStyle=C.ink;x.fillRect(PX,y,250,92);x.fillStyle='#fff';x.font=F(600,52,FM);x.textAlign='center';x.fillText(String(room.no),PX+125,y+66,230);x.textAlign='left';
  x.fillStyle=C.ink;x.font=F(600,34);x.fillText(t.name,PX+282,y+42,W-PX*2-282);x.fillStyle=C.muted;x.font=F(400,25);x.fillText(`Dọn vào ${dmy(t.moveIn)}`,PX+282,y+80);
  y+=150;const cols=[PX,PX+300,PX+560,W-PX];x.font=F(600,24);x.fillStyle=C.muted;x.fillText('THÁNG',cols[0],y);x.textAlign='right';x.fillText('PHẢI TRẢ',cols[1]+200,y);x.fillText('ĐÃ TRẢ',cols[2]+200,y);x.fillText('TRẠNG THÁI',cols[3],y);x.textAlign='left';
  y+=18;x.strokeStyle=C.ink;x.lineWidth=2;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();
  for(const m of ms){const c=rowCalc(pid,m,key);y+=58;x.fillStyle=C.ink;x.font=F(600,28);x.fillText(monthLabel(m),cols[0],y);x.textAlign='right';x.font=F(500,28);x.fillText(c.complete?money(c.total):'—',cols[1]+200,y);x.fillText(c.paid?money(c.paid):'0 đ',cols[2]+200,y);
    const [l]=STATUS[c.status];x.font=F(600,24);x.fillStyle=c.status==='paid'?C.ok:c.status==='due'||c.status==='partial'?C.bad:C.muted;x.fillText(l,cols[3],y);x.textAlign='left';
    y+=22;x.setLineDash([6,6]);x.strokeStyle=C.line;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();x.setLineDash([])}
  const debt=tenantDebt(p,room);y+=36;x.fillStyle=debt?'#FBEDEA':C.soft;x.fillRect(PX-24,y,W-2*PX+48,120);x.fillStyle=debt?C.bad:C.acc;x.font=F(700,28);x.fillText(debt?'CÒN NỢ':'ĐÃ THANH TOÁN ĐỦ',PX,y+72);x.textAlign='right';x.font=F(700,52);x.fillText(money(debt),W-PX,y+80);x.textAlign='left';y+=120;
  const bank=BANKS.find(b=>b[0]===p.bank.bin);
  if(debt>0.5&&bank&&p.bank.acct&&window.qrcode){y+=44;const ref=`P${ascii(room.no).replace(/\s/g,'')} CONG NO`.toUpperCase();
    try{const q=window.qrcode(0,'M');q.addData(vietQR(p.bank.bin,p.bank.acct,debt,ref));q.make();const n=q.getModuleCount();const cell=Math.floor(280/n),qs=cell*n;x.fillStyle='#000';for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(q.isDark(i,j))x.fillRect(PX+j*cell,y+i*cell,cell,cell);
      const tx=PX+qs+48;let ty=y+36;x.fillStyle=C.ink;x.font=F(700,30);x.fillText(bank[1],tx,ty,W-PX-tx);ty+=46;x.font=F(600,34,FM);x.fillText(p.bank.acct,tx,ty,W-PX-tx);ty+=40;x.font=F(500,25);x.fillText(p.bank.holder||'',tx,ty,W-PX-tx);ty+=46;x.fillStyle=C.muted;x.font=F(400,24);x.fillText('Nội dung: '+ref,tx,ty,W-PX-tx);y+=qs}catch(e){}}
  y+=60;x.strokeStyle=C.line;x.beginPath();x.moveTo(PX,y);x.lineTo(W-PX,y);x.stroke();y+=40;x.fillStyle=C.muted;x.font=F(400,21);x.fillText(`Lập ngày ${dmy(todayISO())} · Sổ Trọ${p.owner.phone?' · Liên hệ '+p.owner.phone:''}`,PX,y);
  const out=document.createElement('canvas');out.width=W;out.height=y+44;const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,W,out.height);o.drawImage(cv,0,0);return out;
}
function statementSheet(sh){const room=S.props[sh.params.pid].rooms.find(r=>r.id===sh.params.rid);return{title:'Ảnh sao kê P.'+esc(room?room.no:''),body:`<img id="inv-img" class="invimg" alt="Ảnh sao kê phòng ${esc(room?room.no:'')}" ${sh.params.url?`src="${sh.params.url}"`:''}><p class="small muted">Lưu ảnh rồi gửi qua Zalo. Ảnh gồm các tháng gần nhất, số đã đóng, số còn nợ và mã QR trả nợ.</p>`,foot:`<button class="btn pri" data-act="saveImg">${ic('dl',18)}Lưu ảnh</button>`}}

/* =========================== documents: contract, CT01, handover =========================== */
function readVN(n){
  n=Math.round(Math.abs(n||0));if(!n)return'Không đồng';
  const d=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const r3=(x,full)=>{const h=Math.floor(x/100),t=Math.floor(x%100/10),u=x%10;const s=[];
    if(full||h)s.push(d[h]+' trăm');
    if(t>1){s.push(d[t]+' mươi');if(u===1)s.push('mốt');else if(u===4)s.push('tư');else if(u===5)s.push('lăm');else if(u)s.push(d[u])}
    else if(t===1){s.push('mười');if(u===5)s.push('lăm');else if(u)s.push(d[u])}
    else if(u){if(full||h)s.push('lẻ');s.push(d[u])}
    return s.join(' ')};
  const units=['',' nghìn',' triệu',' tỷ'];const g=[];while(n>0){g.push(n%1000);n=Math.floor(n/1000)}
  const parts=[];for(let k=g.length-1;k>=0;k--){if(!g[k])continue;parts.push(r3(g[k],k<g.length-1)+(units[k]||''))}
  const s=parts.join(' ')+' đồng';return s.charAt(0).toUpperCase()+s.slice(1);
}
function parseRuns(s){const out=[];const re=/(\*\*[^*]+\*\*|__[^_]+__)/g;let last=0,m;s=String(s);while((m=re.exec(s))){if(m.index>last)out.push([s.slice(last,m.index),{}]);const t=m[0];out.push(t.startsWith('**')?[t.slice(2,-2),{b:1}]:[t.slice(2,-2),{i:1}]);last=m.index+t.length}if(last<s.length)out.push([s.slice(last),{}]);return out}
const DP=(s,o={})=>Object.assign({t:'p',runs:parseRuns(s)},o);
const DC=(s,o={})=>DP(s,Object.assign({al:'center'},o));
const DJ=(s,o={})=>DP(s,Object.assign({al:'both'},o));
const DT=(cols,rows,border)=>({t:'tbl',cols,rows,border:!!border});
const blank=(v,n=30)=>v?String(v):'.'.repeat(n);
function sigCell(title,name,o={}){return[DC(`**${title}**`,{sz:o.sz||13,sp:0}),DC('__(Ký, ghi rõ họ tên)__',{sz:o.sz?o.sz-1:12,sp:o.gap||64}),DC(name?`**${name}**`:'',{sz:o.sz||13,sp:0})]}
function nameOrDots(s){return s?s:'.'.repeat(28)}
function buildDoc(kind,p,room,t){return kind==='ct01'?buildCT01(p,room,t):kind==='handover'?buildHandover(p,room,t):buildContract(p,room,t)}
function buildContract(p,room,t){
  const o=p.owner||{};const miss=[];if(!o.name)miss.push('tên chủ trọ');if(!o.cccd)miss.push('CCCD chủ trọ');if(!o.address)miss.push('địa chỉ chủ trọ');if(!t.cccd)miss.push('CCCD người thuê');if(!t.dob)miss.push('ngày sinh người thuê');if(!t.home)miss.push('nơi thường trú người thuê');if(!p.equipment)miss.push('trang thiết bị phòng');
  const l=roomLayout(p,room);const li=layoutInfo(l);const pr=p.prices;const [y,mo,da]=(t.moveIn||todayISO()).split('-');const bank=BANKS.find(b=>b[0]===p.bank.bin);
  const water=pr.waterMode==='person'?`3.4. Tiền nước: ${num(pr.waterPerson)} đồng/người/tháng.`:`3.4. Tiền nước: ${[pr.city>0?`nước máy ${num(pr.city)} đồng/m³ (chỉ số khi nhận phòng: ${num(t.c0)} m³)`:'',pr.well>0?`nước giếng ${num(pr.well)} đồng/m³ (chỉ số khi nhận phòng: ${num(t.w0)} m³)`:''].filter(Boolean).join('; ')||'không thu'}.`;
  const svc=[pr.trash>0?`tiền rác ${num(pr.trash)} đồng/${pr.trashMode==='person'?'người':'phòng'}/tháng`:'',pr.wifi>0&&!room.noWifi?`wifi ${num(pr.wifi)} đồng/phòng/tháng`:'',...(pr.extras||[]).filter(x=>x.amount).map(x=>`${x.name.toLowerCase()} ${num(x.amount)} đồng/${x.mode==='person'?'người':'phòng'}/tháng`)].filter(Boolean);
  const B=[DC('**CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM**',{sp:0}),DC('**Độc lập – Tự do – Hạnh phúc**',{sp:0}),DC('—————————',{sp:14}),
    DC('**HỢP ĐỒNG THUÊ PHÒNG TRỌ**',{sz:16,sp:2}),DC(`Số: ${blank('',8)}/HĐTP`,{sp:12}),
    DJ(`Hôm nay, ngày ${da} tháng ${mo} năm ${y}, tại ${blank(p.address,40)}, chúng tôi gồm:`),
    DP('**BÊN CHO THUÊ (BÊN A):**',{sp:2}),DP(`Ông/Bà: ${nameOrDots(o.name)}`,{sp:2}),DP(`Số CCCD: ${blank(o.cccd,24)}`,{sp:2}),DP(`Địa chỉ thường trú: ${blank(o.address,50)}`,{sp:2}),DP(`Điện thoại: ${blank(o.phone,20)}`),
    DP('**BÊN THUÊ (BÊN B):**',{sp:2}),DP(`Ông/Bà: ${t.name}`,{sp:2}),DP(`Ngày sinh: ${t.dob?dmy(t.dob):blank('',16)}        Giới tính: ${blank(t.gender,10)}`,{sp:2}),DP(`Số CCCD: ${blank(t.cccd,24)}`,{sp:2}),DP(`Nơi thường trú: ${blank(t.home,50)}`,{sp:2}),DP(`Điện thoại: ${blank(t.phone,20)}`),
    DJ('Hai bên thống nhất ký kết hợp đồng thuê phòng trọ với các điều khoản sau:',{sp:8}),
    DP('**Điều 1. Phòng cho thuê**'),
    DJ(`1.1. Bên A cho Bên B thuê phòng số ${room.no}, ${p.name}, địa chỉ: ${blank(p.address,40)}.`),
    DJ(`1.2. Diện tích sử dụng khoảng ${f2(li.area+li.loftA)} m² (sàn ${f2(li.area)} m²${l.loft.on?`, gác lửng ${f2(li.loftA)} m²`:''})${l.wc.on?', có nhà vệ sinh riêng':''}${l.kitchen&&l.kitchen.on?`, có bàn bếp nấu ăn dài ${f2(l.kitchen.len)} m`:''}.`),
    DJ(`1.3. Trang thiết bị kèm theo: ${blank([p.equipment,acOf(p,room)?`1 máy lạnh ${f2(+acOf(p,room).hp)} HP`:''].filter(Boolean).join(', '),50)}.`),
    DJ(`1.4. Số người ở: ${t.people} người${t.members.filter(x=>x.name).length?` (gồm Bên B và ${t.members.filter(x=>x.name).map(x=>x.name).join(', ')})`:''}. Bên B không tự ý cho thêm người ở khi chưa báo Bên A.`),
    DP('**Điều 2. Thời hạn thuê**'),
    DJ(t.endDate?`Từ ngày ${dmy(t.moveIn)} đến ngày ${dmy(t.endDate)}. Khi hết hạn, nếu hai bên đồng ý thì gia hạn hoặc ký hợp đồng mới.`:`Từ ngày ${dmy(t.moveIn)}, không xác định thời hạn. Bên nào muốn chấm dứt hợp đồng thực hiện theo Điều 6.`),
    DP('**Điều 3. Giá thuê, tiền cọc và chi phí dịch vụ**'),
    DJ(`3.1. Giá thuê phòng: ${money(room.rent)}/tháng (Bằng chữ: ${readVN(room.rent)}).`),
    DJ(`3.2. Tiền đặt cọc: ${money(t.deposit||0)} (Bằng chữ: ${readVN(t.deposit||0)}). Tiền cọc được trả lại khi Bên B trả phòng đúng thỏa thuận, sau khi trừ tiền thuê, tiền dịch vụ còn nợ và chi phí sửa chữa hư hỏng do Bên B gây ra (nếu có).`),
    DJ(`3.3. Tiền điện: ${num(pr.elec)} đồng/kWh theo đồng hồ riêng của phòng. Chỉ số điện khi nhận phòng: ${num(t.e0)} kWh.`),
    DJ(water),
    DJ(`3.5. Dịch vụ khác: ${svc.length?svc.join('; '):'không thu'}.`),
    DJ(`3.6. Bên B thanh toán trước ngày ${p.dueDay||5} hằng tháng, bằng tiền mặt hoặc chuyển khoản${bank&&p.bank.acct?` vào tài khoản ${p.bank.acct} tại ${bank[1]}, chủ tài khoản ${p.bank.holder}`:''}.`),
    DJ('3.7. Khi điều chỉnh giá thuê hoặc giá dịch vụ, Bên A báo cho Bên B trước ít nhất 30 ngày.'),
    DP('**Điều 4. Quyền và nghĩa vụ của Bên A**'),
    ...['a) Giao phòng và trang thiết bị cho Bên B đúng thỏa thuận; bảo đảm Bên B sử dụng ổn định trong thời hạn thuê.','b) Sửa chữa kịp thời những hư hỏng không do lỗi của Bên B.','c) Xác nhận, tạo điều kiện để Bên B đăng ký tạm trú theo quy định.','d) Được nhận đủ tiền thuê, tiền dịch vụ đúng hạn; được kiểm tra phòng khi có báo trước.'].map(s=>DJ(s,{sp:2})),
    DP('**Điều 5. Quyền và nghĩa vụ của Bên B**'),
    ...['a) Thanh toán đầy đủ, đúng hạn tiền thuê và tiền dịch vụ.','b) Đăng ký tạm trú theo quy định của pháp luật về cư trú.','c) Sử dụng phòng đúng mục đích để ở; giữ gìn vệ sinh, trật tự; tuân thủ quy định phòng cháy, chữa cháy; không tàng trữ hàng cấm, chất dễ cháy nổ.','d) Không tự ý sửa chữa, cải tạo phòng hoặc cho người khác thuê lại khi chưa được Bên A đồng ý.','đ) Bồi thường hư hỏng do mình gây ra; khi trả phòng phải bàn giao lại phòng và trang thiết bị như lúc nhận, trừ hao mòn tự nhiên.'].map(s=>DJ(s,{sp:2})),
    DP('**Điều 6. Chấm dứt hợp đồng**'),
    ...['a) Bên nào muốn chấm dứt hợp đồng trước thời hạn phải báo cho bên kia trước ít nhất 30 ngày.','b) Bên B tự ý chấm dứt trước thời hạn mà không báo trước thì không được trả lại tiền cọc. Bên A tự ý chấm dứt trước thời hạn mà không báo trước thì phải trả lại tiền cọc và bồi thường cho Bên B một khoản bằng tiền cọc.','c) Bên B chậm thanh toán quá 15 ngày so với hạn mà không có lý do chính đáng thì Bên A có quyền chấm dứt hợp đồng sau khi đã thông báo.'].map(s=>DJ(s,{sp:2}))];
  let art=7;
  if(p.terms&&p.terms.trim()){B.push(DP(`**Điều ${art++}. Thỏa thuận khác**`));p.terms.split(/\n+/).filter(s=>s.trim()).forEach(s=>B.push(DJ(s.trim(),{sp:2})))}
  B.push(DP(`**Điều ${art}. Điều khoản chung**`),DJ('Hai bên cam kết thực hiện đúng hợp đồng. Tranh chấp phát sinh được giải quyết bằng thương lượng; nếu không thương lượng được thì một trong hai bên có quyền yêu cầu Tòa án có thẩm quyền giải quyết. Hợp đồng lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản, có hiệu lực từ ngày ký.',{sp:16}),
    DT([.5,.5],[[sigCell('BÊN CHO THUÊ (BÊN A)',o.name),sigCell('BÊN THUÊ (BÊN B)',t.name)]]));
  return{title:'Hợp đồng thuê phòng',file:`HopDong_P${slug(room.no)}_${slug(t.name)}.docx`,blocks:B,missing:miss};
}
function buildCT01(p,room,t){
  const o=p.owner||{};const miss=[];if(!t.dob)miss.push('ngày sinh');if(!t.gender)miss.push('giới tính');if(!t.cccd)miss.push('số định danh (CCCD)');if(!o.name)miss.push('tên chủ trọ');if(!o.cccd)miss.push('CCCD chủ trọ');if(!p.address)miss.push('địa chỉ khu trọ');
  const mem=t.members.filter(x=>x.name);const s9={sz:10,sp:0};
  const head=['TT','Họ, chữ đệm và tên','Ngày, tháng, năm sinh','Giới tính','Số định danh cá nhân','Mối quan hệ với chủ hộ'].map(h=>[DC(`**${h}**`,s9)]);
  const rows=(mem.length?mem:[{},{},{}]).map((x,i)=>[[DC(x.name?String(i+1):'',s9)],[DP(x.name||'',s9)],[DC(x.dob?dmy(x.dob):'',s9)],[DC(x.gender||'',s9)],[DC(x.cccd||'',s9)],[DC(x.relation||'',s9)]]);
  const sigT=t=>[DC(`**${t}**`,{sz:10,sp:0}),DC('__(Ký, ghi rõ họ tên)__',{sz:10,sp:0})];
  const sigN=(name,id)=>[DP('',{sz:10,sp:40}),DC(name?`**${name}**`:'',{sz:10,sp:4}),DP(`Họ và tên(7): ${name||'.'.repeat(14)}`,{sz:9,sp:0}),DP(`Số định danh cá nhân: ${id||'.'.repeat(12)}`,{sz:9,sp:0})];
  const B=[DT([.45,.55],[[[DP('')],[DP('**Mẫu CT01**',{al:'right',sz:11,sp:0}),DP('__Ban hành kèm theo Thông tư số 53/2025/TT-BCA__',{al:'right',sz:10,sp:0})]]]),
    DC('**CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM**',{sp:0}),DC('**Độc lập – Tự do – Hạnh phúc**',{sp:0}),DC('—————————',{sp:10}),
    DC('**TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ**',{sz:15,sp:10}),DC(`Kính gửi(1): ${'.'.repeat(56)}`,{sp:10}),
    DP(`1. Họ, chữ đệm và tên khai sinh: **${t.name.toUpperCase()}**`),
    DP(`2. Ngày, tháng, năm sinh: ${t.dob?dmy(t.dob):blank('',14)}          3. Giới tính: ${blank(t.gender,10)}`),
    DP(`4. Số định danh cá nhân: ${blank(t.cccd,26)}`),
    DP(`5. Số điện thoại liên hệ: ${blank(t.phone,18)}          6. Email: ${blank('',26)}`),
    DP(`7. Họ, chữ đệm và tên chủ hộ: ${t.name.toUpperCase()}          8. Mối quan hệ với chủ hộ: Chủ hộ`),
    DP(`9. Số định danh cá nhân của chủ hộ: ${blank(t.cccd,26)}`),
    DJ(`10. Nội dung đề nghị(2): Đăng ký tạm trú tại phòng số ${room.no}, ${p.name}, địa chỉ: ${blank(p.address,40)}${t.endDate?`; thời hạn tạm trú đến ngày ${dmy(t.endDate)}`:''}.`),
    DP('11. Những thành viên trong hộ gia đình cùng thay đổi:',{sp:2}),
    DT([.07,.29,.17,.11,.18,.18],[head,...rows],true),
    DP(`${'.'.repeat(16)}, ngày ${'.'.repeat(4)} tháng ${'.'.repeat(4)} năm ${'.'.repeat(6)}`,{al:'right',sp:8,sz:12}),
    DT([.25,.25,.25,.25],[[sigT('Ý KIẾN CỦA CHỦ HỘ(3)'),sigT('Ý KIẾN CỦA CHỦ SỞ HỮU CHỖ Ở HỢP PHÁP(4)'),sigT('Ý KIẾN CỦA CHA, MẸ HOẶC NGƯỜI GIÁM HỘ(5)'),sigT('NGƯỜI KÊ KHAI(6)')],[sigN('',''),sigN(o.name,o.cccd),sigN('',''),sigN(t.name,t.cccd)]]),
    DP('__Ghi chú: (1) Cơ quan đăng ký cư trú. (2) Ghi rõ, cụ thể nội dung đề nghị. (3), (4), (5) Ghi ý kiến đồng ý khi pháp luật yêu cầu; có thể xác nhận trên ứng dụng VNeID hoặc bằng văn bản riêng. (6) Chỉ ký khi nộp hồ sơ trực tiếp; người kê khai đồng thời là chủ hộ hoặc chủ sở hữu thì không cần ký các mục (3), (4). (7) Chỉ ghi khi đề nghị xác nhận qua VNeID.__',{sz:9,al:'both'})];
  return{title:'Tờ khai tạm trú (CT01)',file:`CT01_TamTru_P${slug(room.no)}_${slug(t.name)}.docx`,blocks:B,missing:miss};
}
function buildHandover(p,room,t){
  const o=p.owner||{};const pr=p.prices;const miss=[];if(!o.name)miss.push('tên chủ trọ');if(!p.equipment)miss.push('trang thiết bị phòng');
  const [y,mo,da]=(t.moveIn||todayISO()).split('-');const s={sp:0};
  const meters=[[[DC('**Đồng hồ**',s)],[DC('**Chỉ số khi bàn giao**',s)]],[[DP('Điện (kWh)',s)],[DC(num(t.e0),s)]]];
  if(pr.waterMode!=='person'){if(pr.city>0||t.c0)meters.push([[DP('Nước máy (m³)',s)],[DC(num(t.c0),s)]]);if(pr.well>0||t.w0)meters.push([[DP('Nước giếng (m³)',s)],[DC(num(t.w0),s)]])}
  const eq=String(p.equipment||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);if(acOf(p,room))eq.push(`1 Máy lạnh ${f2(+acOf(p,room).hp)} HP`);
  const eqRows=(eq.length?eq:['','','','','']).map((e,i)=>{const m=e.match(/^(\d+)\s+(.*)$/);return[[DC(e?String(i+1):'',s)],[DP(m?m[2]:e,s)],[DC(m?m[1]:(e?'1':''),s)],[DP(e?'Hoạt động tốt':'',s)]]});
  const B=[DC('**CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM**',{sp:0}),DC('**Độc lập – Tự do – Hạnh phúc**',{sp:0}),DC('—————————',{sp:14}),
    DC('**BIÊN BẢN BÀN GIAO PHÒNG**',{sz:16,sp:12}),
    DJ(`Hôm nay, ngày ${da} tháng ${mo} năm ${y}, tại phòng số ${room.no}, ${p.name}, địa chỉ: ${blank(p.address,40)}, chúng tôi gồm:`),
    DP(`**Bên giao (Bên A):** ${nameOrDots(o.name)}${o.phone?` – Điện thoại: ${o.phone}`:''}`),
    DP(`**Bên nhận (Bên B):** ${t.name}${t.phone?` – Điện thoại: ${t.phone}`:''}`),
    DJ('Hai bên cùng kiểm tra và xác nhận tình trạng phòng khi bàn giao như sau:'),
    DP('**1. Chỉ số đồng hồ**',{sp:2}),DT([.6,.4],meters,true),
    DP('**2. Trang thiết bị**',{sp:2}),DT([.08,.52,.14,.26],[[[DC('**STT**',s)],[DC('**Tên thiết bị**',s)],[DC('**Số lượng**',s)],[DC('**Tình trạng**',s)]],...eqRows],true),
    DP(`**3. Chìa khóa:** ${'.'.repeat(10)} chiếc. **Thẻ/remote cổng:** ${'.'.repeat(10)} chiếc.`),
    DJ(`**4. Ghi chú khác:** ${'.'.repeat(80)}`),
    DJ('Biên bản lập thành 02 bản, mỗi bên giữ 01 bản, là căn cứ để đối chiếu khi trả phòng và hoàn tiền cọc.',{sp:16}),
    DT([.5,.5],[[sigCell('BÊN GIAO',o.name),sigCell('BÊN NHẬN',t.name)]])];
  return{title:'Biên bản bàn giao phòng',file:`BanGiao_P${slug(room.no)}_${slug(t.name)}.docx`,blocks:B,missing:miss};
}
function docHTML(bs){return bs.map(b=>b.t==='tbl'?`<table class="${b.border?'b':''}">${b.rows.map(row=>`<tr>${row.map((cell,i)=>`<td style="width:${Math.round(b.cols[i]*100)}%">${docHTML(cell)}</td>`).join('')}</tr>`).join('')}</table>`:`<p class="${b.al==='center'?'c':b.al==='right'?'r':b.al==='both'?'j':''}" style="${b.sz&&b.sz!==13?`font-size:${(b.sz*1.04).toFixed(1)}px;`:''}${b.sp!=null?`margin-bottom:${Math.min(b.sp,64)}px;`:''}">${b.runs.map(([t,o])=>{let s=esc(t);if(o.b)s=`<b>${s}</b>`;if(o.i)s=`<i>${s}</i>`;return s}).join('')||'&nbsp;'}</p>`).join('')}
const xmlEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function docXml(blocks){
  const W=9071;
  const run=([t,o],sz)=>`<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}<w:sz w:val="${sz*2}"/><w:szCs w:val="${sz*2}"/></w:rPr><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>`;
  const para=b=>{const sz=b.sz||13;return`<w:p><w:pPr><w:spacing w:before="0" w:after="${Math.round((b.sp??4)*20)}" w:line="288" w:lineRule="auto"/>${b.al?`<w:jc w:val="${b.al}"/>`:''}</w:pPr>${b.runs.map(r=>run(r,sz)).join('')}</w:p>`};
  const bd=v=>['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="${v}" w:sz="4" w:space="0" w:color="000000"/>`).join('');
  const tbl=b=>{const cw=b.cols.map(f=>Math.round(W*f));return`<w:tbl><w:tblPr><w:tblW w:w="${W}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${bd(b.border?'single':'nil')}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cw.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${b.rows.map(row=>`<w:tr>${row.map((cell,i)=>`<w:tc><w:tcPr><w:tcW w:w="${cw[i]}" w:type="dxa"/></w:tcPr>${(cell.length?cell:[DP('')]).map(para).join('')}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`};
  return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${blocks.map(b=>b.t==='tbl'?tbl(b):para(b)).join('')}<w:p/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
async function docxBlob(blocks){
  await loadScript(URLS.zip);const z=new window.JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml',docXml(blocks));
  return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* =========================== money: ledger, reconciliation, anomalies =========================== */
function ledgerOf(pid,m){const b=getBill(pid,m);return b&&b.ledger||null}
function ensureLedger(pid,m){const k=billKey(pid,m);if(!S.bills[k])S.bills[k]={pid,month:m,rooms:{},createdAt:todayISO()};const b=S.bills[k];if(!b.ledger)b.ledger={elecKwh:null,elecCost:null,waterM3:null,waterCost:null,expenses:[]};if(!Array.isArray(b.ledger.expenses))b.ledger.expenses=[];return b.ledger}
function moneyStats(pid,m){
  const s=monthSum(pid,m);const L=ledgerOf(pid,m)||{};const ex=(L.expenses||[]).reduce((a,x)=>a+(x.amount||0),0);const cost=(L.elecCost||0)+(L.waterCost||0)+ex;
  let kwh=0,cm3=0,elecRev=0,waterRev=0,allE=true,allC=true,n=0;
  for(const [k,r] of rowsSorted(pid,m)){n++;const c=rowCalc(pid,m,k);if(r.e1!=null)kwh+=r.e1-r.e0;else allE=false;if(r.c1!=null)cm3+=r.c1-r.c0;else allC=false;for(const i of c.items){if(i.k==='elec')elecRev+=i.amount;if(i.k==='water'||i.k==='city')waterRev+=i.amount}}
  return Object.assign({},s,{L,ex,cost,profit:s.due-cost,cashProfit:s.paid-cost,kwh:Math.round(kwh*100)/100,cm3:Math.round(cm3*100)/100,elecRev,waterRev,allE:allE&&n>0,allC:allC&&n>0});
}
function anomalies(pid,m){const out=[];for(const [k,r] of rowsSorted(pid,m)){if(r.e1==null)continue;const u=r.e1-r.e0;const avg=avgUse(pid,m,k,'e');if(avg==null||avg<30)continue;const ratio=u/avg;if(ratio<0.4)out.push({key:k,r,u,avg,kind:'low'});else if(ratio>2.5)out.push({key:k,r,u,avg,kind:'high'})}return out}
function moneySumHTML(st){return`<div class="card hero"><div class="kpis" style="margin-top:0"><div class="kpi"><small>Phải thu</small><b>${shortMoney(st.due)}</b></div><div class="kpi"><small>Chi phí</small><b>${shortMoney(st.cost)}</b></div><div class="kpi"><small>Lãi tạm tính</small><b class="${st.profit>=0?'ok':'bad'}">${st.profit<0?'−':''}${shortMoney(Math.abs(st.profit))}</b></div></div><p class="small muted" style="margin-top:10px">Thực thu ${money(st.paid)} − chi ${money(st.cost)} = <b style="color:var(--ink)">${money(st.cashProfit)}</b>${st.rows>st.complete?` · ${st.rows-st.complete} phòng chưa chốt số`:''}</p></div>`}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const n=x/p;return(n<=1?1:n<=2?2:n<=5?5:10)*p}
function axisLab(v){return v>=1e6?(v/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+'tr':v>=1e3?Math.round(v/1e3)+'k':String(v)}
function moneyChart(pid,m){
  const ms=[];for(let i=5;i>=0;i--)ms.push(addMonth(m,-i));const d=ms.map(x=>{const s=moneyStats(pid,x);return{m:x,a:s.due,b:s.cost}});
  const max=Math.max(1e6,...d.map(x=>Math.max(x.a,x.b)));const step=niceStep(max/4);const top=Math.ceil(max/step)*step;
  const W=340,H=170,L=40,B=24,T=8,pw=W-L-6,ph=H-B-T,gw=pw/6,bw=Math.min(16,gw/3);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Phải thu và chi phí 6 tháng gần nhất">`;
  for(let v=0;v<=top+1e-6;v+=step){const y=T+ph-v/top*ph;s+=`<line x1="${L}" x2="${W-6}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:var(--line)" stroke-width="1"/><text x="${L-6}" y="${(y+4).toFixed(1)}" text-anchor="end" font-size="10" style="fill:var(--muted)">${axisLab(v)}</text>`}
  d.forEach((x,i)=>{const cx=L+gw*i+gw/2;const ha=x.a/top*ph,hb=x.b/top*ph;const cur=x.m===m;
    s+=`<rect x="${(cx-bw-1).toFixed(1)}" y="${(T+ph-ha).toFixed(1)}" width="${bw.toFixed(1)}" height="${ha.toFixed(1)}" rx="2" style="fill:var(--accent)"/><rect x="${(cx+1).toFixed(1)}" y="${(T+ph-hb).toFixed(1)}" width="${bw.toFixed(1)}" height="${hb.toFixed(1)}" rx="2" style="fill:var(--warn)"/><text x="${cx.toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" style="fill:var(--${cur?'ink':'muted'})" ${cur?'font-weight="700"':''}>T${Number(x.m.slice(5))}</text>`});
  return s+'</svg>';
}
function recHTML(kind,st,metered=true){
  const L=st.L||{};const isE=kind==='e';const unit=isE?'kWh':'m³';const master=isE?L.elecKwh:L.waterM3;const cost=isE?L.elecCost:L.waterCost;const rooms=isE?st.kwh:st.cm3;const rev=isE?st.elecRev:st.waterRev;
  const rows=[];let head='';
  if(metered&&master!=null){
    const diff=Math.round((master-rooms)*100)/100;const pct=master>0?diff/master*100:0;let chip;
    if(isE?!st.allE:!st.allC)chip=['warn','Còn phòng chưa chốt số'];
    else if(diff<0)chip=['bad','Các phòng cộng lại lớn hơn đồng hồ tổng, kiểm tra lại chỉ số'];
    else if(pct<=5)chip=['ok','Bình thường'];
    else if(pct<=15)chip=['warn',isE?'Hao hụt cao: kiểm tra đèn chung, máy bơm, dây dẫn':'Hao hụt cao: kiểm tra rò rỉ đường ống'];
    else chip=['bad',isE?'Bất thường: kiểm tra rò điện hoặc câu điện trộm':'Bất thường: kiểm tra rò rỉ hoặc dùng nước trộm'];
    head=`<span class="chip ${chip[0]}" style="white-space:normal">${chip[1]}</span>`;
    rows.push(['Đồng hồ tổng',`${num(master)} ${unit}`],['Các phòng cộng lại',`${num(rooms)} ${unit}`],['Chênh lệch (dùng chung, hao hụt)',`${num(diff)} ${unit} · ${f2(pct)}%`]);
  }
  if(cost!=null&&cost>0){if(metered&&master)rows.push(['Giá vốn bình quân',`${num(Math.round(cost/master))} đ/${unit}`]);rows.push(['Thu từ các phòng',money(rev)],['Phải trả',money(cost)],[rev>=cost?'Lời':'Lỗ',money(Math.abs(rev-cost))])}
  if(!rows.length)return`<p class="small muted">${metered?`Nhập số ${unit} và số tiền trên hóa đơn để đối chiếu.`:'Nhập số tiền trên hóa đơn để so với tiền nước thu từ các phòng.'}</p>`;
  const last=rows.length-1;
  return`${head}<div class="calc-rows" style="margin-top:8px">${rows.map(([a,b],i)=>`<div><span>${a}</span><b ${i===last&&cost?`style="color:var(--${rev>=cost?'ok':'bad'})"`:''}>${b}</b></div>`).join('')}</div>`;
}
function ledFld(label,f,val,sfx,full){return`<label class="fld ${full?'full':''}"><span class="fl">${label}</span><span class="fi"><input type="number" inputmode="decimal" step="any" id="led-${f}" data-in="ledger" data-f="${f}" value="${val??''}" style="--sfx:${sfx.length}"><span class="sfx">${sfx}</span></span></label>`}
function tabMoney(p){
  const m=ui.month;const L=ledgerOf(p.id,m)||{};const ex=L.expenses||[];const st=moneyStats(p.id,m);const metered=p.prices.waterMode!=='person'&&p.prices.city>0;const an=anomalies(p.id,m);
  return`<div class="monthnav"><button class="iconbtn" data-act="month" data-d="-1" aria-label="Tháng trước">${ic('left')}</button><b>${monthLabel(m)}</b><button class="iconbtn" data-act="month" data-d="1" aria-label="Tháng sau">${ic('chev')}</button></div>
  <div id="money-sum">${moneySumHTML(st)}</div>
  <div class="card" style="margin-top:12px"><div class="row wrapr"><b class="grow">6 tháng gần nhất</b><span class="legend"><span><i style="background:var(--accent)"></i>Phải thu</span><span><i style="background:var(--warn)"></i>Chi phí</span></span></div><div class="chart" id="money-chart" style="margin-top:8px">${moneyChart(p.id,m)}</div></div>
  <div class="sec-h"><h3>Đối chiếu điện</h3></div>
  <div class="group"><p class="small muted">Nhập số trên hóa đơn tiền điện của khu (đồng hồ tổng EVN).</p><div class="fgrid">${ledFld('Điện tổng','elecKwh',L.elecKwh,'kWh')}${ledFld('Tiền điện EVN','elecCost',L.elecCost,'đ')}</div><div id="rec-e">${recHTML('e',st)}</div></div>
  <div class="sec-h"><h3>${metered?'Đối chiếu nước máy':'Tiền nước'}</h3></div>
  <div class="group"><div class="fgrid">${metered?ledFld('Nước tổng','waterM3',L.waterM3,'m³'):''}${ledFld('Tiền nước phải trả','waterCost',L.waterCost,'đ',!metered)}</div><div id="rec-w">${recHTML('w',st,metered)}</div></div>
  ${an.length?`<div class="sec-h"><h3>Phòng dùng điện bất thường</h3></div><div class="list">${an.map(a=>`<button class="li" data-act="openBill" data-key="${esc(a.key)}"><span class="plate">${esc(a.r.roomNo)}</span><span class="grow"><b>${esc(a.r.tenantName)}</b><span>${num(a.u)} kWh tháng này · trung bình ${num(Math.round(a.avg))} kWh</span></span><span class="chip ${a.kind==='low'?'bad':'warn'}">${a.kind==='low'?'Giảm '+Math.round((1-a.u/a.avg)*100)+'%':'Tăng '+f2(a.u/a.avg)+' lần'}</span></button>`).join('')}</div><p class="small muted" style="margin-top:8px">Điện giảm mạnh khi phòng vẫn có người ở có thể do đồng hồ hỏng hoặc bị can thiệp. Nên kiểm tra trực tiếp.</p>`:''}
  <div class="sec-h"><h3>Chi phí khác</h3></div>
  <div class="group">${ex.map((x,i)=>`<div class="adj" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 40px"><input type="text" id="exp-n-${i}" data-in="exp" data-i="${i}" data-f="name" value="${esc(x.name)}" placeholder="Nội dung"><input type="number" inputmode="numeric" id="exp-a-${i}" data-in="exp" data-i="${i}" data-f="amount" value="${x.amount??''}" placeholder="Số tiền"><button class="iconbtn" data-act="delExp" data-i="${i}" aria-label="Xóa khoản chi">${ic('x',18)}</button><select id="exp-c-${i}" data-in="exp" data-i="${i}" data-f="cat" style="grid-column:1/-1;min-height:38px;font-size:14px">${EXP_CATS.map(c=>`<option ${c===x.cat?'selected':''}>${c}</option>`).join('')}</select></div>`).join('<hr style="border:0;border-top:1px dashed var(--line);margin:2px 0;width:100%">')}<button class="btn sm" data-act="addExp">${ic('plus',16)}Thêm khoản chi</button></div>
  <p class="small muted" style="margin-top:10px">Lãi tạm tính = tiền phải thu của các phòng − tiền điện, nước trả cho nhà cung cấp − chi phí khác trong tháng.</p>`;
}
function refreshMoney(p){const m=ui.month;const st=moneyStats(p.id,m);const metered=p.prices.waterMode!=='person'&&p.prices.city>0;const set=(id,h)=>{const e=document.getElementById(id);if(e)e.innerHTML=h};set('money-sum',moneySumHTML(st));set('rec-e',recHTML('e',st));set('rec-w',recHTML('w',st,metered));set('money-chart',moneyChart(p.id,m))}

/* =========================== home extras =========================== */
function homeExtras(p){
  const today=todayISO();const rd=nextDay(p.readDay||1);const du=nextDay(clamp(p.dueDay||5,1,28));
  const dd=x=>{const n=daysBetween(today,x);return n===0?'hôm nay':n===1?'ngày mai':`còn ${n} ngày`};
  const reps=openReports(p);
  return`<div class="mini" style="margin-top:10px"><button class="card" data-act="openRemind" style="text-align:left"><small>Chốt số điện nước</small><b>${dmy(rd).slice(0,5)}</b><small>${dd(rd)}</small></button><button class="card" data-act="openRemind" style="text-align:left"><small>Hạn thu tiền</small><b>${dmy(du).slice(0,5)}</b><small>${dd(du)}</small></button></div>
  ${reps.length?`<div class="sec-h"><h3>Người thuê báo</h3><span class="spacer"></span><span class="chip bad">${reps.length} chưa xử lý</span></div><div class="list">${reps.map(x=>`<div class="rep"><div class="row"><span class="plate">${esc(x.roomNo)}</span><b class="grow">${esc(x.tname||'')}</b><span class="small muted">${new Date(x.at).toLocaleDateString('vi-VN')}</span></div><p style="overflow-wrap:anywhere">${esc(x.text)}</p><div class="row"><span class="spacer"></span><button class="btn sm soft" data-act="doneReport" data-uid="${esc(x.uid)}" data-id="${esc(x.id)}">${ic('check',16)}Đã xử lý</button></div></div>`).join('')}</div>`:''}`;
}

/* =========================== v2 sheets =========================== */
Object.assign(SHEETS,{
 meter(sh){
  const st=sh.params;const r=rowOf(st.pid,st.m,st.key);if(!r)return{title:'Chụp đồng hồ',body:'<p class="muted">Hóa đơn đã bị xóa.</p>'};const unit=st.f==='e'?'kWh':'m³';
  const up=uploadText(st);const da=`data-ch="meterPhoto" data-pid="${st.pid}" data-m="${st.m}" data-key="${esc(st.key)}" data-f="${st.f}"`;
  return{title:`${meterName(st.f)} · P.${esc(r.roomNo)}`,body:`<img class="photo-big meter" src="${st.url}" alt="Ảnh đồng hồ ${meterName(st.f)}">${photoRedo(da)}<div id="meter-status">${meterStatus(st)}</div>
   <label class="fld"><span class="fl">Chỉ số mới (${unit})</span><input type="number" inputmode="decimal" step="any" id="meter-val" class="reading" data-draft="value" data-type="num" value="${sh.draft.value??''}"></label>
   <p class="small" id="meter-info">${meterInfo(st,sh.draft.value)}</p>${up?`<p class="small muted">${up}</p>`:''}`,
   foot:`<button class="btn pri" data-act="applyMeter">${ic('check',18)}Dùng số này</button>`};
 },
 photo(sh){const q=sh.params;const r=q.key?rowOf(q.pid,q.m,q.key):null;
  return{title:r?`${meterName(q.f)} · P.${esc(r.roomNo)} · ${monthLabel(q.m)}`:'Ảnh đồng hồ',body:`<img class="photo-big" ${phSrc(q.id)} alt="Ảnh đồng hồ (không tải được ảnh)">${isLocalPh(q.id)?'<p class="small muted" style="margin-top:8px">Ảnh lưu trên máy này. Dùng “Sao lưu kèm ảnh” trong Thiết lập để giữ ảnh khi đổi máy.</p>':''}`,
   foot:r?`<button class="btn" data-act="savePhoto">${ic('dl',18)}Lưu ảnh</button><button class="btn" data-act="delPhoto">${ic('trash',18)}Xóa ảnh</button>`:''}},
 portal(sh){
  const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);const t=room&&room.tenant;if(!t)return{title:'Trang người thuê',body:'<p class="muted">Phòng không có người thuê.</p>'};
  let body=`<p>Người thuê <b>${esc(t.name)}</b> xem được hóa đơn từng tháng, ảnh đồng hồ, mã QR chuyển khoản và gửi báo hỏng hóc cho bạn. Họ chỉ thấy phòng của mình.</p>`;
  if(mode!=='cloud')body+=`<div class="banner">${ic('alert',18)}<span>Cần mở app trên claude.ai (đã đăng nhập) để bật trang người thuê.</span></div>`;
  else if(!t.portal)body+=`<button class="btn pri block" data-act="genPortal">${ic('key',18)}Tạo mã phòng cho người thuê</button>`;
  else body+=`<div class="code">${fmtCode(t.portal)}</div><div class="btns"><button class="btn pri" data-act="copyPortalMsg">${ic('copy',18)}Chép lời nhắn gửi người thuê</button><button class="btn" data-act="previewPortal">${ic('user',18)}Xem thử</button></div><div class="btns"><button class="btn sm" data-act="regenPortal">${ic('refresh',16)}Đổi mã</button><button class="btn sm danger" data-act="offPortal">Tắt trang</button></div>`;
  body+=`<div class="card stack"><b>Để người thuê mở được</b><ol class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px"><li>Bấm nút <b>Chia sẻ</b> của trang này và cho phép <b>bất kỳ ai có link</b> được xem.</li><li>Người thuê mở link, đăng nhập tài khoản Claude rồi nhập mã phòng.</li><li>Dữ liệu quản lý của bạn vẫn riêng tư. Người thuê chỉ đọc được trang của phòng mình.</li></ol><p class="small muted">Báo hỏng gửi thẳng vào app khi người thuê có quyền dùng trang (mức Contributor). Nếu không, app chép sẵn nội dung để họ dán vào Zalo gửi bạn.</p></div>
   <div class="card stack"><b>Người thuê không dùng Claude?</b><p class="small muted">Gửi ảnh sao kê gồm các tháng gần nhất, số đã đóng, số còn nợ và mã QR.</p><button class="btn" data-act="openStatement">${ic('img',18)}Ảnh sao kê</button></div>`;
  return{title:'Trang người thuê · P.'+esc(room.no),body};
 },
 doc(sh){
  const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);const t=room&&room.tenant;if(!t)return{title:'Giấy tờ',body:'<p class="muted">Phòng không có người thuê.</p>'};
  const d=buildDoc(sh.params.kind,p,room,t);
  return{title:d.title,body:`${d.missing.length?`<div class="banner" style="margin:0">${ic('alert',18)}<span class="grow">Còn thiếu: ${d.missing.join(', ')}. Chỗ thiếu để dấu chấm để điền tay.</span></div><div class="btns"><button class="btn sm" data-act="editTenant">${ic('user',16)}Bổ sung người thuê</button><button class="btn sm" data-act="editProp">${ic('building',16)}Bổ sung chủ trọ, khu</button></div>`:''}
   <div class="paper-wrap"><div class="paper">${docHTML(d.blocks)}</div></div>
   <p class="small muted">${sh.params.kind==='ct01'?'Tờ khai có thể nộp trực tiếp tại Công an xã, phường hoặc khai trực tuyến qua VNeID, Cổng dịch vụ công. Hãy đối chiếu với mẫu CT01 nơi bạn nộp trước khi in.':'Đây là mẫu tham khảo, không thay cho tư vấn pháp lý. Mở file Word để sửa lại cho đúng thỏa thuận trước khi in.'}</p>`,
   foot:`<button class="btn pri" data-act="saveDoc">${ic('dl',18)}Tải file Word (.docx)</button>`};
 },
 remind(){
  const today=todayISO();const items=buildReminders(true).filter(x=>daysBetween(today,x.date)<=60);
  const kindChip={read:['acc','Chốt số'],due:['warn','Thu tiền'],end:['bad','Hết hạn']};
  const props=Object.values(S.props);
  return{title:'Nhắc trên điện thoại',body:`<div class="card stack"><b>${ic('bell',18)} Thông báo hằng ngày từ Claude</b><p class="small">Mỗi sáng, Claude đọc lịch nhắc bên dưới và gửi thông báo về app Claude trên điện thoại khi có việc: trước ngày chốt số 1 ngày, đúng hạn thu tiền khi còn phòng chưa đóng, và trước ngày hết hạn hợp đồng 30, 14, 7, 3, 1 ngày.</p><p class="small muted">Bật thông báo cho app Claude trên điện thoại để nhận. Lịch nhắc được cập nhật mỗi khi bạn mở app này${mode==='cloud'?'':' (cần mở trên claude.ai)'}. Dữ liệu mẫu không gửi thông báo.</p></div>
   <div class="sec-h" style="margin:4px 0 0"><h3>60 ngày tới</h3></div>
   ${items.length?`<div class="list">${items.map(x=>`<div class="li"><span class="chip ${kindChip[x.kind][0]}" style="min-width:76px;justify-content:center">${kindChip[x.kind][1]}</span><span class="grow"><b>${dmy(x.date)}</b><span>${esc(x.text)}</span></span></div>`).join('')}</div>`:'<p class="small muted">Không có việc nào trong 60 ngày tới.</p>'}
   <div class="sec-h" style="margin:4px 0 0"><h3>Thêm vào Google Calendar</h3></div>
   <p class="small muted">Nhắc bằng lịch của điện thoại, không cần mở Claude.</p>
   ${props.map(p=>`<div class="group"><h4>${esc(p.name)}</h4><div class="btns"><a class="btn sm" target="_blank" rel="noopener" href="${gcal('Chốt số điện nước – '+p.name,nextDay(p.readDay||1),'Nhắc từ Sổ Trọ','FREQ=MONTHLY;BYMONTHDAY='+(p.readDay||1))}">${ic('cal',16)}Chốt số hằng tháng</a><a class="btn sm" target="_blank" rel="noopener" href="${gcal('Hạn thu tiền phòng – '+p.name,nextDay(clamp(p.dueDay||5,1,28)),'Nhắc từ Sổ Trọ','FREQ=MONTHLY;BYMONTHDAY='+clamp(p.dueDay||5,1,28))}">${ic('cal',16)}Thu tiền hằng tháng</a></div>${p.rooms.filter(r=>r.tenant&&r.tenant.endDate&&r.tenant.endDate>=today).sort(byNo).map(r=>`<a class="li" style="text-decoration:none;color:inherit" target="_blank" rel="noopener" href="${gcal(`Hết hạn thuê phòng ${r.no} – ${r.tenant.name}`,r.tenant.endDate,`${p.name}. Liên hệ: ${r.tenant.phone||''}`)}"><span class="plate">${esc(r.no)}</span><span class="grow"><b>${esc(r.tenant.name)}</b><span>Hết hạn ${dmy(r.tenant.endDate)}</span></span>${ic('cal',18)}</a>`).join('')}</div>`).join('')}`};
 }
});

/* =========================== v2 actions & inputs =========================== */
Object.assign(A,{
 enterCode(){const el=document.getElementById('tenant-code');enterTenant(el?el.value:'',false)},
 exitTenant(){exitTenant()},
 sendReport(){sendReport()},
 viewPhoto(el){const d=el.dataset;push('photo',{id:d.id,f:d.f,pid:d.pid,m:d.m,key:d.key})},
 async savePhoto(){const q=topSheet().params;const r=rowOf(q.pid,q.m,q.key);try{const b=await photoBlob(q.id);if(!b)throw 0;saveFile(`DongHo_P${slug(r?r.roomNo:'')}_${slug(meterName(q.f))}_${q.m}.jpg`,b)}catch(e){toast('Không lấy được ảnh này')}},
 delPhoto(){const q=topSheet().params;ask('Xóa ảnh đồng hồ?','Chỉ số đã ghi vẫn giữ nguyên, chỉ xóa ảnh.','Xóa',()=>{const r=rowOf(q.pid,q.m,q.key);if(r&&r.photos&&r.photos[q.f]===q.id){const ph=Object.assign({},r.photos);delete ph[q.f];r.photos=ph;persist('b',billKey(q.pid,q.m))}dropLocalPhoto(q.id);pop();toast('Đã xóa ảnh')},true)},
 applyMeter(){
  const sh=topSheet();const st=sh.params;const v=sh.draft.value;if(v==null){toast('Nhập chỉ số mới');focusId('meter-val');return}
  const r=rowOf(st.pid,st.m,st.key);if(!r){pop();return}
  r[st.f+'1']=v;const nm=addMonth(st.m,1);const nr=rowOf(st.pid,nm,st.key);if(nr){nr[st.f+'0']=v;persist('b',billKey(st.pid,nm))}
  st.applied=true;if(st.photoId)attachPhoto(st);
  persist('b',billKey(st.pid,st.m));pop();toast(`Đã ghi ${meterName(st.f).toLowerCase()} ${num(v)}${st.upload==='uploading'?', ảnh đang được lưu':''}`);
 },
 openPortal(){push('portal',{rid:topSheet().params.rid})},
 genPortal(){const p=P();const t=p.rooms.find(r=>r.id===topSheet().params.rid).tenant;t.portal=newToken();persist('p',p.id);render();toast('Đã tạo mã phòng')},
 regenPortal(){const p=P();const rid=topSheet().params.rid;ask('Đổi mã phòng?','Mã cũ sẽ ngừng hoạt động. Bạn cần gửi mã mới cho người thuê.','Đổi mã',()=>{const t=p.rooms.find(r=>r.id===rid).tenant;if(t.portal)p.closedPortals.push(t.portal);t.portal=newToken();persist('p',p.id);render();toast('Đã đổi mã')})},
 offPortal(){const p=P();const rid=topSheet().params.rid;ask('Tắt trang người thuê?','Người thuê sẽ không xem được trang của phòng nữa.','Tắt trang',()=>{const t=p.rooms.find(r=>r.id===rid).tenant;if(t.portal)p.closedPortals.push(t.portal);t.portal='';persist('p',p.id);render();toast('Đã tắt trang người thuê')},true)},
 copyPortalMsg(){const p=P();const room=p.rooms.find(r=>r.id===topSheet().params.rid);const t=room.tenant;copyText(`Chào ${t.name}, đây là trang xem hóa đơn phòng ${room.no} – ${p.name}:\n${ARTIFACT_URL}\nMở link, đăng nhập Claude rồi nhập mã phòng: ${fmtCode(t.portal)}\nTrên trang có hóa đơn từng tháng, ảnh đồng hồ điện nước, mã QR chuyển khoản và chỗ báo hỏng hóc cho chủ trọ.`,'Đã chép lời nhắn, dán vào Zalo gửi người thuê')},
 async previewPortal(){const t=P().rooms.find(r=>r.id===topSheet().params.rid).tenant;toast('Đang mở trang người thuê…');clearTimeout(auxT);await flush();await runAux();enterTenant(t.portal,true)},
 openStatement(){push('image',{kind:'statement',pid:P().id,rid:topSheet().params.rid})},
 openDoc(el){push('doc',{kind:el.dataset.kind,rid:topSheet().params.rid})},
 async saveDoc(){const sh=topSheet();const p=P();const room=p.rooms.find(r=>r.id===sh.params.rid);if(!room||!room.tenant)return;const d=buildDoc(sh.params.kind,p,room,room.tenant);toast('Đang tạo file Word…');let blob;try{blob=await docxBlob(d.blocks)}catch(e){toast('Không tạo được file Word. Kiểm tra kết nối mạng.');return}saveFile(d.file,blob)},
 addMember(){const d=topSheet().draft;(d.members=d.members||[]).push({name:'',dob:'',gender:'',cccd:'',relation:''});render();setTimeout(()=>focusId(fid('members.'+(d.members.length-1)+'.name')),30)},
 delMember(el){topSheet().draft.members.splice(+el.dataset.i,1);render()},
 openRemind(){push('remind')},
 doneReport(el){markReport(el.dataset.uid,el.dataset.id)},
 addExp(){const p=P();const L=ensureLedger(p.id,ui.month);L.expenses.push({id:uid6(),name:'',amount:null,cat:EXP_CATS[0]});persist('b',billKey(p.id,ui.month));render();setTimeout(()=>focusId('exp-n-'+(L.expenses.length-1)),30)},
 delExp(el){const p=P();const L=ensureLedger(p.id,ui.month);L.expenses.splice(+el.dataset.i,1);persist('b',billKey(p.id,ui.month));render()}
});
Object.assign(INPUTS,{
 ledger(el){const p=P();const L=ensureLedger(p.id,ui.month);const v=toNum(el.value);L[el.dataset.f]=v==null?null:Math.max(0,v);persist('b',billKey(p.id,ui.month));refreshMoney(p)},
 exp(el){const p=P();const L=ensureLedger(p.id,ui.month);const x=L.expenses[+el.dataset.i];if(!x)return;if(el.dataset.f==='amount')x.amount=toNum(el.value);else x[el.dataset.f]=el.value;persist('b',billKey(p.id,ui.month));refreshMoney(p)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='tenant-code'){e.preventDefault();A.enterCode()}});

/* =========================== chốt số bằng ảnh: đi lần lượt từng phòng, từng đồng hồ =========================== */
function runTargets(pid,m){const out=[];for(const [key,r] of rowsSorted(pid,m))for(const f of meterFields(r))out.push({key,f,r});return out}
// Đồng hồ kế tiếp chưa có số mới, tính từ đồng hồ "after" (vòng lại từ đầu nếu cần).
function runNext(pid,m,after){const t=runTargets(pid,m);const i=after?t.findIndex(x=>x.key===after.key&&x.f===after.f):-1;
  for(let k=1;k<=t.length;k++){const x=t[(i+k+t.length)%t.length];if(x.r[x.f+'1']==null)return x}return null}
function runStep(run,tg){return{run,pid:run.pid,m:run.m,key:tg?tg.key:null,f:tg?tg.f:'e',url:null,blob:null,state:'none',conf:'',note:'',photoId:null,upload:'none',applied:false,typed:false}}
async function runLoad(sh,file){
  let blob;try{blob=await shrink(file)}catch(e){toast('Không mở được ảnh này, hãy chụp lại.');return}
  const st=sh.params;if(st.url){try{URL.revokeObjectURL(st.url)}catch(e){}}
  Object.assign(st,{url:URL.createObjectURL(blob),blob,state:readEngine()?'reading':'manual',engine:readEngine(),conf:'',note:'',photoId:null,upload:'none',typed:false});
  const r=rowOf(st.pid,st.m,st.key);sh.draft.value=r?r[st.f+'1']??null:null;
  storePhoto(st,()=>{if(topSheet()===sh&&sh.params===st)requestRender()});
  if(topSheet()===sh)render();
  if(readEngine())readMeter(sh);
}
function runAddPhotos(el){
  const files=[...(el.files||[])];el.value='';const sh=topSheet();if(!files.length||!sh||sh.type!=='meterRun')return;
  sh.params.run.queue.push(...files.slice(1));runLoad(sh,files[0]);
}
function runSetTarget(v){
  const sh=topSheet();if(!sh||sh.type!=='meterRun')return;const [key,f]=v.split('|');const st=sh.params;st.key=key;st.f=f;
  const r=rowOf(st.pid,st.m,key);if(!st.url||st.state!=='done')sh.draft.value=r?r[f+'1']??null:null;render();
}
Object.assign(SHEETS,{
 designs(sh){const p=S.props[sh.params.pid];const cnt=id=>p.rooms.filter(r=>roomUses(p,r,id)).length;const custom=p.rooms.filter(r=>r.layout).sort(byNo);
  const item=(id,name,l)=>`<button class="li" data-act="openLayout" data-did="${esc(id)}"><span class="mi" style="background:var(--accent-soft);color:var(--accent);width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none">${ic('cube',18)}</span><span class="grow"><b>${esc(name)}</b><span>${f2(l.W)} × ${f2(l.L)} m · trần ${f2(l.H)} m${l.loft.on?' · có gác':''}${l.wc.on?' · WC':''} · ${cnt(id)} phòng</span></span><span class="chev">${ic('chev',18)}</span></button>`;
  return{title:'Thiết kế phòng 3D',body:`<p class="small muted">Mỗi thiết kế là một mẫu phòng 3D. Chọn nhiều phòng dùng chung một thiết kế: sửa thiết kế thì các phòng đó đổi theo. Kiot mặt tiền thường rộng hơn, không gác: nên tạo thiết kế riêng cho kiot.</p>
   <div class="list">${item('default','Mẫu chung',p.layout)}${p.designs.map(x=>item(x.id,x.name,x.layout)).join('')}</div>
   ${custom.length?`<p class="small muted">Phòng có kích thước riêng: ${custom.map(r=>esc(r.no)).join(', ')}. Đổi trong trang chi tiết phòng.</p>`:''}
   <div class="btns"><button class="btn" data-act="newDesign">${ic('plus',18)}Thêm thiết kế</button><button class="btn" data-act="openSite">${ic('building',18)}Sơ đồ cả dãy 3D</button></div>`}},
 site(sh){const p=S.props[sh.params.pid];const d=sh.draft;const two=d.mode==='two';
  if(!p.rooms.length)return{title:'Sơ đồ dãy trọ 3D',body:'<p class="muted">Khu chưa có phòng nào. Thêm phòng ở tab Phòng trước.</p>'};
  const roles=siteRoles(p,d);const opts=two?[['kl','Kiot, bên trái'],['kr','Kiot, bên phải'],['l','Dãy trái'],['r','Dãy phải']]:[['k','Kiot mặt tiền'],['row','Dãy phía sau']];
  const rows=p.rooms.slice().sort(byNo).map(r=>{const up=(r.floor||1)>1;const o=up?opts.filter(([v])=>!v.startsWith('k')):opts;const cur=roles[r.id];
   return`<div class="li" style="gap:10px"><span class="plate">${esc(r.no)}</span><span class="grow"><b>Tầng ${r.floor||1}</b><span>${esc(r.layout?'Kích thước riêng':designName(p,r.design))}</span></span><select data-ch="siteRole" data-rid="${r.id}" aria-label="Vị trí phòng ${esc(r.no)}" style="width:auto;min-width:138px;flex:none">${o.map(([v,t])=>`<option value="${v}" ${v===cur?'selected':''}>${t}</option>`).join('')}</select></div>`}).join('');
  const body=`<div class="stage-pin"><div class="stage" data-3d="site">${stageOverlay(true)}</div></div>
   <div id="site-info" style="margin-top:12px">${siteInfoHTML(p,d)}</div>
   <div class="group"><h4>${ic('building',18)}Kiểu dãy trọ</h4>${seg('mode',d.mode,[['one','Một dãy'],['two','Hai dãy, hành lang giữa']])}
    ${two?'<p class="hint" style="margin:6px 0 0">Hai dãy phòng quay cửa vào nhau, hành lang ở giữa chạy từ đường vào.</p>':`<div class="fld" style="margin-top:10px"><span class="fl">Lối đi và cửa các phòng phía sau (nhìn từ đường vào)</span>${seg('side',d.side,[['left','Bên trái kiot'],['right','Bên phải kiot']])}<span class="hint">Lối đi chạy dọc từ đường vào, cửa các phòng phía sau quay ra lối đi này.</span></div>`}
    ${fld(two?'Hành lang rộng':'Lối đi rộng','cw',d.cw,{type:'number',sfx:'m',hint:'Thường 1,2–2 m. Có xe máy đi vào nên từ 1,5 m.'})}</div>
   <div class="group"><h4>${ic('door',18)}Vị trí từng phòng</h4><p class="small muted" style="margin:0 0 6px">Kiot quay mặt ra đường. Các phòng phía sau xếp từ ngoài đường vào theo số phòng. Phòng tầng trên xếp chồng lên theo cùng thứ tự.</p><div class="list">${rows}</div>
    <button class="btn sm" data-act="openDesigns" style="margin-top:8px">${ic('cube',16)}Thiết kế phòng (kiot, phòng thường…)</button></div>`;
  return{title:'Sơ đồ dãy trọ 3D',body,foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveSite">${ic('check',18)}Lưu sơ đồ</button>`};
 },
 readSet(sh){const d=sh.draft;const inClaude=!!window.claude;
  let body=`<div class="group">${tog('Tự đọc số khi chụp hoặc chọn ảnh','autoRead',d.autoRead,'Số đọc được điền sẵn vào ô Chỉ số mới. Bạn so với ảnh rồi bấm lưu.')}</div>`;
  if(caps.imgOK)body+=`<div class="banner" style="background:var(--ok-soft);color:var(--ok)">${ic('check',18)}<span>Đang mở trong app Claude: Claude đọc số, không cần khóa API.</span></div>`;
  else if(inClaude)body+=`<p class="small muted">Chế độ xem này không gửi được ảnh cho Claude, hãy nhập số bằng tay.</p>`;
  else body+=`<div class="card"><p style="margin:0 0 8px"><b>Hai cách đọc</b></p><p class="small" style="margin:0 0 6px"><b>Bộ đọc trên máy</b>: miễn phí, chạy ngay trên điện thoại, cần mạng lần đầu để tải (khoảng 5 MB). Đọc tốt khi ảnh chụp gần, rõ, thẳng ô số; hay nhầm khi ảnh lóa, mờ hoặc chụp xa.</p><p class="small" style="margin:0"><b>Claude API</b>: chính xác hơn nhiều. Cần khóa API của Anthropic (tạo tại console.anthropic.com) và có tính phí, ước khoảng 0,01–0,03 USD mỗi ảnh. Khi có khóa, app dùng Claude thay cho bộ đọc trên máy.</p></div>
   ${fld('Khóa Claude API (không bắt buộc)','key',d.key,{type:'password',full:1,ph:'sk-ant-…',hint:'Khóa chỉ lưu trong máy này, không nằm trong tệp sao lưu. Để trống để dùng bộ đọc trên máy.'})}`;
  return{title:'Đọc số trên ảnh',body,foot:`<button class="btn" data-act="back">Hủy</button><button class="btn pri" data-act="saveReadSet">${ic('check',18)}Lưu</button>`};
 },
 meterRun(sh){
  const st=sh.params;const run=st.run;const t=runTargets(run.pid,run.m);
  if(!t.length||!st.key)return{title:'Chốt số bằng ảnh',body:'<p class="muted">Chưa có hóa đơn tháng này. Tạo hóa đơn ở tab Hóa đơn trước.</p>'};
  const r=rowOf(run.pid,run.m,st.key);if(!r)return{title:'Chốt số bằng ảnh',body:'<p class="muted">Hóa đơn đã bị xóa.</p>'};
  const unit=st.f==='e'?'kWh':'m³';const left=t.filter(x=>x.r[x.f+'1']==null).length;const pa='data-ch="runPhoto"';
  const opts=t.map(x=>`<option value="${esc(x.key)}|${x.f}" ${x.key===st.key&&x.f===st.f?'selected':''}>P.${esc(x.r.roomNo)} · ${meterName(x.f)}${x.r[x.f+'1']!=null?' · đã có '+num(x.r[x.f+'1']):''}</option>`).join('');
  let body=`<p class="small muted">${monthLabel(run.m)} · còn ${left}/${t.length} đồng hồ chưa có số mới${run.saved?` · vừa ghi ${run.saved}`:''}${run.queue.length?` · ${run.queue.length} ảnh đang chờ`:''}</p>`;
  if(!left)body+=`<div class="banner" style="background:var(--ok-soft);color:var(--ok)">${ic('check',18)}<span>Tất cả đồng hồ tháng này đã có số mới. Chọn đồng hồ bên dưới nếu muốn chụp lại.</span></div>`;
  body+=`<label class="fld"><span class="fl">Đồng hồ</span><select id="run-target" data-ch="runTarget" aria-label="Chọn phòng và đồng hồ">${opts}</select></label>`;
  body+=st.url?`<img class="photo-big meter" src="${st.url}" alt="Ảnh đồng hồ ${meterName(st.f)} phòng ${esc(r.roomNo)}">${photoRedo(pa)}<div id="meter-status">${meterStatus(st)}</div>`
   :`<div class="run-empty">${ic('camera',30)}<p>Chụp đồng hồ <b>${meterName(st.f).toLowerCase()}</b> phòng <b>${esc(r.roomNo)}</b>.<br>Hoặc chọn nhiều ảnh đã chụp sẵn: ảnh được gán lần lượt theo thứ tự phòng, bạn đổi được ở ô Đồng hồ.</p><div class="btns"><label class="btn pri">${ic('camera',18)}Chụp ảnh${photoInput(pa,true)}</label><label class="btn">${ic('img',18)}Chọn ảnh${photoInput(pa,false,true)}</label></div></div>`;
  body+=`<label class="fld" style="margin-top:12px"><span class="fl">Chỉ số mới (${unit})</span><input type="number" inputmode="decimal" step="any" id="meter-val" class="reading" data-draft="value" data-type="num" value="${sh.draft.value??''}"></label><p class="small" id="meter-info">${meterInfo(st,sh.draft.value)}</p>${st.url&&uploadText(st)?`<p class="small muted">${uploadText(st)}</p>`:''}`;
  return{title:'Chốt số bằng ảnh',body,foot:`<button class="btn" data-act="runSkip">Bỏ qua</button><button class="btn pri" data-act="runSave">${ic('check',18)}Lưu, tiếp</button>`};
 }
});
Object.assign(A,{
 openSite(){const p=P();push('site',{pid:p.id},normSite(clone(p.site)))},
 saveSite(){const sh=topSheet();const p=S.props[sh.params.pid];const d=normSite(sh.draft);
  // Lưu vai trò đã thấy trên màn hình (kể cả phần tự chia hai dãy) để lần sau mở lại không đổi.
  d.roles=siteRoles(p,d);p.site=d;persist('p',p.id);pop();toast('Đã lưu sơ đồ dãy trọ')},
 openReadSet(){push('readSet',{},{autoRead:autoReadOn(),key:getApiKey()})},
 saveReadSet(){const d=topSheet().draft;S.settings.autoRead=!!d.autoRead;persist('s');
  if(!window.claude){const k=String(d.key||'').trim();if(k&&!/^sk-ant-/.test(k)){toast('Khóa API Claude thường bắt đầu bằng sk-ant-');focusId('f-key');return}setApiKey(k)}
  pop();toast(readEngine()?'Đã lưu. Cách đọc: '+ENGINE_NAME[readEngine()]:'Đã tắt tự đọc số')},
 openRun(){const p=P();const m=ui.month;const run={pid:p.id,m,queue:[],saved:0};const tg=runNext(p.id,m,null)||runTargets(p.id,m)[0];const st=runStep(run,tg);
  const r=tg?rowOf(p.id,m,tg.key):null;push('meterRun',st,{value:r?r[tg.f+'1']??null:null})},
 runSkip(){const sh=topSheet();const st=sh.params;const tg=runNext(st.pid,st.m,{key:st.key,f:st.f});
  if(!tg||(tg.key===st.key&&tg.f===st.f)){toast('Không còn đồng hồ nào khác chưa có số');return}runSetTarget(tg.key+'|'+tg.f)},
 runSave(){
  const sh=topSheet();const st=sh.params;const run=st.run;const v=sh.draft.value;if(v==null){toast('Nhập chỉ số mới');focusId('meter-val');return}
  const r=rowOf(st.pid,st.m,st.key);if(!r){pop();return}
  r[st.f+'1']=v;const nm=addMonth(st.m,1);const nr=rowOf(st.pid,nm,st.key);if(nr){nr[st.f+'0']=v;persist('b',billKey(st.pid,nm))}
  st.applied=true;if(st.photoId)attachPhoto(st);persist('b',billKey(st.pid,st.m));run.saved++;
  toast(`Đã ghi ${meterName(st.f).toLowerCase()} P.${r.roomNo}: ${num(v)}`);
  const tg=runNext(st.pid,st.m,{key:st.key,f:st.f});
  if(!tg){const q=run.queue.length;pop();toast(`Đã chốt đủ số tất cả đồng hồ${q?`, còn ${q} ảnh chưa dùng`:''}`);return}
  sh.params=runStep(run,tg);sh.draft={value:null};sh.scroll=0;render();
  if(run.queue.length)runLoad(sh,run.queue.shift());
 }
});

/* =========================== sao lưu: nhắc nhở, Google Drive, tự sao lưu trên Android =========================== */
// Ba lớp bảo vệ khi chạy ngoài Claude (dữ liệu chỉ nằm trên máy):
//  A. Google Drive của chính chủ trọ qua Google Apps Script (src/drive-script.gs): tự sao lưu khi có thay đổi và mỗi ngày.
//  B. App Android tự ghi bản sao mỗi ngày vào Tải xuống/SoTro/SaoLuuTuDong (còn lại sau khi gỡ app).
//  C. Nhắc trên Tổng quan khi lâu chưa sao lưu.
const LS_BK='sotro.backup.v1',LS_DRIVE='sotro.drive.v1';
const DRIVE_SCRIPT='@DRIVE_SCRIPT@';
function bkGet(){return lsGet(LS_BK)||{}}
function bkSet(o){lsSet(LS_BK,Object.assign(bkGet(),o))}
function markBackedUp(){bkSet({last:Date.now()})}
function hasRealData(){return Object.values(S.props).some(p=>!p.demo)}
function driveRaw(){return lsGet(LS_DRIVE)||{}}
function driveCfg(){const c=driveRaw();return c.url&&c.key?c:null}
function driveSet(o){lsSet(LS_DRIVE,Object.assign(driveRaw(),o))}
const fmtTime=t=>t?new Date(t).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'}):'';
function driveStatusText(){const c=driveCfg();if(!c)return'Chưa cài · tự sao lưu lên Drive của bạn, lấy lại khi gỡ app hay đổi máy';if(c.lastErr&&(c.errAt||0)>(c.last||0))return'Lỗi: '+c.lastErr;return c.last?'Đã sao lưu lúc '+fmtTime(c.last):'Đã kết nối, chưa sao lưu lần nào'}
function backupBoot(){if(!bkGet().since)bkSet({since:Date.now()});
  const run=()=>{autoDrive();androidAutoBackup()};setTimeout(run,15000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(run,5000)})}

// ---------- C. nhắc sao lưu ----------
function backupBanner(){
  if(mode!=='local'||!hasRealData())return'';const b=bkGet(),now=Date.now();if((b.snooze||0)>now)return'';const c=driveCfg();
  if(c){const age=now-(c.last||b.since||now);if(age<3*864e5)return'';
    return`<div class="banner wide">${ic('alert',18)}<span class="grow">Sao lưu Google Drive ${c.last?`đã ${Math.floor(age/864e5)} ngày chưa chạy được`:'chưa chạy được lần nào'}.${c.lastErr?' '+esc(c.lastErr):''}</span><div class="btns"><button class="btn sm" data-act="openDrive">Xem</button></div></div>`}
  // App Android tự lưu mỗi ngày thì chỉ nhắc mỗi tháng (bản tự lưu nằm trên máy, mất máy vẫn mất).
  const autoOk=b.autoTs&&now-b.autoTs<3*864e5;const last=b.last||b.since||now;const days=Math.floor((now-last)/864e5);if(days<(autoOk?30:7))return'';
  return`<div class="banner wide">${ic('alert',18)}<span class="grow">${b.last?`Đã ${days} ngày chưa sao lưu ra ngoài máy.`:'Bạn chưa sao lưu dữ liệu ra ngoài máy lần nào.'} Gỡ app, mất máy hay lỡ xóa dữ liệu trình duyệt là mất hết phòng, hóa đơn, ảnh đồng hồ.</span><div class="btns"><button class="btn sm" data-act="openDrive">${ic('upload',16)}Tự sao lưu lên Drive</button><button class="btn sm" data-act="backupZip">Sao lưu ra tệp</button><button class="btn sm" data-act="snoozeBackup">Để sau</button></div></div>`;
}

// ---------- A. Google Drive ----------
async function driveCall(c,action,extra){
  let r;try{r=await fetch(c.url,{method:'POST',body:JSON.stringify(Object.assign({key:c.key,action},extra||{}))})}catch(e){throw{code:'offline'}}
  if(!r.ok)throw{code:'http'};let j;try{j=await r.json()}catch(e){throw{code:'not_script'}}
  if(!j||!j.ok)throw{code:(j&&j.error)||'error',message:j&&j.message};return j;
}
const DRIVE_ERR={offline:'Không kết nối được Google. Kiểm tra mạng, và script phải triển khai với “Người có quyền truy cập: Bất kỳ ai”.',http:'Google từ chối yêu cầu, kiểm tra lại URL ứng dụng web.',not_script:'URL này không phải ứng dụng web của script Sổ Trọ.',bad_key:'Mật mã không khớp: script trên Google không phải bản chép từ máy này. Chép mã script lại và triển khai lại.',busy:'Drive đang bận, app sẽ thử lại sau.',server:'Script gặp lỗi trên Google.',not_found:'Không tìm thấy tệp trên Drive.',bad_backup:'Tệp trên Drive không phải bản sao lưu Sổ Trọ.'};
const driveErr=e=>DRIVE_ERR[e&&e.code]||('Lỗi không rõ'+(e&&e.message?': '+e.message:''));
const DRIVE_URL_RE=/^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[\w-]+\/exec$/;
let driveT=null,driveBusy=false,driveProg='';
function driveDirty(){if(mode!=='local'||!driveCfg())return;if(!driveRaw().dirty)driveSet({dirty:true});clearTimeout(driveT);driveT=setTimeout(autoDrive,60000)}
// Tự sao lưu: sau khi dữ liệu đổi (cách lần trước ít nhất 10 phút), và ít nhất mỗi ngày một lần.
function autoDrive(){const c=driveCfg();if(mode!=='local'||!c||driveBusy||!hasRealData())return;const now=Date.now();
  if(!c.dirty&&now-(c.last||0)<864e5)return;const wait=(c.last||0)+10*60000-now;
  if(c.dirty&&wait>0){clearTimeout(driveT);driveT=setTimeout(autoDrive,wait+1000);return}
  driveBackup(false)}
function refreshDriveSheet(){const sh=topSheet();if(sh&&sh.type==='drive')requestRender()}
async function driveBackup(manual){
  const c=driveCfg();if(!c)return false;if(driveBusy){if(manual)toast('Đang sao lưu, chờ chút…');return false}
  if(!hasRealData()){if(manual)toast('Chưa có dữ liệu của bạn để sao lưu (đang là dữ liệu mẫu)');return false}
  driveBusy=true;
  try{
    // Ảnh đồng hồ chỉ tải lên một lần, bản sao lưu dữ liệu nhỏ nên lưu nhiều bản.
    const have=new Set(c.photos||[]);const ids=[...photoRefs()].filter(id=>isLocalPh(id)&&!have.has(id));let i=0;
    for(const id of ids){i++;driveProg=`Đang tải ảnh đồng hồ ${i}/${ids.length}…`;refreshDriveSheet();const v=await phGet(id).catch(()=>null);if(!v)continue;
      await driveCall(c,'putPhoto',{name:id+'.jpg',type:v.type||'image/jpeg',data:await blobToBase64(new Blob([v.buf]))});have.add(id);if(i%5===0)driveSet({photos:[...have]})}
    driveSet({photos:[...have]});driveProg='Đang lưu dữ liệu…';refreshDriveSheet();
    const d=new Date();const json=backupJSON();driveSet({dirty:false});
    try{await driveCall(c,'save',{name:`SoTro_${todayISO()}_${pad(d.getHours())}${pad(d.getMinutes())}.json`,json})}catch(e){driveSet({dirty:true});throw e}
    driveSet({last:Date.now(),lastErr:''});markBackedUp();if(manual)toast('Đã sao lưu lên Google Drive');return true;
  }catch(e){driveSet({lastErr:driveErr(e),errAt:Date.now()});if(manual)toast('Chưa sao lưu được: '+driveErr(e));return false}
  finally{driveBusy=false;driveProg='';refreshDriveSheet()}
}
function driveKey(){let k=driveRaw().pendingKey;if(!k){k=newToken()+newToken()+newToken();driveSet({pendingKey:k})}return k}
async function loadDriveList(sh){try{sh.params.files=(await driveCall(driveCfg(),'list')).files}catch(e){sh.params.err=driveErr(e)}if(topSheet()===sh)render()}
async function restorePhotosFromDrive(){
  const c=driveCfg();if(!c)return;const ids=[...photoRefs()].filter(isLocalPh);let names;
  try{names=new Set((await driveCall(c,'photos')).names)}catch(e){toast('Đã khôi phục dữ liệu, chưa tải được ảnh: '+driveErr(e));return}
  const need=[];for(const id of ids){const v=await phGet(id).catch(()=>null);if(!v&&names.has(id+'.jpg'))need.push(id)}
  driveSet({photos:ids.filter(id=>names.has(id+'.jpg'))});
  if(!need.length){toast('Đã khôi phục dữ liệu');return}
  toast(`Đã khôi phục dữ liệu. Đang tải ${need.length} ảnh đồng hồ…`);let ok=0;
  for(const id of need){try{const g=await driveCall(c,'getPhoto',{name:id+'.jpg'});const bin=Uint8Array.from(atob(g.data),ch=>ch.charCodeAt(0));await phPut(id,{buf:bin.buffer,type:g.type||'image/jpeg',at:Date.now()});ok++}catch(e){}}
  render();toast(`Đã tải ${ok}/${need.length} ảnh đồng hồ từ Drive`);
}
async function driveConnectWith(url,key,thenRestore){
  if(!DRIVE_URL_RE.test(url)){toast('URL phải có dạng https://script.google.com/macros/s/…/exec');return}
  toast('Đang kết nối Google Drive…');let j;
  try{j=await driveCall({url,key},'ping')}catch(e){toast(driveErr(e));return}
  let photos=[];try{photos=(await driveCall({url,key},'photos')).names.map(n=>n.replace(/\.jpg$/,''))}catch(e){}
  driveSet({url,key,folder:j.folder||'',email:j.email||'',pendingKey:null,photos,last:0,lastErr:'',dirty:true});
  if(thenRestore){ui.sheets=ui.sheets.filter(x=>x.type!=='drive'&&x.type!=='restoreHub');push('drive',{},{});push('driveRestore',{files:null,err:''});loadDriveList(topSheet());toast('Đã kết nối. Chọn bản sao lưu để khôi phục.')}
  else{render();toast('Đã kết nối Google Drive');driveBackup(true)}
}

// ---------- B. App Android tự ghi bản sao mỗi ngày ----------
async function androidAutoBackup(){
  if(mode!=='local'||!window.SoTroAndroid||!SoTroAndroid.autoBackup||!hasRealData())return;
  const b=bkGet();if(b.autoDay===todayISO())return;
  try{await loadScript(URLS.zip)}catch(e){return}
  const z=new JSZip();z.file('sotro.json',backupJSON());
  // Kèm ảnh đồng hồ 2 tháng gần nhất cho tệp không quá lớn; đủ ảnh thì dùng Google Drive.
  const ms=new Set([curMonth(),addMonth(curMonth(),-1)]);
  for(const bl of Object.values(S.bills)){if(!ms.has(bl.month))continue;for(const r of Object.values(bl.rooms||{}))for(const id of Object.values(r.photos||{}))if(isLocalPh(id)){const v=await phGet(id).catch(()=>null);if(v)z.file('anh/'+id+'.jpg',v.buf)}}
  let ok=false;try{ok=SoTroAndroid.autoBackup(`SoTro_tudong_${todayISO()}.zip`,await blobToBase64(await z.generateAsync({type:'blob'})))}catch(e){}
  if(ok)bkSet({autoDay:todayISO(),autoTs:Date.now()});
}

Object.assign(SHEETS,{
 drive(sh){const c=driveCfg();const d=sh.draft;
  if(!c){const key=driveKey();
   return{title:'Sao lưu Google Drive',body:`<p>App tự sao lưu dữ liệu và ảnh đồng hồ lên <b>Google Drive của chính bạn</b>: sau mỗi lần thay đổi (cách nhau ít nhất 10 phút) và mỗi ngày. Gỡ app, mất máy hay lỡ xóa dữ liệu web vẫn lấy lại được. Dữ liệu không đi qua máy chủ nào khác.</p>
    <div class="group"><h4>${ic('key',18)}Đã cài trước đây, giờ cài lại app hoặc đổi máy?</h4>${fld('Mã kết nối','code',d.code,{full:1,ph:'https://script.google.com/…/exec#…',hint:'Mã kết nối có trong mục này trên máy cũ. Mất mã thì xem cách lấy lại ở cuối trang.'})}<button class="btn" data-act="driveConnectCode">${ic('upload',18)}Kết nối và khôi phục</button></div>
    <div class="group"><h4>${ic('cal',18)}Cài lần đầu, khoảng 5 phút</h4><ol class="steps">
     <li>Bấm <b>Chép mã script</b>. <button class="btn sm pri" data-act="driveCopyScript">${ic('copy',16)}Chép mã script</button></li>
     <li>Mở <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener"><b>script.google.com</b></a> bằng Gmail của bạn (tạo <b>Dự án mới</b>). Xóa hết chữ có sẵn, dán mã vừa chép, bấm biểu tượng <b>Lưu</b> (đĩa mềm).</li>
     <li>Bấm <b>Triển khai › Tùy chọn triển khai mới</b>. Ở “Chọn loại”, bấm bánh răng › <b>Ứng dụng web</b>. “Thực thi với tư cách”: <b>Tôi</b>. “Người có quyền truy cập”: <b>Bất kỳ ai</b>. Bấm <b>Triển khai</b>.</li>
     <li>Google hỏi cấp quyền: bấm <b>Cấp quyền truy cập</b>, chọn tài khoản. Nếu thấy “Google chưa xác minh ứng dụng này”: <b>Nâng cao › Đi tới… (không an toàn) › Cho phép</b>. Đây là script của chính bạn, chỉ ghi vào thư mục “Sổ Trọ - Sao lưu”.</li>
     <li>Chép <b>URL ứng dụng web</b> (đuôi <span class="mono">/exec</span>), dán vào ô dưới rồi bấm <b>Kết nối</b>.</li></ol>
     ${fld('URL ứng dụng web','url',d.url,{full:1,ph:'https://script.google.com/macros/s/…/exec'})}<button class="btn pri" data-act="driveConnect">${ic('check',18)}Kết nối</button></div>
    <details class="small muted"><summary style="cursor:pointer;font-weight:600">Mất mã kết nối?</summary><p style="margin-top:6px">Mở script.google.com › dự án đã tạo › <b>Triển khai › Quản lý các bản triển khai</b> để chép lại URL; mật mã nằm ở dòng <span class="mono">var KEY</span> trong mã. Mã kết nối = URL + dấu # + mật mã. Hoặc mở Google Drive › thư mục “Sổ Trọ - Sao lưu”, tải tệp .json mới nhất rồi dùng <b>Khôi phục từ tệp</b> (cách này không kèm ảnh).</p></details>
    <p class="hint">Mật mã của máy này: <span class="mono">${esc(key.slice(0,6))}…</span> (đã có sẵn trong mã script).</p>`}}
  const err=c.lastErr&&(c.errAt||0)>(c.last||0);const code=c.url+'#'+c.key;
  return{title:'Sao lưu Google Drive',body:`<div class="card stack"><div class="row"><span class="mi" style="background:var(--${err?'warn':'ok'}-soft);color:var(--${err?'warn':'ok'});width:36px;height:36px;border-radius:10px;display:grid;place-items:center">${ic(err?'alert':'check',20)}</span><div class="grow"><b>${err?'Lần sao lưu gần nhất bị lỗi':'Đang tự sao lưu'}</b><p class="small muted">${c.email?esc(c.email)+' · ':''}${c.last?'gần nhất '+fmtTime(c.last):'chưa sao lưu lần nào'}</p></div></div>
    ${err?`<div class="banner" style="margin:0">${ic('alert',18)}<span>${esc(c.lastErr)}</span></div>`:''}${driveProg?`<p class="small" style="color:var(--accent)">${esc(driveProg)}</p>`:''}
    <div class="btns"><button class="btn pri" data-act="driveBackupNow" ${driveBusy?'disabled':''}>${ic('upload',18)}Sao lưu ngay</button><button class="btn" data-act="openDriveRestore">${ic('refresh',18)}Khôi phục</button></div>
    ${c.folder?`<a class="btn sm" style="text-decoration:none" href="${esc(c.folder)}" target="_blank" rel="noopener">${ic('file',16)}Mở thư mục trên Drive</a>`:''}</div>
   <div class="group"><h4>${ic('key',18)}Mã kết nối, hãy cất kỹ</h4><p class="small" style="margin:0">Cài lại app, đổi máy, hay lỡ xóa dữ liệu: vào <b>Thiết lập › Sao lưu Google Drive</b>, dán mã này để lấy lại dữ liệu. Nên lưu vào <b>Zalo › Cloud của tôi</b>. Ai có mã này đọc được dữ liệu sao lưu, đừng gửi cho người khác.</p>
    <div class="mono small" style="word-break:break-all;background:var(--surface2);padding:10px;border-radius:10px">${esc(code)}</div><button class="btn sm" data-act="copy" data-text="${esc(code)}">${ic('copy',16)}Chép mã kết nối</button></div>
   <p class="small muted">Giữ 20 bản mới nhất và mỗi ngày một bản trong 90 ngày. Ảnh đồng hồ nằm trong thư mục con “anh”.</p>
   <button class="btn danger" data-act="driveDisconnect">Ngắt kết nối trên máy này</button>`};
 },
 driveRestore(sh){const q=sh.params;
  const list=q.files?(q.files.length?`<div class="list">${q.files.map(f=>`<button class="li" data-act="driveRestoreOne" data-id="${esc(f.id)}" data-t="${f.time}"><span class="grow"><b>${fmtTime(f.time)}</b><span>${esc(f.name)} · ${Math.max(1,Math.round(f.size/1024))} KB</span></span><span class="chev">${ic('chev',18)}</span></button>`).join('')}</div>`:'<p class="muted">Chưa có bản sao lưu nào trên Drive.</p>')
   :q.err?`<div class="banner">${ic('alert',18)}<span>${esc(q.err)}</span></div>`:'<p class="muted">Đang lấy danh sách từ Google Drive…</p>';
  return{title:'Khôi phục từ Google Drive',body:`<p class="small muted">Chọn bản sao lưu. Toàn bộ dữ liệu trên máy này sẽ được thay bằng bản đã chọn, ảnh đồng hồ được tải về sau.</p>${list}`}},
 restoreHub(){const mi=n=>`<span class="mi" style="background:var(--accent-soft);color:var(--accent);width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none">${ic(n,20)}</span>`;
  return{title:'Khôi phục dữ liệu',body:`<p>Lấy lại phòng, người thuê, hóa đơn, thiết kế 3D và ảnh đồng hồ đã sao lưu.</p>
   <div class="list"><button class="li" data-act="openDrive">${mi('upload')}<span class="grow"><b>Từ Google Drive</b><span>Nếu đã cài sao lưu Google Drive: dán mã kết nối.</span></span><span class="chev">${ic('chev',18)}</span></button>
   <label class="li" style="cursor:pointer">${mi('file')}<span class="grow"><b>Từ tệp sao lưu</b><span>${window.SoTroAndroid?'App Android tự lưu mỗi ngày ở Tải xuống › SoTro › SaoLuuTuDong (chọn tệp .zip mới nhất). Hoặc tệp bạn tự sao lưu.':'Tệp .zip hoặc .json bạn đã sao lưu (trong Tệp, iCloud Drive, Zalo…).'}</span></span><input type="file" accept=".json,.zip,application/json,application/zip" data-ch="restore" hidden><span class="chev">${ic('chev',18)}</span></label></div>`}}
});
Object.assign(A,{
 openDrive(){push('drive',{},{code:'',url:''})},
 openRestoreHub(){push('restoreHub',{},{})},
 snoozeBackup(){bkSet({snooze:Date.now()+3*864e5});render()},
 driveCopyScript(){copyText(DRIVE_SCRIPT.replace('__KEY__',driveKey()),'Đã chép mã script. Dán vào script.google.com')},
 driveConnect(){const d=topSheet().draft;driveConnectWith(String(d.url||'').trim(),driveKey(),false)},
 driveConnectCode(){const v=String(topSheet().draft.code||'').trim();const i=v.lastIndexOf('#');if(i<0){toast('Mã kết nối gồm URL, dấu # và mật mã');return}driveConnectWith(v.slice(0,i),v.slice(i+1),true)},
 driveBackupNow(){driveBackup(true).then(()=>refreshDriveSheet());refreshDriveSheet()},
 openDriveRestore(){push('driveRestore',{files:null,err:''});loadDriveList(topSheet())},
 driveRestoreOne(el){const id=el.dataset.id;const t=+el.dataset.t;
  ask('Khôi phục bản sao lưu?',`Bản lưu lúc ${fmtTime(t)}. Toàn bộ dữ liệu hiện tại trên máy này sẽ được thay thế.`,'Khôi phục',async()=>{
   toast('Đang tải bản sao lưu…');
   try{const j=await driveCall(driveCfg(),'get',{id});let d;try{d=JSON.parse(j.json)}catch(e){throw{code:'bad_backup'}}if(!d||d.app!=='sotro'||!d.props)throw{code:'bad_backup'};
    applyBackup(d);driveSet({dirty:false,last:Date.now(),lastErr:''});restorePhotosFromDrive()}catch(e){toast('Không khôi phục được: '+driveErr(e))}},true)},
 driveDisconnect(){ask('Ngắt kết nối Google Drive?','Máy này sẽ thôi tự sao lưu. Các bản đã sao lưu vẫn còn trên Drive, dán mã kết nối để nối lại.','Ngắt kết nối',()=>{lsSet(LS_DRIVE,{});render();toast('Đã ngắt kết nối')},true)}
});

/* =========================== app Android (vỏ WebView, xem thư mục android/) =========================== */
// Ghi ngay các thay đổi đang chờ khi app bị ẩn, để Android tắt app nền cũng không mất dữ liệu vừa nhập.
function flushNow(){if(pending.size){clearTimeout(flushT);flush()}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNow()});
window.addEventListener('pagehide',flushNow);
function blobToBase64(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const s=String(r.result);res(s.slice(s.indexOf(',')+1))};r.onerror=()=>rej(r.error);r.readAsDataURL(b)})}
async function androidSave(filename,data){
  try{
    const b=data instanceof Blob?data:new Blob([data],{type:'application/octet-stream'});
    // Bên Android tự hiện thông báo đã lưu, kèm nút Mở và Chia sẻ.
    SoTroAndroid.saveFile(filename,b.type||'',await blobToBase64(b));return true
  }catch(e){toast('Không lưu được tệp');return false}
}
// Phiên bản app Android (rỗng khi chạy trên trình duyệt hoặc app cũ chưa có bộ cập nhật).
function androidVersion(){try{return window.SoTroAndroid&&SoTroAndroid.appVersion?String(SoTroAndroid.appVersion()):''}catch(e){return''}}
Object.assign(A,{checkUpdate(){try{SoTroAndroid.checkUpdate()}catch(e){toast('Bản app này chưa có bộ cập nhật, hãy tải bản mới trên GitHub')}}});
// Nút Quay lại của Android: đóng lớp trên cùng, rồi về trang chủ; trả false thì app thoát.
window.sotroAndroid={
  back(){if(ui.sheets.length){pop();return true}if(ui.tab!=='home'){ui.tab='home';render();window.scrollTo(0,0);return true}return false},
  flush:flushNow
};

/* =========================== toast & boot =========================== */
let toastT=null;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},3200)}
boot();
