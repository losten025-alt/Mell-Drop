/* ================= Утилиты ================= */
/* Защита от показа сайта во фрейме на чужой странице (clickjacking) */
try{if(window.top!==window.self){document.documentElement.innerHTML='';throw 0}}catch(e){}
var sb=null,user=null,isAdmin=false,started=false;
var MK=null,mkq={s:'',r:'',o:'new',mine:false};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const coin=()=>'<svg class="coin" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.2" fill="var(--yel)"/><circle cx="6" cy="6" r="3.2" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1"/></svg>';
/* Картинки: только растровые data:-URL ограниченного размера (svg не пускаем) */
const okImg=u=>typeof u==='string'&&u.length<900000&&/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(u)?u:'';
const cleanId=s=>String(s==null?'':s).replace(/[^\w-]/g,'').slice(0,40);
const str=(v,n)=>String(v==null?'':v).slice(0,n);
const clampN=(v,a,b,df)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):df};
const RC=['#8a93a8','#4fd36a','#3d8bff','#b45cff','#ff2bd6','#ff3b4e','#ffd23a'];
const RN=['Обычная','Необычная','Редкая','Эпическая','Легендарная','Аркана','Безымянная'];
const RE=['Common','Uncommon','Rare','Epic','Legendary','Arcane','Nameless'];
const NR=RN.length;
const newId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
function flash(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}

/* ================= Конфиг (то, что редактируется в настройках) ================= */
const K_S='mell-state-v1',K_C='mell-config-v1',K_D='mell-draft-v1',K_SEEN='mell-seen-v1';
function defCfg(){
  const raw=[
   [0,'Кот в шоке',15],[0,'Дед с пивом',20],[0,'Бабка с семками',25],[0,'Вайб в 4 утра',30],[0,'Стул без ножки',18],
   [1,'Огурец-босс',70],[1,'Лысый вайб',90],[1,'Пельмень судьбы',110],[1,'Сосед сверху',130],
   [2,'Кринж-колобок',250],[2,'Золотой кринж',320],[2,'Шаурма-король',400],
   [3,'Мемный дедлайн',800],[3,'Лютый хомяк',1000],[3,'Платиновый лол',1300],
   [4,'Клоун в короне',3000],[4,'Пиксельный батя',4000],
   [5,'Тот самый мем',12000],[5,'Золотой унитаз',18000],
   [6,'Безымянный мем',60000]];
  return {v:2,site:{name:'Мелл Дроп'},
    welcome:{on:true,title:'Добро пожаловать в Мелл Дроп',sub:'Кейсы, апгрейды и контракты на виртуальные монеты',
      text:'Открывай кейсы, собирай мемы разной редкости, крути апгрейдер и подписывай контракты.\nМонеты виртуальные: ничего не покупается и не выводится.',btn:'Войти в игру',img:'',bonus:1000},
    market:{fee:5,minPct:10,maxPct:1000,maxLots:20},
    items:raw.map((a,i)=>({id:'m'+(i+1),r:a[0],n:a[1],p:a[2],img:''})),
    cases:[
      {id:'c1',n:'Дворовый',img:'',price:null,w:[60,26,9,3.5,1.2,.25,.05],pool:[]},
      {id:'c2',n:'Элитный',img:'',price:null,w:[25,32,24,12,5,1.6,.4],pool:[]},
      {id:'c3',n:'Золотой ящик',img:'',price:null,w:[0,10,30,30,20,8,2],pool:[]}]};
}
/* Старые настройки (5 редкостей) переносятся на новые 7: 0->0, 1->2, 2->3, 3->4, 4->5 */
const MIG=[0,2,3,4,5];
function normalize(c){
  const d=defCfg();if(!c||typeof c!=='object')return d;
  const old=!(+c.v>=2);
  const mapR=r=>{r=Math.max(0,Math.round(+r||0));return old?MIG[Math.min(4,r)]:Math.min(NR-1,r)};
  const mapW=w=>{const o=new Array(NR).fill(0);w=Array.isArray(w)?w:[];
    if(old){MIG.forEach((nr,i)=>{o[nr]=clampN(w[i],0,1e6,0)})}else{for(let i=0;i<NR;i++)o[i]=clampN(w[i],0,1e6,0)}return o};
  const sw=c.site&&typeof c.site==='object'?c.site:{},cw=c.welcome&&typeof c.welcome==='object'?c.welcome:{},cm=c.market&&typeof c.market==='object'?c.market:{};
  const dw=d.welcome,dm=d.market;
  const o={v:2,site:{name:str(sw.name||d.site.name,40)},
    welcome:{on:cw.on===undefined?dw.on:!!cw.on,title:str(cw.title==null?dw.title:cw.title,80),sub:str(cw.sub==null?dw.sub:cw.sub,120),
      text:str(cw.text==null?dw.text:cw.text,600),btn:str(cw.btn==null?dw.btn:cw.btn,30),img:okImg(cw.img),bonus:Math.round(clampN(cw.bonus,0,1e6,dw.bonus))},
    market:{fee:Math.round(clampN(cm.fee,0,50,dm.fee)),minPct:Math.round(clampN(cm.minPct,1,100,dm.minPct)),maxPct:Math.round(clampN(cm.maxPct,100,10000,dm.maxPct)),maxLots:Math.round(clampN(cm.maxLots,1,200,dm.maxLots))},
    items:[],cases:[]};
  const seen=new Set();
  (Array.isArray(c.items)?c.items:d.items).slice(0,500).forEach(x=>{if(!x)return;const id=cleanId(x.id);if(!id||seen.has(id))return;seen.add(id);
    o.items.push({id,n:str(x.n||'Без названия',60),r:mapR(x.r),p:Math.round(clampN(x.p,1,1e9,1)),img:okImg(x.img)})});
  const seenC=new Set();
  (Array.isArray(c.cases)?c.cases:d.cases).slice(0,50).forEach(x=>{if(!x)return;const id=cleanId(x.id);if(!id||seenC.has(id))return;seenC.add(id);
    o.cases.push({id,n:str(x.n||'Кейс',40),img:okImg(x.img),price:+x.price>0?Math.round(clampN(x.price,1,1e9,1)):null,w:mapW(x.w),pool:Array.isArray(x.pool)?x.pool.slice(0,500).map(cleanId).filter(Boolean):[]})});
  return o;
}
function loadCfg(){try{const raw=ls.get(K_C);if(raw)return normalize(JSON.parse(raw))}catch(e){}return defCfg()}
let CFG=loadCfg(),IDX={};
function reindex(){IDX={};CFG.items.forEach(x=>{IDX[x.id]=x})}
reindex();
let cfgT=null;
function saveCfg(){
  reindex();ls.set(K_D,'1');clearTimeout(cfgT);
  cfgT=setTimeout(()=>{if(!ls.set(K_C,JSON.stringify(CFG)))flash('Память браузера переполнена. Уменьши картинки или опубликуй в облако.')},300);
}

/* ================= Прогресс игрока ================= */
function loadState(){
  try{const j=JSON.parse(ls.get(K_S));
    if(j&&Array.isArray(j.inv))return {bal:Math.max(0,+j.bal||0),inv:j.inv.filter(x=>x&&x.id!=null).map(x=>({u:+x.u,id:String(x.id)})),uid:+j.uid||1,claimed:!!j.claimed}}catch(e){}
  return {bal:0,inv:[],uid:1,claimed:false};
}
let S=loadState();
function resetS(){S={bal:0,inv:[],uid:1,claimed:false}}
/* Без облака прогресс хранится локально. С облаком баланс и инвентарь живут только на сервере. */
function save(){if(!sb)ls.set(K_S,JSON.stringify(S))}
function applyState(st){
  S={bal:Number(st.balance)||0,inv:(Array.isArray(st.inventory)?st.inventory:[]).map(x=>({u:+x.u,id:String(x.id)})),uid:1,claimed:!!st.claimed};
  nextBonus=Date.now()+(+st.bonus_ms||0);isAdmin=!!st.admin;
  if(started)render();
}
async function rpc(fn,args){
  const {data,error}=await sb.rpc(fn,args||{});
  if(error)throw new Error(error.code==='P0001'?error.message:'Ошибка сервера, попробуй ещё раз');
  return data;
}
async function refresh(){if(!sb||!user||busy)return;try{applyState(await rpc('get_state'))}catch(e){flash(e.message)}}
function addItem(it){const u=S.uid++;S.inv.push({u,id:it.id});return u}
function invItems(){return S.inv.map(x=>({u:x.u,it:IDX[x.id]})).filter(x=>x.it).sort((a,b)=>b.it.p-a.it.p)}
function byUid(u){return S.inv.find(x=>x.u===u)}
function itOf(u){const x=byUid(u);return x?IDX[x.id]:null}

/* ================= Кейсы: шансы и цены ================= */
const avg=a=>a.reduce((s,x)=>s+x.p,0)/a.length;
function casePool(c){const set=c.pool&&c.pool.length?new Set(c.pool):null;return CFG.items.filter(x=>!set||set.has(x.id))}
function caseTables(c){
  const pool=casePool(c),by=RN.map((_,r)=>pool.filter(x=>x.r===r));
  let w=c.w.map((x,r)=>by[r].length?Math.max(0,+x||0):0),tot=w.reduce((a,b)=>a+b,0);
  if(!tot){w=by.map(a=>a.length?1:0);tot=w.reduce((a,b)=>a+b,0)}
  return {pool,by,w,tot};
}
function caseEV(c){const t=caseTables(c);if(!t.tot)return 0;return t.w.reduce((s,w,r)=>s+(w/t.tot)*(t.by[r].length?avg(t.by[r]):0),0)}
function autoPrice(c){return Math.max(10,Math.round(caseEV(c)*1.15/5)*5)}
function casePrice(c){return c.price>0?Math.round(c.price):autoPrice(c)}
function pickFrom(c){
  const t=caseTables(c);if(!t.tot)return null;
  let x=Math.random()*t.tot,r=0;
  for(;r<NR-1;r++){x-=t.w[r];if(x<0)break}
  if(!t.by[r].length||!t.w[r]){const ok=RN.map((_,k)=>k).filter(k=>t.w[k]>0&&t.by[k].length);r=ok[ok.length-1]}
  const p=t.by[r];return p[Math.floor(Math.random()*p.length)];
}

/* ================= Рисунки ================= */
function art(it){
  if(it.img)return `<img src="${esc(it.img)}" alt="${esc(it.n)}">`;
  const s=hash(it.id),c=RC[it.r],hue=(s*47+20)%360,ink='#1d1626';
  const e=s%3,m=(s>>3)%4,a=(s>>6)%3;
  const eyes=e===0?`<circle cx="40" cy="49" r="3.4" fill="${ink}"/><circle cx="60" cy="49" r="3.4" fill="${ink}"/>`
   :e===1?`<circle cx="40" cy="49" r="7.5" fill="#fff"/><circle cx="60" cy="49" r="7.5" fill="#fff"/><circle cx="42" cy="50" r="3.2" fill="${ink}"/><circle cx="58" cy="50" r="3.2" fill="${ink}"/>`
   :`<path d="M33 50q7-8 14 0M53 50q7-8 14 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  const mouth=m===0?`<path d="M38 64q12 12 24 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
   :m===1?`<ellipse cx="50" cy="67" rx="8" ry="6" fill="${ink}"/>`
   :m===2?`<path d="M39 67h22" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
   :`<path d="M38 71q12-10 24 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  const acc=a===1?`<g fill="none" stroke="${ink}" stroke-width="2.5"><rect x="31" y="42" width="17" height="14" rx="4"/><rect x="52" y="42" width="17" height="14" rx="4"/><path d="M48 48h4"/></g>`
   :a===2?`<path d="M35 61q7-6 15 0q8-6 15 0q-7 7-15 3q-8 4-15-3z" fill="#3a2a22"/>`:'';
  const top=it.r>=4?`<polygon points="31,30 36,13 43,26 50,10 57,26 64,13 69,30" fill="#ffc83a" stroke="#7a5200" stroke-width="2" stroke-linejoin="round"/>`
   :it.r>=2?`<path d="M27 38q23-30 46 0z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`:'';
  const spark=it.r>=4?`<path d="M14 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${c}"/><path d="M84 66l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="${c}"/>`:'';
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${esc(it.n)}"><circle cx="50" cy="54" r="30" fill="hsl(${hue} 55% 68%)" stroke="rgba(0,0,0,.35)" stroke-width="2"/>${eyes}${mouth}${acc}${top}${spark}</svg>`;
}
function crate(r){
  const c=RC[r];
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="12" y="30" width="96" height="52" fill="#141a35" stroke="${c}" stroke-width="3"/><rect x="8" y="16" width="104" height="20" fill="#1c2347" stroke="${c}" stroke-width="3"/><rect x="52" y="30" width="16" height="52" fill="${c}" fill-opacity=".35"/><rect x="52" y="16" width="16" height="20" fill="${c}" fill-opacity=".6"/><circle cx="60" cy="56" r="7" fill="${c}"/><circle cx="60" cy="56" r="2.5" fill="#060812"/></svg>`;
}
const caseColor=i=>[2,3,4,5,1][i%5];
function caseIcon(c,i){return c.img?`<img src="${esc(c.img)}" alt="${esc(c.n)}">`:crate(caseColor(i))}
function card(it,o={}){
  const insp=!o.mini&&!o.noinsp;
  const cls=['card','r'+it.r,o.mini?'mini':'',o.sel?'sel':'',o.on?'on':'',o.dim?'dim':''].filter(Boolean).join(' ');
  const iid=insp&&!o.sel?` data-iid="${esc(it.id)}"`:'';
  const eye=insp&&o.sel?`<button class="eye" type="button" data-iid="${esc(it.id)}" aria-label="Осмотр" title="Осмотр"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 3C4.5 3 2 8 2 8s2.5 5 6 5 6-5 6-5-2.5-5-6-5zm0 7.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg></button>`:'';
  return `<div class="${cls}" ${o.attrs||''}${iid}><div class="in">${eye}${o.chance?`<span class="ch">${o.chance}</span>`:''}<div class="art">${art(it)}</div><div class="nm">${esc(it.n)}</div><div class="meta"><span class="rl">${RN[it.r]}</span><span class="pr">${coin()}${fmt(o.price!=null?o.price:it.p)}</span></div>${o.extra||''}</div></div>`;
}

/* ================= Шапка и вкладки ================= */
let tab='inv',busy=false,selCase=null,upSel=new Set(),upTarget=null,ctSel=new Set(),res=null,sub='welcome',armed=null,nextBonus=0;
const canEdit=()=>!sb||isAdmin;
function logoHTML(){
  const n=String(CFG.site.name||'Мелл Дроп').trim().toUpperCase(),i=n.indexOf(' ');
  return i>0?esc(n.slice(0,i))+'<i>//</i>'+esc(n.slice(i+1)):esc(n);
}
function hdr(){
  $('#logo').innerHTML=logoHTML();
  const nm=String(CFG.site.name||'Мелл Дроп');if(document.title!==nm)document.title=nm;
  $('#bal').innerHTML=coin().replace('class="coin"','class="coin" style="width:20px;height:20px"')+`<span>${fmt(S.bal)}</span>`;
  const left=Math.ceil((nextBonus-Date.now())/1000),b=$('#bonus');
  if(left>0){b.disabled=true;b.textContent=`Бонус через ${left} с`}else{b.disabled=!!(sb&&!user);b.textContent='Бонус +50'}
  const au=$('#auth');au.hidden=!sb;au.textContent=user?'Выйти ('+String(user.email||'').split('@')[0]+')':'Войти';
  $('#sys').className='sys'+(sb?'':' off');
  $('#sys').textContent=sb?(user?'Вход выполнен'+(isAdmin?' · админ':''):'Нужен вход'):'';
  if(tab==='settings'&&!canEdit())tab='inv';
  if(tab==='market'&&!sb)tab='inv';
  const tabs=[['inv','Инвентарь']];
  if(sb)tabs.push(['market','Рынок']);
  tabs.push(['cases','Кейсы'],['upgrade','Апгрейдер'],['contract','Контракты']);
  if(canEdit())tabs.push(['settings','Настройки']);
  $('#tabs').innerHTML=tabs.map(([k,n])=>`<button class="tab ${tab===k?'on':''}" type="button" data-tab="${k}">${n}${k==='inv'?`<i>${invItems().length}</i>`:''}</button>`).join('');
}
setInterval(()=>{const left=Math.ceil((nextBonus-Date.now())/1000),b=$('#bonus');if(left>0){b.disabled=true;b.textContent=`Бонус через ${left} с`}else if(b.disabled&&!(sb&&!user)){hdr()}},500);
$('#bonus').addEventListener('click',async()=>{
  if(Date.now()<nextBonus||busy)return;
  if(sb){if(!user)return;try{applyState((await rpc('claim_bonus')).state)}catch(e){flash(e.message);refresh()}return}
  S.bal+=50;nextBonus=Date.now()+20000;save();hdr();
});

/* ================= Инвентарь (главная) ================= */
function viewInv(){
  const inv=invItems(),total=inv.reduce((s,x)=>s+x.it.p,0);
  const bar=`<div class="bar hud"><div class="line"><b>${inv.length}</b> предметов на <b>${coin()}${fmt(total)}</b></div><div class="grp"><button class="btn pri sm" type="button" data-tab="cases">Открыть кейс</button>${sb?'<button class="btn sm" type="button" data-tab="market">Рынок</button>':''}</div></div>`;
  const grid=inv.length?`<div class="grid">${inv.map(({u,it})=>card(it,{attrs:`data-u="${u}"`,extra:sb?`<button class="btn sm sell" type="button" data-list="${u}">На рынок</button>`:''})).join('')}</div>`
    :`<div class="empty"><span>Здесь пока пусто. Открой первый кейс, и дроп появится в инвентаре.</span><button class="btn pri" type="button" data-tab="cases">К кейсам</button></div>`;
  return `<h2>Твой инвентарь</h2>`+bar+grid;
}

/* ================= Рынок (игроки продают друг другу, цену ставит продавец) ================= */
const MC=()=>Object.assign({fee:5,minPct:10,maxPct:1000,maxLots:20},CFG.market||{});
function mkLimits(it){const m=MC();return {min:Math.max(1,Math.ceil(it.p*m.minPct/100)),max:Math.max(1,Math.floor(it.p*m.maxPct/100))}}
async function mkLoad(){
  if(!sb||!user)return;
  try{MK=await rpc('market_browse')}catch(e){flash(e.message);if(!MK)MK=[]}
  if(tab==='market')render();
}
function mkList(){
  let a=(MK||[]).map(l=>({l,it:IDX[l.item]})).filter(x=>x.it&&!!x.l.mine===!!mkq.mine);
  const q=mkq.s.trim().toLowerCase();
  if(q)a=a.filter(x=>x.it.n.toLowerCase().includes(q));
  if(mkq.r!=='')a=a.filter(x=>x.it.r===+mkq.r);
  if(mkq.o==='asc')a.sort((x,y)=>x.l.price-y.l.price);
  else if(mkq.o==='desc')a.sort((x,y)=>y.l.price-x.l.price);
  else if(mkq.o==='rar')a.sort((x,y)=>y.it.r-x.it.r||y.l.price-x.l.price);
  return a;
}
function mkGridHTML(){
  if(MK===null)return '<div class="empty">Загрузка лотов…</div>';
  const a=mkList();
  if(!a.length)return `<div class="empty">${mkq.mine?'У тебя нет лотов. Открой инвентарь и нажми «На рынок» у предмета.':'Подходящих лотов нет.'}</div>`;
  return `<div class="grid">${a.map(({l,it})=>{
    const btn=l.mine?`<button class="btn sm sell danger" type="button" data-cancel="${l.id}">Снять с продажи</button>`
      :`<button class="btn sm sell" type="button" data-buy="${l.id}" ${S.bal<l.price?'disabled':''}>${armed==='buy:'+l.id?'Точно?':'Купить'}</button>`;
    return card(it,{price:l.price,extra:`<div class="mkref">Реком. ${fmt(it.p)}</div>`+btn});
  }).join('')}</div>`;
}
function drawMk(){const g=$('#mkGrid');if(g)g.innerHTML=mkGridHTML()}
function viewMarket(){
  const m=MC(),mine=(MK||[]).filter(l=>l.mine).length;
  return `<h2>Рынок</h2><p class="hint">Продавец сам ставит цену. Комиссия рынка ${m.fee}% берётся с продавца при сделке. Выставить предмет можно в инвентаре.</p>
  <div class="mkbar hud"><input type="search" placeholder="Поиск по названию" maxlength="40" data-mk="s" value="${esc(mkq.s)}" aria-label="Поиск">
   <select data-mk="r" aria-label="Редкость"><option value="">Все редкости</option>${RN.map((n,r)=>`<option value="${r}" ${mkq.r===String(r)?'selected':''}>${n}</option>`).join('')}</select>
   <select data-mk="o" aria-label="Сортировка">${[['new','Новые'],['asc','Дешевле'],['desc','Дороже'],['rar','По редкости']].map(([k,n])=>`<option value="${k}" ${mkq.o===k?'selected':''}>${n}</option>`).join('')}</select>
   <div class="grp"><button class="chip ${mkq.mine?'':'on'}" type="button" data-mkmode="all">Все лоты</button><button class="chip ${mkq.mine?'on':''}" type="button" data-mkmode="mine">Мои (${mine})</button><button class="btn sm" type="button" data-act="mkrefresh">Обновить</button></div></div>
  <div id="mkGrid">${mkGridHTML()}</div>`;
}
function onMk(e){const el=e.target;if(!el.dataset||!el.dataset.mk)return;mkq[el.dataset.mk]=String(el.value);drawMk()}
document.addEventListener('input',onMk);
document.addEventListener('change',onMk);
function updCalc(){
  const inp=$('#mkPrice'),out=$('#mkCalc');if(!inp||!out)return;
  const it=IDX[inp.dataset.item];if(!it)return;
  const lim=mkLimits(it),v=Math.round(+inp.value);
  if(!(v>=lim.min&&v<=lim.max)){out.style.color='var(--bad)';out.textContent=`Цена должна быть от ${fmt(lim.min)} до ${fmt(lim.max)}`;return}
  out.style.color='var(--ok)';out.textContent=`Ты получишь ${fmt(v-Math.floor(v*MC().fee/100))} после комиссии`;
}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='mkPrice')updCalc()});
function listDialog(u){
  if(!sb)return;const it=itOf(u);if(!it)return;
  const lim=mkLimits(it);
  $('#dlgLayer').innerHTML=`<div class="ov" data-dlg="close"><div class="dlg" role="dialog" aria-modal="true"><p class="eyebrow">Выставить на рынок</p>${card(it,{noinsp:1})}
   <label class="fld"><span>Твоя цена, монет</span><input id="mkPrice" data-item="${esc(it.id)}" type="number" inputmode="numeric" min="${lim.min}" max="${lim.max}" step="1" value="${it.p}"></label>
   <p id="mkCalc" style="min-height:1.4em;font-size:13px"></p><p class="hint">Допустимо от ${fmt(lim.min)} до ${fmt(lim.max)}.</p>
   <div class="row"><button class="btn pri" type="button" data-dlg="list" data-u="${u}">Выставить</button><button class="btn" type="button" data-dlg="close">Отмена</button></div></div></div>`;
  updCalc();const i=$('#mkPrice');if(i){i.focus();i.select()}
}
async function doList(u){
  const inp=$('#mkPrice');if(!inp)return;
  const price=Math.round(+inp.value);if(!(price>=1)){flash('Укажи цену');return}
  busy=true;
  try{const r=await rpc('market_list',{p_uid:u,p_price:price});busy=false;$('#dlgLayer').innerHTML='';MK=null;applyState(r.state);flash('Лот выставлен');if(tab==='market')mkLoad()}
  catch(e){busy=false;flash(e.message)}
}
async function doBuy(id){
  busy=true;
  try{
    const r=await rpc('market_buy',{p_id:id});busy=false;
    MK=(MK||[]).filter(x=>x.id!==id);applyState(r.state);
    const it=IDX[r.item];if(it)showRes({head:'Куплено за '+fmt(r.paid),item:it,u:r.uid});
  }catch(e){busy=false;flash(e.message);mkLoad()}
}
async function doCancel(id){
  busy=true;
  try{const r=await rpc('market_cancel',{p_id:id});busy=false;MK=(MK||[]).filter(x=>x.id!==id);applyState(r.state);flash('Лот снят, предмет вернулся в инвентарь')}
  catch(e){busy=false;flash(e.message);mkLoad()}
}

/* ================= Кейсы ================= */
function curCase(){return CFG.cases.find(c=>c.id===selCase)||CFG.cases[0]||null}
function viewCases(){
  const c=curCase();
  if(!c)return `<div class="empty" style="margin-top:22px"><span>Кейсов пока нет.</span>${canEdit()?'<button class="btn pri" type="button" data-tab="settings">Добавить в настройках</button>':''}</div>`;
  const t=caseTables(c),price=casePrice(c);
  const strip=t.pool.length?Array.from({length:14},()=>card(pickFrom(c),{mini:1})).join(''):'';
  const drops=t.pool.filter(x=>t.w[x.r]>0).sort((a,b)=>b.r-a.r||b.p-a.p).map(x=>{
    const p=t.w[x.r]/t.tot/t.by[x.r].length*100;
    return card(x,{chance:(p<1?p.toFixed(2):p.toFixed(1))+'%'});
  }).join('');
  return `<div class="cases">${CFG.cases.map((x,k)=>`<button class="case ${x.id===c.id?'on':''}" type="button" data-case="${esc(x.id)}" style="--cc:${RC[caseColor(k)]}"><span class="ico">${caseIcon(x,k)}</span><b>${esc(x.n)}</b><span class="price">${coin()}${fmt(casePrice(x))}</span></button>`).join('')}</div>
  <div class="stage"><div class="roll hud"><div class="mark"></div><div class="clip"><div class="strip" id="strip">${strip}</div></div></div>
  <div class="act"><button class="btn pri big" type="button" id="openBtn" data-act="open" ${t.pool.length?'':'disabled'}>Открыть за ${coin()}${fmt(price)}</button></div></div>
  <h2>Что может выпасть</h2>${drops?`<div class="grid">${drops}</div>`:'<div class="empty">В этом кейсе нет мемов.</div>'}`;
}
async function openCase(){
  if(busy)return;
  const c=curCase();if(!c)return;
  busy=true;let win,st=null,u=null;
  try{
    if(sb){
      const r=await rpc('open_case',{p_case:c.id});
      win=IDX[r.item];st=r.state;u=r.uid;
      if(!win)throw new Error('Предмет не найден в каталоге. Обнови страницу.');
      S.bal=Number(st.balance)||0;
    }else{
      const price=casePrice(c);
      if(S.bal<price){busy=false;flash('Не хватает монет. Возьми бонус.');return}
      win=pickFrom(c);if(!win){busy=false;flash('В кейсе нет мемов');return}
      S.bal-=price;
    }
  }catch(e){busy=false;flash(e.message);if(sb)refresh();return}
  hdr();const ob=$('#openBtn');if(ob)ob.disabled=true;
  const W=48,N=58,arr=[];
  for(let k=0;k<N;k++)arr.push(k===W?win:pickFrom(c)||win);
  const strip=$('#strip'),clipW=strip.parentElement.clientWidth;
  strip.innerHTML=arr.map(it=>card(it,{mini:1})).join('');
  strip.style.transition='none';strip.style.transform='translateX(0)';void strip.offsetWidth;
  const step=132,jit=(Math.random()-.5)*88,x=clipW/2-(W*step+62+jit);
  strip.style.transition='transform 5.4s cubic-bezier(.1,.75,.12,1)';
  strip.style.transform=`translateX(${x}px)`;
  await wait(5600);
  if(sb)applyState(st);else{u=addItem(win);save()}
  hdr();busy=false;
  const b=$('#openBtn');if(b)b.disabled=false;
  showRes({head:'Выпало',cls:'win',item:win,sub:`${RN[win.r]} · стоимость ${fmt(win.p)}`,u,again:true});
}

/* ================= Апгрейдер ================= */
const UP_EDGE=0.93;
function upSum(){let s=0;upSel.forEach(u=>{const it=itOf(u);if(it)s+=it.p});return s}
function upChance(sum,t){return t?Math.min(90,sum/t.p*100*UP_EDGE):0}
function viewUp(){
  const inv=invItems();
  for(const u of [...upSel])if(!itOf(u))upSel.delete(u);
  const sum=upSum();
  const targets=sum>0?CFG.items.filter(x=>x.p>sum&&upChance(sum,x)>=1).sort((a,b)=>a.p-b.p):[];
  if(upTarget!==null&&!targets.find(x=>x.id===upTarget))upTarget=null;
  const t=upTarget!==null?IDX[upTarget]:null,ch=upChance(sum,t),C=2*Math.PI*86;
  const left=inv.length?`<div class="grid tight">${inv.map(({u,it})=>card(it,{sel:1,on:upSel.has(u),attrs:`data-up="${u}" tabindex="0"`})).join('')}</div>`
    :`<div class="empty">В инвентаре пусто. Открой кейс или возьми бонус.</div>`;
  const right=!sum?`<div class="empty">Выбери предметы слева, и здесь появятся цели.</div>`
    :targets.length?`<div class="grid tight">${targets.map(x=>card(x,{sel:1,on:upTarget===x.id,attrs:`data-target="${esc(x.id)}" tabindex="0"`,chance:upChance(sum,x).toFixed(1)+'%'})).join('')}</div>`
    :`<div class="empty">Для такой суммы целей нет. Добавь предметов.</div>`;
  return `<div class="up">
   <div class="panel"><h2>Твои предметы</h2><p class="hint">Выбери один или несколько. Их сумма станет ставкой.</p>${left}</div>
   <div class="ringbox"><div class="ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="86" fill="none" stroke="var(--mag)" stroke-opacity=".3" stroke-width="14"/><circle cx="100" cy="100" r="86" fill="none" stroke="var(--ok)" stroke-width="14" stroke-dasharray="${C*ch/100} ${C}" transform="rotate(-90 100 100)"/><circle cx="100" cy="100" r="70" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 5"/></svg><div class="needle" id="needle"></div><div class="rc"><b>${ch.toFixed(1)}%</b><span>шанс</span></div></div>
   <div class="line">Ставка <b>${fmt(sum)}</b> → цель <b>${t?fmt(t.p):'—'}</b></div>
   <button class="btn pri big" type="button" data-act="upgrade" ${sum&&t&&!busy?'':'disabled'}>Апгрейд</button></div>
   <div class="panel"><h2>Цель</h2><p class="hint">Чем дороже цель, тем ниже шанс.</p>${right}</div></div>`;
}
async function doUpgrade(){
  if(busy)return;
  const sum=upSum(),t=upTarget!==null?IDX[upTarget]:null;
  if(!sum||!t)return;
  busy=true;
  const ch=upChance(sum,t);let r,win,st=null,u=null;
  document.querySelectorAll('[data-act="upgrade"]').forEach(b=>b.disabled=true);
  try{
    if(sb){const x=await rpc('do_upgrade',{p_uids:[...upSel],p_target:t.id});r=+x.roll;win=!!x.win;st=x.state;u=x.uid}
    else{r=Math.random()*100;win=r<ch}
  }catch(e){busy=false;flash(e.message);if(sb)refresh();render();return}
  const nd=$('#needle');
  nd.style.transition='none';nd.style.transform='rotate(0deg)';void nd.offsetWidth;
  nd.style.transition='transform 4.6s cubic-bezier(.1,.7,.1,1)';
  nd.style.transform=`rotate(${360*5+r*3.6}deg)`;
  await wait(4800);
  if(sb)applyState(st);
  else{upSel.forEach(k=>{const i=S.inv.findIndex(x=>x.u===k);if(i>=0)S.inv.splice(i,1)});if(win)u=addItem(t);save()}
  upSel=new Set();upTarget=null;hdr();busy=false;
  if(win)showRes({head:'Апгрейд удался',cls:'win',item:t,sub:`Шанс был ${ch.toFixed(1)}%`,u});
  else{render();showRes({head:'Не повезло',cls:'lose',item:null,sub:`Ставка ${fmt(sum)} сгорела. Шанс был ${ch.toFixed(1)}%.`})}
}

/* ================= Контракты ================= */
function viewContract(){
  const inv=invItems();
  for(const u of [...ctSel])if(!itOf(u))ctSel.delete(u);
  let rar=null,sum=0;
  ctSel.forEach(u=>{const it=itOf(u);rar=it.r;sum+=it.p});
  const n=ctSel.size;
  const grid=inv.length?`<div class="grid tight">${inv.map(({u,it})=>{
    const off=it.r===NR-1||(rar!==null&&it.r!==rar);
    return card(it,{sel:1,on:ctSel.has(u),dim:off&&!ctSel.has(u),attrs:`data-ct="${u}" tabindex="0"`});
  }).join('')}</div>`:`<div class="empty">В инвентаре пусто. Открой кейс или возьми бонус.</div>`;
  const rule=rar===null?'Выбери 10 предметов одной редкости':`${RN[rar]} → ${RN[rar+1]}`;
  return `<h2>Контракт</h2><p class="hint">Отдай 10 предметов одной редкости и получи случайный предмет следующей. Безымянные в контракт не идут.</p>
  <div class="bar hud"><div class="line"><b>${n}/10</b> · ${rule} · сумма <b>${fmt(sum)}</b></div>
  <div class="grp"><button class="btn sm" type="button" data-act="ctclear" ${n?'':'disabled'}>Сбросить</button><button class="btn pri" type="button" data-act="contract" ${n===10&&!busy?'':'disabled'}>Подписать контракт</button></div></div>${grid}`;
}
async function doContract(){
  if(busy||ctSel.size!==10)return;
  let rar=null,ok=true,sum=0;
  ctSel.forEach(u=>{const it=itOf(u);if(!it){ok=false;return}sum+=it.p;if(rar===null)rar=it.r;else if(it.r!==rar)ok=false});
  if(!ok||rar===null||rar>=NR-1)return;
  busy=true;let out,u=null,st=null;
  try{
    if(sb){
      const x=await rpc('do_contract',{p_uids:[...ctSel]});
      out=IDX[x.item];u=x.uid;st=x.state;
      if(!out)throw new Error('Предмет не найден в каталоге. Обновись.');
    }else{
      const pool=CFG.items.filter(x=>x.r===rar+1);
      if(!pool.length){busy=false;flash('В следующей редкости нет мемов. Добавь их в настройках.');return}
      out=pool[Math.floor(Math.random()*pool.length)];
    }
  }catch(e){busy=false;flash(e.message);if(sb)refresh();return}
  if(sb)applyState(st);
  else{ctSel.forEach(k=>{const i=S.inv.findIndex(x=>x.u===k);if(i>=0)S.inv.splice(i,1)});u=addItem(out);save()}
  ctSel=new Set();busy=false;render();
  showRes({head:'Контракт выполнен',cls:'win',item:out,sub:`Отдано на ${fmt(sum)}, получено на ${fmt(out.p)}`,u});
}

/* ================= Диалог результата ================= */
const emblem=(c,cls)=>`<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 96 50 50 96 4 50z" fill="rgba(10,20,50,.7)" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M50 14 86 50 50 86 14 50z" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width="2"/><path d="M50 24l5.5 20.5L76 50 55.5 55.5 50 76 44.5 55.5 24 50 44.5 44.5z" fill="${c}"/></svg>`;
function plEl(it,cls,style,front){
  const h=art(it),attr=`class="pl ${cls}" style="${style}"`+(front?'':' aria-hidden="true"');
  return h.indexOf('<img ')===0?h.replace('<img ','<img '+attr+' draggable="false" '):h.replace('<svg ','<svg '+attr+' ');
}
let VW=null;
function stopViewer(){if(VW){cancelAnimationFrame(VW.raf);VW=null}}
function startViewer(){
  const vp=$('#vp'),sc=$('#vscene');if(!vp||!sc)return;
  const fl=$('#vfloor');
  const still=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const v={rx:-6,ry:still?15:-200,vx:0,vy:0,drag:false,lx:0,ly:0,idle:0,raf:0,intro:!still};
  VW=v;
  const apply=()=>{
    sc.style.transform=`rotateX(${v.rx}deg) rotateY(${v.ry}deg)`;
    fl.style.transform=`scaleX(${(.5+.5*Math.abs(Math.cos(v.ry*Math.PI/180))).toFixed(3)})`;
  };
  const tick=()=>{
    if(VW!==v)return;
    if(!v.drag){
      if(v.intro){v.ry+=(15-v.ry)*.07;if(Math.abs(15-v.ry)<.6)v.intro=false}
      else{
        v.ry+=v.vy;v.rx+=v.vx;v.vy*=.95;v.vx*=.9;v.idle++;
        if(!still&&v.idle>90)v.ry+=.3;
        v.rx+=(-6-v.rx)*.03;
      }
    }
    v.rx=Math.max(-35,Math.min(35,v.rx));
    apply();
    v.raf=requestAnimationFrame(tick);
  };
  vp.addEventListener('pointerdown',e=>{v.drag=true;v.intro=false;v.idle=0;v.lx=e.clientX;v.ly=e.clientY;v.vx=0;v.vy=0;vp.classList.add('grab');try{vp.setPointerCapture(e.pointerId)}catch(_){}});
  vp.addEventListener('pointermove',e=>{if(!v.drag)return;const dx=e.clientX-v.lx,dy=e.clientY-v.ly;v.lx=e.clientX;v.ly=e.clientY;v.ry+=dx*.7;v.rx-=dy*.5;v.vy=dx*.7;v.vx=-dy*.5});
  const end=()=>{v.drag=false;v.idle=0;vp.classList.remove('grab')};
  vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
  apply();v.raf=requestAnimationFrame(tick);
}
function openInspect(o){
  const it=o.item,rc=RC[it.r],N=8;
  let mid='';
  for(let i=0;i<N;i++){const z=(-.43+i*(.86/(N-1))).toFixed(3);mid+=plEl(it,'mid',`transform:translateZ(calc(var(--D)*${z}))`,false)}
  const sellBtn=sb&&o.u!=null&&byUid(o.u)?`<button class="btn" type="button" data-act="rmarket">На рынок</button>`:'';
  const again=o.again?'<button class="btn pri" type="button" data-act="ragain">Открыть ещё</button>':'';
  $('#layer').innerHTML=`<div class="inspx" role="dialog" aria-modal="true" aria-label="${esc(it.n)}" style="--rc:${rc}">
   <div class="ix-bg"></div>${emblem(rc,'ix-wm')}
   <div class="ix-stage" id="vp"><div class="vglow"></div><div class="vfloor" id="vfloor"></div>
    <div class="vwrap"><div class="vscene" id="vscene">${plEl(it,'bk','',false)}${mid}${plEl(it,'ft','',true)}</div></div></div>
   <div class="ix-head">${emblem(rc,'ix-em')}<div><h1>${esc(it.n)}<small>${esc(RN[it.r])}</small></h1><p>${esc(o.head)} · ${coin()}${fmt(it.p)}</p></div></div>
   <p class="ix-hint vhint">Крути пальцем или мышью</p>
   <div class="ix-foot"><button class="ixback" type="button" data-act="rclose">Назад</button><div class="ix-act">${sellBtn}${again}</div></div></div>`;
  startViewer();
}
function showRes(o){
  stopViewer();
  res=o;
  if(o.item){openInspect(o);return}
  $('#layer').innerHTML=`<div class="ov" data-act="rclose"><div class="dlg" role="dialog" aria-modal="true"><p class="eyebrow ${o.cls||''}">${esc(o.head)}</p><div class="empty" style="width:190px">Предмет не получен</div><p>${esc(o.sub||'')}</p><div class="row"><button class="btn" type="button" data-act="rclose">Закрыть</button></div></div></div>`;
}
function closeRes(){stopViewer();res=null;$('#layer').innerHTML='';render()}

/* ================= Приветствие ================= */
function showWelcome(preview){
  const w=CFG.welcome;
  $('#welLayer').innerHTML=`<div class="wel" role="dialog" aria-modal="true">${w.img?`<img class="wbg" src="${esc(w.img)}" alt="">`:''}
   <div class="wp hud"><span class="tag">// ${esc(CFG.site.name)}</span><h1>${esc(w.title)}</h1>${w.sub?`<p class="sub">${esc(w.sub)}</p>`:''}${w.text?`<p class="txt">${esc(w.text)}</p>`:''}
   <button class="btn pri big" type="button" data-wel="${preview?'preview':'go'}">${esc(w.btn||'Поехали')}</button>
   <span class="small">${preview?'Предпросмотр. Бонус не начисляется.':(w.bonus&&!S.claimed?`Стартовый бонус: ${fmt(w.bonus)} монет`:'Виртуальные монеты, без вывода')}</span></div></div>`;
}
function claimStart(){
  if(!sb&&!S.claimed){S.claimed=true;S.bal+=CFG.welcome.bonus;save()}
}

/* ================= Настройки ================= */
function viewSettings(){
  const nav=[['welcome','Приветствие'],['items','Мемы'],['cases','Кейсы'],['market','Рынок'],['data','Данные']];
  const head=`<div class="subnav">${nav.map(([k,n])=>`<button type="button" class="chip ${sub===k?'on':''}" data-sub="${k}">${n}</button>`).join('')}</div>`;
  const note=sb?'':'<p class="hint" style="margin-top:12px">Сайт работает без облака: изменения сохраняются только в этом браузере.</p>';
  return head+note+(sub==='welcome'?setWelcome():sub==='items'?setItems():sub==='cases'?setCases():sub==='market'?setMarket():setData());
}
const upBtn=(key,label)=>`<label class="btn sm">${label}<input type="file" accept="image/*" data-file="${esc(key)}"></label>`;
function armBtn(key,label,cls){return `<button type="button" class="btn sm danger ${cls||''}" data-del="${esc(key)}">${armed===key?'Точно?':label}</button>`}
function setWelcome(){
  const w=CFG.welcome;
  return `<div class="form hud">
   <label class="fld"><span>Название сайта</span><input data-sec="site" data-f="name" value="${esc(CFG.site.name)}" maxlength="40"></label>
   <label class="chk"><input type="checkbox" data-sec="welcome" data-f="on" ${w.on?'checked':''}> Показывать приветствие при первом заходе</label>
   <label class="fld"><span>Заголовок</span><input data-sec="welcome" data-f="title" value="${esc(w.title)}" maxlength="80"></label>
   <label class="fld"><span>Подзаголовок</span><input data-sec="welcome" data-f="sub" value="${esc(w.sub)}" maxlength="120"></label>
   <label class="fld"><span>Текст</span><textarea data-sec="welcome" data-f="text" maxlength="600">${esc(w.text)}</textarea></label>
   <div class="pick"><label class="fld" style="flex:1;min-width:160px"><span>Текст кнопки</span><input data-sec="welcome" data-f="btn" value="${esc(w.btn)}" maxlength="30"></label>
   <label class="fld" style="width:160px"><span>Стартовый бонус, монет</span><input type="number" min="0" step="1" data-sec="welcome" data-f="bonus" value="${w.bonus}"></label></div>
   <div class="fld"><span>Фоновая картинка</span><div class="pick"><div class="wthumb">${w.img?`<img src="${esc(w.img)}" alt="">`:'нет'}</div>${upBtn('welcome','Загрузить')}${w.img?`<button type="button" class="btn sm" data-act="wimgdel">Убрать</button>`:''}</div></div>
   <div><button type="button" class="btn pri" data-act="wpreview">Показать приветствие</button></div></div>`;
}
function setItems(){
  const rows=CFG.items.map(x=>`<div class="erow hud r${x.r}" ><div class="th" data-iid="${esc(x.id)}">${art(x)}</div>
   <div class="ef"><input class="in-name" data-sec="items" data-id="${esc(x.id)}" data-f="n" value="${esc(x.n)}" maxlength="60" placeholder="Название">
   <select data-sec="items" data-id="${esc(x.id)}" data-f="r">${RN.map((n,r)=>`<option value="${r}" ${x.r===r?'selected':''}>${n} · ${RE[r]}</option>`).join('')}</select>
   <input type="number" min="1" step="1" data-sec="items" data-id="${esc(x.id)}" data-f="p" value="${x.p}" placeholder="Цена"></div>
   <div class="ea">${upBtn('items:'+x.id,x.img?'Сменить иконку':'Иконка')}${x.img?`<button type="button" class="btn sm" data-noimg="items:${esc(x.id)}">Сбросить</button>`:''}${armBtn('items:'+x.id,'Удалить')}</div></div>`).join('');
  return `<label class="drop" id="bulkDrop">Нажми или перетащи сюда картинки сразу пачкой. Для каждой появится мем, название берётся из имени файла.<input type="file" accept="image/*" multiple data-bulk="items"></label>
  <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-act="additem">Добавить мем вручную</button></div>
  <div class="elist">${rows||'<div class="empty">Мемов нет. Загрузи картинки выше.</div>'}</div>`;
}
function infoHTML(c){
  const n=casePool(c).length;
  return n?`Средний выигрыш <b>${fmt(caseEV(c))}</b> · цена <b>${fmt(casePrice(c))}</b>${c.price?'':' (авто)'} · мемов в кейсе <b>${n}</b>`:'В кейсе нет мемов';
}
function setCases(){
  const panels=CFG.cases.map((c,i)=>{
    const all=!c.pool.length,set=new Set(c.pool);
    return `<div class="cpanel hud"><div class="chead"><div class="th">${caseIcon(c,i)}</div>
     <label class="fld"><span>Название кейса</span><input data-sec="cases" data-id="${esc(c.id)}" data-f="n" value="${esc(c.n)}" maxlength="40"></label>
     <label class="fld"><span>Цена, монет</span><input type="number" min="1" step="1" data-sec="cases" data-id="${esc(c.id)}" data-f="price" data-price="${esc(c.id)}" value="${c.price||''}" placeholder="авто ${autoPrice(c)}"></label>
     <div class="ca ea" style="display:flex;gap:6px;flex-wrap:wrap">${upBtn('cases:'+c.id,c.img?'Сменить иконку':'Иконка')}${c.img?`<button type="button" class="btn sm" data-noimg="cases:${esc(c.id)}">Сбросить</button>`:''}${armBtn('cases:'+c.id,'Удалить')}</div></div>
     <div><span class="lbl">Шансы по редкостям (в весах, сумма любая)</span><div class="odds" style="margin-top:8px">${RN.map((n,r)=>`<label class="odd r${r}"><span>${n}</span><input type="number" min="0" step="any" data-sec="cases" data-id="${esc(c.id)}" data-f="w" data-wi="${r}" value="${c.w[r]}"></label>`).join('')}</div></div>
     <div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><span class="lbl">Мемы в кейсе${all?' (все)':''}</span><button type="button" class="btn sm" data-poolall="${esc(c.id)}" ${all?'disabled':''}>Все мемы</button></div>
     <div class="pool">${CFG.items.map(x=>`<button type="button" class="chip r${x.r} ${all||set.has(x.id)?'on':''}" data-pool="${esc(c.id)}:${esc(x.id)}">${esc(x.n)}</button>`).join('')||'<span class="hint">Сначала добавь мемы.</span>'}</div></div>
     <div class="cinfo" data-info="${esc(c.id)}">${infoHTML(c)}</div></div>`;
  }).join('');
  return `<div style="margin-top:14px"><button type="button" class="btn sm" data-act="addcase">Добавить кейс</button></div>${panels||'<div class="empty" style="margin-top:14px">Кейсов нет.</div>'}`;
}
function setMarket(){
  const m=CFG.market;
  const f=(k,label,min,max)=>`<label class="fld"><span>${label}</span><input type="number" min="${min}" max="${max}" step="1" data-sec="market" data-f="${k}" value="${m[k]}"></label>`;
  return `<div class="form hud"><p class="hint">Правила рынка проверяет сервер. Изменения вступают в силу после «Опубликовать для всех» во вкладке «Данные».</p>
   ${f('fee','Комиссия с продавца, %',0,50)}${f('minPct','Минимальная цена лота, % от базовой цены мема',1,100)}${f('maxPct','Максимальная цена лота, % от базовой цены мема',100,10000)}${f('maxLots','Макс. лотов у одного игрока',1,200)}</div>`;
}
function setData(){
  const size=Math.round(JSON.stringify(CFG).length/1024);
  const cloud=sb?`<div class="fld"><span>Облако (видят все игроки)</span><div class="pick"><button type="button" class="btn pri sm" data-act="publish" ${isAdmin?'':'disabled'}>Опубликовать для всех</button><button type="button" class="btn sm" data-act="cloudload" ${isAdmin?'':'disabled'}>Загрузить из облака</button></div>${isAdmin?'':'<span class="hint">Нужен вход под админом. Как им стать, написано в README.</span>'}</div>`:'';
  return `<div class="form hud"><div class="line">Размер настроек: <b>${fmt(size)} КБ</b></div>${cloud}
   <div class="fld"><span>Резервная копия</span><div class="pick"><button type="button" class="btn sm" data-act="export">Скачать .json</button><label class="btn sm">Загрузить из файла<input type="file" accept="application/json,.json" data-import="1"></label></div></div>
   <div class="fld"><span>Сброс</span><div class="pick">${armBtn('reset-cfg','Вернуть стандартные мемы и кейсы')}${armBtn('reset-state','Сбросить мой прогресс')}</div></div></div>`;
}

/* ----- обработчики полей настроек ----- */
function onField(e){
  const el=e.target;if(!el.dataset||!el.dataset.sec)return;
  const sec=el.dataset.sec,f=el.dataset.f;
  let obj=sec==='site'?CFG.site:sec==='welcome'?CFG.welcome:sec==='market'?CFG.market:(sec==='items'||sec==='cases')?CFG[sec].find(x=>x.id===el.dataset.id):null;
  if(!obj)return;
  let v;
  if(el.type==='checkbox')v=el.checked;else if(el.type==='number')v=el.value===''?null:+el.value;else v=el.value;
  if(f==='w')obj.w[+el.dataset.wi]=Math.max(0,v||0);
  else if(sec==='items'&&f==='r')obj.r=Math.min(NR-1,Math.max(0,+v||0));
  else if(sec==='items'&&f==='p')obj.p=Math.max(1,Math.round(v||1));
  else if(sec==='cases'&&f==='price')obj.price=v>0?Math.round(v):null;
  else if(sec==='market'){const L={fee:[0,50],minPct:[1,100],maxPct:[100,10000],maxLots:[1,200]}[f];if(!L)return;obj[f]=Math.round(Math.min(L[1],Math.max(L[0],v==null?L[0]:v)))}
  else if(f==='bonus')obj.bonus=Math.max(0,Math.round(v||0));
  else obj[f]=v;
  saveCfg();
  if(sec==='site')hdr();
  if(sec==='cases'){
    const qid=CSS.escape(el.dataset.id);
    const inf=document.querySelector('[data-info="'+qid+'"]');if(inf)inf.innerHTML=infoHTML(obj);
    const pi=document.querySelector('[data-price="'+qid+'"]');if(pi)pi.placeholder='авто '+autoPrice(obj);
  }
  if(e.type==='change'&&el.tagName==='SELECT')render();
}
document.addEventListener('input',onField);
document.addEventListener('change',onField);

/* ----- загрузка картинок ----- */
function readImg(file,max,q){
  return new Promise((ok,bad)=>{
    const fr=new FileReader();
    fr.onload=()=>{const im=new Image();
      im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
        c.getContext('2d').drawImage(im,0,0,c.width,c.height);
        let u=c.toDataURL('image/webp',q);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/jpeg',q);ok(u)};
      im.onerror=()=>bad(new Error('img'));im.src=fr.result};
    fr.onerror=()=>bad(new Error('read'));fr.readAsDataURL(file);
  });
}
async function bulkAdd(files){
  let n=0;
  for(const f of files){
    if(!f.type||f.type.indexOf('image/')!==0)continue;
    try{const img=await readImg(f,320,.82);
      CFG.items.push({id:newId('m'),n:f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,60)||'Мем',r:0,p:20,img});n++}catch(e){}
  }
  if(n){saveCfg();render();flash(`Добавлено мемов: ${n}. Задай им редкость и цену.`)}else flash('Не получилось прочитать картинки');
}
document.addEventListener('change',async e=>{
  const el=e.target;
  if(el.dataset&&el.dataset.file&&el.files&&el.files[0]){
    const [sec,id]=el.dataset.file.split(':');
    try{
      if(sec==='welcome'){CFG.welcome.img=await readImg(el.files[0],1280,.72)}
      else if(sec==='items'||sec==='cases'){const o=CFG[sec].find(x=>x.id===id);if(o)o.img=await readImg(el.files[0],sec==='items'?320:360,.82)}
      saveCfg();render();
    }catch(err){flash('Не получилось прочитать картинку')}
  }else if(el.dataset&&el.dataset.bulk&&el.files){bulkAdd([...el.files]);el.value=''}
  else if(el.dataset&&el.dataset.import&&el.files&&el.files[0]){
    try{const txt=await el.files[0].text();CFG=normalize(JSON.parse(txt));saveCfg();render();flash('Настройки загружены')}catch(err){flash('Файл не подходит')}
  }
});
['dragover','dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{
  const d=e.target.closest&&e.target.closest('#bulkDrop');if(!d)return;
  e.preventDefault();
  if(ev==='dragover')d.classList.add('over');else d.classList.remove('over');
  if(ev==='drop'&&e.dataTransfer&&e.dataTransfer.files)bulkAdd([...e.dataTransfer.files]);
}));
function dlCfg(){
  const b=new Blob([JSON.stringify(CFG)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download='mell-drop-config.json';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function doDelete(key){
  if(key==='reset-cfg'){CFG=defCfg();saveCfg();flash('Стандартные мемы и кейсы возвращены');return}
  if(key==='reset-state'){
    if(sb){rpc('reset_progress').then(r=>{MK=null;applyState(r.state);flash('Прогресс сброшен')}).catch(e=>flash(e.message));return}
    S={bal:0,inv:[],uid:1,claimed:false};save();claimStart();flash('Прогресс сброшен');return}
  const [sec,id]=key.split(':');
  if(sec==='items'){CFG.items=CFG.items.filter(x=>x.id!==id);CFG.cases.forEach(c=>{c.pool=c.pool.filter(p=>p!==id)})}
  if(sec==='cases'){CFG.cases=CFG.cases.filter(x=>x.id!==id)}
  saveCfg();
}

/* ================= Облако (Supabase) ================= */
(function(){
  const C=window.MEMDROP_CONFIG||{};
  if(window.supabase&&C.SUPABASE_URL&&C.SUPABASE_ANON_KEY)sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);
})();
async function fetchCloudCfg(){
  if(!sb)return null;
  try{const {data,error}=await sb.from('site_config').select('data').eq('id',1).maybeSingle();
    if(error||!data||!data.data||!Array.isArray(data.data.items))return null;return normalize(data.data)}catch(e){return null}
}
async function publishCfg(){
  if(!sb||!user||!isAdmin){flash('Публиковать может только админ');return}
  const {error}=await sb.from('site_config').upsert({id:1,data:CFG});
  if(error){flash('Не получилось опубликовать. Проверь, что ты админ и что supabase.sql выполнен.');return}
  ls.del(K_D);flash('Опубликовано. Сервер уже использует новые шансы, цены и правила рынка.');
}
if(sb){
  resetS();
  sb.auth.onAuthStateChange((ev,session)=>{
    const was=user&&user.id;
    user=session?session.user:null;
    if(!user){isAdmin=false;resetS();MK=null;nextBonus=0}
    else if(was&&was!==user.id){resetS();MK=null}
    if(started)render();
    if(user&&(ev==='SIGNED_IN'||ev==='INITIAL_SESSION'))setTimeout(refresh,0);
  });
}
function authDialog(){
  $('#authLayer').innerHTML=`<div class="ov"><div class="dlg" role="dialog" aria-modal="true"><p class="eyebrow">Облачное сохранение</p>
  <input id="aem" type="email" placeholder="Почта" autocomplete="email" maxlength="254">
  <input id="apw" type="password" placeholder="Пароль, от 8 символов" autocomplete="current-password" maxlength="72">
  <p id="amsg" style="min-height:1.4em;font-size:13px"></p>
  <div class="row"><button class="btn pri" type="button" data-auth="in">Войти</button><button class="btn" type="button" data-auth="up">Регистрация</button><button class="btn" type="button" data-auth="close">Закрыть</button></div></div></div>`;
}
function authMsg(t,bad){const m=$('#amsg');if(m){m.textContent=t;m.style.color=bad?'var(--bad)':'var(--ok)'}}
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-auth]');if(!t||!sb)return;
  const a=t.dataset.auth;
  if(a==='open'){if(user){await sb.auth.signOut();user=null;isAdmin=false;resetS();MK=null;render();flash('Вышел. Прогресс остался на сервере.')}else authDialog();return}
  if(a==='close'){$('#authLayer').innerHTML='';return}
  const email=($('#aem').value||'').trim(),pw=$('#apw').value||'';
  if(!email||pw.length<8){authMsg('Введи почту и пароль от 8 символов',true);return}
  authMsg('Секунду…');
  if(a==='in'){const {error}=await sb.auth.signInWithPassword({email,password:pw});
    if(error)authMsg('Не вышло войти. Проверь почту и пароль.',true);else $('#authLayer').innerHTML='';}
  else if(a==='up'){const {data,error}=await sb.auth.signUp({email,password:pw});
    if(error)authMsg('Не вышло зарегистрироваться. Попробуй другой пароль или почту.',true);
    else if(data.session)$('#authLayer').innerHTML='';
    else authMsg('Готово. Подтверди почту по письму и войди.');}
});

/* ================= Каркас и события ================= */
function render(){
  if(!started)return;
  hdr();
  if(sb&&!user){$('#main').innerHTML='<div class="empty hud gate"><span>Прогресс, кейсы и рынок работают на сервере, поэтому нужен вход. Монеты виртуальные.</span><button class="btn pri big" type="button" data-auth="open">Войти или зарегистрироваться</button></div>';return}
  $('#main').innerHTML=tab==='inv'?viewInv():tab==='market'?viewMarket():tab==='cases'?viewCases():tab==='upgrade'?viewUp():tab==='contract'?viewContract():viewSettings();
}
function toggle(set,u,max){if(set.has(u))set.delete(u);else if(!max||set.size<max)set.add(u)}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab],[data-case],[data-up],[data-target],[data-ct],[data-list],[data-buy],[data-cancel],[data-dlg],[data-mkmode],[data-act],[data-sub],[data-pool],[data-poolall],[data-del],[data-noimg],[data-wel],[data-iid]');
  if(!t)return;
  const d=t.dataset;
  if(d.wel){$('#welLayer').innerHTML='';ls.set(K_SEEN,'1');if(d.wel==='go')claimStart();render();return}
  if(d.act==='rclose'){if(e.target===t||t.tagName==='BUTTON')closeRes();return}
  if(d.act==='rmarket'){if(res&&res.u!=null&&!busy){const u=res.u;closeRes();listDialog(u)}return}
  if(d.act==='ragain'){closeRes();openCase();return}
  if(d.dlg==='close'){if(e.target===t||t.tagName==='BUTTON')$('#dlgLayer').innerHTML='';return}
  if(busy)return;
  if(d.dlg==='list'){doList(+d.u);return}
  if(d.tab){tab=d.tab;render();if(tab==='market')mkLoad();return}
  if(d.list){listDialog(+d.list);return}
  if(d.mkmode){mkq.mine=d.mkmode==='mine';render();return}
  if(d.buy){
    const key='buy:'+d.buy;
    if(armed!==key){armed=key;render();setTimeout(()=>{if(armed===key){armed=null;if(tab==='market')render()}},2500);return}
    armed=null;doBuy(+d.buy);return;
  }
  if(d.cancel){doCancel(+d.cancel);return}
  if(d.case){selCase=d.case;render();return}
  if(d.up){toggle(upSel,+d.up);render();return}
  if(d.target){upTarget=upTarget===d.target?null:d.target;render();return}
  if(d.ct){toggle(ctSel,+d.ct,10);render();return}
  if(d.iid){const it=IDX[d.iid];if(it){const h=t.closest('[data-u]');showRes({head:'Осмотр',item:it,u:h?+h.dataset.u:null})}return}
  if(d.sub){sub=d.sub;render();return}
  if(d.noimg){const [sec,id]=d.noimg.split(':');const o=(sec==='items'||sec==='cases')?CFG[sec].find(x=>x.id===id):null;if(o){o.img='';saveCfg();render()}return}
  if(d.poolall){const c=CFG.cases.find(x=>x.id===d.poolall);if(c){c.pool=[];saveCfg();render()}return}
  if(d.pool){
    const [cid,iid]=d.pool.split(':'),c=CFG.cases.find(x=>x.id===cid);if(!c)return;
    let p=c.pool.length?c.pool.slice():CFG.items.map(x=>x.id);
    if(p.includes(iid)){if(p.length===1){flash('В кейсе должен остаться хотя бы один мем');return}p=p.filter(x=>x!==iid)}else p.push(iid);
    c.pool=p.length>=CFG.items.length?[]:p;saveCfg();render();return;
  }
  if(d.del){
    const key=d.del;
    if(armed!==key){armed=key;render();setTimeout(()=>{if(armed===key){armed=null;render()}},2500);return}
    armed=null;doDelete(key);render();return;
  }
  const a=d.act;
  if(a==='open')openCase();
  else if(a==='upgrade')doUpgrade();
  else if(a==='contract')doContract();
  else if(a==='ctclear'){ctSel=new Set();render()}
  else if(a==='mkrefresh')mkLoad();
  else if(a==='wpreview')showWelcome(true);
  else if(a==='wimgdel'){CFG.welcome.img='';saveCfg();render()}
  else if(a==='additem'){CFG.items.push({id:newId('m'),n:'Новый мем',r:0,p:20,img:''});saveCfg();render()}
  else if(a==='addcase'){CFG.cases.push({id:newId('c'),n:'Новый кейс',img:'',price:null,w:[50,28,13,6,2,.8,.2],pool:[]});saveCfg();render()}
  else if(a==='export')dlCfg();
  else if(a==='publish')publishCfg();
  else if(a==='cloudload'){fetchCloudCfg().then(c=>{if(c){CFG=c;reindex();ls.set(K_C,JSON.stringify(CFG));ls.del(K_D);render();flash('Загружено из облака')}else flash('В облаке пока нет настроек')})}
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.sel')){e.preventDefault();e.target.click()}
  if(e.key==='Escape'){const dl=$('#dlgLayer');if(dl&&dl.innerHTML)dl.innerHTML='';else if(res)closeRes()}
  if(res&&VW){const k=e.key;VW.intro=false;VW.idle=0;
    if(k==='ArrowLeft')VW.vy-=7;else if(k==='ArrowRight')VW.vy+=7;else if(k==='ArrowUp')VW.vx+=5;else if(k==='ArrowDown')VW.vx-=5}
});

/* ================= Старт ================= */
(async function boot(){
  if(sb){
    const c=await Promise.race([fetchCloudCfg(),wait(2500).then(()=>null)]);
    if(c&&ls.get(K_D)!=='1'){CFG=c;reindex()}
  }
  started=true;
  $('#boot').remove();
  render();
  if(CFG.welcome.on&&ls.get(K_SEEN)!=='1')showWelcome(false);
  else{ls.set(K_SEEN,'1');claimStart();render()}
})();
