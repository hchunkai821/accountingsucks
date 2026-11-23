/* 06-game.js — 遊戲流程：開局、每年規劃、事件、年末結算、升遷、職缺、升學（大學／研究所）、結局 */
"use strict";
/* ================= STATE ================= */
let S=null;
function setS(v){S=v}
let ui={trait:'genius',seed:String(Math.floor(100000+rnd()*900000)),big:false,mobile:false,alloc:{},sd:null,sdSeed:null,sasg:[],ssel:null};
const SETUP_DICE=10;
function setupDice(){if(ui.sdSeed!==ui.seed){const r=mulberry32(seedHash(ui.seed+'|setup'));const ps={titles:[]};ui.sd=Array.from({length:SETUP_DICE},()=>rollDie(r,ps));ui.sdSeed=ui.seed;ui.sasg=ui.sd.map(()=>null);ui.ssel=null;ui.srolled=false}return ui.sd}

/* 開局：種子在這一刻鎖定，國中三年的骰子要進遊戲後才擲（不能在開始畫面刷種子） */
function newGame(){
  ui.seed=cleanSeed(ui.seed)||'1';
  setRand(mulberry32(seedHash(ui.seed)));
  const tr=TRAITS[ui.trait];ui.sdSeed=null;setupDice();
  const b0={};for(const k of SK)b0[k]=BASE[k]+(tr.st[k]||0);
  const z={};for(const k of SK)z[k]=0;
  S={titles:[],prog:z,c20:0,c1:0,seed:ui.seed,trait:ui.trait,age:15,year:2026,phase:'pre',sy:1,st:{...b0},cash:3+(tr.cash||0),perf:40,job:null,workYears:0,
    certs:{},cpa:0,uscpa:0,fans:0,clients:0,flags:{},love:0,married:false,kids:0,house:false,mortgage:0,
    log:[],burn:0,peak:null,earn:0,seen:{},stage:'prologue',acts:[],examT:null,ev:null,evRes:null,evN:0,report:null,offers:[],achv:new Set(),
    edu:{},port:0,hsRanks:[],uniRanks:[],bonusPts:0,ledger:[],exp:{},cfa:0,recent:[],dead:null,yearTitles:[],vc:{}};
  S.name=cleanName(ui.name);originOf(S);S.season=ui.season!=null?ui.season:currentSeason();
  S.jb={st:{...b0},prog:{...z}};S.jd=ui.sd.slice();S.jasg=S.jd.map(()=>null);S.jrolled=false;
  S.W=genWorld(ui.seed);
  render();
}
function juniorRecalc(){const ap=applyDice(S.jb.st,S.jb.prog,S.jd,S.jasg,S);S.st=ap.st;S.prog=ap.prog}
/* 國中三年配點完成 → 會考 */
function finishJunior(){
  juniorRecalc();
  logPush('jroll','','國中三年的累積',diceLine(S.jd));const g={};for(const k of SK)g[k]=S.st[k]-S.jb.st[k];logPush('jdone','','國中三年',gainChips(g));
  if(S.titles.includes('rich'))S.cash+=100;
  const v=S.st.aca*.8+S.st.eng*.2+ri(-6,6)+(S.trait==='exam'?3:0)+tSum('exam');
  S.kk={v:Math.round(v),tier:v>=40?1:v>=33?2:v>=26?3:4};
  S.stage='kaikao';render();
}
function addSt(o){if(!o)return;for(const k in o)if(k in S.st)S.st[k]=clamp(S.st[k]+o[k],0,100)}
function applyEff(e,chips,label){
  if(!e)return;
  for(const k in e){
    const v=e[k];if(!v)continue;
    if(k in S.st){let x=v;if(x<0&&k==='hp')x=Math.round(x*tMul('hpLoss'))||-1;if(x<0&&k==='mind')x=Math.round(x*tMul('mindLoss'))||-1;S.st[k]=clamp(S.st[k]+x,0,100);chips&&chips.push([STATN[k],x])}
    else if(k==='cash'){S.cash=money(S.cash+v);S.ledger.push([label||'其他',v]);chips&&chips.push(['存款',v,'萬'])}
    else if(k==='perf'){S.perf=clamp(S.perf+v,0,100);chips&&S.phase==='work'&&chips.push(['績效',v])}
    else if(k==='love'){S.love+=v}
    else if(k==='pt'){S.bonusPts+=v;chips&&chips.push(['明年點數',v])}
    else if(k==='port'){S.port+=v;chips&&chips.push(['學習歷程',v])}
    else if(k==='fans'){S.fans=Math.max(0,(S.fans||0)+v);chips&&chips.push(['訂閱',v,'萬'])}
  }
}
function overall(){const s=S.st;return Math.round(s.aca*.15+s.skill*.3+s.eng*.1+s.hp*.12+s.mind*.13+s.net*.2)}
function jobTitle(s=S){
  if(s.phase==='hs')return s.edu.hs?.k==='voc'?'高職生':'高中生';
  if(s.phase==='uni')return s.job?.key==='grad'?'研究生':'大學生';
  if(!s.job)return '待業中';
  const J=JOBS[s.job.key];return J.special?J.title:J.lad[s.job.lvl][0];
}
function identity(){
  if(S.phase==='hs')return S.sy>=4?'重考生':['高一','高二','高三'][S.sy-1];
  if(S.phase==='uni')return S.job?.key==='grad'?(S.job.yrs?'碩二':'碩一'):`大${'一二三四五'[Math.min(S.sy,5)-1]}`;
  return jobTitle();
}
function jobSalary(s=S){
  if(!s.job)return 0;const J=JOBS[s.job.key];
  if(J.special)return s.job.lastInc||0;
  return Math.round(J.lad[s.job.lvl][1]*(1+0.025*s.job.yrs)*(s.W?sectorMul(s.job.key):1));
}
/* 金額單位是萬元，記到小數第二位（0.18 萬＝1,800 元）。
   fmt：有小數才顯示小數；fmt2：帳本用，一律兩位小數，負數加括號 */
const money=n=>Math.round(n*100)/100;
const fmt=n=>{n=money(n);const d=Number.isInteger(n)?0:2;const a=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});return n<0?`(${a})`:a};
const feeTxt=v=>v>=1?`${fmt(v)} 萬`:`${Math.round(v*10000).toLocaleString('en-US')} 元`;
const fmt2=n=>{n=money(n);const a=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});return n<0?`(${a})`:a};
const sign=n=>n>0?`+${n}`:`${n}`;
const uniName=u=>u?`${u.n}${u.d}`:'';

/* ================= YEAR FLOW ================= */
function actionList(){
  let l;
  if(S.phase==='hs')l=ACTS_HS.filter(a=>!a.voc||isVoc(S));
  else if(S.phase==='uni')l=S.job?.key==='grad'?ACTS_GRAD:ACTS_UNI.filter(a=>!a.min||S.sy>=a.min);
  else l=ACTS_WORK.filter(a=>!a.cond||a.cond(S));
  return l;
}
function availExams(){return Object.keys(EXAMS).filter(k=>!S.certs[k]&&EXAMS[k].ok(S))}
function setupPlan(){
  S.flags.hospNow=0;
  S.acts=[];S.examT=null;S.ledger=[];S.perf=clamp(40+tSum('perfY'),0,100);S.evN=0;S.ev=null;S.evRes=null;
  if(!S.prog){S.prog={};for(const k of SK)S.prog[k]=0}
  S.pb={st:{...S.st},prog:{...S.prog}};
  const n=diceCount(rand,S)+(S.bonusPts||0)+(S.phase==='hs'||S.phase==='uni'?1:0);S.bonusPts=0;
  S.dice=Array.from({length:clamp(n,1,8)},()=>rollDie(rand,S));S.asg=S.dice.map(()=>null);S.sel=null;S.rolled=false;S.diceDone=false;
  S.stage='plan';
}
function planRecalc(){const ap=applyDice(S.pb.st,S.pb.prog,S.dice,S.asg,S);S.st=ap.st;S.prog=ap.prog}
function diceLeft(){return S.asg.filter(x=>!x).length}
function needDice(){return diceLeft()>0&&SK.some(k=>S.st[k]<100)}
function putDie(i,k){if(i==null||S.asg[i])return;if(S.st[k]>=100)return;S.asg[i]=k;planRecalc()}
function clearDice(){S.asg=S.dice.map(()=>null);S.sel=null;planRecalc()}
function ptsLeft(){return diceLeft()}
function needPts(){return needDice()?1:0}
function confirmPlan(){
  const chips=[];
  for(const id of S.acts){
    const a=actionList().find(x=>x.id===id);applyEff(a.e,chips,a.n);
    if(id==='intern'&&!S.flags.intern){if(rand()<.55+S.st.skill/200)S.flags.intern=1}
    if(id==='code'){S.flags.cs=1;if(S.phase==='work')S.flags.codeY=(S.flags.codeY||0)+1}
    if(id==='cpacram')S.flags.cpaCram=1;
    if(id==='law'||id==='lawnight'){S.flags.lawY=(S.flags.lawY||0)+1;if(S.flags.lawY>=2&&!S.flags.law){S.flags.law=1;chips.push(['法律學分修滿',1,''])}}
    if(id==='research'){S.flags.research=1}
    if(id==='cpatrain'){S.flags.cpaTrain=1;chips.push(['會計師職前訓練完成',1,''])}
    if(id==='credits'){S.flags.credY=(S.flags.credY||0)+1;if(S.flags.credY>=2){S.flags.accCredits=1}}
    if(id==='love'){if(rand()<.5+tSum('love')*.3)S.love++}
    if(id==='side'){S.fans+=ri(0,3)+Math.floor(S.st.mind/40)}
    if(id==='invest'){S._invest=true}
    if(id==='cram'&&S.phase==='hs')S.flags.cramY=1;
  }
  if(S.trait==='liver')applyEff({hp:4});
  if(S.trait==='zen')applyEff({mind:4});
  S.planChips=chips;S.evN=0;S.yearEvs=[];S.yearTitles=[];
  S.sudSlot=rand()<(.12+(S.phase==='work'?.23:0)+(S.age>=50?.05:0))*tMul('sud')?ri(0,2):-1;
  S.aiSlots=[];S.aiReqs=null;
  if(aiActive()){
    const slots=[0,1,2].filter(i=>i!==S.sudSlot);const chosen=[];
    while(chosen.length<AI.per&&slots.length)chosen.push(slots.splice(Math.floor(rnd()*slots.length),1)[0]);
    S.aiSlots=chosen;const reqs={};for(const i of chosen)reqs[i]=aiRequest(i);S.aiReqs=reqs;
  }
  nextEvent();
}
function poolEvent(){
  const cool=e=>S.seen[e.id]==null||(!e.once&&S.year-S.seen[e.id]>=(e.cd||7));
  const elig=EVENTS.filter(e=>{try{return e.w(S)&&!(e.once&&S.seen[e.id]!=null)&&!S.yearEvs.includes(e.id)}catch(_){return false}});
  /* 家庭出身的劇情有優先權：抉擇事件很快出現，續集則在之後的某一年冒出來 */
  for(const e of elig)if(e.pri&&S.seen[e.id]==null&&rand()<e.pri)return e;
  const fresh=elig.filter(e=>!e.rep&&S.seen[e.id]==null);
  const ok=elig.filter(e=>!e.rep&&cool(e));
  const pool=fresh.length?fresh:ok.length?ok:elig;
  return pool.length?pick(pool):null;
}
function suddenPick(){
  const elig=SUDDEN.filter(e=>{try{return (e.once?S.seen[e.id]==null:(S.seen[e.id]==null||S.year-S.seen[e.id]>=(e.cd||8)))&&e.w(S)}catch(_){return false}});
  return elig.length?{...pick(elig),sud:true}:null;
}
function nextEvent(){
  let ev=null;
  const reqs=S.aiReqs;
  if(reqs&&S.aiSlots.includes(S.evN)){
    const req=reqs[S.evN];
    if(req&&req.st==='ok')ev=req.ev;
    else if(req&&req.st==='loading'&&!AUTO.on){
      S.stage='aiwait';render();
      req.wait=()=>{if(S&&S.stage==='aiwait'&&S.aiReqs===reqs)nextEvent()};
      setTimeout(()=>{if(S&&S.stage==='aiwait'&&S.aiReqs===reqs&&req.st==='loading'){req.st='timeout';nextEvent()}},30000);
      return;
    }
  }
  if(!ev&&S.evN===S.sudSlot)ev=suddenPick();
  if(!ev)ev=poolEvent()||EVENTS.find(e=>e.id==='g_weekend');
  if(!ev.ai){S.seen[ev.id]=S.year;S.vc[ev.id]=(S.vc[ev.id]||0)+1;ev=variant(ev,S.vc[ev.id])}
  S.ev=ev;S.yearEvs.push(ev.id);S.yearTitles.push(ev.t);S.recent.push(ev.t);if(S.recent.length>12)S.recent.shift();
  S.evRes=null;S.stage='event';render();
}
/* 高中低風險的成功率固定：35%／50%／70%；有「天選之人」這類運氣稱號時是 50%／65%／80%。
   用 20 面骰：擲出 ≥ 門檻就成功（≥14＝35%、≥11＝50%、≥8＝65%、≥7＝70%、≥5＝80%） */
const TIER_DC={3:[14,11,17],2:[11,8,14],1:[7,5,10]};/* [一般, 天選之人, 衰神附體]：衰神是 ≥17＝20%、≥14＝35%、≥10＝55% */
function luckyNow(s){return tChk('luck',s)>0}
function unluckyNow(s){return tChk('luck',s)<0}
function tierDC(c){return c&&c.tier&&TIER_DC[c.tier]?TIER_DC[c.tier][luckyNow()?1:unluckyNow()?2:0]:null}
function tierP(c){const dc=tierDC(c);return dc==null?null:(21-dc)/20}
function chooseOpt(i){
  const c=S.ev.c[i];const chips=[];
  if(c.tag)S.flags[c.tag]=(S.flags[c.tag]||0)+1; /* 記住這個選擇，多年後可能有後果 */
  if(c.d){
    const stat=c.d.s,fixed=tierDC(c);const mod=fixed!=null?0:(stat?Math.floor((S.st[stat]-50)/10):0)+tChk(stat||'luck');const dc=fixed!=null?fixed:c.d.dc;
    const roll=ri(1,20);if(roll===20)S.c20++;if(roll===1)S.c1++;const ok=fixed!=null?roll>=dc:(roll===20||(roll!==1&&roll+mod>=dc));
    const br=ok?c.ok:c.ng;
    applyEff(br.e,chips,S.ev.t);if(br.f)S.flags[br.f]=1;const xt=br.fx?br.fx(S):'';
    const tt=eventTitle(c,ok,roll);
    S.evRes={roll,mod,dc,stat:fixed!=null?null:stat,ok,r:br.r+(typeof xt==='string'&&xt?' '+xt:''),chips,label:c.t,title:tt};
  }else{
    applyEff(c.e,chips,S.ev.t);if(c.f)S.flags[c.f]=1;const xt=c.fx?c.fx(S):'';
    S.evRes={r:c.r+(typeof xt==='string'&&xt?' '+xt:''),chips,label:c.t};
  }
  if(S.ev.lethal&&S.st.hp<=0){if(rand()<.45*tMul('life')){S.dead=S.ev.lethal;S.evRes.r+=' ……醫護人員盡了全力，但這一次，你沒能撐過去。'}else{S.st.hp=8;S.evRes.r+=' 你在鬼門關前走了一回，奇蹟似地活了下來。'}}
  S.evN++;S.stage='evres';render(true);
}
function afterEvent(){if(S.dead){endGame('death');return}if(S.evN<3)nextEvent();else yearEnd()}

function examMod(E){
  const v=avg(E.st.map(k=>S.st[k]));
  /* 會計師：27 歲以後每 3 歲擲骰 -1（工作、家庭越來越忙）。
     對照考選部 112 年及格人員：平均 27.6 歲、21-25 歲占 54%、26-30 歲 26% */
  /* 律師：30 歲以後每 3 歲擲骰 -1（會計背景、非法律本科，越晚越難準備；避免有人一路考到 60 歲） */
  const agePen=E===EXAMS.CPA&&S.age>27?Math.floor((S.age-27)/3):E===EXAMS['律師']&&S.age>30?Math.floor((S.age-30)/3):0;
  return Math.floor((v-40)/8)+(S.trait==='exam'?2:0)+(S.flags.cram?1:0)+tSum('exam')-agePen;
}
function takeExams(notes){
  const k=S.examT;if(!k||!S.acts.includes('exam'))return;
  const E=EXAMS[k];if(!E.ok(S))return;
  if(E.cost){S.cash=money(S.cash-E.cost);S.ledger.push([`${E.name}報名費`,-E.cost])}
  let mod=examMod(E)-(['CPA','高考','調查特考','記帳士'].includes(k)?S.W.exam[S.year]:0)+(k==='高考'&&S.flags.nudge?1:0)+(k==='CPA'?(S.flags.cpaCram?1:0)+(S.flags.cpaBoost?1:0):0)+(k==='高考'||k==='調查特考'?(S.flags.gC?1:0):0);
  const pass=(r,m,dc)=>r===20||(r!==1&&r+m>=dc);
  if(E.subj){
    /* 分科考：可以一科一科累積（CFA 要一級一級考） */
    const unit=k==='CFA'?'級':'科';const before=examProg(k);const rolls=[];
    if(WINDOW_Y[k]!=null){S.entryY=S.entryY||{};if(S.entryY[k]==null)S.entryY[k]=S.year}
    const py=KEEP_Y[k]?passYears(k):null;let cur=before;
    for(let i=cur;i<E.subj;i++){const r=ri(1,20);rolls.push(r);if(pass(r,mod,E.dc)){cur++;if(py)py.push(S.year)}else if(k==='CFA')break}
    setExamProg(k,cur);const got=cur-before;
    if(cur>=E.subj){S.certs[k]=1;const nm={CPA:'會計師',USCPA:'US CPA',CFA:'CFA',CIA:'CIA',CMA:'CMA'}[k]||E.name;notes.push(['good',`🎉 ${E.name}全部通過！你拿到了「${nm}」資格！`]);S.achv.add('考上 '+nm)}
    else notes.push([got?'':'bad',`${E.name}：本次過了 ${got} ${unit}，累計 ${cur}/${E.subj} ${unit}。（擲骰 ${rolls.join('、')}，修正 ${sign(mod)}，門檻 ${E.dc}）`]);
  }else if(E.stages){
    /* 多階段考試：前一關過了才能考下一關，沒過明年從頭來 */
    const log=[];let ok=true;
    for(const [si,[nm,st]] of E.stages.entries()){
      const fee=(E.stageFee||[])[si];if(fee){S.cash=money(S.cash-fee);S.ledger.push([`${E.name}${nm}報名費`,-fee])}
      const m=st?Math.floor((S.st[st]-40)/8)+(st==='mind'?Math.floor((S.st.net-50)/15):0):mod;const dc=st?10:E.dc;const r=ri(1,20);
      if(pass(r,m,dc)){log.push(`${nm}✔（${r}${sign(m)}）`)}else{log.push(`${nm}✘（${r}${sign(m)} < ${dc}）`);ok=false;break}
    }
    if(ok){S.certs[k]=1;notes.push(['good',`🎉 ${E.name}上榜！${log.join(' → ')}`]);if(k==='調查特考')S.flags.newFor=1}
    else notes.push(['bad',`${E.name}落榜了：${log.join(' → ')}。明年要從第一關重新考。`]);
  }else{
    const r=ri(1,20);const ok=pass(r,mod,E.dc);
    if(ok){S.certs[k]=1;notes.push(['good',`🎉 ${E.name}上榜！（擲骰 ${r}${sign(mod)} ≥ ${E.dc}）`]);if(k==='高考')S.flags.newGov=1;if(k==='關務特考')S.flags.newCus=1}
    else notes.push(['bad',`${E.name}落榜了。（擲骰 ${r}${sign(mod)} < ${E.dc}）明年再來。`]);
  }
}
const EXAM_KEY={CPA:'cpa',USCPA:'uscpa',CFA:'cfa'};
function examProg(k){return EXAM_KEY[k]?(S[EXAM_KEY[k]]||0):((S.ep||{})[k]||0)}
function setExamProg(k,v){if(EXAM_KEY[k])S[EXAM_KEY[k]]=v;else{S.ep=S.ep||{};S.ep[k]=v}}
/* 及格科目的保留期限（一年只考一次，所以換算成「之後幾年的考試還能沿用」）：
   會計師：自榜示日起保留 3 年（考試規則第 10 條）→ 之後 3 年
   US CPA：自成績公布日起 30 個月（NASBA 2023 年修正）→ 之後 2 年（第 3 年已超過 30 個月） */
const KEEP_Y={CPA:3,USCPA:2};
const KEEP_TXT={CPA:'3 年',USCPA:'30 個月'};
/* CIA（IIA：申請通過後 3 年）、CMA（IMA：進入認證計畫後 3 年）：從第一次報考那年起，3 年內要全部考完 */
const WINDOW_Y={CIA:2,CMA:2};
function passYears(k){S.passY=S.passY||{};if(k==='CPA'&&S.cpaPass&&!S.passY.CPA){S.passY.CPA=S.cpaPass;delete S.cpaPass}
  const n=examProg(k);let a=(S.passY[k]||[]).slice(0,n);while(a.length<n)a.push(S.year);return S.passY[k]=a}
function expireCredits(notes){
  for(const k in KEEP_Y){if(S.certs[k]||!examProg(k))continue;const a=passYears(k),keep=a.filter(y=>S.year-y<=KEEP_Y[k]),lost=a.length-keep.length;
    if(lost){S.passY[k]=keep;setExamProg(k,keep.length);notes.push(['bad',`⌛ ${EXAMS[k].name}：有 ${lost} 科及格成績超過 ${KEEP_TXT[k]}保留期限，失效了。目前剩 ${keep.length}/${EXAMS[k].subj} 科。`])}}
  S.entryY=S.entryY||{};
  for(const k in WINDOW_Y){const y0=S.entryY[k];if(y0==null||S.certs[k]||S.year-y0<=WINDOW_Y[k])continue;
    const had=examProg(k);delete S.entryY[k];setExamProg(k,0);
    if(had)notes.push(['bad',`⌛ ${EXAMS[k].name}：從第一次報考起已經超過 3 年還沒考完，已過的 ${had} 科全部失效。要重新報名。`])}
}
function licenseRoll(notes){
  if(!S.flags.c3){const r=ri(1,20),m=Math.floor((S.st.skill-40)/8)+(S.trait==='exam'?2:0);if(r+m>=8){S.flags.c3=1;notes.push(['good',`🎉 會計事務丙級檢定通過！（擲骰 ${r}${sign(m)}）`])}else notes.push(['bad','丙級檢定沒過，明年再來。'])}
  else if(!S.flags.skillCert){const r=ri(1,20),m=Math.floor((S.st.skill-40)/8)+(S.trait==='exam'?2:0);if(r+m>=13){S.flags.skillCert=1;notes.push(['good',`🎉 會計事務乙級檢定通過！可以走「技優甄審」了。（擲骰 ${r}${sign(m)}）`])}else notes.push(['bad',`乙級檢定差一點。（擲骰 ${r}${sign(m)} < 13）`])}
  else notes.push(['','你已經有乙級證照了，持續精進實力。']);
}
function yearEnd(){
  const notes=[];const L=S.ledger;
  if(S._invest){const base=Math.max(S.cash,10);const r=ri(1,20);const pct=(r<=4?-.18:r<=12?.04:r<=19?.12:.4)+econNow()*.06+tSum('inv');const g=Math.round(base*pct);S.cash+=g;L.push([`投資損益（擲骰 ${r}）`,g]);S._invest=false}
  let inc=0;
  if(S.phase==='hs'){
    const H=S.edu.hs;addSt({aca:H.aY,skill:H.sY});
    const a=S.acts;
    const rs=S.st.aca+ri(-12,12)+H.rb+(a.includes('study')?10:0)+(a.includes('cram')?5:0)+(S.flags.rankBoost?6:0)-(a.includes('chill')?6:0)-(a.includes('part')?4:0);
    const pct=clamp(Math.round(115-rs*1.15),1,99);
    if(S.sy<=3)S.hsRanks.push(pct);
    S.flags.rankBoost=0;
    notes.push(['',`本學年校排：前 ${pct}%${S.sy<=3?'（繁星推薦看校排平均）':''}`]);
    if(a.includes('license'))licenseRoll(notes);
  }else if(S.phase==='uni'){
    if(S.job?.key==='grad'){S.job.yrs++;}
    else{
      const a=S.acts;
      const rs=(S.st.aca+S.st.skill)/2+ri(-12,12)+(a.includes('study')?10:0)+(S.flags.rankBoost?6:0)-(a.includes('chill')?6:0)-(S.edu.pres||1)*3+6;
      for(const x of dmList(S))if(x.type==='double'){addSt({mind:-2,hp:-1});notes.push(['',`雙主修${deptName(S.edu.uni,x.k)}的課很重：心態 -2、體力 -1`])}
      const pct=clamp(Math.round(110-rs*1.25),1,99);S.uniRanks.push(pct);S.flags.rankBoost=0;
      notes.push(['',`本學年系排：前 ${pct}%（研究所推甄看系排）`]);
    }
  }else if(S.job&&!(S.flags.hosp&&S.phase==='work')){
    const J=JOBS[S.job.key];
    if(!J.special){
      const sal=jobSalary();const bonus=GOVJ.includes(S.job.key)?Math.round(sal*.125):Math.round(sal*S.perf/380*(J.bonusMul||1)*({1:1.3,0:1,'-1':.55}[econNow()]));
      inc=sal+bonus;L.push([`年薪（${J.lad[S.job.lvl][0]}）`,sal]);L.push([`年終獎金（績效 ${S.perf}）`,bonus]);
      S.job.lastInc=inc;
      if(S.job.key==='startup'){
        const r=rand();
        if(r<.06+S.job.lvl*.02+econNow()*.03){const pay=[400,900,2200][S.job.lvl]+ri(0,300);L.push(['🚀 公司 IPO！股票選擇權變現',pay]);inc+=pay;notes.push(['good','公司掛牌上市了！你的選擇權變成真的錢。']);S.achv.add('新創 IPO')}
        else if(r>.86){notes.push(['bad','公司燒完錢了，宣布解散。你的選擇權變成壁紙。']);S.job=null}
      }
    }else{
      const k=S.job.key;
      if(k==='selfbook'||k==='selfcpa'){
        const per=k==='selfcpa'?7:3.5,rent=k==='selfcpa'?50:22;
        S.clients=Math.max(0,S.clients+Math.floor(S.st.net/15)+ri(-2,3)+econNow()-Math.floor(S.clients/(k==='selfcpa'?6:8)));
        const g=Math.round(S.clients*per);inc=g-rent;L.push([`客戶 ${S.clients} 家 × ${per} 萬`,g]);L.push(['房租、人事、雜支',-rent]);
      }else if(k==='creator'){
        const r=ri(1,20);S.fans=Math.max(0,S.fans+(r>=18?ri(6,12):r<=3?-ri(2,6):ri(-1,4)));
        inc=Math.round(S.fans*1.9+(r>=18?30:0));L.push([`業配與廣告分潤（${S.fans} 萬訂閱）`,inc]);
        if(r>=18)notes.push(['good','有支影片破百萬觀看！']);if(r<=3)notes.push(['bad','演算法改版，觀看數腰斬。']);
      }else if(k==='cafe'){
        inc=ri(-40,70)+Math.floor(S.st.net/2)+(S.flags.cafeFame||0)*8;L.push(['咖啡廳本年度淨利',inc]);
      }
      S.job.lastInc=inc;
    }
    if(S.job)S.job.yrs++;
  }
  if(S.phase==='work'&&S.job){S.workYears++;S.exp[S.job.key]=(S.exp[S.job.key]||0)+1}
  if(S.flags.hosp&&S.phase==='work'){/* 去年被強制住院：今年沒有收入，私人公司可能直接不要你 */
    L.push(['住院休養，這一年沒有收入',0]);inc=0;S.flags.hosp=0;S.flags.hospNow=1;S.st.hp=Math.min(100,S.st.hp+20);
    L.push(['復健與回診',-15]);S.cash-=15;S.flags.hospN=(S.flags.hospN||0)+1;
    if(S.job&&!inJob(S,...GOVJ)&&rand()<.5){S.job=null;notes.push(['bad','出院後回到公司，人資說：「你的位子，我們已經找人了。」'])}else notes.push(['','你出院了。身體好了一點，但存款少了一大截。'])}
  S.cash+=inc;S.earn+=Math.max(0,inc);
  if(S.phase==='work'){
    if(inc>0){const ti=Math.max(0,inc-45);const br=[[59,.05],[133,.12],[266,.2],[498,.3],[1e9,.4]];let tax=0,lo=0;for(const [hi,r] of br){if(ti>lo)tax+=(Math.min(ti,hi)-lo)*r;lo=hi}tax=Math.round(tax);if(tax>0){L.push(['綜合所得稅',-tax]);S.cash-=tax}}
    let live=S.age<30?24:28;if(S.married)live+=12;live+=kidsDep()*15;if(S.age>=30)live+=12;
    if(inJob(S,'abroad'))live+=25;live+=Math.round(Math.max(0,inc-60)*.25);live=Math.round(live*tMul('live'));
    S.lastLive=live;
    if(S.flags.stuloan&&(S.flags.loanY||0)<6){S.flags.loanY=(S.flags.loanY||0)+1;L.push([`就學貸款還款（${S.flags.loanY}/6）`,-6]);S.cash-=6}
    if(S.flags.rent){L.push(['套房租金收入',9]);S.cash+=9}
    if(S.flags.etf&&S.cash>0){const g=Math.round(Math.min(S.cash,2000)*(.04+econNow()*.03));if(g){L.push(['定期定額投資報酬',g]);S.cash+=g}}
    if(econNow()<0&&S.job&&!S.job.special&&!GOVJ.includes(S.job.key)&&rand()<.06){notes.push(['bad','景氣衰退，公司裁員，你在名單上。']);S.job=null}
    L.push(['生活費'+(S.married?'（含家庭）':'')+(S.age>=30?'＋孝親費':''),-live]);S.cash-=live;
    /* 沒買房就要租房（外派的住房已算在生活費裡） */
    {const rent=rentNow();if(rent){L.push(['房租',-rent]);S.cash-=rent}}
    if((S.flags.carY||0)>0){L.push([`車貸＋養車（車貸剩 ${S.flags.carY} 年）`,-14]);S.cash-=14;S.flags.carY--}
    else if(S.flags.car){L.push(['養車（油錢、保險、停車位）',-6]);S.cash-=6}
    if(S.love>0&&!S.married){const d=4+Math.min(S.love,3)*2;L.push(['約會、紀念日、一起旅行',-d]);S.cash-=d}
    if((S.flags.careY||0)>0){L.push([`${originOf().rel}的長照費用（還要 ${S.flags.careY} 年）`,-20]);S.cash-=20;S.flags.careY--;if(!S.flags.careY)S.flags.careDone=1}
    if(S.mortgage>0){const ln=loanLeft(),it=Math.round(ln*HOUSE.rate),pay=S.mortgage===1?ln+it:HOUSE.pay,prin=Math.min(ln,pay-it);
      S.loan=ln-prin;S.cash-=pay;S.mortgage--;if(!S.mortgage)S.loan=0;S.houseSpent=(S.houseSpent||0)+prin;
      L.push([`房貸（本金 ${prin}＋利息 ${it}，剩 ${S.mortgage} 年）`,-pay])}
    if(S.acts.includes('night')&&!deg(S)){S.flags.nightY=(S.flags.nightY||0)+1;
      if(S.flags.nightY>=4){S.edu.deg=true;S.edu.night=true;S.edu.major=S.edu.major||'acc';S.edu.pres=Math.max(S.edu.pres||0,1);notes.push(['good','🎉 進修部畢業！你拿到了大學學歷。']);S.achv.add('半工半讀拿到學位')}
      else notes.push(['',`進修部第 ${S.flags.nightY} 年完成（讀滿 4 年拿學位）`])}
    if(S.acts.includes('credits')&&S.flags.accCredits&&!S.flags.credNote){S.flags.credNote=1;notes.push(['good','會計學分補修完成，可以報考會計師了！'])}
  }
  expireCredits(notes);
  pensionYear(notes);
  takeExams(notes);
  if(S.phase==='work'&&S.st.eng>=75&&!S.flags.engNote){S.flags.engNote=1;notes.push(['good','🌏 英文達到 75：可以投遞新加坡區域財務的職缺了（另外要專業 58）。'])}
  if(S.fans>0&&!inJob(S,'creator')&&S.acts.includes('side')){const g=Math.round(S.fans*.8);if(g>0){S.cash+=g;L.push(['自媒體副業收入',g])}}
  // stress
  const J=S.job?JOBS[S.job.key]:null;const str=S.phase==='work'?(J?J.stress:3):(S.phase==='hs'&&S.sy>=3?6:3);
  const hpT=68-Math.max(0,S.age-45)*1.2;/* 45 歲以後，身體自然恢復的目標越來越低 */
  let dh=Math.round((hpT-S.st.hp)*.2-str*.6+2),dm=Math.round((65-S.st.mind)*.2-str*.45+2);
  if(S.age>=45)dh-=2;if(S.age>=55)dh-=2;if(S.flags.gym)dh+=2;if(S.flags.cat)dm+=1;
  dh+=tSum('hpY');dm+=tSum('mindY');if(dh<0)dh=Math.round(dh*tMul('hpLoss'));if(dm<0)dm=Math.round(dm*tMul('mindLoss'));
  if(!S.job&&S.phase==='work')dm-=6;
  /* 出社會後欠錢要付利息；學生時期當作跟爸媽借的，不收利息，但還是自己的負債。
     信用卡循環利率依信用評等分級（法定上限 15%，多數人約 5%）：欠款第 1 年 5%，之後每年 +2.5%，第 5 年起 15%。
     前 30 萬（約信用卡額度）用循環利率，超過的部分轉成信用貸款／債務協商，利率 6%（不然會無限滾雪球）。
     存款回到正數，信用就慢慢恢復，下次欠款從 5% 重新算 */
  if(S.cash<0&&S.phase==='work'){S.flags.debtY=(S.flags.debtY||0)+1;
    const rate=Math.min(.15,.05+(S.flags.debtY-1)*.025),debt=-S.cash,card=Math.min(debt,30),loan=debt-card,i1=money(card*rate),i2=money(loan*.06);
    if(i1>0){L.push([`負債利息：信用卡循環（${+(rate*100).toFixed(1)}%，欠款第 ${S.flags.debtY} 年）`,-i1])}
    if(i2>0){L.push(['負債利息：信用貸款／債務協商（6%）',-i2]);if(!S.flags.debtNote){S.flags.debtNote=1;notes.push(['bad','💳 欠款超過信用卡額度了。銀行把超過的部分轉成信用貸款，利率比較低，但你得慢慢還。'])}}
    if(S.flags.debtY===3)notes.push(['bad','📉 連續欠款三年，你的信用評等越來越差，循環利率一直往上調。'])
    S.cash=money(S.cash-i1-i2)}
  else if(S.phase==='work')S.flags.debtY=0;
  if(S.cash<0){if(S.phase==='work'){dm-=6;notes.push(['bad','存款變成紅字了。會計人最怕看到的括號，出現在自己的帳上。'])}else{dm-=2;notes.push(['bad',`你跟${originOf().rel}借了錢。${originOf().rel}說不急，但這筆帳，你自己記得。`])}}
  S.st.hp=clamp(S.st.hp+dh,0,100);S.st.mind=clamp(S.st.mind+dm,0,100);
  /* 體力上限：45 歲以後每年下降，休息也補不回來（65 歲剩 65） */
  const hpCap=Math.round(100-Math.max(0,S.age-45)*1.75);
  if(S.st.hp>hpCap){S.st.hp=hpCap;if(!S.flags.capNote){S.flags.capNote=1;notes.push(['bad',`身體開始走下坡了。你的體力上限剩 ${hpCap}，之後每年都會再少一點。`])}}
  // promotion
  let promoted=false;
  if(S.phase==='work'&&S.job&&!JOBS[S.job.key].special&&!S.flags.hospNow){
    const J2=JOBS[S.job.key];const nl=S.job.lvl+1;
    if(nl<J2.lad.length){
      const rq=J2.req[nl];let okReq=S.job.yrs>=rq.y;const miss=[];
      for(const k of ['skill','net','eng','mind'])if(rq[k]&&S.st[k]<rq[k]){okReq=false;miss.push(`${STATN[k]} ${rq[k]}`)}
      if(rq.cert&&!S.certs[rq.cert]){okReq=false;miss.push('會計師證照')}
      if(okReq){
        const r=ri(1,20);const m=Math.floor(S.perf/10)-4+tSum('promo');
        if(r+m>=10){S.job.lvl=nl;S.job.yrs=0;promoted=true;notes.push(['good',`升官了！你現在是「${J2.lad[nl][0]}」（擲骰 ${r}${sign(m)}）`]);
          if(S.job.key==='big4'&&nl===5)S.achv.add('四大合夥人');if(nl===J2.lad.length-1)S.achv.add(`登頂：${J2.lad[nl][0]}`)}
        else notes.push(['',`這次升遷名單沒有你。（擲骰 ${r}${sign(m)} < 10，績效越高越容易）`]);
      }else if(S.job.yrs>=rq.y&&miss.length)notes.push(['',`升「${J2.lad[nl][0]}」還差：${miss.join('、')}（記得配點！）`]);
    }
  }
  if(S.phase==='work'&&S.job){
    const sp=JOBS[S.job.key].special;const v=sp?(S.job.lastInc||0):jobSalary();
    if(!S.peak||v>S.peak.sal)S.peak={t:jobTitle(),sal:v,k:S.job.key};
  }
  if(S.phase==='work'&&!S.dead){
    if(S.st.hp<10){S.dead='過勞';notes.push(['bad','你倒在辦公桌前。同事以為你只是又趴著睡著了。'])}
    else if(S.st.hp<20&&!S.flags.hosp){S.flags.hosp=1;const med=40+ri(0,20);S.cash-=med;L.push(['住院醫藥費（自費病房、看護）',-med]);
      notes.push(['bad',`🏥 體力跌破 20，醫生強制你住院。醫藥費 ${med} 萬，明年一整年不能上班，但房租和生活費照樣要繳。`])}
  }
  let crash=null;
  if(!S.dead&&(S.st.hp<=0||S.st.mind<=0)){
    const which=S.st.hp<=0?'身體':'心理';
    if(S.phase==='work'){S.burn++;
      if(S.age>=55||S.burn>=3)crash=which;
      else{notes.push(['bad',`${which}亮紅燈，你被迫停下來休養。`+(inJob(S,...GOVJ)?'（公務員可以留職停薪）':'工作也沒了。')]);
        if(!inJob(S,...GOVJ))S.job=null;S.st.hp=Math.max(S.st.hp,55);S.st.mind=Math.max(S.st.mind,55);S.cash-=10;L.push(['醫療費用',-10])}
    }else{notes.push(['bad',`${which}撐不住了，你休學（休息）了一陣子。`]);S.st.hp=Math.max(S.st.hp,50);S.st.mind=Math.max(S.st.mind,50)}
  }
  const gainT=k=>{if(!k||S.titles.includes(k)||S.titles.length>=6)return;if(TCONF.some(([a,b])=>(a===k&&S.titles.includes(b))||(b===k&&S.titles.includes(a))))return;S.titles.push(k);(S.tY=S.tY||{})[k]=S.year;const t=TITLES[k];notes.push([t.neg?'bad':'good',`${t.neg?'😵':'🏅'} 獲得稱號「${t.n}」：${t.d}`]);S.log.push({y:S.year,a:S.age,t:'',h:`獲得稱號「${t.n}」`})};
  if(S.c20>=3&&!S.titles.includes('chosen'))gainT('chosen');
  if(S.c1>=3&&!S.titles.includes('jinx'))gainT('jinx');
  if(S.dice&&S.dice.length>=3&&S.dice.every(v=>v===6))gainT('dicegod');
  if((S.exp.big4||0)+(S.exp.ib||0)>=8)gainT('workaholic');
  if(S.burn>=1)gainT('glassheart');
  if(S.flags.gym&&S.st.hp>=80)gainT('iron');
  for(const k of [...S.titles]){if(S.year-((S.tY||{})[k]||0)<3)continue;const t=TITLES[k];let p;
    if(t.neg)p=.07;
    else if(['chosen','star','lucky6','dicegod','investor'].includes(k))p=S.age>=40?.09:.02;
    else if(['iron','longevity','earlybird','owl'].includes(k))p=S.age>=45?.07:.01;
    else if(['genius','examgod','allround'].includes(k))p=S.age>=50?.06:.01;
    else p=.03;
    if(rand()<p){const to=!t.neg&&S.age>=40&&rand()<.6?TFLIP[k]:null;const m=dropTitle(k,to);if(m)notes.push([to||!t.neg?'bad':'good',(t.neg?'🌤 ':'🍂 ')+m])}}
  const hl=[];if(promoted)hl.push('升遷');notes.filter(n=>n[1].includes('🎉')).forEach(n=>hl.push(n[1].replace('🎉 ','').split('！')[0]));
  hl.push(...(S.yearTitles||[]).slice(0,2));
  S.log.push({y:S.year,a:S.age,t:identity(),h:hl.join('；')});
  S.flags.cram=0;S.flags.cramYdone=S.flags.cramY;
  S.offers=[];
  if(!crash){
    const q=(S.age<40?.0003:S.age<50?.0008:S.age<60?.002:.004)*(S.st.hp<20?3:S.st.hp<40?1.5:1)*tMul('life');
    if(rand()<q){S.dead=S.age<45?'一場突如其來的意外':'突發的疾病';notes.push(['bad','人生沒有預告。'])}
  }
  let next='normal';
  if(S.dead)next='death';
  else if(crash)next='crash';
  else if(S.phase==='hs'&&S.sy>=3)next='admit';
  else if(S.phase==='uni'&&!S.job&&S.sy>=4)next='gadmit';
  else if(S.phase==='uni'&&!S.job&&dmTypes().length)next='dm';
  else if(S.phase==='uni'&&S.job?.key==='grad'&&S.job.yrs>=2){
    S.flags.master=1;S.edu.pres=Math.max(S.edu.pres||0,S.edu.grad.pres);
    if(S.edu.grad.f==='gI')S.certs['資料分析學程']=1;
    S.achv.add('碩士畢業');S.job=null;S.phase='work';S.edu.deg=true;genOffers(true);next='gradwork';
  }else if(S.phase==='work')genOffers(!S.job);
  (S.nwHist=S.nwHist||[]).push([S.age,netWorth()]);
  S.report={L:[...L],notes,crash,next};S.stage='yearend';render();
}

/* ================= OFFERS ================= */
function genOffers(fresh){
  const out=[];const cur=S.job?.key;
  const ladderKeys=Object.keys(JOBS).filter(k=>!JOBS[k].special&&k!==cur&&JOBS[k].entry(S));
  for(let i=ladderKeys.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[ladderKeys[i],ladderKeys[j]]=[ladderKeys[j],ladderKeys[i]]}
  // prefer group-fit
  const fav=[];if(S.flags.gA)fav.push('big4','ib','abroad');if(S.flags.gB)fav.push('corp','data','inaudit');if(S.flags.gC)fav.push('tax','gov','forensic','fsc');if(S.flags.law)fav.push('lawyer','legal');if(S.certs.CPA)fav.push('fas','twse');const DF={fin:['bank','ib','fund','fintech'],cs:['data','erp','itaudit'],econ:['credit','fund'],taxm:['tax','gov','customs'],biz:['pm','startup','npo'],stat:['data','credit'],intl:['abroad','customs','fpa'],law:['lawyer','legal']};for(const x of dmList(S))fav.push(...(DF[DEPTS[x.k].flag]||[]));if(S.flags.gF||S.flags.fin)fav.push('ib','bank','fund','wealth');if(S.flags.cs)fav.push('swe','data','fintech');
  const hotJ=SECTORS[eraOf(S.year).hot].jobs;
  ladderKeys.sort((a,b)=>(fav.includes(b)?1:0)+(hotJ.includes(b)?1:0)-(fav.includes(a)?1:0)-(hotJ.includes(a)?1:0));
  let n=fresh?3:(rand()<.35+S.st.net/250?1:0);
  if(fresh&&(S.edu.pres||0)>=4)n++;
  n+=econNow();if(fresh)n=Math.max(n,2);n=Math.max(n,0);
  if(S.acts.includes('hunt'))n+=2;if(S.flags.headhunt){n+=1;S.flags.headhunt=0}
  const force=(k,why)=>{if(k!==cur&&JOBS[k].entry(S)&&!out.find(o=>o.k===k))out.push({k,why})};
  if(S.flags.newGov){force('gov','高考分發');S.flags.newGov=0}
  if(S.flags.newFor){force('forensic','特考分發');S.flags.newFor=0}
  if(S.flags.newCus){force('customs','特考分發');S.flags.newCus=0}
  if(S.flags.returnOffer&&fresh){force('big4','實習預聘');S.flags.returnOffer=0}
  if(S.flags.startupInvite){force('startup','學長邀請');S.flags.startupInvite=0}
  if(S.flags.abroadInvite){force('abroad','公司外派');S.flags.abroadInvite=0}
  if(S.flags.vocIntern&&!deg(S)&&fresh)force('local','實習單位邀請');
  for(const k of ladderKeys){if(out.length>=n)break;if(!out.find(o=>o.k===k))out.push({k})}
  if(fresh&&!out.length)out.push({k:'local'});
  if(S.phase==='work'){
    for(const k of ['selfbook','selfcpa','creator','cafe']){
      if(k===cur||!JOBS[k].entry(S))continue;
      if(k==='cafe'&&!(S.st.mind<40||rand()<.12))continue;
      out.push({k,sp:1});
    }
  }
  for(const o of out){const J=JOBS[o.k];if(J.special){o.lvl=0;continue}
    let lvl=0;if(![...GOVJ,'tutor'].includes(o.k)&&S.workYears>=3){lvl=Math.min(Math.floor(S.workYears/4),J.lad.length-2,3);
      while(lvl>0){const rq=J.req[lvl];if(['skill','net','eng'].every(k=>!rq[k]||S.st[k]>=rq[k]-5)&&(!rq.cert||S.certs[rq.cert]))break;lvl--}}
    o.lvl=lvl}
  S.offers=out;
}
const ACH={semi:'進入半導體業',swe:'轉職工程師',pm:'當上 PM',fund:'管理基金',vc:'踏入創投',fintech:'金融科技',fpa:'外商科技業',wealth:'成為理專',gov:'考上公職',abroad:'海外工作',data:'成功轉職科技業',selfbook:'自己當老闆',selfcpa:'掛牌執業會計師',creator:'全職網紅',cafe:'轉行開店',forensic:'調查局探員',esg:'永續顧問',ib:'踏進投行'};
function acceptOffer(i){
  const o=S.offers[i];const J=JOBS[o.k];
  const old=S.job?jobTitle():null;
  if(J.cost){S.cash-=J.cost}
  if(o.k==='selfbook'||o.k==='selfcpa')S.clients=Math.max(S.clients,S.flags.sidebook?6:2)+Math.floor(S.st.net/15);
  S.job={key:o.k,lvl:o.lvl||0,yrs:0,special:!!J.special,...(o.why==='公司外派'?{expat:1}:{})};
  S.phase='work';
  if(ACH[o.k])S.achv.add(ACH[o.k]);
  S.log.push({y:S.year,a:S.age,t:'',h:`➜ ${old?`離開「${old}」，`:''}加入「${J.name}」${o.lvl?`（${J.lad[o.lvl][0]}）`:''}`});
  nextYear();
}
function stay(){nextYear()}
function nextYear(){
  S.age++;S.year++;S.sy++;
  if(S.age>=65){endGame('retire');return}
  setupPlan();
  /* 住院的那一年：不能擲骰、不能選行動、也不會遇到事件，直接跳到年底結算 */
  if(S.flags.hosp&&S.phase==='work'){S.planChips=[];S.yearEvs=[];S.yearTitles=[];S.dice=[];S.asg=[];yearEnd();return}
  render();
}

/* ================= 雙主修／輔系 ================= */
function dmChance(k,type){
  const D=DEPTS[k],u=S.edu.uni,P=dmPol(u);const rank=S.uniRanks.length?avg(S.uniRanks):50;
  if(type==='double'&&P.gate&&rank>P.gate)return 0;
  const sc=S.st.aca*.6+(100-rank)*.4+((S.flags.science&&['im','stat'].includes(k))?5:0)-D.diff-(type==='double'?12:0)-((u.pres||3)-3)*2;
  return clamp((sc-28)/40,.05,.95);
}
/* 還能申請哪幾種：看學校規定的上限、已經有的、還有沒有沒選過的科系；雙主修只到大二、輔系到大三 */
function dmTypes(){
  if(S.phase!=='uni'||S.job)return[];const u=S.edu.uni;if(!u)return[];const P=dmPol(u),L=dmList(S);
  if(L.length>=P.total||!deptsOf(u).some(k=>!L.find(x=>x.k===k)))return[];
  const out=[];if(S.sy<=2&&P.dbl>L.filter(x=>x.type==='double').length)out.push('double');
  if(S.sy<=3&&P.minor>L.filter(x=>x.type==='minor').length)out.push('minor');
  return out;
}
function startDM(){S.dmS={type:null,res:null,tries:(S.dmS?.tries||0)+1};S.stage='dm';render()}
function applyDM(k){
  const t=S.dmS.type,p=dmChance(k,t),ok=p>0&&rand()<p,D=DEPTS[k];
  S.dmS.res={k,ok,p};
  if(ok){S.edu.dms=[...dmList(S),{k,type:t}];S.flags[D.flag]=1;addSt(D.perk);if(t==='double'){addSt(D.perk);S.flags.dm=1}
    const tn=t==='double'?'雙主修':'輔系';S.log.push({y:S.year,a:S.age,t:'',h:`📚 ${tn}${deptName(S.edu.uni,k)}錄取`});S.achv.add(t==='double'?'雙主修':'輔系');}
  render();
}
/* ================= ADMISSION（大學） ================= */
function startAdmit(){
  const v=isVoc(S);
  const base=v?S.st.aca*.5+S.st.skill*.5:S.st.aca*.75+S.st.eng*.25;
  const sc=clamp(Math.round(base*(v?.75:.72)+(v?7:3)+ri(-4,4)+(S.flags.cramYdone?1:0)+(S.trait==='exam'?2:0)+tSum('exam')),10,60);
  S.adm={voc:v,score:sc,rank:Math.round(avg(S.hsRanks)),ch:0,chs:v?['vstar','skill','vapply','vdist']:['star','apply','dist'],picks:[],res:null,score2:null};
  S.flags.cramYdone=0;
  S.stage='admit';render();
}
const CHN={
  star:{n:'繁星推薦',max:1,d:'看高中三年校排（平均）＋學測門檻。社區高中的校排優勢在這裡發揮。'},
  apply:{n:'個人申請',max:3,d:'一階看學測級分，二階看學習歷程＋面試（心態、人脈）。'},
  dist:{n:'分科測驗・登記分發',max:6,d:'七月再考一次分科測驗，依分數由高到低分發。記得填一個保底志願。'},
  vstar:{n:'繁星計畫（技職）',max:1,d:'看高職校排平均＋統測門檻。'},
  skill:{n:'技優甄審',max:2,d:'持有乙級證照或技藝競賽得獎才能報名，錄取率高。'},
  vapply:{n:'四技甄選入學',max:3,d:'統測成績＋備審資料＋面試。'},
  vdist:{n:'四技登記分發',max:6,d:'純看統測分數，依志願分發。'},
};
function admCands(){
  const A=S.adm;const t=A.voc?'t':'u';
  const ch=A.chs[A.ch];return UNIS.filter(u=>u.t===t&&(!u.need||S.flags[u.need])&&(!u.only||u.only.includes(ch))).sort((a,b)=>cutOf(b)-cutOf(a));
}
function admChance(u){
  const A=S.adm,ch=A.chs[A.ch],sc=A.score;
  if(ch==='star'||ch==='vstar'){
    const uc=cutOf(u);if(!u.star||sc<uc-8)return 0;const req=u.star;
    return A.rank<=req?.85:A.rank<=req*1.6?.35:.06;
  }
  if(ch==='apply'||ch==='vapply'){
    const p1=u.cut===0?.97:clamp(.5+(sc-cutOf(u))*.15,.03,.97);
    const mod=Math.floor(((S.st.mind+S.st.net)/2-50)/10)+Math.min(3,Math.floor(S.port/2))+tSum('iv');
    return p1*clamp((10+mod)/20,.05,.95);
  }
  if(ch==='skill'){if(!S.flags.skillCert)return 0;return cutOf(u)<=sc+8?(S.flags.award?.92:.72):.25}
  if(ch==='dist'||ch==='vdist'){return cutOf(u)<=A.score2?1:0}
  return 0;
}
function admEnterChannel(){
  const A=S.adm;const ch=A.chs[A.ch];A.picks=[];A.res=null;
  if(ch==='dist'){const base=S.st.aca*.8+S.st.eng*.2;A.score2=clamp(Math.round(base*.7+3+ri(-5,5)+(S.trait==='exam'?2:0)+tSum('exam')),10,60)}
  if(ch==='vdist')A.score2=A.score;
}
function admSubmit(){
  const A=S.adm;const ch=A.chs[A.ch];const C=admCands();
  if(ch==='dist'||ch==='vdist'){
    const ordered=C.filter(u=>A.picks.includes(u.id));
    const got=ordered.find(u=>cutOf(u)<=A.score2);
    A.res=ordered.map(u=>({id:u.id,ok:got&&u.id===got.id,skip:got&&cutOf(u)<cutOf(got)}));
  }else{
    A.res=A.picks.map(id=>{const u=UNIS.find(x=>x.id===id);return{id,ok:rand()<admChance(u),p:admChance(u)}});
  }
  render();
}
function enterUni(id,via){
  const u=UNIS.find(x=>x.id===id);
  S.edu.uni=u;S.edu.major=u.maj;S.edu.pres=u.pres;S.edu.via=via;
  addSt(u.perk);if(u.flag)S.flags[u.flag]=1;
  S.phase='uni';S.sy=0;
  if(u.id==='ntu')S.achv.add('考上台大');
  if(via)S.achv.add(`${via}上榜`);
  S.log.push({y:S.year,a:S.age,t:'',h:`🎓 透過「${via}」錄取 ${uniName(u)}`});
  nextYear();
}
function admNext(){S.adm.ch++;admEnterChannel();render()}
function retake(){S.flags.retake=1;S.log.push({y:S.year,a:S.age,t:'',h:'決定重考一年'});S.sy=3;nextYear()}
function goWorkHS(){
  S.phase='work';S.edu.deg=false;S.edu.major=null;
  S.log.push({y:S.year,a:S.age,t:'',h:'高中職畢業，直接投入職場'});S.achv.add('早早出社會');
  genOffers(true);S.report={L:[],notes:[],next:'jobhunt'};S.stage='jobhunt';render();
}

/* ================= ADMISSION（研究所） ================= */
function startGAdmit(){S.edu.deg=true;S.gad={ch:0,chs:['rec','exam'],picks:[],res:null};S.stage='gadmit';render()}
function gEst(ch){
  const rank=avg(S.uniRanks);
  if(ch==='rec')return tSum('iv')*2+S.st.skill*.5+(100-rank)*.4+(S.flags.research?8:0)+(S.flags.caseAward?4:0)+((S.edu.pres||1)-3)*2;
  return tSum('exam')*2+S.st.aca*.55+S.st.skill*.45+(S.flags.gradPrep?4:0)+(S.flags.cpaCram?2:0)+(S.trait==='exam'?2:0);
}
function gChance(g){
  if(g.need&&!S.flags[g.need])return 0;
  const ch=S.gad.chs[S.gad.ch];const est=gEst(ch);
  return clamp(.5+(est-cutOf(g))*(ch==='rec'?.06:.07),.03,.95);
}
function gSubmit(){const G=S.gad;G.res=G.picks.map(id=>{const g=GRADS.find(x=>x.id===id);return{id,ok:rand()<gChance(g)}});render()}
function gNextCh(){const G=S.gad;G.ch=1;G.picks=[];G.res=null;render()}
function enterGrad(id){
  const g=GRADS.find(x=>x.id===id);const via=S.gad.chs[S.gad.ch]==='rec'?'研究所推甄':'研究所考試';
  S.edu.grad=g;S.flags[g.f]=1;S.job={key:'grad',lvl:0,yrs:0,special:true};S.phase='uni';
  S.achv.add(`${via}上榜`);
  S.log.push({y:S.year,a:S.age,t:'',h:`🎓 透過「${via}」錄取 ${g.n} ${g.g}`});
  nextYear();
}
function skipGrad(){
  S.phase='work';S.edu.deg=true;
  S.log.push({y:S.year,a:S.age,t:'',h:'大學畢業，直接就業'});
  genOffers(true);S.report={L:[],notes:[],next:'jobhunt'};S.stage='jobhunt';render();
}

/* ================= ENDING ================= */
/* 目前每年的房租（沒買房、沒外派才要付） */
function rentNow(){return !S.house&&!inJob(S,'abroad')?(S.age<30?14:S.age<40?18:22)+(S.married?8:0)+kidsDep()*3:0}
/* 提早退休門檻（4% 法則）：每年固定開銷 × 25。開銷包含生活費、房租、養車、約會；
   還沒繳完的房貸要先還清，所以另外加上剩下的貸款 */
function fireTarget(){const car=(S.flags.carY||0)>0?14:S.flags.car?6:0,love=S.love>0&&!S.married?4+Math.min(S.love,3)*2:0;
  return Math.max(2000,((S.lastLive||40)+rentNow()+car+love)*25+kidsDep()*200+(S.mortgage>0?loanLeft():0))}
function fireOK(){return S.phase==='work'&&S.age>=35&&S.cash>=fireTarget()}
/* 還要養的小孩：出生後 22 年內（大學畢業前）才算開銷 */
function kidsDep(){return S.kidY?S.kidY.filter(y=>S.year-y<22).length:S.kids}
/* 房子：房價 1400 萬、頭期 250 萬、貸款 1150 萬、利率 2%、30 年本息平均攤還（每年約 51 萬）。
   房產淨值＝房價－還沒還的貸款，所以買房當下淨資產不變 */
const HOUSE={price:1400,down:250,rate:.02,pay:51};
function loanLeft(){return S.loan!=null?S.loan:Math.round(S.mortgage*(HOUSE.price-HOUSE.down)/30)}
function netWorth(){return money(S.cash+(S.house?HOUSE.price-(S.mortgage>0?loanLeft():0):0)+(S.rentProp||0)+(S.pen||0))}/* rentProp：收租的套房（300 萬） */
/* 退休金專戶（不能提早領，所以「提早退休」只看存款）：
   一般上班族：勞退新制，雇主每年提撥薪水的 6%（不從薪水扣；月提繳工資上限 15 萬）；新加坡當地聘用的沒有，公司外派的才有
   公務員：2023/7/1 以後初任適用個人專戶制，以「本俸加一倍」（約薪水的 8 成）× 15% 提撥，政府 65%、個人 35%
   專戶每年約 3% 報酬 */
function pensionYear(notes){
  if(S.pen)S.pen=Math.round(S.pen*1.03);
  if(S.phase!=='work'||!S.job||JOBS[S.job.key].special||S.flags.hospNow)return;
  if(S.job.key==='abroad'&&!S.job.expat)return;/* 自己應徵新加坡當地職缺：沒有台灣勞退（新加坡 CPF 也只給公民和永久居民）；台灣公司外派才繼續提撥 */
  const sal=jobSalary(),gov=inJob(S,...GOVJ),add=Math.round(gov?sal*.8*.15:Math.min(sal,180)*.06);/* 勞退月提繳工資最高 15 萬（2026 年分級表），一年最多提繳 180 萬 × 6% ＝ 10.8 萬 */
  S.pen=(S.pen||0)+add;
  if(!S.flags.penNote){S.flags.penNote=1;notes.push(['',gov?`🏦 公務人員退撫個人專戶開始提撥：今年存入 ${add} 萬（政府 65%、個人 35%）。退休後才能領。`:`🏦 雇主開始幫你提撥勞退：每年薪水的 6% 存進個人專戶，今年 ${add} 萬。60 歲以後才能領。`])}
}
/* 現值：把結局的淨資產，用 2% 的折現率（資金的時間價值）折回 15 歲那年。
   遊戲裡的薪水、物價不會隨通膨上漲，數字本來就是「今天的錢」，所以這裡不是扣通膨 */
const PV_RATE=.02;
function presentValue(v,years){return money(v/Math.pow(1+PV_RATE,years))}
/* 人生資產負債表：期初存款＋一生收入－一生支出－購屋（轉為不動產）＝現金與投資；再加上不動產、退休金＝淨資產 */
function lifeLedger(){const cash0=3+(TRAITS[S.trait].cash||0),house=S.houseSpent||0,nw=netWorth();
  return {cash0,earn:S.earn,house,spent:money(cash0+S.earn-S.cash-house),cash:S.cash,prop:money(nw-S.cash-(S.pen||0)),pen:S.pen||0,nw,pv:presentValue(nw,S.age-15)}}
function endPrologue(){S.stage='junior';render()}
function currentSeason(d){d=d||new Date();const m=d.getMonth()+1;return m<=3?'busy':m===5?'tax':m>=6&&m<=8?'summer':m>=11?'yearend':''}
function endGame(type){S.endType=type;S.stage='end';render()}
function endingTitle(){
  const t=S.endType,k=S.peak?.k,nw=netWorth();
  if(t==='death')return['人生突然關帳',`${S.age} 歲那年，${S.dead}讓你的人生帳本提早畫上了雙線。沒有人準備好，但你留下的每一筆分錄，都有人記得。`];
  if(t==='crash')return['被人生強制關帳','你把自己燃燒成了別人的財報。下輩子，記得先幫自己提列一點「健康準備」。'];
  if(t==='fire')return[S.age<45?'年輕的 FIRE 傳說':'提早退休的自由人',`你在 ${S.age} 歲按下了人生的「結帳」鍵。從此以後，每天都是週六。`];
  const top=S.peak?.t;
  const map={
    '合夥人':['四大合夥人','你從審計員一路熬成合夥人。辦公室有窗了，但你已經不記得上一次準時下班是什麼時候。'],
    '稅務合夥人':['稅務界的大神','你的名字是各大企業的租稅救命符。每年五月，大家還是會想起你。'],
    '財務長':['上市公司財務長','你在法說會上自信地解釋毛利率。當年搞不懂借貸的新生，現在負責整家公司的錢。'],
    'APAC CFO':['亞太區財務長','從台灣到新加坡，你的英文報告讓老外點頭稱是。護照蓋滿了章。'],
    '董事總經理':['投行董事總經理','你敲過的鐘比廟裡還多。財富自由，但肝已經不是原廠的了。'],
    '主任秘書':['鐵飯碗的頂端','公務體系的高層，月退俸穩穩的。你的人生就像一份勾稽完美的報表。'],
    '補教天王':['會計補教天王','全台會計師有一半聽過你的課。你的口頭禪變成了考生的護身符。'],
    '數據長':['從會計到數據長','你證明了會計人的邏輯可以走得很遠。VLOOKUP 是你一切的起點。'],
    '處長':['調查局的鑑識傳奇','你追過的金流可以繞地球一圈。'],
    '稽核長':['讓人敬畏的稽核長','全公司都怕你，但董事會最信任你。'],
    '永續總監':['永續界的領頭羊','你讓公司的碳排和帳一樣乾淨。地球謝謝你。'],
    '財務副總':['半導體大廠財務副總','分紅、擴廠、法說會。你見證了台灣科技業最瘋狂的年代。'],
    'Finance Director':['外商財務總監','你的英文比母語還常用，總部的人都知道 Taiwan 有一個很可靠的你。'],
    '技術長':['會計出身的技術長','你寫的第一行程式是 =SUM()。後來，你帶領整個工程團隊。'],
    '產品長':['產品長','你讓工程師和業務終於說同一種語言：數字。'],
    '投資長':['投信投資長','你管理的錢比很多公司的市值還大。每天早上七點，你依然準時開晨會。'],
    '分行經理':['分行經理','整條街的阿姨都認識你。你是她們最信任的理財顧問。'],
    '營運長':['金融科技營運長','你讓支付變得更安全、更方便。法規和程式碼，你都懂。'],
    '創投合夥人':['創投合夥人','你投過的公司，有幾家已經敲鐘了。你看財報的眼光，就是最好的護城河。'],
    '合夥律師':['懂會計的併購律師','你在談判桌上一邊翻合約、一邊翻財報。對方律師看不懂的附註，你一眼就看穿。'],
    '法遵長':['上市公司法遵長','董事會開會前，所有人都會先問一句：「法遵那邊怎麼說？」'],
    '檢查局副局長':['金融業最怕的人','你帶隊檢查過的銀行，至今還在流傳你的名字。'],
    '併購顧問合夥人':['併購界的翻帳高手','上百億的併購案，最後都卡在你一句「這筆帳我要再看一次」。'],
    '上市審查部經理':['敲鐘前的守門人','台股有一半的新面孔，都曾經坐在你對面接受提問。'],
    '風險諮詢合夥人':['懂系統的審計合夥人','你看帳，也看程式碼。客戶的資安長和財務長，都只信你一個人。'],
    '顧問總監':['ERP 導入天王','全台有一半的上市公司，是用你設計的流程在關帳。'],
    '評等總監':['一個字母定生死的人','你給的評等，決定了多少公司的借錢成本。你從來沒有因為壓力改過一個字母。'],
    '關務署副署長':['國門的守帳人','你攔下的走私和低報，加起來可以蓋好幾座體育館。'],
    '執行長':['非營利組織的執行長','你讓每一塊捐款都看得見去處。你證明了，會計也可以讓世界變好一點。'],
    '新創 CFO':['新創財務長','你經歷過燒錢、募資、倒閉、重來。履歷精彩得像一部電影。'],
  };
  if(map[top])return map[top];
  if(k==='selfcpa')return[S.clients>=35?'地方傳奇會計師':'招牌掛著你名字的會計師',`你的事務所有 ${S.clients} 家客戶，巷口的阿伯都叫你「先生」。`];
  if(k==='selfbook')return[S.clients>=40?'記帳士界的里長伯':'巷口的記帳士',`${S.clients} 家客戶，每年五月門口大排長龍。你是整條街的財務守護神。`];
  if(k==='creator')return[S.fans>=60?'百萬訂閱財會網紅':'財會 YouTuber',`${S.fans} 萬人訂閱你的頻道。你讓會計變得不無聊，這可能是全台最難的事。`];
  if(k==='cafe')return['帳最漂亮的咖啡廳老闆','你離開了數字的世界，但每晚打烊後，還是會忍不住幫店裡做月結。'];
  if(GOVJ.includes(k))return['安穩退休的公務員','準時上下班，退休金一筆一筆存進專戶。你的人生沒有大起大落，但每天都睡得很好。'];
  if(nw<0)return['負債退休的會計人','你幫無數公司把帳做平，自己的帳最後卻是括號。退休那天，你把信用卡帳單摺好，放進抽屜最深處。'];
  if((S.flags.hospN||0)>=2)return['用健康換存款的人',`你住過 ${S.flags.hospN} 次院，病歷比你的履歷還厚。存下來的錢，有一大半最後都繳給了醫院。`];
  if(S.flags.divorced&&nw<2500)return['帳平了，家散了','財產分得很清楚，每一筆都對得上。只是週末的餐桌，從此只剩一副碗筷。'];
  if(S.house&&S.mortgage>0)return['幫銀行打工到退休',`退休那天，房貸還剩 ${S.mortgage} 年。你終於懂了：房子是資產，房貸是你的一生。`];
  if(S.flags.careDone&&nw<1500)return['夾心世代的倖存者','上有爸媽要照顧，下有帳單要繳。你沒有成為誰的傳奇，但你撐住了一個家。'];
  if(!S.house&&nw<800)return['一輩子幫房東繳房貸','你算過，這輩子付出去的房租，剛好夠買下當年那間不敢買的房子。'];
  if(nw>=3000)return['低調的千萬富翁','你不是最風光的那個，但你是同學會裡最會存錢的那個。'];
  if(!deg(S))return['沒有學歷也走出一片天','你證明了，人生的路不只一條。'];
  return[`退休的${top||'會計人'}`,'平凡但踏實的一生。你的帳，借貸平衡。'];
}
