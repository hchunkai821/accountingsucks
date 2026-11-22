/* 01-core.js — 核心：亂數（種子）、能力值、升級成本、稱號 TITLES、天賦 TRAITS、高中職 HSS、大學 UNIS、研究所 GRADS */
"use strict";
/* 版本號：唯一的來源。改版時只改這裡，再到 README 的「更新紀錄」補一行 */
const VERSION='1.0.0';
/* 玩家能輸入的東西（名字、種子、網址參數）一律先過濾，避免被塞進網頁變成程式碼 */
const cleanSeed=v=>String(v==null?'':v).replace(/[^A-Za-z0-9_-]/g,'').slice(0,16);
const cleanName=v=>String(v==null?'':v).replace(/[<>&"'`\\]/g,'').trim().slice(0,8);
/* ================= RNG ================= */
function seedHash(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0}
function mulberry32(a){return function(){a=Math.imul(a+0x6D2B79F5,1);let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* 不需要種子的亂數（換種子、擲骰動畫、自動模擬）用瀏覽器的密碼學亂數 */
const rnd=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
let rand=rnd;
function setRand(f){rand=f}
const ri=(a,b)=>a+Math.floor(rand()*(b-a+1));
const pick=a=>a[Math.floor(rand()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:50;

/* ================= STATS ================= */
const STATN={aca:'學力',skill:'專業',eng:'英文',hp:'體力',mind:'心態',net:'人脈'};
const SK=Object.keys(STATN);
const STATD={aca:'考試、升學、國考',skill:'工作表現、證照、升遷',eng:'外商、海外、US CPA',hp:'撐過忙季的本錢',mind:'抗壓、面試、不崩潰',net:'升遷、客戶、機會'};
const BASE={aca:24,skill:10,eng:22,hp:60,mind:55,net:12};
const INIT_PTS=15;
const stepUp=v=>v<60?3:v<80?2:1;
function allocVal(v,n){for(let i=0;i<n;i++)v=Math.min(100,v+stepUp(v));return v}

const COST=l=>l<30?1:l<45?2:l<60?3:l<72?4:l<82?6:l<92?9:13;
function addExp(st,prog,k,pts){let lv=st[k],p=(prog[k]||0)+pts;while(lv<100&&p>=COST(lv)){p-=COST(lv);lv++}if(lv>=100)p=0;st[k]=lv;prog[k]=p}
const TITLES={
  genius:{n:'天才',r:3,d:'學力經驗 ×1.5',mul:{aca:1.5}},
  examgod:{n:'考神',r:3,d:'所有升學、證照考試擲骰 +2',exam:2},
  dicegod:{n:'骰神',r:3,d:'能力骰最小點數為 3',diceMin:3},
  chosen:{n:'天選之人',r:3,d:'純運氣檢定 +3',chk:{luck:3}},
  star:{n:'福星',r:3,d:'突發事件機率減半',sud:.5},
  allround:{n:'全能型',r:3,d:'所有能力經驗 ×1.15',mulAll:1.15},
  numfreak:{n:'數字狂',r:2,d:'專業經驗 ×1.5',mul:{skill:1.5}},
  bilingual:{n:'雙語人',r:2,d:'英文經驗 ×1.5',mul:{eng:1.5}},
  butterfly:{n:'社交達人',r:2,d:'人脈經驗 ×1.4，人脈檢定 +1',mul:{net:1.4},chk:{net:1}},
  iron:{n:'鐵人',r:2,d:'體力損失減半',hpLoss:.5},
  steelheart:{n:'鋼鐵心臟',r:2,d:'心態檢定 +2',chk:{mind:2}},
  earlybird:{n:'早起鳥',r:2,d:'每年多 1 顆能力骰',dice:1},
  lucky6:{n:'六六大順',r:2,d:'能力骰擲出 6 時額外 +3 點',six:3},
  saver:{n:'小資存錢王',r:2,d:'生活費 -12%',live:.88},
  investor:{n:'投資鬼才',r:2,d:'投資報酬 +6%',inv:.06},
  interview:{n:'面試王',r:2,d:'升學面試、升遷擲骰 +2',promo:2,iv:2},
  bossfav:{n:'老闆緣',r:2,d:'升遷擲骰 +3',promo:3},
  longevity:{n:'長壽體質',r:2,d:'死亡風險減半',life:.5},
  charm:{n:'萬人迷',r:2,d:'談戀愛更容易有進展',love:1},
  owl:{n:'夜貓子',r:1,d:'學力、專業經驗 ×1.2，但體力檢定 -1',mul:{aca:1.2,skill:1.2},chk:{hp:-1}},
  workaholic:{n:'工作狂',r:1,d:'每年績效 +10，但每年體力 -3',perfY:10,hpY:-3},
  glass:{n:'玻璃人',r:1,neg:1,d:'體力損失 ×1.5，每年體力 -2',hpLoss:1.5,hpY:-2},
  glassheart:{n:'玻璃心',r:1,neg:1,d:'心態損失 ×1.5',mindLoss:1.5},
  loner:{n:'邊緣人',r:1,neg:1,d:'人脈檢定 -2，但心態檢定 +1',chk:{net:-2,mind:1}},
  procrast:{n:'拖延症',r:1,neg:1,d:'每年少 1 顆能力骰，但考試擲骰 +1（最後一刻爆發）',dice:-1,exam:1},
  jinx:{n:'衰神附體',r:1,neg:1,d:'純運氣檢定 -3',chk:{luck:-3}},
  moonlight:{n:'月光族',r:1,neg:1,d:'生活費 +15%',live:1.15},
  forever:{n:'萬年考生',r:1,neg:1,d:'證照考試擲骰 -2，但學力經驗 ×1.3',exam:-2,mul:{aca:1.3}},
  disaster:{n:'災星',r:1,neg:1,d:'突發事件機率 ×1.6',sud:1.6},
};
const TCONF=[['glass','iron'],['glassheart','steelheart'],['chosen','jinx'],['star','disaster'],['moonlight','saver'],['earlybird','procrast'],['examgod','forever'],['butterfly','loner']];
function pickTitle(r,have){
  const c=Object.keys(TITLES).filter(k=>!have.includes(k)&&!TCONF.some(([a,b])=>(a===k&&have.includes(b))||(b===k&&have.includes(a))));
  if(!c.length)return null;const w=c.map(k=>({1:6,2:3,3:1}[TITLES[k].r]));let x=r()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<c.length;i++){x-=w[i];if(x<0)return c[i]}return c[c.length-1];
}
const TGAIN={aca:['genius','examgod','owl','allround'],skill:['numfreak','workaholic','allround'],eng:['bilingual'],hp:['iron','longevity'],mind:['steelheart'],net:['butterfly','interview','bossfav','charm'],luck:['chosen','star','lucky6','dicegod','investor']};
const TLOSE={aca:['forever','procrast'],skill:['procrast'],eng:['loner'],hp:['glass'],mind:['glassheart'],net:['loner','moonlight'],luck:['jinx','disaster']};
const TFLIP={chosen:'jinx',star:'disaster',iron:'glass',steelheart:'glassheart',butterfly:'loner',saver:'moonlight',earlybird:'procrast',examgod:'forever'};
function titleOK(k){return k&&TITLES[k]&&!S.titles.includes(k)&&S.titles.length<6&&!TCONF.some(([a,b])=>(a===k&&S.titles.includes(b))||(b===k&&S.titles.includes(a)))}
function giveTitle(k,why){if(!titleOK(k))return '';S.titles.push(k);(S.tY=S.tY||{})[k]=S.year;const t=TITLES[k];S.log.push({y:S.year,a:S.age,t:'',h:`${t.neg?'😵':'✨'} 覺醒稱號「${t.n}」${why?'（'+why+'）':''}`});return `${t.neg?'😵':'✨'} 你獲得了稱號「${t.n}」：${t.d}`}
function dropTitle(k,to){const i=S.titles.indexOf(k);if(i<0)return '';S.titles.splice(i,1);const t=TITLES[k];let msg=`稱號「${t.n}」消失了`;if(to&&TITLES[to]&&titleOK(to)){S.titles.push(to);msg+=`，取而代之的是「${TITLES[to].n}」`}S.log.push({y:S.year,a:S.age,t:'',h:msg});return msg+'。'}
function eventTitle(c,ok,roll){
  if(!c.d||S.phase==='pre')return '';
  const st=c.d.s||'luck';const T=c.tier||0;
  let p=T===3?.1:T===2?.04:0;if(roll===20)p+=.25;if(roll===1)p+=.2;
  if(rand()>=p)return '';
  const pool=(ok?TGAIN:TLOSE)[st]||[];const cand=pool.filter(titleOK);
  return cand.length?giveTitle(pick(cand),ok?'挑戰成功':'挑戰失敗'):'';
}
function rollTitles(seed){const r=mulberry32(seedHash(seed+'|title'));const out=[pickTitle(r,[])];if(r()<.45){const k=pickTitle(r,out);if(k)out.push(k)}return out}
function tl(s){return ((s||S||{}).titles||[]).map(k=>TITLES[k]).filter(Boolean)}
function tSum(p,s){return tl(s).reduce((a,t)=>a+(t[p]||0),0)}
function tMul(p,s){return tl(s).reduce((a,t)=>a*(t[p]||1),1)}
function tChk(k,s){return tl(s).reduce((a,t)=>a+((t.chk||{})[k]||0),0)}
function expMul(k,s){return tl(s).reduce((a,t)=>a*((t.mul||{})[k]||1)*(t.mulAll||1),1)}
function diceCount(r,s){return clamp([1,2,3,3,4,4,5,6][Math.floor(r()*8)]+tSum('dice',s),1,7)}
function rollDie(r,s){return Math.max(1+Math.floor(r()*6),tl(s).reduce((a,t)=>Math.max(a,t.diceMin||1),1))}
function diePts(v,k,s){return Math.round((v+(v===6?tSum('six',s):0))*expMul(k,s))}
function applyDice(baseSt,baseProg,dice,asg,s){const st={...baseSt},prog={...baseProg};dice.forEach((v,i)=>{if(asg[i])addExp(st,prog,asg[i],diePts(v,asg[i],s))});return {st,prog}}
function titleBadges(s){return (s.titles||[]).map(k=>{const t=TITLES[k];return `<span class="badge ${t.neg?'tlneg':'tl'+t.r}" title="${t.d}">${t.r===3?'★ ':''}${t.n}</span>`}).join('')}
const TRAITS={
  genius:{name:'學霸體質',desc:'讀書吸收快。學力 +10',st:{aca:10}},
  number:{name:'數字敏感',desc:'看報表像看小說。專業 +8',st:{skill:8}},
  liver:{name:'肝很硬',desc:'體力 +10，每年體力額外 +4',st:{hp:10}},
  zen:{name:'佛系人生',desc:'心態 +8，每年心態額外 +4',st:{mind:8}},
  social:{name:'社交蝴蝶',desc:'尾牙一定上台。人脈 +10',st:{net:10}},
  polyglot:{name:'語言天分',desc:'英文 +12',st:{eng:12}},
  exam:{name:'考試運爆棚',desc:'會考、學測、統測、證照擲骰 +2',st:{}},
  rich:{name:'家裡有點錢',desc:'起始存款 +80 萬，但爸媽意見很多（心態 -4）',cash:80,st:{mind:-4}},
};

/* ================= SCHOOLS ================= */
const HSS=[
  {id:'star',n:'第一志願明星高中',k:'hs',tier:1,rb:-15,aY:3,sY:0,desc:'全台最會念書的人都在這。學力成長快，但校排很難看，繁星不利。'},
  {id:'top',n:'市區前段高中',k:'hs',tier:2,rb:-5,aY:2,sY:0,desc:'讀書風氣好、資源多，各種管道都能拚。'},
  {id:'comm',n:'社區高中',k:'hs',tier:4,rb:15,aY:0,sY:0,desc:'離家近、壓力小。校排容易衝前面，繁星大有可為。'},
  {id:'vpub',n:'公立高商・會計事務科',k:'voc',tier:3,rb:0,aY:0,sY:3,desc:'借貸法則高一就學。統測專業科目領先，檢定證照一路考。'},
  {id:'vdp',n:'公立高商・資料處理科',k:'voc',tier:3,rb:0,aY:0,sY:2,flag:'cs',desc:'會計＋程式，技職資訊路線，之後轉資料分析很順。'},
  {id:'vpvt',n:'私立高職・商業經營科',k:'voc',tier:4,rb:10,aY:0,sY:2,desc:'建教合作多，想早點出社會賺錢也很可以。'},
];
const KK_GRADE=['','5A++','4A1B','2A3B','5B'];
const UNIS=[
  {id:'ntu',n:'國立臺灣大學',d:'會計學系',t:'u',cut:54,star:2,ref:'115 個申一階：國英數A 39 級分（滿分 45）・國英頂標、數A前標｜繁星第一輪校排 2%',pres:5,maj:'acc',perk:{net:6,aca:3},desc:'椰林大道、傅鐘。名片上的光環，四大與投行 HR 都會多看一眼。'},
  {id:'nccu',n:'國立政治大學',d:'會計學系',t:'u',cut:51,star:17,ref:'115 個申一階：國英數A社 51 級分、英數A 23｜繁星第一輪 17%（第二輪 8%）',pres:5,maj:'acc',perk:{net:10},desc:'政大幫遍布金融圈，學長姊人脈是最強的外掛。'},
  {id:'ncku',n:'國立成功大學',d:'會計學系',t:'u',cut:46,star:5,ref:'115 個申一階：國英數A社 46 級分、英 13、數A 10｜繁星第一輪 5%',pres:4,maj:'acc',perk:{skill:4},desc:'府城生活步調舒服，南部科技業財會部門的愛將。'},
  {id:'ntpu',n:'國立臺北大學',d:'會計學系',t:'u',cut:47,star:11,ref:'115 個申一階：國英數A 39、英 12、數A 8｜繁星第一輪 11%',pres:4,maj:'acc',perk:{aca:4},flag:'cpaBoost',desc:'三峽校區又大又安靜，適合閉關念會計師（會計師考試 +1）。'},
  {id:'nchu',n:'國立中興大學',d:'會計學系',t:'u',cut:43,star:16,ref:'115 個申一階：國英數A社 43 級分、英 12、社 13｜繁星第一輪 16%',pres:4,maj:'acc',perk:{mind:4,net:2},desc:'台中生活機能好、物價友善，中部企業人脈深。'},
  {id:'ccu',n:'國立中正大學',d:'會計與資訊科技學系',t:'u',cut:44,star:6,ref:'115 個申一階：國 11、英 13｜繁星第一輪 6%',pres:3,maj:'accinfo',perk:{skill:3},flag:'cs',desc:'會資系：會計＋資訊雙修，民雄空氣好，轉資料分析很順。'},
  {id:'scu',n:'東吳大學',d:'會計學系',t:'u',cut:37,star:26,ref:'115 個申一階：國英數B 28 級分（滿分 45）｜繁星第一輪 26%',pres:3,maj:'acc',perk:{net:3},flag:'cpaBoost',desc:'城中校區在台北市中心，實習與補習都超方便（會計師考試 +1）。'},
  {id:'fju',n:'輔仁大學',d:'會計學系',t:'u',cut:36,star:36,ref:'115 個申一階：英 11、數B 10、國均標｜繁星第一輪 36%（第二輪 8%）',pres:3,maj:'acc',perk:{mind:4,net:2},desc:'校園氛圍溫暖，社團活動豐富。'},
  {id:'fcu',n:'逢甲大學',d:'會計學系',t:'u',cut:35,star:35,ref:'（推估）',pres:3,maj:'acc',perk:{net:5},desc:'夜市就在校門口，中部校友企業多。'},
  {id:'tku',n:'淡江大學',d:'會計學系',t:'u',cut:34,star:40,ref:'（推估）',pres:3,maj:'acc',perk:{eng:6},desc:'淡水夕陽、外語風氣盛，大三出國交換機會多。'},
  {id:'cycu',n:'中原大學',d:'會計學系',t:'u',cut:34,star:40,ref:'（推估）',pres:3,maj:'acc',perk:{skill:2,mind:2},desc:'桃園產業聚落，製造業財會職缺多。'},
  {id:'mcu',n:'銘傳大學',d:'會計學系',t:'u',cut:31,star:50,ref:'（推估）',pres:2,maj:'acc',perk:{eng:4},desc:'國際化校園，作息很規律。'},
  {id:'pccu',n:'中國文化大學',d:'會計學系',t:'u',cut:30,star:50,ref:'（推估）',pres:2,maj:'acc',perk:{hp:6},desc:'每天爬陽明山上課，體力自然變好。'},
  {id:'pvt',n:'私立大學',d:'會計學系',t:'u',cut:0,star:50,ref:'錄取門檻寬鬆',pres:1,maj:'acc',perk:{mind:3},desc:'學校不是終點。很多會計師都是從這裡開始的。'},
  {id:'ncku_t',n:'國立成功大學',d:'會計學系（四技甄選）',t:'t',cut:56,star:0,ref:'115 四技甄選一階：英數 29、專業 30 級分，只招 2 人',only:['vapply'],pres:4,maj:'acc',perk:{skill:4},desc:'一般大學也透過四技甄選收高職生，名額極少、門檻極高。'},
  {id:'ntub',n:'國立臺北商業大學',d:'會計資訊系',t:'t',cut:50,star:15,ref:'114 統測分發最低 830.25 分（滿分 1000，約 83%）｜四技甄選一階 英數 26、專業 27｜技職繁星需校排前 30%',pres:4,maj:'accinfo',perk:{skill:4},flag:'cs',desc:'技職商管龍頭，業界實務連結超強。'},
  {id:'nkust',n:'國立高雄科技大學',d:'會計資訊系',t:'t',cut:42,star:25,ref:'114 統測分發最低 485.5 分｜四技甄選招 51 人',pres:3,maj:'accinfo',perk:{skill:3},flag:'cs',desc:'南部技職重鎮，產學合作多。'},
  {id:'yuntech',n:'國立雲林科技大學',d:'會計系',t:'t',cut:43,star:25,ref:'（推估）國立科大會計系',pres:3,maj:'acc',perk:{aca:4},desc:'校園大、讀書風氣好，考研究所比例高。'},
  {id:'nutc',n:'國立臺中科技大學',d:'會計資訊系',t:'t',cut:42,star:25,ref:'114 統測分發最低 488 分｜四技甄選招 54 人',pres:3,maj:'accinfo',perk:{skill:3},flag:'cs',desc:'台中市區，實習機會多。'},
  {id:'pvtt',n:'私立科技大學',d:'會計系',t:'t',cut:0,star:50,ref:'錄取門檻寬鬆',pres:1,maj:'acc',perk:{skill:2},desc:'實務導向，畢業就能上手。'},
];
/* 雙主修／輔系：只能在自己學校申請，看學力和系排，不一定會上 */
const DEPTS={
  fin:{n:'財務金融學系',diff:6,flag:'fin',perk:{skill:2},unlock:'銀行、投行、投信、金融科技、信用評等'},
  law:{n:'法律學系',diff:10,flag:'law',perk:{aca:2},unlock:'律師考試、商務律師、企業法務'},
  im:{n:'資訊管理學系',diff:6,flag:'cs',perk:{skill:2},unlock:'資料分析、軟體工程、ERP 顧問、IT 稽核'},
  econ:{n:'經濟學系',diff:3,flag:'econ',perk:{aca:2},unlock:'信用評等、投信研究員'},
  tax:{n:'財政稅務學系',diff:2,flag:'taxm',perk:{skill:1,aca:1},unlock:'四大稅務、國稅局、關務'},
  biz:{n:'企業管理學系',diff:0,flag:'biz',perk:{net:3},unlock:'產品經理、新創、非營利組織'},
  stat:{n:'統計學系',diff:3,flag:'stat',perk:{aca:1,skill:1},unlock:'資料分析、信用評等'},
  intl:{n:'國際企業學系',diff:1,flag:'intl',perk:{eng:3},unlock:'海外財務、關務、外商 FP&A'},
};
/* 各校可申請的科系（用該校實際的系名）與修讀規定
   src:1 = 規定有查證（台大、政大、中原、輔仁）；其他學校查不到明確條文，用「雙主修或輔系擇一」當預設，可以照實際規定修改
   dbl：雙主修上限、minor：輔系上限、total：合計上限、gate：雙主修要班排前幾 % 才能申請 */
const DM_DEFAULT={dbl:1,minor:1,total:1,rule:'雙主修或輔系擇一（未查到該校條文，遊戲預設）'};
const NCKU_DM={d:{law:'法律學系',im:'工業與資訊管理學系',econ:'經濟學系',biz:'企業管理學系',stat:'統計學系'}};
const SCHOOL_DM={
  ntu:{d:{fin:'財務金融學系',law:'法律學系',im:'資訊管理學系',econ:'經濟學系',intl:'國際企業學系',biz:'工商管理學系'},dbl:1,minor:2,total:3,gate:20,src:1,rule:'雙主修限一個學系，前一學年 GPA 2.92 以上或班排前 20% 才能申請；輔系資格最多兩個'},
  nccu:{d:{fin:'財務管理學系',law:'法律學系',im:'資訊管理學系',econ:'經濟學系',intl:'國際經營與貿易學系',biz:'企業管理學系',stat:'統計學系',tax:'財政學系'},dbl:1,minor:2,total:3,src:1,rule:'一雙二輔：雙主修一個、輔系最多兩個'},
  ncku:NCKU_DM,ncku_t:NCKU_DM,
  ntpu:{d:{fin:'金融與合作經營學系',law:'法律學系',im:'資訊工程學系',econ:'經濟學系',biz:'企業管理學系',stat:'統計學系',tax:'財政學系'}},
  nchu:{d:{fin:'財務金融學系',law:'法律學系',im:'資訊管理學系',econ:'應用經濟學系',biz:'企業管理學系'}},
  ccu:{d:{fin:'財務金融學系',law:'財經法律學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系'}},
  scu:{d:{fin:'財務工程與精算數學系',law:'法律學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系',intl:'國際經營與貿易學系'}},
  fju:{d:{fin:'金融與國際企業學系',law:'財經法律學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系',stat:'統計資訊學系'},src:1,rule:'雙主修要修滿另一系全部專業必修、至少 40 學分（遊戲：雙主修或輔系擇一）'},
  fcu:{d:{fin:'財務金融學系',law:'財經法律學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系',intl:'國際經營與貿易學系',stat:'統計學系',tax:'財稅學系'}},
  tku:{d:{fin:'財務金融學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系',intl:'國際企業學系',stat:'統計學系'}},
  cycu:{d:{fin:'財務金融學系',law:'財經法律學系',im:'資訊管理學系',biz:'企業管理學系',intl:'國際經營與貿易學系'},dbl:1,minor:2,total:2,src:1,rule:'最多兩個學系：兩個輔系，或一個輔系加一個雙主修'},
  mcu:{d:{fin:'財務金融學系',law:'法律學系',im:'資訊管理學系',biz:'企業管理學系',intl:'國際企業學系'}},
  pccu:{d:{fin:'財務金融學系',law:'法律學系',im:'資訊管理學系',econ:'經濟學系',biz:'企業管理學系',intl:'國際企業管理學系'}},
  pvt:{d:{fin:'財務金融學系',im:'資訊管理學系',biz:'企業管理學系'},dbl:0,minor:1,total:1,rule:'只開放輔系，沒有雙主修（遊戲設定）'},
  ntub:{d:{fin:'財務金融系',tax:'財政稅務系',im:'資訊管理系',biz:'企業管理系',intl:'國際商務系'}},
  nkust:{d:{fin:'財務管理系',tax:'財政稅務系',im:'資訊管理系',biz:'企業管理系',intl:'國際企業系'}},
  yuntech:{d:{fin:'財務金融系',im:'資訊管理系',biz:'企業管理系'}},
  nutc:{d:{fin:'財務金融系',tax:'財政稅務系',im:'資訊管理系',biz:'企業管理系',intl:'國際貿易與經營系'}},
  pvtt:{d:{fin:'財務金融系',im:'資訊管理系',biz:'企業管理系'},dbl:0,minor:1,total:1,rule:'只開放輔系，沒有雙主修（遊戲設定）'},
};
function dmPol(u){return {...DM_DEFAULT,...(SCHOOL_DM[u&&u.id]||{})}}
function deptsOf(u){return Object.keys(dmPol(u).d||{})}
function deptName(u,k){const d=dmPol(u).d||{};return d[k]||DEPTS[k].n}
function dmList(s){return (s.edu&&s.edu.dms)||[]}
function dmLabel(s){return dmList(s).map(x=>`${x.type==='double'?'雙主修':'輔系'}${deptName(s.edu.uni,x.k)}`).join('、')}
/* 研究所只收會計相關碩士班。組別依各校簡章／課程表查證：
   臺大：甲組（主修會計）、乙組（主修商業智慧與資料分析）｜政大：會計組、稅務組｜雲科：甲組（會計組）、乙組（會計資訊組）
   其他學校查不到分組資料，一律標「不分組」 */
const GRADS=[
  {id:'ntua',n:'臺大會計系碩士班',g:'甲組（主修會計）',cut:78,pres:5,f:'gA',fx:'四大、投行、外商加分'},
  {id:'ntub2',n:'臺大會計系碩士班',g:'乙組（主修商業智慧與資料分析）',cut:76,pres:5,f:'gI',fx:'直接拿到資料分析能力，數據、ERP、IT 稽核加分'},
  {id:'nccua',n:'政大會計系碩士班',g:'會計組',cut:76,pres:5,f:'gA',fx:'四大、投行、外商加分'},
  {id:'nccuc',n:'政大會計系碩士班',g:'稅務組',cut:73,pres:5,f:'gC',fx:'四大稅務、國稅局、調查局加分'},
  {id:'nckua',n:'成大會計系碩士班',g:'不分組',cut:70,pres:4,f:'gA',fx:'四大、投行、外商加分'},
  {id:'ntpuc',n:'北大會計系碩士班',g:'不分組',cut:66,pres:4,f:'gA',fx:'四大、企業財會加分'},
  {id:'nchua',n:'中興會計系碩士班',g:'不分組',cut:64,pres:4,f:'gA',fx:'四大、企業財會加分'},
  {id:'ccub',n:'中正會計與資訊科技系碩士班',g:'不分組',cut:61,pres:3,f:'gB',fx:'企業財會、資料分析加分'},
  {id:'scua',n:'東吳會計系碩士班',g:'不分組',cut:58,pres:3,f:'gA',fx:'四大、事務所加分'},
  {id:'ntubb',n:'北商會計資訊系碩士班',g:'不分組',cut:57,pres:3,f:'gB',fx:'企業財會、資料分析加分'},
  {id:'yuntecha',n:'雲科會計系碩士班',g:'甲組（會計組）',cut:52,pres:3,f:'gA',fx:'事務所、企業財會加分'},
  {id:'yuntechb',n:'雲科會計系碩士班',g:'乙組（會計資訊組）',cut:50,pres:3,f:'gB',fx:'企業財會、資料分析加分'},
  {id:'pvtg',n:'私立大學會計系碩士班',g:'不分組',cut:42,pres:2,f:'gA',fx:'多兩年專業累積'},
];
