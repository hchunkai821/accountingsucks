/* 08-auto.js — 自動模擬：策略、配點、選項判斷。檔案最後一行 render() 啟動遊戲 */
"use strict";
{const v=document.getElementById('ver');if(v)v.textContent='v'+VERSION}
const AI={state:'none',on:false,per:1};
function aiActive(){return false}
function aiRequest(){return {st:'fail'}}

/* ================= 自動模擬 ================= */
const AUTO={on:false,panel:false,strat:'balanced',speed:450,timer:null};
function autoStart(){AUTO.on=true;AUTO.panel=false;setConfirmReset(false);renderCtrl();autoTick()}
function autoStop(){AUTO.on=false;clearTimeout(AUTO.timer);renderCtrl();if(S)render()}
function autoTick(){
  clearTimeout(AUTO.timer);if(!AUTO.on||!S)return;
  const d=S.stage==='evres'?AUTO.speed+(AUTO.speed<500?0:700):AUTO.speed;
  AUTO.timer=setTimeout(()=>{if(!AUTO.on||!S)return;try{autoStep()}catch(e){console.error(e);autoStop();return}if(!S||S.stage==='end')autoStop();else autoTick()},d);
}
const AW={
  school:{career:{aca:1.6,eng:1,skill:.9,net:.7,mind:.6,hp:.5},cert:{aca:1.8,skill:1.1,eng:.8,net:.5,mind:.6,hp:.5},balanced:{aca:1.2,eng:.9,skill:.8,net:.8,mind:.8,hp:.8},life:{mind:1.2,hp:1.1,net:1.1,aca:.8,eng:.6,skill:.5}},
  work:{career:{skill:1.4,net:1.4,eng:.8,mind:.8,hp:.8,aca:.3},cert:{aca:1.3,skill:1.3,eng:.8,net:.7,hp:.7,mind:.8},balanced:{skill:1,net:1,hp:1,mind:1,eng:.7,aca:.5},life:{mind:1.3,hp:1.3,net:1,skill:.7,eng:.5,aca:.3}}
};
function autoW(){const w={...AW[S.phase==='work'?'work':'school'][AUTO.strat]};if(S.phase==='hs'&&isVoc(S)){const a=w.aca;w.aca=(a+w.skill)/2;w.skill=a}return w}
function autoAlloc(){
  const w=autoW();
  const order=S.dice.map((v,i)=>i).filter(i=>!S.asg[i]);/* 照順序分配，不偷看後面的骰子 */
  for(const i of order){let best=null,bv=-1e9;
    for(const k of SK){if(S.st[k]>=100)continue;let v=w[k]*(110-S.st[k])/100+rnd()*.25;if((k==='hp'||k==='mind')&&S.st[k]<45)v+=2;if(v>bv){bv=v;best=k}}
    if(!best)break;putDie(i,best)}
}
const APREF={
  hs:{career:['study','cram','comp','license','club'],cert:['study','cram','license','comp'],balanced:['study','club','license','volunteer','sport'],life:['club','love','sport','chill','volunteer']},
  uni:{career:['intern','study','research','cpacram','club','exch'],cert:['cpacram','exam','study','research','intern'],balanced:['study','intern','club','exam','exch'],life:['club','love','exch','chill']},
  grad:{career:['thesis','intern','exam','ta'],cert:['exam','cpacram','thesis'],balanced:['thesis','exam','intern','ta'],life:['thesis','love','chill','exch']},
  work:{career:['grind','network','exam','hunt','learn'],cert:['exam','lawnight','grind','learn','network'],balanced:['grind','exam','rest','network','invest'],life:['rest','travel','love','invest','side','quiet']}
};
const EXPREF={cert:['CPA','律師','關務特考','CISA','高考','CFA','USCPA','記帳士','CIA','調查特考','永續管理師','資料分析學程'],career:['CPA','CFA','USCPA','CMA','證券高業','CIA','資料分析學程','永續管理師','記帳士'],balanced:['CPA','律師','記帳士','永續管理師','高考','CIA','資料分析學程'],life:['永續管理師','信託業務員','記帳士','資料分析學程']};
function autoActs(){
  const av=actionList().map(a=>a.id);
  const ph=S.phase==='hs'?'hs':S.phase==='uni'?(S.job?.key==='grad'?'grad':'uni'):'work';
  let pref=[...APREF[ph][AUTO.strat]];
  if(S.phase==='work'){if(!deg(S)&&AUTO.strat!=='life')pref.unshift('night');if(deg(S)&&!accOK(S)&&AUTO.strat==='cert')pref.unshift('credits');if(!S.job)pref.unshift('hunt')}
  if(S.st.hp<40||S.st.mind<40)pref=['rest','travel','chill','sport','love',...pref];
  const ex=availExams();const tgt=EXPREF[AUTO.strat].find(k=>ex.includes(k));
  pref=pref.filter((x,i)=>av.includes(x)&&pref.indexOf(x)===i&&(x!=='exam'||tgt));
  if(pref.length>2&&rnd()<.25)[pref[1],pref[2]]=[pref[2],pref[1]];
  for(const x of av)if(!pref.includes(x)&&x!=='exam')pref.push(x);
  S.acts=pref.slice(0,2);if(S.acts.includes('exam'))S.examT=tgt;
}
function effVal(e,w){let v=0;for(const k in e||{}){const x=e[k];
  if(k in S.st){let ww=w[k]||1;if((k==='hp'||k==='mind')&&S.st[k]<45)ww*=3;if(S.st[k]>=95&&x>0)ww*=.2;v+=x*ww}
  else if(k==='cash')v+=x*(S.cash<0?1:.25);else if(k==='perf')v+=x*.5;else if(k==='port')v+=x*3;else if(k==='love')v+=x*(AUTO.strat==='life'?6:2)}return v}
function autoChoice(){
  const w=autoW();let best=0,bv=-1e9;
  S.ev.c.forEach((c,i)=>{let v;
    if(c.d){const mod=c.d.s?Math.floor((S.st[c.d.s]-50)/10):0;const p=clamp((21-(c.d.dc-mod))/20,.05,.95);v=p*effVal(c.ok.e,w)+(1-p)*effVal(c.ng.e,w);if(S.ev.lethal)v-= (1-p)*20}
    else v=effVal(c.e,w);
    const f=c.f||(c.ok&&c.ok.f);if(f==='fraud')v-=40;if(f==='whistle')v-=5;
    v+=rnd()*3;if(v>bv){bv=v;best=i}});
  return best;
}
function offerVal(k,lvl){
  const J=JOBS[k];let sal;
  if(J.special)sal={selfcpa:170,selfbook:85,creator:S.fans*1.9,cafe:30,grad:0}[k]||0;
  else sal=J.lad[lvl][1]*(1+(J.bonusMul||1)*.12)+J.lad[J.lad.length-1][1]*.08;
  const like={cert:{big4:60,tax:60,gov:80,selfcpa:90,tutor:60,forensic:70,inaudit:40,selfbook:40,lawyer:70,customs:70,fsc:60,credit:40,legal:40},career:{lawyer:40,fas:30,itaudit:40,credit:30},balanced:{corp:50,semi:40,gov:50,inaudit:40,esg:40,data:40,fpa:30,local:20,tutor:30,erp:40,credit:40,legal:40,itaudit:30},life:{gov:60,inaudit:40,creator:40,esg:30,npo:70,customs:50}}[AUTO.strat]||{};
  return sal-J.stress*(AUTO.strat==='life'?7:AUTO.strat==='career'?1:3)+(like[k]||0);
}
function autoOffer(){
  if(!S.offers.length)return false;
  let bi=-1,bv=-1e9;S.offers.forEach((o,i)=>{if(o.k==='cafe'&&AUTO.strat!=='life')return;const v=offerVal(o.k,o.lvl||0)+rnd()*40;if(v>bv){bv=v;bi=i}});
  if(bi<0)return false;
  const cur=S.job&&S.phase==='work'?offerVal(S.job.key,S.job.lvl||0):-1e9;
  if(!S.job||bv>cur*1.2+10){acceptOffer(bi);return true}
  return false;
}
function autoAdmit(){
  const A=S.adm,ch=A.chs[A.ch],C=CHN[ch];
  if(!A.res){
    const cands=admCands();
    if(ch==='dist'||ch==='vdist'){const pv=cands[cands.length-1].id;A.picks=cands.filter(u=>cutOf(u)<=A.score2+2).slice(0,5).map(u=>u.id);if(!A.picks.includes(pv))A.picks.push(pv)}
    else{const ps=cands.map(u=>({u,p:admChance(u)})).filter(x=>x.p>=.3).slice(0,C.max);if(!ps.length){if(A.ch<A.chs.length-1){admNext();return}}A.picks=ps.map(x=>x.u.id)}
    if(A.picks.length){admSubmit();return}
  }
  const ok=(A.res||[]).filter(r=>r.ok);
  if(ok.length){enterUni(ok[0].id,C.n);return}
  if(A.ch<A.chs.length-1){admNext();return}
  if(!S.flags.retake&&AUTO.strat!=='life')retake();else goWorkHS();
}
function autoGAdmit(){
  const G=S.gad;
  if(!G.res){
    const want=AUTO.strat==='cert'||AUTO.strat==='career'||(AUTO.strat==='balanced'&&rnd()<.4);
    if(!want){skipGrad();return}
    const ps=GRADS.map(g=>({g,p:gChance(g)})).filter(x=>x.p>=.35).slice(0,3);
    if(!ps.length){if(G.ch===0){gNextCh();return}skipGrad();return}
    G.picks=ps.map(x=>x.g.id);gSubmit();return;
  }
  const ok=G.res.filter(r=>r.ok);if(ok.length){enterGrad(ok[0].id);return}
  if(G.ch===0){gNextCh();return}
  skipGrad();
}
function autoJunior(){const w={aca:1.6,eng:1,skill:.6,hp:.6,mind:.7,net:.6};S.jd.forEach((v,i)=>{if(S.jasg[i])return;let bk=null,bv=-1;for(const k of SK){const x=w[k]*(110-S.st[k])+rnd()*10;if(S.st[k]<100&&x>bv){bv=x;bk=k}}if(bk){S.jasg[i]=bk;juniorRecalc()}})}
function autoDM(){
  const D=S.dmS;if(D.res){stay();return}
  const pref={career:['fin','law','im','intl','econ'],cert:['law','tax','econ','fin','stat'],balanced:['fin','im','tax','biz','law','stat'],life:['biz','intl','im','econ']}[AUTO.strat];
  const av=deptsOf(S.edu.uni).filter(k=>!dmList(S).find(x=>x.k===k));const ks=pref.filter(k=>av.includes(k));const k=ks[Math.floor(rnd()*Math.min(3,ks.length))]||av[0];
  const ty=dmTypes();if(!ty.length){stay();return}
  if(!D.type)D.type=ty.includes('double')&&dmChance(k,'double')>.45?'double':ty.includes('minor')?'minor':ty[0];
  applyDM(k);
}
function autoStep(){
  const st=S.stage;
  if(st==='prologue'){endPrologue();return}
  if(st==='junior'){S.jrolled=true;autoJunior();finishJunior();return}
  if(st==='kaikao'){const ok=HSS.filter(h=>S.kk.tier<=h.tier);const pref={career:['star','top','vpub','comm'],cert:['star','top','vpub','comm'],balanced:['top','comm','vpub','star'],life:['comm','vpvt','top','vpub']}[AUTO.strat];const h=pref.map(id=>ok.find(x=>x.id===id)).find(Boolean)||ok[0];chooseHS(h.id);return}
  if(st==='plan'){autoAlloc();autoActs();confirmPlan();return}
  if(st==='event'){chooseOpt(autoChoice());return}
  if(st==='evres'){afterEvent();return}
  if(st==='aiwait'){return}
  if(st==='yearend'){
    const n=S.report.next;
    if(n==='death'){endGame('death');return}
    if(n==='crash'){endGame('crash');return}
    if(n==='admit'){startAdmit();return}
    if(n==='gadmit'){startGAdmit();return}
    if(n==='dm'){startDM();return}
    if(autoOffer())return;
    const canFire=fireOK();
    if(canFire&&AUTO.strat==='life'){S.achv.add('財富自由');endGame('fire');return}
    stay();return;
  }
  if(st==='dm'){autoDM();return}
  if(st==='jobhunt'){if(!autoOffer())stay();return}
  if(st==='admit'){autoAdmit();return}
  if(st==='gadmit'){autoGAdmit();return}
}

function render(anim){
  if(AUTO.on&&AUTO.speed<500)anim=false;
  document.body.classList.add('app');document.body.classList.remove('drawer');
  renderTop();renderCtrl();
  if(!S){renderSetup();window.scrollTo(0,0);return}
  const st=S.stage;
  if(st==='prologue')renderPrologue();
  else if(st==='junior')renderJunior();
  else if(st==='kaikao')renderKaikao();
  else if(st==='plan')renderPlan();
  else if(st==='event'||st==='evres')renderEvent(anim);
  else if(st==='yearend'){renderYearEnd();checkMilestones()}
  else if(st==='jobhunt')renderJobhunt();
  else if(st==='aiwait')renderAIWait();
  else if(st==='admit')renderAdmit();
  else if(st==='dm')renderDM();
  else if(st==='gadmit')renderGAdmit();
  else if(st==='end')renderEnd();
  if(!['junior','kaikao','plan','event','evres','yearend','jobhunt','dm'].includes(st)&&!anim)window.scrollTo({top:0});
}
/* 從朋友的挑戰連結進來：?seed=xxx */
try{const q=new URLSearchParams(location.search);const sd=cleanSeed(q.get('seed'));if(sd){ui.seed=sd;ui.challenge=1}}catch(e){}
render();
