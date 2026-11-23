/* 07-ui.js — 畫面：所有 render 函式（設定、配點骰子、事件、結算、升學、結局） */
"use strict";
/* 能力條的寬度：CSP 不允許 HTML 裡的 style="..."，所以用 data-w 標記，再用 JS 設定 .style.width（CSP 允許） */
function fillW(root=document){root.querySelectorAll('[data-w]').forEach(e=>{e.style.width=e.dataset.w+'%';e.removeAttribute('data-w')})}
if(typeof MutationObserver!=='undefined')new MutationObserver(()=>fillW()).observe(document.documentElement,{childList:true,subtree:true});
/* ================= RENDER ================= */
const $=id=>document.getElementById(id);
function renderTop(){const t=$('topbar');if(t)t.innerHTML=''}
function eduLine(){
  const p=[];if(S.edu.hs)p.push(S.edu.hs.n);if(S.edu.uni)p.push(uniName(S.edu.uni)+(dmList(S).length?`（${dmLabel(S)}）`:''));if(S.edu.night)p.push('科大進修部');if(S.edu.grad)p.push(`${S.edu.grad.n}${S.edu.grad.g}`);
  return p.join(' → ')||'國中';
}
function sidebar(){
  const s=S.st;
  const bars=SK.map(k=>`<div class="stat"><span>${STATN[k]}</span><div class="bar"><i class="${s[k]<25?'low':''}" data-w="${s[k]}"></i></div><span class="n">${s[k]}</span></div>`).join('');
  const certs=Object.keys(S.certs).map(k=>`<span class="badge cert">${k==='CPA'?'會計師':k}</span>`).join('');
  const fl=[[S.flags.c3&&!S.flags.skillCert,'會計丙級'],[S.flags.skillCert,'會計乙級'],[S.flags.award,'技藝競賽優勝'],[S.flags.intern,'實習經驗'],[S.flags.returnOffer,'四大預聘'],[S.flags.cs,'會寫程式'],[S.flags.fin,'財金背景'],[S.flags.accCredits&&!['acc','accinfo'].includes(S.edu.major),'會計學分'],[S.flags.research,'專題研究'],[S.flags.caseAward,'個案競賽冠軍'],[S.flags.cpaCram,'會計師補習'],[S.flags.master,'碩士'],[S.flags.hero,'吹哨者'],[S.flags.ai,'AI 大使']].filter(x=>x[0]).map(x=>`<span class="badge">${x[1]}</span>`).join('');
  const prog=Object.keys(EXAMS).filter(k=>EXAMS[k].subj&&!S.certs[k]&&examProg(k)).map(k=>`<span class="badge dim">${k==='CPA'?'會計師':k} ${examProg(k)}/${EXAMS[k].subj} ${k==='CFA'?'級':'科'}</span>`).join('');
  const J=S.job&&S.phase==='work'?JOBS[S.job.key]:null;
  const ranks=S.phase==='hs'&&S.hsRanks.length?`<div class="kv"><span>校排平均</span><span>前 ${Math.round(avg(S.hsRanks))}%</span></div>`:S.phase==='uni'&&S.uniRanks.length?`<div class="kv"><span>系排平均</span><span>前 ${Math.round(avg(S.uniRanks))}%</span></div>`:'';
  return `<div class="card"><h3>能力</h3>${bars}
    <div class="mt10">
    <div class="kv"><span>學歷</span><span class="t">${eduLine()}</span></div>
    ${ranks}
    ${S.phase!=='work'?`<div class="kv"><span>學習歷程</span><span>${S.port}</span></div>`:''}
    ${S.phase==='work'?`<div class="kv"><span>職稱</span><span class="t">${jobTitle()}</span></div>
    <div class="kv"><span>單位</span><span class="t">${J?J.name:'—'}</span></div>
    ${J&&!J.special?`<div class="kv"><span>本職級年資</span><span>${S.job.yrs} 年</span></div>`:''}
    <div class="kv"><span>總年資</span><span>${S.workYears} 年</span></div>
    <div class="kv"><span>本年績效</span><span>${S.perf}</span></div>`:''}
    ${S.fans?`<div class="kv"><span>粉絲</span><span>${S.fans} 萬</span></div>`:''}
    ${S.clients&&inJob(S,'selfbook','selfcpa')?`<div class="kv"><span>客戶數</span><span>${S.clients}</span></div>`:''}
    ${S.phase==='work'&&S.W?`<div class="kv"><span>景氣</span><span class="t">${ECON[econNow()][1]} ${ECON[econNow()][0]}・${SECTORS[eraOf(S.year).hot].n}</span></div>`:''}${S.phase==='work'&&S.lastLive?`<div class="kv"><span>FIRE 目標</span><span>${fmt(fireTarget())} 萬</span></div>`:''}${S.phase==='work'?`<div class="kv"><span>家庭</span><span class="t">${S.married?'已婚':'單身'}${S.kids?`・${S.kids} 個孩子`:''}${S.house?'・有房':''}</span></div>`:''}
    </div></div>
    <div class="card"><h3>稱號・特質・證照</h3><div class="badges">${titleBadges(S)}<span class="badge trait">${TRAITS[S.trait].name}</span>${fl}${certs}${prog}</div></div>
    <div class="card logcard"><h3>生涯紀錄</h3><div class="log">${S.log.slice().reverse().map(l=>`<div><span class="y">${l.y}・${l.a}</span>${l.t?`<b>${l.t}</b> `:''}${l.h}</div>`).join('')||'<div class="hint">人生的第一筆分錄還沒寫下。</div>'}</div></div>`;
}
function phaseBar(cur){
  const p=[['plan','年初・配點'],['e1','事件 1'],['e2','事件 2'],['e3','事件 3'],['yearend','年末・結算']];
  let c=cur;if(cur==='event'||cur==='evres')c='e'+(S.stage==='evres'?S.evN:S.evN+1);
  const idx=p.findIndex(x=>x[0]===c);
  return `<div class="phase">${p.map((x,i)=>`<span class="${i===idx?'on':i<idx?'done':''}">${x[1]}</span>`).join('')}</div>`;
}
function stageHead(){
  let sub;
  if(S.phase==='hs')sub=`${S.edu.hs.n}｜${identity()}`;
  else if(S.phase==='uni')sub=S.job?.key==='grad'?`${S.edu.grad.n} ${S.edu.grad.g}｜${identity()}`:`${uniName(S.edu.uni)}｜${identity()}`;
  else sub=`${jobTitle()}${S.job&&!S.job.special?`｜${JOBS[S.job.key].name}`:''}`;
  const money=`存款 <b class="${S.cash<0?'neg':''}">${fmt(S.cash)}</b> 萬${S.phase==='work'&&S.job?`・年薪 <b>${fmt(jobSalary())}</b> 萬`:''}`;
  return `<h2>${S.year} 年・${S.age} 歲</h2><p class="lead">${sub}<br><span class="money">${money}</span></p>`;
}
function pips(v){const L={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[Math.min(v,6)];return `<span class="pips">${[0,1,2,3,4,5,6,7,8].map(i=>`<i class="${L.includes(i)?'on':''}"></i>`).join('')}</span>`}
/* 能力骰（仿棒球人生）：先按「擲骰」才知道點數；之後照順序，點一下能力就把目前這顆骰子加進去 */
/* ===== 版型：左邊「故事紀錄」一張張卡片往下長，右邊「行動面板」放目前要做的選擇（仿棒球人生） ===== */
function whoLine(){
  if(S.phase==='pre')return '國三';
  if(S.phase==='hs')return `${S.edu.hs.n}｜${identity()}`;
  if(S.phase==='uni')return S.job?.key==='grad'?`${S.edu.grad.n} ${S.edu.grad.g}｜${identity()}`:`${uniName(S.edu.uni)}｜${identity()}`;
  return `${jobTitle()}${S.job&&!S.job.special?`｜${JOBS[S.job.key].name}`:''}`;
}
function lgGroup(fresh){if(!S.lg)S.lg=[];let g=S.lg[S.lg.length-1];if(!g||g.y!==S.year||(fresh&&g.cards.length&&g.who!==whoLine())){g={y:S.year,a:S.age,who:whoLine(),cards:[]};S.lg.push(g)}return g}
/* 同一個 key 只會寫一次，所以重繪畫面不會重複加卡片 */
function logPush(key,cls,title,html){if(!S.lgK)S.lgK={};if(S.lgK[key])return;S.lgK[key]=1;lgGroup(key.startsWith('st')).cards.push({key,cls,title,html})}
function logDrop(key){if(!S.lgK||!S.lgK[key])return;delete S.lgK[key];for(const g of S.lg||[])g.cards=g.cards.filter(c=>c.key!==key)}
/* 每一頁只顯示「目前這一步」的卡片：年初一頁、每個事件各一頁、年末一頁 */
const PAGE_KEYS=['jr','kk','st','ev','ye','jh','dm'];
function isPageStart(k){return PAGE_KEYS.some(p=>k.startsWith(p))}
function pageCards(){
  const all=[];for(const g of S.lg||[])all.push(...g.cards);
  let i=all.length-1;while(i>0&&!isPageStart(all[i].key))i--;
  return {key:all[i]?all[i].key:'',cards:all.slice(Math.max(i,0))};
}
function stepLabel(){
  const st=S.stage;if(st==='dm')return '雙主修／輔系';
  if(st==='junior')return '會考前';if(st==='kaikao')return '會考放榜';if(st==='plan')return '年初';
  if(st==='event')return `事件 ${S.evN+1} / 3`;if(st==='evres')return `事件 ${S.evN} / 3`;
  if(st==='yearend')return '年末結算';if(st==='jobhunt')return '找工作';return '';
}
const MINI_KEYS=['roll','alloc','plan','jroll','jdone'];
function logHtml(){
  const P=pageCards();
  return P.cards.map((c,j)=>{const mini=MINI_KEYS.some(k=>c.key.startsWith(k));
    return `<div class="lc ${c.cls||''} ${mini?'mini':''} ${j===P.cards.length-1?'new':''}">${c.title?`<div class="lc-t">${c.title}</div>`:''}<div class="lc-b">${c.html}</div></div>`}).join('');
}
function pageHead(){
  return `<div class="pghead"><div class="pg1"><b>${S.year} 年・${S.age} 歲</b><span class="step">${stepLabel()}</span><button class="mrec" id="mrec">📖 紀錄</button></div>
    <div class="who">${whoLine()}　<span class="money">存款 <b class="${S.cash<0?'neg':''}">${fmt(S.cash)}</b> 萬${S.phase==='work'&&S.job?`・年薪 <b>${fmt(jobSalary())}</b> 萬`:''}</span></div>
    <div class="mstats">${SK.map(k=>`<span>${STATN[k]}<b>${S.st[k]}</b></span>`).join('')}</div></div>`;
}
let ACT=[];
/* 行動面板：標題、說明，和一排選項按鈕（主文字＋小字說明） */
function actHtml(title,sub,opts){
  ACT=opts||[];
  return `${title?`<div class="act-t">${title}</div>`:''}${sub?`<div class="act-s">${sub}</div>`:''}<div class="act-opts">${ACT.map((o,i)=>`<button class="ob ${o.main?'main':''} ${o.warn?'warn':''}" data-ob="${i}" ${o.dis?'disabled':''}>${o.t}${o.s?`<small>${o.s}</small>`:''}</button>`).join('')}</div>`;
}
function narrow(){return ui.mobile||window.innerWidth<=900}
function gameLayout(act,focus){
  $('main').innerHTML=`<div class="game"><section class="stage ${focus?'focus':''}">${pageHead()}<div class="scene" id="scene">${logHtml()}</div><div class="act" id="act">${act}</div></section>
    <aside class="side" id="side"><button class="mclose" id="mclose">✕ 關閉</button>${sidebar()}</aside></div>`;
  document.querySelectorAll('[data-ob]').forEach(b=>b.onclick=()=>{const o=ACT[+b.dataset.ob];if(o&&!o.dis)o.f()});
  $('mrec').onclick=()=>document.body.classList.add('drawer');
  $('mclose').onclick=()=>document.body.classList.remove('drawer');
  fillW();const sc=$('scene');if(sc)sc.scrollTop=sc.scrollHeight;
}
function diceLine(dice){return `<div class="minidice">擲出 <b>${dice.length}</b> 顆骰：${dice.map(v=>`<span class="md ${v===6?'six':''}">${v}</span>`).join('')}</div>`}
function gainChips(g,unit){return chipHtml(SK.filter(k=>g[k]).map(k=>[STATN[k],g[k],unit||'']))||'<p class="hint">沒有帶來變化。</p>'}
function dicePts(dice,asg){const g={};dice.forEach((v,i)=>{if(asg[i])g[asg[i]]=(g[asg[i]]||0)+v});return g}

/* 能力骰配點：骰子一排，亮起來的是目前這顆；點一下能力就把它加進去 */
function diceWidget(o){
  const {p,dice,asg,st,prog,base}=o;
  const left=asg.filter(x=>!x).length,cur=asg.findIndex(x=>!x);const fl=ui.flash&&ui.flash.p===p?ui.flash:null;
  const allCap=SK.every(k=>st[k]>=100);const done=left===0||allCap;
  const rowsN=Math.ceil(dice.length/9)||1,colsN=Math.ceil(dice.length/rowsN);
  const bar=`<div class="dicebar dc${colsN}">${dice.map((v,i)=>`<div class="d6 ${asg[i]?'used':''} ${i===cur?'sel':''} ${v===6?'six':''}" data-v="${v}">${pips(v)}<small>${asg[i]?STATN[asg[i]]:''}</small></div>`).join('')}</div>`;
  const cue=done?`<div class="cue ok">骰子都分配完了！</div>`:`<div class="cue">剩 ${left} 顆　目前這顆：<b>${dice[cur]} 點</b>${SK.some(k=>diePts(dice[cur],k,S)!==dice[cur])?'<span class="pvn">（有稱號加成，實際點數標在各能力旁）</span>':''}</div>`;
  const rows=SK.map(k=>{const c=COST(st[k]);const d=st[k]-base[k];const on=!done&&st[k]<100;
    return `<button class="abrow ${fl&&fl.k===k?'flash':''}" data-${p}s="${k}" title="${STATD[k]}" ${on?'':'disabled'}><span class="nm">${STATN[k]}</span><span class="bar2"><i data-w="${st[k]}"></i></span><span class="val">${st[k]}${d?`<em>+${d}</em>`:''}<small>${st[k]>=100?'滿級':`${prog[k]||0}/${c}`}${on&&cur>=0?`<b class="pv">+${diePts(dice[cur],k,S)}</b>`:''}</small></span><span class="fx">${fl&&fl.k===k?fl.t:''}</span></button>`}).join('');
  return `<div class="alloc2">${bar}${cue}<div class="abrows">${rows}</div>
    <div class="abbtm"><button class="ob" data-${p}undo="1" ${left<dice.length?'':'disabled'}>↩ 復原</button>${done?`<button class="ob main" data-${p}ok="1">${o.okText}</button>`:`<button class="ob" data-${p}auto="1">自動分配</button>`}</div>
    <p class="hint">數字下方是升級進度：能力越高，升一級要的點數越多；不滿一級的點數會存起來。</p></div>`;
}
function animDice(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.dicebar .d6').forEach((el,i)=>{const v=+el.dataset.v;el.classList.add('roll');
    const iv=setInterval(()=>{const q=el.querySelector('.pips');if(q)q.outerHTML=pips(1+Math.floor(rnd()*6))},70);
    setTimeout(()=>{clearInterval(iv);el.classList.remove('roll');const q=el.querySelector('.pips');if(q)q.outerHTML=pips(v)},300+i*90)});
}
function bindDice(p,o){
  const q=s=>document.querySelector(`[data-${p}${s}]`);
  document.querySelectorAll(`[data-${p}s]`).forEach(b=>b.onclick=()=>{const k=b.getAttribute(`data-${p}s`);const g=o.get();const i=g.asg.findIndex(x=>!x);if(i<0)return;
    const b0=g.st[k];o.put(i,k);const g2=o.get();if(!g2.asg[i])return;const got=g2.st[k]-b0;ui.flash={p,k,t:got>0?`+${got}`:'蓄力'};o.rerender()});
  if(q('undo'))q('undo').onclick=()=>{const g=o.get();let i=-1;g.asg.forEach((x,j)=>{if(x)i=j});if(i>=0)o.undo(i);ui.flash=null;o.rerender()};
  if(q('auto'))q('auto').onclick=()=>{o.auto();ui.flash=null;o.rerender()};
  if(q('ok'))q('ok').onclick=()=>{ui.flash=null;o.ok()};
}
function allocWidget(base,alloc,left,prefix){
  return SK.map(k=>{const n=alloc[k]||0;const v=allocVal(base[k],n);const nxt=allocVal(base[k],n+1)-v;
    return `<div class="alloc"><span title="${STATD[k]}">${STATN[k]}</span><div class="bar"><b data-w="${v}"></b><i data-w="${base[k]}"></i></div><span class="n">${v}${n?` <em>(+${v-base[k]})</em>`:''}</span><button class="pm" data-${prefix}m="${k}" ${n?'':'disabled'}>−</button><button class="pm" data-${prefix}p="${k}" ${left>0&&nxt>0?'':'disabled'} title="+${nxt}">+</button></div>`}).join('')
   +`<p class="hint m6t">每點 +3；能力 60 以上每點 +2，80 以上每點 +1。滑過能力名稱可看用途。</p>`;
}
function renderSetup(){
  const trs=Object.entries(TRAITS).map(([k,v])=>`<button class="opt ${ui.trait===k?'on':''}" data-tr="${k}"><b>${v.name}</b><small>${v.desc}</small></button>`).join('');
  $('main').innerHTML=`<div class="onepage"><div class="card setup">
    ${seasonBanner(currentSeason())}
    ${ui.challenge?`<div class="result mb12">🔗 朋友邀請你挑戰同一個世界（種子 ${esc(ui.seed)}）。同樣的世界，你會活出不一樣的人生嗎？</div>`:''}
    <h2>這是誰的人生？</h2>
    <div class="namebox"><input id="pname" maxlength="8" placeholder="輸入你的名字（可以不填）" value="${esc(ui.name||'')}" autocomplete="off"><span class="hint">名字會出現在故事裡</span></div>
    <h3 class="mt14">你是個什麼樣的人？</h3>
    <div class="opts">${trs}</div>
    <div class="row"><button class="btn big" id="go">開始人生 ▸</button></div>
    <div class="row"><button class="btn ghost" id="codex">📖 人生圖鑑 ${codexPct()}%</button>${installBtnHtml()}</div>
    <details class="more"><summary>其他設定（世界種子、字體）</summary>
      <div class="seedbox"><input type="text" id="seed" value="${esc(ui.seed)}" maxlength="12"><button class="btn ghost" id="reseed">換一個</button><span class="hint">同一個種子 + 同樣的選擇 = 同一段人生。</span></div>
      <div class="row"><button class="btn ghost" id="fs">${ui.big?'標準字':'大字'}</button></div>
    </details></div></div>`;
  document.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{ui.name=$('pname').value;ui.trait=b.dataset.tr;renderSetup()});
  $('pname').oninput=e=>{ui.name=e.target.value};
  bindInstall();$('codex').onclick=openCodex;
  $('reseed').onclick=()=>{ui.seed=String(Math.floor(100000+rnd()*900000));renderSetup()};
  $('seed').onchange=e=>{ui.seed=cleanSeed(e.target.value)||'1';renderSetup()};
  $('fs').onclick=()=>{ui.big=!ui.big;document.body.classList.toggle('big',ui.big);renderSetup()};
  $('go').onclick=()=>{ui.name=$('pname').value;ui.seed=cleanSeed($('seed').value)||ui.seed;newGame()};
  const more=document.querySelector('details.more');if(ui.moreOpen)more.open=true;more.ontoggle=()=>{ui.moreOpen=more.open};
}
function chooseHS(id){
  const h=HSS.find(x=>x.id===id);S.edu.hs=h;S.edu.hsKind=h.k;if(h.flag)S.flags[h.flag]=1;
  S.phase='hs';S.sy=1;S.log.push({y:S.year,a:S.age,t:'',h:`會考 ${KK_GRADE[S.kk.tier]}，進入${h.n}`});
  setupPlan();render();
}
function chipHtml(chips){return chips&&chips.length?`<div class="chips">${chips.filter(c=>c[1]).map(c=>`<span class="chip ${c[1]>0?'up':'dn'}">${c[0]} ${sign(c[1])}${c[2]||''}</span>`).join('')}</div>`:''}
function planFlavor(){
  if(S.phase==='hs'){
    if(S.sy>=4)return '重考的一年。補習班的冷氣很冷，但你的決心很熱。';
    const v=isVoc(S);
    return v?['高職新生，第一次摸到傳票和帳簿。','高二，檢定、競賽、統測，選擇變多了。','高三，統測倒數。技優、甄選、登記分發，你要走哪一條？'][S.sy-1]
            :['高一新生，一切都很新鮮。','高二，學習歷程要開始累積了。','高三，學測倒數。繁星、個申、分科，三條路都在前面。'][S.sy-1];
  }
  if(S.phase==='uni'){
    if(S.job?.key==='grad')return S.job.yrs?'碩二，論文和求職同時進行。':'碩一，修課、讀 paper、找指導教授。';
    return ['大一，初會、經濟學、微積分。','大二，中會讓很多人懷疑人生。','大三，審計、稅法、成會。實習與專題的分水嶺。','大四，研究所推甄、考試、還是直接就業？'][Math.min(S.sy,4)-1];
  }
  return S.job?JOBS[S.job.key].flavor:'目前沒有工作。積極投履歷，年底能拿到更多機會。';
}
function offersHtml(isFresh){
  return S.offers.map((o,i)=>{const J=JOBS[o.k];
    const sal=J.special?'收入浮動':`${J.lad[o.lvl][0]}・年薪約 ${J.lad[o.lvl][1]} 萬`;
    return `<div class="offer ${o.sp?'special':''}"><div><b>${J.name}</b>${o.why?` <span class="chip up">${o.why}</span>`:''}<div class="meta">${sal}${J.cost?`・初期投入 ${J.cost} 萬`:''}</div><div class="meta">${J.flavor}</div></div><button class="btn ${o.sp?'gold':''}" data-o="${i}">${S.job?'轉換跑道':'接受'}</button></div>`}).join('');
}
function bindOffers(){document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>acceptOffer(+b.dataset.o))}
/* 遊戲第一關：國中三年的累積（種子已鎖定） */
function renderJunior(){
  logPush('jr','story','國三・會考前',`<div class="story"><p>會考前最後一個月，教室後面的倒數牌翻到了「30」。你看著桌上那疊模擬考卷，回想這三年：是不是每天都有好好念書？還是把時間花在了別的地方？</p></div>`);
  let act;
  if(!S.jrolled)act=actHtml('國中三年的累積','回想這三年你最努力的是什麼。會考主要看「學力」和「英文」，但人生很長，體力和心態也很重要。',
    [{t:'🎲 擲骰',s:`${S.jd.length} 顆骰`,main:1,f:()=>{S.jrolled=true;logPush('jroll','','國中三年的累積',diceLine(S.jd));renderJunior();animDice()}}]);
  else act=`<div class="act-t">分配國中三年的累積</div><div class="act-s">點一下能力，就把亮起來的那顆骰子加進去</div>`+diceWidget({p:'j',dice:S.jd,asg:S.jasg,st:S.st,prog:S.prog,base:S.jb.st,okText:'參加國中會考 ▸'});
  gameLayout(act,S.jrolled);
  bindDice('j',{get:()=>({dice:S.jd,asg:S.jasg,st:S.st,prog:S.prog}),put:(i,k)=>{if(S.st[k]<100){S.jasg[i]=k;juniorRecalc()}},undo:i=>{S.jasg[i]=null;juniorRecalc()},
    auto:()=>autoJunior(),ok:()=>finishJunior(),rerender:renderJunior});
}
function renderKaikao(){
  const K=S.kk;
  logPush('kk','gold','國中會考放榜',`<div class="bigscore">${KK_GRADE[K.tier]}</div><p>${storyTok(K.tier===1?'全家人都在 LINE 群組裡轉發你的成績單。{rel}難得提早關了{shop}，說要帶你去吃火鍋。':K.tier===2?'成績不錯，前段高中、公立高商都可以選。{rel}在{shop}多送了隔壁鄰居一份{food}。':K.tier===3?'普普通通，但路還很多。{rel}拍拍你的肩：「{call}，考完就好。」':'考得不太理想。{rel}沒有罵你，只說：「高中職三年才是真正的開始。」')}</p>`);
  gameLayout(actHtml('要選哪一條路？','會考成績決定你能選的學校。',HSS.map(h=>{const ok=K.tier<=h.tier;
    return {t:h.n,s:`${h.desc}<br>${h.k==='voc'?'→ 統測／技優／四技':'→ 學測／繁星／個申／分科'}${ok?'':'｜會考成績未達'}`,dis:!ok,f:()=>chooseHS(h.id)}})));
}
function renderPlan(){
  const Y=S.year;
  logPush('st'+Y,'story',`新的一年`,`<div class="story">${storyFor()}</div>${newsLine()}`);
  let act;const acts=actionList();const exams=availExams();
  if(!S.rolled){
    act=actHtml('年初特訓','新的一年開始了。擲出能力骰，決定今年要在哪方面成長。',[{t:'🎲 擲骰',s:`${S.dice.length} 顆骰`,main:1,f:()=>{S.rolled=true;logPush('roll'+Y,'','年初特訓',diceLine(S.dice));renderPlan();animDice()}}]);
  }else if(!S.diceDone){
    act=`<div class="act-t">分配訓練成果</div><div class="act-s">點一下能力，就把亮起來的那顆骰子加進去</div>`+diceWidget({p:'a',dice:S.dice,asg:S.asg,st:S.st,prog:S.prog,base:S.pb.st,okText:'確認 ▸'});
  }else if(S.acts.length<2||(S.acts.includes('exam')&&!S.examT)){
    const back={t:'↩ 重選',f:()=>{S.acts=[];S.examT=null;renderPlan()}};
    if(S.acts.length<2){
      const opts=acts.filter(a=>!S.acts.includes(a.id)).map(a=>({t:a.n,s:a.id==='exam'&&!exams.length?'目前沒有可以報考的證照':a.fx,dis:a.id==='exam'&&!exams.length,
        f:()=>{S.acts.push(a.id);if(S.acts.length===2&&!S.acts.includes('exam'))confirmPlan();else renderPlan()}}));
      if(S.acts.length)opts.push(back);else opts.push({t:'↩ 重新分配骰子',f:()=>{S.diceDone=false;logDrop('alloc'+Y);renderPlan()}});
      act=actHtml(`今年要把時間花在哪？（${S.acts.length+1}/2）`,S.acts.length?`已選：${S.acts.map(id=>acts.find(a=>a.id===id)?.n).join('、')}`:'選兩件事，會影響今年的能力和遇到的事件。',opts);
    }else{
      act=actHtml('要報考哪一個？','',exams.map(k=>({t:EXAMS[k].name+(EXAMS[k].subj&&examProg(k)?`（已過 ${examProg(k)}/${EXAMS[k].subj}）`:''),s:`${EXAMS[k].info||''}｜難度 ${EXAMS[k].diff}・報名費 ${EXAMS[k].stageFee?EXAMS[k].stageFee.map((f,i)=>`${EXAMS[k].stages[i][0]} ${feeTxt(f)}`).join('、'):EXAMS[k].cost?feeTxt(EXAMS[k].cost):'免費'}`,f:()=>{S.examT=k;if(S.acts.length===2)confirmPlan();else renderPlan()}})).concat([back]));
    }
  }else{confirmPlan();return}
  gameLayout(act,S.rolled);
  bindDice('a',{get:()=>({dice:S.dice,asg:S.asg,st:S.st,prog:S.prog}),put:(i,k)=>putDie(i,k),undo:i=>{S.asg[i]=null;planRecalc()},auto:()=>autoAlloc(),
    ok:()=>{S.diceDone=true;const g={};for(const k of SK)g[k]=S.st[k]-S.pb.st[k];logPush('alloc'+Y,'','訓練成果',gainChips(g));renderPlan()},rerender:renderPlan});
}
function renderEvent(){
  const E=S.ev,R=S.evRes,Y=S.year;
  /* 自動模擬會跳過擲骰畫面，這裡補上紀錄 */
  logPush('roll'+Y,'','年初特訓',diceLine(S.dice));
  logPush('alloc'+Y,'','訓練成果',gainChips(dicePts(S.dice,S.asg),' 點'));
  logPush('plan'+Y,'','今年的計畫',`<p>${S.acts.map(id=>actionList().find(a=>a.id===id)?.n).filter(Boolean).join('、')}${S.acts.includes('exam')&&S.examT?`（報考${EXAMS[S.examT].name}）`:''}</p>${chipHtml(S.planChips)}`);
  const slot=(S.phase==='work'?['春','夏','秋冬']:['上學期','寒暑假','下學期'])[Math.min(R?S.evN-1:S.evN,2)];
  let act;
  if(!R){
    logPush(`ev${Y}-${S.evN}`,E.sud?'bad':'',`${slot}｜${E.sud?'⚡ ':''}${E.t}`,`<p>${E.x}</p>`);
    act=actHtml(`事件｜${E.t}`,`${slot}${E.sud?'・突發事件':''}${E.ai?'・AI 事件':''}`,E.c.map((c,i)=>{const T=c.tier||0;
      const mod=c.d?((c.d.s?Math.floor((S.st[c.d.s]-50)/10):0)+tChk(c.d.s||'luck')):0;const fp=tierP(c);const p=fp!=null?fp:c.d?clamp((21-(c.d.dc-mod))/20,.05,.95):1;
      const amp=E.sud?'':`・影響幅度${['小','小','中','大'][T]}`;
      return {t:c.t,s:c.d?`成功率 ${Math.round(p*100)}%${fp!=null?(luckyNow()?'（天選之人加成）':unluckyNow()?'（衰神附體）':''):`｜${c.d.s?`看${STATN[c.d.s]}`:'純看運氣'}`}${amp}`:S.ev.noChoice?'沒有選擇，只能承受':`必定成功${amp}`,warn:T===3,f:()=>chooseOpt(i)}}));
  }else{
    const verdict=R.roll===20?'大成功！':R.roll===1?'大失敗……':R.ok?'成功':'失敗';
    logPush(`res${Y}-${S.evN}`,R.roll==null?'':R.ok?'good':'bad',`你選擇：${R.label}`,
      `${R.roll!=null?`<div class="rollline">🎲 擲出 <b>${R.roll}</b>${R.stat?`，${STATN[R.stat]}修正 ${sign(R.mod)}`:''}，需要 ${R.dc} 以上 → <b class="${R.ok?'up':'dn'}">${verdict}</b></div>`:''}<p>${R.r}</p>${chipHtml(R.chips)}${R.title?`<div class="tl-get"><b>${R.title}</b></div>`:''}`);
    act=actHtml('','',[{t:S.dead?'翻到人生最後一頁 ▸':S.evN<3?`下一個事件（${S.evN+1}/3）▸`:'年末結算 ▸',main:1,f:afterEvent}]);
  }
  gameLayout(act);
}
function renderYearEnd(){
  const R=S.report,Y=S.year;
  const tot=R.L.reduce((a,b)=>a+b[1],0);
  const rows=R.L.map(r=>`<tr><td>${r[0]}</td><td class="n ${r[1]<0?'neg':''}">${fmt2(r[1])}</td></tr>`).join('');
  const msg=R.next==='death'?`<div class="result bad">這一年的最後，${S.dead}帶走了你。帳本停在了這一頁。</div>`
    :R.next==='crash'?'<div class="result bad">再也撐不住了。醫生說：「你需要的不是休假，是退休。」</div>'
    :R.next==='admit'?`<div class="result">${S.sy>=4?'重考的一年結束了。再拚一次！':'高中職三年結束了。升學季，開始！'}</div>`
    :R.next==='gadmit'?'<div class="result">🎓 大學畢業了！接下來：研究所推甄、研究所考試，還是直接就業？</div>'
    :R.next==='gradwork'?'<div class="result">🎓 碩士畢業！</div>':'';
  logPush('ye'+Y,'ledger',`年末結算`,`<table class="ledger">${rows||'<tr><td>本年度無收支</td><td class="n">0.00</td></tr>'}<tr class="tot"><td>本期淨額</td><td class="n ${tot<0?'neg':''}">${fmt2(tot)}</td></tr></table>
    ${R.notes.length?`<ul class="notes">${R.notes.map(n=>`<li class="${n[0]}">${n[1]}</li>`).join('')}</ul>`:''}${msg}`);
  let opts;
  if(R.next==='death')opts=[{t:'翻到人生最後一頁 ▸',main:1,f:()=>endGame('death')}];
  else if(R.next==='crash')opts=[{t:'翻到人生最後一頁 ▸',main:1,f:()=>endGame('crash')}];
  else if(R.next==='admit')opts=[{t:isVoc(S)?'參加統測 ▸':'參加學測 ▸',main:1,f:startAdmit}];
  else if(R.next==='gadmit')opts=[{t:'前往畢業後的十字路口 ▸',main:1,f:startGAdmit}];
  else if(R.next==='dm')opts=[{t:'申請雙主修／輔系 ▸',s:'看學力和系排，不一定會上；上了就多一條出路',main:1,f:startDM},{t:'不申請，進入下一學年 ▸',s:S.sy<=1?'大二還有一次機會':'這是最後一次機會',f:stay}];
  else{
    opts=offerOpts();
    opts.push({t:S.phase!=='work'?'進入下一學年 ▸':S.job?`留在目前的位置 ▸`:'繼續找工作 ▸',s:S.phase==='work'&&S.job?jobTitle():'',main:!S.offers.length,f:stay});
    if(fireOK())opts.push({t:'🔥 提早退休（FIRE）',s:'存款已達年支出 25 倍（4% 法則）',f:()=>{S.achv.add('財富自由');endGame('fire')}});
    if(S.age>=60&&S.phase==='work')opts.push({t:'申請退休',s:'結束職涯，結算人生',f:()=>endGame('retire')});
  }
  gameLayout(actHtml(S.offers.length&&!['death','crash','admit','gadmit','dm'].includes(R.next)?(S.job?'年底有新的機會':'有公司向你招手'):'接下來呢？','',opts));
}
function renderDM(){
  const D=S.dmS,u=S.edu.uni,Y=S.year,P=dmPol(u),L=dmList(S),types=dmTypes();
  logPush('dm'+Y+'-'+D.tries,'gold','雙主修／輔系申請',`<div class="story"><p>系辦公告欄貼出了今年的雙主修、輔系申請名單。學長說：「會計是根，再多學一門，路就會變寬。」</p></div>
    <p class="hint">📋 ${u.n}的規定：${P.rule}${L.length?`<br>你目前有：${dmLabel(S)}`:''}</p>`);
  let act;
  if(D.res){
    const K=DEPTS[D.res.k],nm=deptName(u,D.res.k),tn=D.type==='double'?'雙主修':'輔系';
    logPush('rdm'+Y+'-'+D.tries,D.res.ok?'good':'bad',D.res.ok?`🎉 ${tn}${nm}錄取！`:`${tn}${nm}沒上`,
      D.res.ok?`<p>從下學期開始，你的課表多了${nm}的課。</p><p class="hint">解鎖：${K.unlock}</p>${chipHtml(Object.entries(K.perk).map(([k,v])=>[STATN[k],D.type==='double'?v*2:v]))}`
      :D.res.p<=0?`<p>你的系排沒有達到雙主修的申請門檻（前 ${P.gate}%），申請沒有被受理。</p>`:`<p>錄取率大約 ${Math.round(D.res.p*100)}%，這次差了一點。</p>`);
    act=actHtml('','',[{t:'進入下一學年 ▸',main:1,f:stay}]);
  }else if(!D.type){
    const o=[];
    if(types.includes('double'))o.push({t:'雙主修',s:`還能申請 ${P.dbl-L.filter(x=>x.type==='double').length} 個｜學分多、課很重（每年心態、體力會下降），錄取比較難；能力加成加倍${P.gate?`｜需系排前 ${P.gate}%`:''}`,main:1,f:()=>{D.type='double';renderDM()}});
    if(types.includes('minor'))o.push({t:'輔系',s:`還能申請 ${P.minor-L.filter(x=>x.type==='minor').length} 個｜學分比較少，錄取比較容易；一樣能解鎖那條出路`,f:()=>{D.type='minor';renderDM()}});
    o.push({t:'這次不申請',s:'專心讀會計本科',f:stay});
    act=actHtml('要申請哪一種？',P.dbl?'':'這間學校沒有開放雙主修。',o);
  }else{
    const tn=D.type==='double'?'雙主修':'輔系';
    act=actHtml(`選擇${tn}的科系`,'錄取率依你的學力和系排計算',deptsOf(u).filter(k=>!L.find(x=>x.k===k)).map(k=>{const K=DEPTS[k];const p=dmChance(k,D.type);
      return {t:deptName(u,k),s:`${p<=0?'系排未達門檻，不能申請':`錄取率約 ${Math.round(p*100)}%`}｜解鎖：${K.unlock}`,dis:p<=0,f:()=>applyDM(k)}}).concat([{t:'↩ 返回',f:()=>{D.type=null;renderDM()}}]));
  }
  gameLayout(act,!!D.type&&!D.res);
}
function offerOpts(){
  return S.offers.map((o,i)=>{const J=JOBS[o.k];const sal=J.special?'收入浮動':`${J.lad[o.lvl][0]}・年薪約 ${J.lad[o.lvl][1]} 萬`;
    return {t:`${S.job?'轉換跑道':'接受'}：${J.name}`,s:`${sal}${J.cost?`・初期投入 ${J.cost} 萬`:''}${o.why?`｜${o.why}`:''}<br>${J.flavor}`,main:o.sp,f:()=>acceptOffer(i)}});
}
function renderJobhunt(){
  logPush('jh'+S.year,'',`找工作`,`<p>${deg(S)?'畢業了！履歷投出去，這些公司回覆了你。':'沒有大學學歷，有些門檻比較高；但也有人邊工作邊讀進修部，一樣走得很遠。'}</p>`);
  const opts=offerOpts();opts.push({t:'先休息一年 ▸',s:'gap year',f:stay});
  gameLayout(actHtml('要接受哪一份工作？','',opts));
}
function pctTag(p){const c=p>=.6?'hi':p>=.25?'mid':'lo';return `<span class="pct ${c}">${p<=0?'不符資格':Math.round(p*100)+'%'}</span>`}
function renderAdmit(){
  const A=S.adm;const ch=A.chs[A.ch];const C=CHN[ch];const cands=admCands();
  const dist=ch==='dist'||ch==='vdist';
  const scoreLbl=A.voc?`<div class="score"><div class="k">統測加權成績</div><div class="v">${Math.round(A.score/60*100)}<span class="hint"> %</span></div></div>`:`<div class="score"><div class="k">學測 國英數A社 總級分</div><div class="v">${A.score}<span class="hint"> / 60</span></div></div>`;
  const s2=ch==='dist'?`<div class="score"><div class="k">分科測驗（換算）</div><div class="v">${A.score2}<span class="hint"> / 60</span></div></div>`:'';
  const cutLbl=u=>A.voc?`統測加權約 ${Math.round(cutOf(u)/60*100)}%`:`約 ${cutOf(u)} 級分`;
  let list='',footer='';
  if(!A.res){
    list=cands.map(u=>{const p=admChance(u);const on=A.picks.includes(u.id);const dis=p<=0&&!dist;
      const extra=(ch==='star'||ch==='vstar')?`・繁星校排需前 ${u.star}%`:'';
      return `<div class="offer ${on?'sel':''} ${dis?'off':''}"><div><b>${uniName(u)}</b><div class="meta">遊戲門檻 ${u.cut?cutLbl(u):'寬鬆'}${extra}</div><div class="meta">📋 ${u.ref||''}</div><div class="meta">${u.desc}</div></div>${dist?(p?'<span class="pct hi">落點內</span>':'<span class="pct lo">超出落點</span>'):pctTag(p)}<button class="btn sm ${on?'':'ghost'}" data-pk="${u.id}" ${dis||(!on&&A.picks.length>=C.max)?'disabled':''}>${on?'已選':'選擇'}</button></div>`}).join('');
    footer=`<div class="row"><button class="btn" id="sub" ${A.picks.length?'':'disabled'}>${dist?'送出志願，等待分發':'送出申請'} ▸</button>${A.ch<A.chs.length-1?'<button class="btn ghost" id="skipch">放棄這個管道 ▸</button>':''}<span class="hint">最多選 ${C.max} 個${dist?'，會由錄取分數高到低分發':''}</span></div>`;
  }else{
    const okRes=A.res.filter(r=>r.ok);
    list=A.res.map(r=>{const u=UNIS.find(x=>x.id===r.id);return `<div class="offer ${r.ok?'sel':''}"><div><b>${uniName(u)}</b><div class="meta">${r.ok?'🎉 錄取！':r.skip?'已分發到更前面的志願':'未錄取'}</div></div>${r.ok?`<button class="btn gold" data-acc="${u.id}">就讀這裡</button>`:''}</div>`}).join('');
    const last=A.ch>=A.chs.length-1;
    footer=`<div class="row">${!last?`<button class="btn ${okRes.length?'ghost':''}" id="nextch">${okRes.length?'放棄錄取，挑戰下一個管道':'前往下一個管道'}：${CHN[A.chs[A.ch+1]].n} ▸</button>`:''}
      ${last&&!okRes.length?`${!S.flags.retake?'<button class="btn" id="retake">重考一年 ▸</button>':''}<button class="btn ghost" id="work">直接就業 ▸</button>`:''}
      ${isVoc(S)&&S.flags.earlyWork?'<button class="btn ghost" id="work">不升學，直接就業 ▸</button>':''}</div>`;
  }
  $('main').innerHTML=`<div class="grid"><div><div class="card">
    <div class="phase">${A.chs.map((c,i)=>`<span class="${i===A.ch?'on':i<A.ch?'done':''}">${CHN[c].n}</span>`).join('')}</div>
    <h2>${S.year+1} 年・升學季</h2>
    <div class="scorebox">${scoreLbl}${s2}<div class="score"><div class="k">${A.voc?'高職':'高中'}校排平均</div><div class="v">前 ${A.rank}%</div></div><div class="score"><div class="k">學習歷程</div><div class="v">${S.port}</div></div></div>
    <h3 class="mt14">${C.n}</h3><p class="lead">${C.d}${ch==='skill'&&!S.flags.skillCert?'<br><b class="txt-red">你沒有乙級證照或競賽獎項，無法報名。</b>':''}</p>
    <div class="offers">${list}</div>${footer}
  </div></div><div>${sidebar()}</div></div>`;
  document.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{const id=b.dataset.pk;const i=A.picks.indexOf(id);if(i>=0)A.picks.splice(i,1);else if(A.picks.length<C.max)A.picks.push(id);renderAdmit()});
  document.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>enterUni(b.dataset.acc,C.n));
  if($('sub'))$('sub').onclick=admSubmit;
  if($('skipch'))$('skipch').onclick=admNext;
  if($('nextch'))$('nextch').onclick=admNext;
  if($('retake'))$('retake').onclick=retake;
  document.querySelectorAll('#work').forEach(b=>b.onclick=goWorkHS);
}
function renderGAdmit(){
  const G=S.gad;const ch=G.chs[G.ch];const isRec=ch==='rec';
  let list='',footer='';
  if(!G.res){
    list=GRADS.map(g=>{const p=gChance(g);const on=G.picks.includes(g.id);const dis=p<=0;
      return `<div class="offer ${on?'sel':''} ${dis?'off':''}"><div><b>${g.n}・${g.g}</b><div class="meta">${g.fx}${g.need?'・需修過資工課':''}</div></div>${pctTag(p)}<button class="btn sm ${on?'':'ghost'}" data-gp="${g.id}" ${dis||(!on&&G.picks.length>=3)?'disabled':''}>${on?'已選':'選擇'}</button></div>`}).join('');
    footer=`<div class="row"><button class="btn" id="gsub" ${G.picks.length?'':'disabled'}>送出 ▸</button>${isRec?'<button class="btn ghost" id="gnext">不推甄，直接考試 ▸</button>':''}<button class="btn ghost" id="gwork">不讀研究所，直接就業 ▸</button><span class="hint">最多選 3 個</span></div>`;
  }else{
    const okR=G.res.filter(r=>r.ok);
    list=G.res.map(r=>{const g=GRADS.find(x=>x.id===r.id);return `<div class="offer ${r.ok?'sel':''}"><div><b>${g.n}・${g.g}</b><div class="meta">${r.ok?'🎉 錄取！':'未錄取'}</div></div>${r.ok?`<button class="btn gold" data-gacc="${g.id}">就讀這裡</button>`:''}</div>`}).join('');
    footer=`<div class="row">${isRec?`<button class="btn ${okR.length?'ghost':''}" id="gnext">${okR.length?'放棄推甄錄取，挑戰考試':'參加研究所考試'} ▸</button>`:''}<button class="btn ghost" id="gwork">直接就業 ▸</button></div>`;
  }
  $('main').innerHTML=`<div class="grid"><div><div class="card">
    <div class="phase">${G.chs.map((c,i)=>`<span class="${i===G.ch?'on':i<G.ch?'done':''}">${c==='rec'?'研究所推甄':'研究所考試'}</span>`).join('')}<span>就業</span></div>
    <h2>大學畢業的十字路口</h2>
    <div class="scorebox"><div class="score"><div class="k">系排平均</div><div class="v">前 ${Math.round(avg(S.uniRanks))}%</div></div><div class="score"><div class="k">${isRec?'推甄實力':'考試實力'}</div><div class="v">${Math.round(gEst(ch))}</div></div></div>
    <p class="lead">${isRec?'推甄看：系排、專業、專題研究、個案競賽、學校名氣。錄取後就不能再參加考試（除非放棄）。':'考試看：學力與專業，有準備研究所、補過會計師的人會加分。'}<br>甲組偏財會審計（四大、投行），乙組偏管會資訊（企業、數據），丙組偏稅務法律（稅務、公職）。</p>
    <div class="offers">${list}</div>${footer}
  </div></div><div>${sidebar()}</div></div>`;
  document.querySelectorAll('[data-gp]').forEach(b=>b.onclick=()=>{const id=b.dataset.gp;const i=G.picks.indexOf(id);if(i>=0)G.picks.splice(i,1);else if(G.picks.length<3)G.picks.push(id);renderGAdmit()});
  document.querySelectorAll('[data-gacc]').forEach(b=>b.onclick=()=>enterGrad(b.dataset.gacc));
  if($('gsub'))$('gsub').onclick=gSubmit;
  if($('gnext'))$('gnext').onclick=gNextCh;
  if($('gwork'))$('gwork').onclick=skipGrad;
}
function renderEnd(){
  if(!S.endSeen){cinePage('人生結算',endingLines(),'查看人生結算 ▸',()=>{S.endSeen=1;renderEnd()});return}
  extraAchv();codexRecord();
  const [title,desc]=endingTitle();const nw=netWorth();const LG=lifeLedger(),pv=LG.pv,cash0=LG.cash0,house$=LG.house,spent=LG.spent,par=v=>fmt2(v);/* 支出用倒推的：期初＋收入－期末現金，所以三行一定對得起來 */
  if(nw>=3000)S.achv.add('身價破三千萬');if(S.married)S.achv.add('成家');if(S.kids>=2)S.achv.add('兒女成群');
  const jobs=S.log.filter(l=>l.h.startsWith('➜')).length;if(jobs>=4)S.achv.add('斜槓轉職王');
  const share=`【會計人生模擬器】${S.name?S.name+'的人生｜':''}種子 ${S.seed}｜${title}｜稱號：${(S.titles||[]).map(k=>TITLES[k].n).join('、')}｜${eduLine()}｜最高職位：${S.peak?.t||'—'}｜淨資產 ${fmt(nw)} 萬｜成就：${[...S.achv].join('、')||'無'}`;
  $('main').innerHTML=`<div class="card">
    <span class="stamp">${S.endType==='death'?'突 然 關 帳':S.endType==='crash'?'強制關帳':S.endType==='fire'?'提前結帳':'結 帳 完 畢'}</span>
    <div class="ending-title">${title}</div>
    <p class="lead fs16">${desc}</p>
    <div class="row mt4"><button class="btn gold" id="shot">📸 存成貼文圖</button><button class="btn gold" id="shot2">📱 限動尺寸</button><button class="btn ghost" id="cx2">📖 人生圖鑑 ${codexPct()}%</button><button class="btn ghost" id="clink">🔗 邀朋友挑戰同一個世界</button><span class="copyok" id="clok"></span></div>
    <div class="split mt8">
      <div><h3>人生資產負債表（萬元）</h3><table class="ledger">
        <tr><td>期初存款（15 歲）</td><td class="n">${fmt2(cash0)}</td></tr>
        <tr><td>一生累積收入</td><td class="n">${fmt2(S.earn)}</td></tr>
        ${spent>=0?`<tr><td>一生累積支出（含投資與其他損益）</td><td class="n neg">${par(-spent)}</td></tr>`:`<tr><td>投資與其他收入淨額（扣除支出後）</td><td class="n">${par(-spent)}</td></tr>`}
        ${house$?`<tr><td>購屋頭期款與房貸（轉為不動產）</td><td class="n neg">${par(-house$)}</td></tr>`:''}
        <tr class="sub"><td>現金與投資</td><td class="n ${S.cash<0?'neg':''}">${par(S.cash)}</td></tr>
        ${S.house?`<tr><td>不動產（淨值）</td><td class="n">${fmt2(nw-S.cash-(S.pen||0))}</td></tr>`:''}
        ${S.pen?`<tr><td>退休金專戶（勞退／公教個人專戶）</td><td class="n">${fmt2(S.pen)}</td></tr>`:''}
        <tr class="tot"><td>淨資產</td><td class="n ${nw<0?'neg':''}">${par(nw)}</td></tr>
        <tr><td>折現回 15 歲的現值</td><td class="n ${pv<0?'neg':''}">${par(pv)}</td></tr></table>
        <p class="hint">💡 錢有時間價值。用 2% 的折現率往回折，${S.age-15} 年後的 ${fmt(nw)} 萬，只等於你 15 歲那年的 ${fmt(pv)} 萬。</p></div>
      <div><h3>生涯摘要</h3>
        <div class="kv"><span>學歷</span><span class="t">${eduLine()}</span></div>
        <div class="kv"><span>結束年齡</span><span>${S.age} 歲</span></div>
        <div class="kv"><span>最高職位</span><span class="t">${S.peak?.t||'—'}</span></div>
        <div class="kv"><span>總年資</span><span>${S.workYears} 年</span></div>
        <div class="kv"><span>換過的跑道</span><span>${jobs} 次</span></div>
        <div class="kv"><span>證照</span><span class="t">${Object.keys(S.certs).map(k=>k==='CPA'?'會計師':k).join('、')||'無'}</span></div>
        <div class="kv"><span>家庭</span><span class="t">${S.married?'已婚':'單身'}${S.kids?`・${S.kids} 個孩子`:''}</span></div></div>
    </div>
    <h3 class="mt18">淨資產走勢</h3>${nwChart()}
    <h3 class="mt18">稱號</h3><div class="badges">${titleBadges(S)}</div>
    <h3 class="mt18">成就</h3><div class="badges">${[...S.achv].map(a=>`<span class="badge cert">${a}</span>`).join('')||'<span class="hint">平凡也是一種成就。</span>'}</div>
    <h3 class="mt18">人生日記帳</h3>
    <div class="timeline">${S.log.map(l=>`<div><span class="y">${l.y}・${l.a} 歲</span><span>${l.t?`<b>${l.t}</b>　`:''}${l.h||'平靜的一年'}</span></div>`).join('')}</div>
    <div class="row"><button class="btn" id="again">再活一次（同種子）</button><button class="btn ghost" id="newg">換個人生</button><button class="btn ghost" id="cp">複製戰績</button><span class="copyok" id="cpok"></span></div>
  </div>`;
  $('shot').onclick=()=>shareImage('post');$('shot2').onclick=()=>shareImage('story');$('cx2').onclick=openCodex;
  $('clink').onclick=async()=>{const u=challengeLink();try{if(navigator.share){await navigator.share({title:'會計人生模擬器',text:`我活成了「${title}」，淨資產 ${fmt(nw)} 萬。同一個世界，換你來：`,url:u});return}await navigator.clipboard.writeText(u);$('clok').textContent='連結已複製！'}catch(e){$('clok').textContent=u}};
  $('again').onclick=()=>{ui.seed=S.seed;ui.sstep=1;setS(null);render()};
  $('newg').onclick=()=>{ui.seed=String(Math.floor(100000+rnd()*900000));ui.alloc={};ui.sstep=1;setS(null);render()};
  $('cp').onclick=async()=>{try{await navigator.clipboard.writeText(share);$('cpok').textContent='已複製！'}catch(e){$('cpok').textContent=share}};
}
let confirmReset=false;
function setConfirmReset(v){confirmReset=v}
const STRATN={balanced:'穩健平衡',career:'衝事業',cert:'考證照',life:'享受人生'};
const SPEEDN={150:'極速',450:'快',900:'中',1600:'慢'};
function renderCtrl(){
  const c=$('ctrl');if(!c)return;
  document.body.classList.toggle('auto',AUTO.on);
  const aiBtn=AI.state==='ready'?`<button class="btn ghost sm" id="aiT" title="每年有 ${AI.per} 個事件由 AI 依你的經歷即時生成">✨ AI 事件：${AI.on?(AI.per===2?'每年 2 題':'每年 1 題'):'關'}</button>`:AI.state==='denied'?'<span class="hint">AI 事件未授權</span>':'';
  const bind=()=>{if($('aiT'))$('aiT').onclick=()=>{if(!AI.on){AI.on=true;AI.per=1}else if(AI.per===1)AI.per=2;else AI.on=false;renderCtrl()}};
  if(!S){c.innerHTML=aiBtn;bind();return}
  if(S.stage==='end'){c.innerHTML='';confirmReset=false;return}
  if(AUTO.on){
    c.innerHTML=`<div class="confirm run"><span>▶ 自動模擬中・${STRATN[AUTO.strat]}・${SPEEDN[AUTO.speed]}</span><button class="btn sm" id="apause">⏸ 暫停</button></div>`;
    $('apause').onclick=autoStop;return;
  }
  if(confirmReset){
    c.innerHTML=`<div class="confirm"><span>確定放棄這段人生？目前進度不會保留。</span><button class="btn sm" id="rsSame">同種子重來</button><button class="btn sm" id="rsNew">換個人生</button><button class="btn ghost sm" id="rsNo">取消</button></div>`;
    $('rsSame').onclick=()=>{AUTO.on=false;ui.seed=S.seed;setS(null);confirmReset=false;render()};
    $('rsNew').onclick=()=>{AUTO.on=false;ui.seed=String(Math.floor(100000+rnd()*900000));ui.alloc={};setS(null);confirmReset=false;render()};
    $('rsNo').onclick=()=>{confirmReset=false;renderCtrl()};return;
  }
  if(AUTO.panel){
    c.innerHTML=`<div class="confirm setup"><span>策略</span><select id="astrat">${Object.entries(STRATN).map(([k,v])=>`<option value="${k}" ${AUTO.strat===k?'selected':''}>${v}</option>`).join('')}</select><span>速度</span><select id="aspd">${Object.entries(SPEEDN).map(([k,v])=>`<option value="${k}" ${AUTO.speed==k?'selected':''}>${v}</option>`).join('')}</select><button class="btn sm gold" id="ago">▶ 開始</button><button class="btn ghost sm" id="acancel">取消</button></div>`;
    $('ago').onclick=()=>{AUTO.strat=$('astrat').value;AUTO.speed=+$('aspd').value;autoStart()};
    $('acancel').onclick=()=>{AUTO.panel=false;renderCtrl()};return;
  }
  c.innerHTML=`${aiBtn}<button class="btn ghost sm" id="aopen">▶ 自動模擬</button><button class="btn ghost sm" id="rst">↺ 重新人生</button>`;
  bind();
  $('aopen').onclick=()=>{AUTO.panel=true;renderCtrl()};
  $('rst').onclick=()=>{confirmReset=true;renderCtrl()};
}
function renderAIWait(){
  $('main').innerHTML=`<div class="grid"><div><div class="card">${phaseBar('event')}${stageHead()}
    <div class="aiload"><div class="spin"></div><div><b>AI 正在依照你的人生經歷編寫劇情……</b><div class="hint">通常需要幾秒鐘。</div></div></div>
    <div class="row"><button class="btn ghost sm" id="aiskip">不等了，用一般事件</button></div>
  </div></div><div>${sidebar()}</div></div>`;
  $('aiskip').onclick=()=>{const r=S.aiReqs&&S.aiReqs[S.evN];if(r)r.st='skip';nextEvent()};
}
