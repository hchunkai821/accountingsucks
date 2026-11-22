/* 05-world.js — 依種子產生的世界（景氣、產業熱潮、考試難度、錄取分數浮動）、事件變化 variant()、高中低風險正規化 */
"use strict";
/* ================= 世界設定（依種子） ================= */
const SECTORS={
  semi:{n:'半導體熱潮',cn:'半導體庫存調整',jobs:['semi']},
  fin:{n:'金融大多頭',cn:'金融業緊縮',jobs:['ib','fund','vc','bank','wealth','lawyer','twse','credit']},
  tech:{n:'AI 科技熱潮',cn:'科技業裁員潮',jobs:['swe','pm','data','fintech','fpa','erp','itaudit']},
  green:{n:'淨零轉型浪潮',cn:'ESG 退燒',jobs:['esg']},
  firm:{n:'會計師大缺人',cn:'事務所整併潮',jobs:['big4','tax','local','selfcpa','selfbook','fas']},
  gov:{n:'公職報考熱',cn:'公部門員額凍結',jobs:['gov','forensic','fsc','customs']},
};
const ECON={1:['繁榮','🟢'],0:['持平','🟡'],'-1':['衰退','🔴']};
function genWorld(seed){
  const r=mulberry32(seedHash(seed+'|world'));
  const econ={};let st=0;
  for(let y=2026;y<=2095;y++){const x=r();if(st===0)st=x<.14?-1:x<.32?1:0;else if(st===1)st=x<.35?0:x<.45?-1:1;else st=x<.5?0:x<.6?1:-1;econ[y]=st}
  const keys=Object.keys(SECTORS);const eras=[];
  for(let y=2026;y<=2095;y+=6+Math.floor(r()*4)){const hot=keys[Math.floor(r()*keys.length)];let cold=keys[Math.floor(r()*keys.length)];if(cold===hot||r()<.4)cold=null;eras.push({from:y,hot,cold})}
  const exam={};for(let y=2026;y<=2095;y++)exam[y]=Math.floor(r()*3)-1;
  const cut={};for(const u of [...UNIS,...GRADS])cut[u.id]=Math.floor(r()*5)-2;
  return {econ,eras,exam,cut};
}
const W=()=>S.W;
function eraOf(y){const E=S.W.eras;let e=E[0];for(const x of E)if(x.from<=y)e=x;return e}
function econNow(){return S.W.econ[S.year]||0}
function sectorMul(k){const e=eraOf(S.year);if(SECTORS[e.hot].jobs.includes(k))return 1.15;if(e.cold&&SECTORS[e.cold].jobs.includes(k))return .9;return 1}
function cutOf(u){return u.cut?u.cut+(S.W.cut[u.id]||0):0}
function newsLine(){
  const e=eraOf(S.year);const ec=ECON[econNow()];
  return `<div class="news">📰 ${S.year} 年｜景氣 ${ec[1]} ${ec[0]}｜產業：<b>${SECTORS[e.hot].n}</b>${e.cold?`、${SECTORS[e.cold].cn}`:''}${S.W.exam[S.year]>0?'｜傳聞今年國考出題偏難':S.W.exam[S.year]<0?'｜傳聞今年國考比較友善':''}${S.season&&SEASONS[S.season]?`｜${SEASONS[S.season].icon} ${SEASONS[S.season].n}活動中`:''}</div>`;
}

/* ================= 事件變化（依種子） ================= */
const POOL={
  co:['小陳','阿凱','Amy','怡君','志明','佳穎','俊傑','雅婷','冠宇','美玲','家豪','Jessica'],
  boss:['王經理','林協理','張課長','陳主任','Linda','黃總監','劉副總'],
  client:['做螺絲的李董','開餐廳的黃老闆','科技業的周總','傳產二代 Eric','網拍女王 Vivian','建設公司的吳董'],
  city:['台北','新竹','台中','台南','高雄','桃園','彰化','宜蘭'],
  city2:['上海','東京','曼谷','胡志明市','美國德州','新加坡','新竹','高雄'],
  food:['雞排','鹽酥雞','牛肉麵','滷肉飯','麻辣鍋','珍奶','臭豆腐','蚵仔煎'],
  friend:['Kevin'],
  prof:['王教授','陳老師','林教授','黃老師','吳教授'],
  money:['3,280','5,640','12,800','860','27,400'],
  snack:['乖乖','科學麵','可樂果','義美小泡芙'],
  trip:['花蓮','墾丁','日本沖繩','澎湖','清境農場','韓國首爾'],
  bigco:['日本大集團','美商科技公司','國內金控','同業龍頭'],
  district:['內湖科學園區','南港','林口','竹北','台中七期','高雄亞洲新灣區'],
  aunt:['三姑','鄰居陳媽媽','媽媽的同事','里長太太'],
  kg:['8','12','15','20'],
  hobby:['攀岩','陶藝','爵士鼓','烘焙','潛水','手沖咖啡','日文','衝浪'],
  animal:['柴犬','企鵝','水豚','貓頭鷹','熊貓'],
  gadget:['新筆電','按摩椅','單眼相機','電動機車','遊戲主機'],
};
const TWISTS=[{e:{},r:'還意外認識了一位很有趣的人。'},{e:{},r:'事後回想，你從中學到不少東西。'},{e:{},r:'不知為何，那天的晚霞特別好看。'},{e:{},r:'回家的路上，你一直在想這件事。'},{e:{},r:'這件事，你後來常常拿出來講。'},{e:{},r:'你把這件事記在手機的備忘錄裡。'}];
/* 固定角色：同一份工作的主管、同事整段都是同一個人（換工作才換人），同一個種子永遠抽到同樣的人 */
function castOf(k){
  const j=(S.job&&S.job.key)||S.phase||'none';S.cast=S.cast||{};
  if(!S.cast[j]){const r=mulberry32(seedHash(S.seed+'|cast|'+j));S.cast[j]={co:POOL.co[Math.floor(r()*POOL.co.length)],boss:POOL.boss[Math.floor(r()*POOL.boss.length)]}}
  return S.cast[j][k];
}
function variant(ev,n){
  const r=mulberry32(seedHash(S.seed+'|'+ev.id+'|'+n));
  const memo={};
  const f=t=>typeof t==='string'?storyTok(t).replace(/\{(\w+)\}/g,(m,k)=>{const p=POOL[k];if(!p)return m;if(!(k in memo))memo[k]=(k==='co'||k==='boss')?castOf(k):p[Math.floor(r()*p.length)];return memo[k]}):t;
  const scale=e=>{if(!e)return e;const o={};for(const k in e){const v=e[k];if(!v)continue;o[k]=(SK.includes(k)&&!ev.sud)||['love','port','pt'].includes(k)?v:(Math.round(v*(.7+r()*.6))||Math.sign(v))}return o};
  const twist=(e,txt)=>{if(r()<.1){const tw=TWISTS[Math.floor(r()*TWISTS.length)];const e2={...(e||{})};for(const k in tw.e)e2[k]=(e2[k]||0)+tw.e[k];return [e2,(txt||'')+' '+tw.r]}return [e,txt]};
  const c=ev.c.map(ch=>{
    if(ch.d){let [oe,or]=twist(scale(ch.ok.e),f(ch.ok.r));let [ne,nr]=twist(scale(ch.ng.e),f(ch.ng.r));
      return {...ch,t:f(ch.t),d:{...ch.d,dc:clamp(ch.d.dc+Math.floor(r()*3)-1,4,18)},ok:{...ch.ok,e:oe,r:or},ng:{...ch.ng,e:ne,r:nr}}}
    let [e,rr]=twist(scale(ch.e),f(ch.r));return {...ch,t:f(ch.t),e,r:rr};
  });
  c.sort((a,b)=>(b.tier===0?.5:b.tier)-(a.tier===0?.5:a.tier));
  return {...ev,t:f(ev.t),x:f(ev.x),c};
}

/* ================= 高中低風險選項 ================= */
const TIERDC={3:12,2:9,1:5};
const TIERN={3:'高風險',2:'中風險',1:'低風險',0:'穩定'};
const GENOPT={
  aca:[['卯起來全力衝刺','你的全力投入有了回報，收穫滿滿。','用力過猛，反而把自己搞得一團糟。'],['認真準備、照計畫來','準備充分，處理得不錯。','努力了，但方向好像錯了。'],['照平常的方式處理','平平順順地過去了。','連平常的做法都出了點小差錯。']],
  skill:[['使出渾身解數硬上','漂亮！你的專業讓所有人刮目相看。','挑戰太大，搞砸了，還被念了一頓。'],['用平常的專業處理','穩穩地處理好了。','有個細節沒注意到，被抓包了。'],['照 SOP 走就好','照表操課，安全過關。','連 SOP 都漏了一步。']],
  eng:[['全英文正面迎戰','你的英文讓大家驚艷。','講到一半卡住，場面很尷尬。'],['準備好重點再上','重點都講到了。','有幾句話對方沒聽懂。'],['請翻譯軟體幫忙','靠工具也順利溝通了。','翻譯軟體翻出了奇怪的句子。']],
  hp:[['拚體力硬撐到底','你撐過去了，連自己都佩服自己。','身體先投降了，你病了好幾天。'],['量力而為','體力剛好夠用。','還是有點太累了。'],['保留體力，慢慢來','雖然慢，但很穩。','慢到有點跟不上。']],
  mind:[['賭上心態，正面迎戰','你扛住了壓力，整個人更強大了。','壓力太大，你崩潰了一晚。'],['冷靜應對','你冷靜地把事情處理好了。','表面冷靜，心裡其實很亂。'],['深呼吸，先觀望','靜觀其變是對的。','觀望太久，錯過了時機。']],
  net:[['動用所有人脈','人脈發揮了驚人的效果。','人情用過頭，有人開始躲你。'],['找熟人幫忙','朋友二話不說幫了你。','朋友剛好在忙，沒幫上。'],['低調自己處理','沒驚動任何人就搞定了。','自己處理不太順，但也沒怎樣。']],
  luck:[['豪賭一把','好運降臨！','運氣站在另一邊。'],['碰碰運氣','運氣還不錯。','差了一點點。'],['小試身手','小賺一點。','小賠一點。']],
};
/* 能力值規則：低／中／高風險＝成功 +1／+2／+3、失敗 -1／-2／-3，只動「這個選項相關的能力」。存款、績效可以比較多。
   st：沒有寫到能力時，就用這個選項檢定的能力。keepHp：會致命的突發事件，體力照原本的傷害算（才有生命危險） */
function normEff(e,T,ok,st,keepHp){const o={};let has=false;
  for(const k in e||{}){const v=e[k];if(!v)continue;
    if(SK.includes(k)){if(keepHp&&k==='hp'&&v<0&&!ok){o.hp=v;has=true;continue}if(ok&&v>0){o[k]=T;has=true}else if(!ok&&v<0){o[k]=-T;has=true}}
    else o[k]=v}
  if(!has)o[st||'mind']=ok?T:-T;
  return o}
/* 每個事件一律「剛好三個選項」：高／中／低風險各一，而且都要擲骰（沒有必定成功） */
const FAILTXT=['結果不如預期，白忙一場。','計畫趕不上變化，事情沒有照你想的走。','你以為很穩，結果還是出了點狀況。','差了臨門一腳，事情搞砸了。'];
function toCheck(ch,main,keep,idx){
  /* 原本必定成功的選項 → 改成低風險擲骰；成功照原本效果，失敗只付出代價、拿不到好處 */
  const e=ch.e||{};const bad={};for(const k in e){const v=e[k];if(v<0&&!SK.includes(k))bad[k]=v}
  bad[main]=(bad[main]||0)-(keep?3:1);
  return {t:ch.t,tag:ch.tag,d:{s:main,dc:TIERDC[1]},ok:{e,r:ch.r,f:ch.f,fx:ch.fx},ng:{e:bad,r:FAILTXT[idx%FAILTXT.length]}};
}
function retier(ch,T,keep,lethal){const st=ch.d.s||'mind';return {...ch,tier:T,d:{...ch.d,dc:TIERDC[T]},ok:{...ch.ok,e:normEff(ch.ok.e,T,true,st)},ng:{...ch.ng,e:normEff(ch.ng.e,T,false,st,lethal)}}}
function normalizeEvent(ev,keep){
  const cnt={};for(const ch of ev.c){const e=ch.d?{...ch.ok.e}:ch.e;for(const k in e||{})if(SK.includes(k))cnt[k]=(cnt[k]||0)+1}
  const ds=ev.c.find(ch=>ch.d)?.d.s;
  const main=ds||Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'mind';
  const raw=ev.c.map((ch,i)=>ch.d?ch:toCheck(ch,main,keep,i));
  const orig=raw.map(ch=>({ch,T:ch.d.dc>=13?3:ch.d.dc>=10?2:1}));
  const slot={};const extra=[];
  for(const o of orig){if(!slot[o.T])slot[o.T]=o.ch;else extra.push(o.ch)}
  for(const T of [3,2,1]){if(!slot[T]&&extra.length)slot[T]=extra.shift()}
  const c=[];
  for(const T of [3,2,1]){
    if(slot[T]){c.push(retier(slot[T],T,keep,!!ev.lethal));continue}
    const g=GENOPT[ds===null?'luck':main][3-T];const st=ds===null?null:main;
    const eff=st?{[st]:T}:{mind:T};const neff=st?{[st]:-T}:{mind:-T};
    const m=v=>v;
    c.push({t:g[0],tier:T,gen:1,d:{s:st,dc:TIERDC[T]},ok:{e:m(eff),r:g[1]},ng:{e:m(neff),r:g[2]}});
  }
  return {...ev,c};
}
for(let i=0;i<EVENTS.length;i++)EVENTS[i]=normalizeEvent(EVENTS[i],false);
for(let i=0;i<SUDDEN.length;i++)if(!SUDDEN[i].noChoice)SUDDEN[i]=normalizeEvent(SUDDEN[i],true);/* 沒有選項的職場崩壞不補成三個選項 */
