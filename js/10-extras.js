/* 10-extras.js — 打字動畫（序章、結局、人生里程碑）、結局分享圖、人生圖鑑、挑戰連結、資產走勢圖、額外成就 */
"use strict";
/* ================= 打字動畫 ================= */
/* lines：字串陣列（可含 <b>，含 <b> 的那一行會被強調）。點畫面＝這一行直接打完；按「略過」＝全部顯示 */
function typeLines(box,lines,done,opt={}){
  const L=lines.map(x=>typeof x==='string'?{t:x.split('<b>').join('').split('</b>').join(''),cls:x.includes('<b>')?'em':''}:x);
  const speed=opt.speed||42,gap=opt.gap||420;let i=0,timer=null,cur=null,full=false,finished=false;
  const instant=(typeof AUTO!=='undefined'&&AUTO.on)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  box.innerHTML='';
  const end=()=>{if(finished)return;finished=true;clearTimeout(timer);if(cur)cur.classList.remove('typing');done&&done()};
  const scroll=()=>{box.scrollTop=box.scrollHeight};
  const line=()=>{
    if(!box.isConnected){finished=true;return}
    if(i>=L.length){end();return}
    const x=L[i];cur=document.createElement('p');cur.className='tw-line typing '+(x.cls||'');box.appendChild(cur);
    let j=0;
    const step=()=>{
      if(!box.isConnected){finished=true;return}
      if(full||instant){cur.textContent=x.t;full=false;cur.classList.remove('typing');i++;scroll();timer=setTimeout(line,instant?0:gap);return}
      j++;cur.textContent=x.t.slice(0,j);scroll();
      if(j>=x.t.length){cur.classList.remove('typing');i++;timer=setTimeout(line,gap)}
      else timer=setTimeout(step,/[，。！？、：」]/.test(x.t[j-1])?speed*5:speed);
    };
    step();
  };
  box.onclick=()=>{if(!finished)full=true};
  const skipAll=()=>{if(finished)return;clearTimeout(timer);box.innerHTML='';for(const x of L){const p=document.createElement('p');p.className='tw-line '+(x.cls||'');p.textContent=x.t;box.appendChild(p)}scroll();end()};
  line();
  return skipAll;
}
/* 一頁式的「電影畫面」：上面打字，下面打完才出現按鈕 */
function cinePage(title,lines,btnText,onNext,extra=''){
  $('main').innerHTML=`<div class="cine"><div class="cine-top"><span class="cine-title">${title}</span><button class="cine-skip" id="cskip">略過 ▸▸</button></div>
    <div class="cine-box" id="cbox"></div><div class="cine-btm" id="cbtm"><button class="btn big" id="cnext">${btnText}</button>${extra}</div></div>`;
  const btm=$('cbtm'),sk=$('cskip');btm.classList.add('wait');
  const skip=typeLines($('cbox'),lines,()=>{btm.classList.remove('wait');sk.style.visibility='hidden'});
  sk.onclick=skip;$('cnext').onclick=onNext;
}
function renderPrologue(){cinePage(`序章・${originOf().shop}`,prologueLines(),'開始 ▸',endPrologue)}

/* ================= 結局：依結局類型用不同的寫法，不套同一個模板 ================= */
const pickS=(arr,salt)=>arr[Math.abs(seedHash(String(S.seed)+'|'+salt))%arr.length];
function lifeFacts(){
  const O=originOf();const certs=Object.keys(S.certs).map(k=>k==='CPA'?'會計師':k);const jobs=S.log.filter(l=>l.h.startsWith('➜')).length;
  return {O,certs,jobs,nw:netWorth(),peak:S.peak?S.peak.t:null,school:S.edu.uni?uniName(S.edu.uni):null,hs:S.edu.hs?S.edu.hs.n:'國中',dm:dmLabel(S),
    call:callName(),closed:S.seen&&S.seen.m_close!=null,hosp:S.seen&&S.seen.m_hospital!=null,z:!!S.flags.zFriend,honest:S.flags.honest||0,shady:S.flags.shady||0,years:S.workYears};
}
function endingLines(){
  const [title]=endingTitle();const F=lifeFacts(),O=F.O,t=S.endType;let L;
  if(t==='death'){
    /* 由家人翻開你留下的帳本 */
    L=[`${S.year} 年的${pickS(['一個雨天','某個平凡的星期二','秋天的傍晚'],'dday')}，消息傳回了家裡。`,
      `${O.rel}在你的書桌抽屜裡，找到了一本筆記。封面上寫著：「${F.call}的帳」。`,
      '第一頁，是你十五歲時歪歪扭扭的字：「借——夢想。貸——現實。」',
      F.school?`中間夾著一張${F.school}的學生證，照片裡的你，笑得很用力。`:'中間夾著一張高中畢業照，照片裡的你，笑得很用力。',
      F.peak?`後面幾頁，寫滿了「${F.peak}」那幾年的加班時數，還有一行小字：「再撐一下就好。」`:'後面幾頁，寫滿了打工的時數，還有一行小字：「再撐一下就好。」',
      F.z?'{bff}來的時候，一句話都沒說，只是把一杯冰拿鐵放在你的照片前面——你們大學時最常喝的那一種。':'',
      '最後一頁，日期停在你走的那一天。上面只寫了一筆：',
      {t:`「收入：${O.rel}的${O.food}。金額：無法計算。」`,cls:'em'},
      epilogueText()];
  }else if(t==='crash'){
    /* 醫院、停下來、重新開帳 */
    L=['診間的燈是冷白色的。',
      `醫生看著你的報告，停了很久：「你的身體，比你的${F.peak?'工作':'帳'}還要透支。」`,
      F.years?`你算了一下，這 ${F.years} 年，你加班的時數，比睡覺還多。`:'你算了一下，這幾年，你擔心的時數，比睡覺還多。',
      `回家的路上，你繞去了${O.shop}${F.closed?'原本在的那條巷子':''}。${O.rel}看到你，什麼都沒問，只是${O.gift}。`,
      '那天晚上，你打開一本新的筆記本。第一行寫著：',
      {t:'「期初餘額：零。但我還在。」',cls:'em'},
      epilogueText()];
  }else if(t==='fire'){
    /* 沒有鬧鐘的第一個早晨 */
    L=[`${S.age} 歲，你提出了辭呈。`,
      '交接的最後一天，你把工作證放在桌上，聽到同事小聲說：「好羨慕。」',
      '隔天早上，鬧鐘沒有響。你醒來的時候，陽光已經照到床尾。',
      `你算過的——淨資產 ${fmt(F.nw)} 萬，就算每年只用百分之四，也夠了。`,
      `可是你最想做的第一件事，不是出國，也不是買東西。你回到${O.shop}，坐在小時候寫功課的那個位子。`,
      `${O.rel}問你：「不用上班，那你要幹嘛？」`,
      {t:'你想了很久：「我想把自己的帳，好好記一次。」',cls:'em'},
      epilogueText()];
  }else{
    const frame=pickS(['party','letter','ledger'],'frame');
    if(frame==='party'){
      /* 退休歡送會 */
      L=['退休歡送會辦在公司附近的小餐廳。',
        F.peak?`主持人念出你的資歷：「${F.years} 年的職涯，最後的職位是——${F.peak}。」台下響起掌聲。`:`主持人念出你的資歷：「${F.years} 年的職涯。」台下響起掌聲。`,
        F.jobs>=3?`有人笑說：「你換過 ${F.jobs} 次跑道，履歷比我的人生還長。」`:'有人笑說：「你是我們公司最後一個會手寫傳票的人。」',
        F.certs.length?`你被要求上台說幾句話。你看著台下，想起自己為了${F.certs[0]}熬過的那些夜。`:'你被要求上台說幾句話。你看著台下，想起第一天上班那件不合身的西裝。',
        `你說：「我十五歲的時候，看著${O.rel}在${O.shop}記帳，覺得那是全世界最無聊的事。」`,
        '大家笑了。',
        {t:'「後來我才知道，那是全世界最溫柔的事。」',cls:'em'},
        epilogueText()];
    }else if(frame==='letter'){
      /* 寫給十五歲的自己 */
      L=[`親愛的十五歲的${F.call}：`,
        `你現在大概正坐在${O.shop}裡，為了會考在煩惱吧。`,
        F.school?`告訴你一個祕密：你會考上${F.school}${F.dm?`，還會跑去修${F.dm}`:''}。`:'告訴你一個祕密：你沒有讀大學，但你會比很多人更早學會怎麼賺錢。',
        F.certs.length?`你會考到${F.certs.join('、')}。有幾次你會想放棄，請不要。`:'你會考很多試，有些沒過。沒關係，那些失敗都會變成你的經驗值。',
        F.peak?`你會成為「${F.peak}」。不過那不是最重要的事。`:'你不會成為什麼大人物。不過那不是最重要的事。',
        F.honest>=2?'最重要的是，你會在很多次「方便一下」的誘惑前面，說出「不行」。':F.shady>=2?'你會做一些自己不太驕傲的決定。原諒自己，但要記得。':'最重要的是，你會一直記得，數字背後都是人。',
        F.closed?`${O.shop}後來收起來了。但${O.smell}，你一輩子都不會忘記。`:`${O.rel}會一直在那裡，${O.gift}。要常常回去。`,
        {t:`—— ${S.age} 歲的你`,cls:'em'},
        epilogueText()];
    }else{
      /* 用一本分錄結算人生 */
      L=['退休那天晚上，你拿出一本全新的帳簿，替自己的一生做最後一次結帳。',
        `借：十五歲那年，${O.rel}的${O.book}。`,
        F.school?`借：${F.school}的四年。`:'借：比別人早出社會的那些年。',
        F.certs.length?`借：${F.certs.length} 張證照，和數不清的深夜。`:'借：每一次落榜後，再報名一次的勇氣。',
        `貸：${F.years} 年的工作${F.peak?`，最後站上「${F.peak}」`:''}。`,
        S.married?(S.kids?`貸：一個家，和 ${S.kids} 個孩子。`:'貸：一個等你回家的人。'):'貸：一個人的自由。',
        `貸：淨資產 ${fmt(F.nw)} 萬。`,
        '你把兩邊加總。差了一點點——就像每一次月結，總會有一點對不上的地方。',
        {t:'你笑了笑，在備註欄寫下：「差額，是人生。」',cls:'em'},
        epilogueText()];
    }
  }
  L=L.filter(Boolean).map(x=>typeof x==='string'?storyTok(x):{...x,t:storyTok(x.t)});
  L.push({t:`—— ${title} ——`,cls:'title'});
  return L;
}

/* ================= 人生里程碑：每一種都是不同的場景 ================= */
const MS_CERT={
  CPA:['晚上九點，考選部的網站卡住了。','你按了十七次重新整理。','第十八次，畫面跳了出來——你的名字，在第三頁的第十一行。','你沒有尖叫。你只是把手機放在桌上，安靜地坐了很久。','然後你打給{rel}。電話響了一聲就被接起來，好像一直在等。','「上了？」「上了。」','電話那頭很久沒有聲音。你只聽見{shop}的鐵門，被拉下來的聲音。','<b>那天，{shop}提早打烊。</b>'],
  '律師':['第二試的最後一科，是商事法。','寫到公司法的時候，你突然想起大二那年，在會計系館背的那條「資產＝負債＋權益」。','放榜那天，你的名字和一群法律系的學霸排在一起。','{rel}問你：「所以你現在是會計師，還是律師？」','你想了想：「是一個看得懂合約，也看得懂帳的人。」','<b>這樣的人，全台灣沒有幾個。</b>'],
  '高考':['分發通知是一封很普通的信。白色信封，公文用的那種。','你拆開的時候，手比想像中還穩。','「薦任第六職等」——六個字，你讀了三遍。','{rel}把那封信影印了一份，貼在{shop}的牆上，就在營業時間的旁邊。','<b>從今以後，你是替國家管帳的人了。</b>'],
  '調查特考':['體能測驗的最後一圈，你的腿已經不是自己的了。','口試官問你：「為什麼想來追金流？」','你說起小時候，家裡那本{book}，有一頁被撕掉的痕跡。','「錢會說話，」你說，「只是要有人聽得懂。」','<b>結訓那天，你領到一張證件，和一份不能跟別人說的工作。</b>'],
  USCPA:['成績是凌晨三點公布的，因為那是美國的下午。','你在被窩裡看著螢幕上的 PASS。','四個字母，四科，好幾年。','早上你照常去上班，沒有跟任何人說。','<b>中午吃便當的時候，你偷偷在名片的設計稿上，加了三個字母：CPA。</b>'],
  CFA:['Level III 的成績信，標題只有一行。','點開之前，你先去倒了一杯水。','你算過，這幾年大概讀了三千個小時。','<b>Congratulations.</b>','你想起第一次考 Level I，旁邊的人在開考前十分鐘還在背公式。那個人後來怎麼了，你不知道。','<b>但你知道，自己沒有放棄。</b>'],
};
const MS_CERT_GENERIC=[
  c=>['證書是用掛號寄來的。','郵差把信封遞給你：「恭喜喔。」','你這才發現，原來有陌生人會為你高興。',`<b>${c}，到手了。</b>`],
  c=>[`你把${c}的證書放進資料夾。`,'資料夾已經有點厚了。每一張紙，都是好幾個月的晚上。','<b>你又多了一把鑰匙。</b>'],
  c=>['考場外面，有人在哭，有人在笑。','你看了一下手機——{rel}傳來一張{food}的照片：「考完了嗎？回來吃。」','一個月後，成績出來了。',`<b>${c}，通過。</b>`],
];
const MS_TOP={
  firm:['合夥人會議結束後，資深合夥人把一支鋼筆放在你面前。','「以後，報告上要簽的，是你的名字。」','你想起第一年忙季，凌晨兩點在客戶的倉庫裡數箱子。那時候，你連簽名的資格都沒有。','<b>現在，你的名字，就是品質。</b>'],
  exec:['法說會的燈光很亮。','台下坐著分析師、記者，還有幾個你在大學時讀過他們報告的人。','主持人說：「接下來，請「{title}」說明本季財務狀況。」','你站起來的時候突然想到——{rel}可能正在{shop}裡看直播。','<b>你清了清喉嚨：「各位好。」</b>'],
  public:['升職的公文，是你自己簽收的。','上面那個職稱，你在新人訓練的時候，只能遠遠地看著。','你走進新辦公室，窗外是你每天通勤經過的那條路。','<b>原來，從這裡看出去，城市是這個樣子。</b>'],
  money:['年終獎金入帳那天，你看著手機上的數字，數了三次位數。','你做的第一件事，是幫{rel}把{shop}剩下的貸款還清。','{rel}說：「你自己的錢，自己留著。」','<b>你說：「這筆，是我欠很久的。」</b>'],
  teach:['你的課程海報，貼滿了補習街的整面牆。','有個學生下課跑來說：「老師，我媽也是聽你的課考上的。」','<b>你突然覺得自己老了。也突然覺得，值得了。</b>'],
  team:['同事們幫你辦了一個小小的升遷慶祝會。','蛋糕上用巧克力寫著你的新職稱，字有點歪。','有人說：「還記得你剛來的時候，連影印機都不會用嗎？」','<b>你記得。你什麼都記得。</b>'],
};
const TOP_KIND={big4:'firm',tax:'firm',fas:'firm',itaudit:'firm',lawyer:'firm',corp:'exec',semi:'exec',fpa:'exec',startup:'exec',abroad:'exec',npo:'exec',erp:'exec',data:'exec',pm:'exec',swe:'exec',
  gov:'public',forensic:'public',fsc:'public',customs:'public',twse:'public',bank:'money',ib:'money',fund:'money',vc:'money',wealth:'money',credit:'money',fintech:'money',tutor:'teach'};
const MS_WED=[
  ['婚禮那天，{rel}穿了一件很久沒穿的衣服。','{bff}上台致詞，講了你高中時的糗事，全場笑翻。','輪到你說話的時候，你只說了一句：','<b>「以後，我們一起記帳。」</b>'],
  ['你們沒有辦婚禮，只是去戶政事務所登記。','承辦人員蓋章的時候說：「恭喜。」','出來的時候下著小雨，你們在騎樓下吃了一碗{food}。','<b>這是你吃過最好吃的一碗。</b>'],
  ['求婚那天，你準備了一份「我們的財務規劃」簡報。','對方看到第三頁就笑出來了：「你真的很會計。」','<b>然後說：「好。」</b>'],
];
function checkMilestones(){
  if(!S||(typeof AUTO!=='undefined'&&AUTO.on))return;
  S.ms=S.ms||{};const q=[];
  for(const k of Object.keys(S.certs)){if(S.ms['c_'+k])continue;S.ms['c_'+k]=1;const nm=EXAMS[k]?EXAMS[k].name:k;
    q.push(MS_CERT[k]||MS_CERT_GENERIC[Math.abs(seedHash(S.seed+k))%MS_CERT_GENERIC.length](nm))}
  if(S.job&&!S.job.special&&JOBS[S.job.key].lad&&S.job.lvl===JOBS[S.job.key].lad.length-1&&!S.ms['top_'+S.job.key]){S.ms['top_'+S.job.key]=1;
    q.push((MS_TOP[TOP_KIND[S.job.key]||'team']).map(x=>x.replace('{title}',JOBS[S.job.key].lad[S.job.lvl][0])))}
  if(S.married&&!S.ms.wed){S.ms.wed=1;q.push(pickS(MS_WED,'wed'))}
  if(S.kids>=1&&!S.ms.kid){S.ms.kid=1;q.push(['凌晨四點，醫院走廊的燈很白。','護理師抱出一個很小、很皺的人。','你習慣性地想算一件事：從今天開始，要準備多少錢？','然後你發現，這是你這輩子第一次，完全不想算。','<b>你只想抱著。</b>'])}
  if(S.house&&!S.ms.house){S.ms.house=1;q.push(['簽約那天，代書把一疊文件推到你面前。','三十年的房貸，你在心裡把利息算了一遍——你是會計，你忍不住。','{rel}來看新家，第一件事是打開書房的抽屜。','<b>「這裡，可以放{book}。」</b>'])}
  if(netWorth()>=1000&&!S.ms.k1000){S.ms.k1000=1;q.push(['某天晚上整理帳戶，你發現淨資產第一次超過了一千萬。','你盯著那串數字。','十五歲那年，{shop}一天的營業額，大概是三千塊。','<b>你把截圖傳給{rel}，什麼話都沒說。</b>'])}
  if(!q.length)return;
  const show=()=>{const lines=q.shift();if(!lines)return;
    const d=document.createElement('div');d.className='msov';d.innerHTML=`<div class="cine"><div class="cine-top"><span class="cine-title">人生里程碑</span><button class="cine-skip">略過 ▸▸</button></div><div class="cine-box"></div><div class="cine-btm wait"><button class="btn big">繼續 ▸</button></div></div>`;
    document.body.appendChild(d);const btm=d.querySelector('.cine-btm');
    const skip=typeLines(d.querySelector('.cine-box'),lines.map(storyTok),()=>btm.classList.remove('wait'));
    d.querySelector('.cine-skip').onclick=skip;d.querySelector('.btn').onclick=()=>{d.remove();show()};};
  show();
}

/* ================= 人生圖鑑（存在這台裝置的瀏覽器裡） ================= */
const CODEX_KEY='alife_codex_v1';
const ARC_IDS={m_invoice:'家裡的店要開發票',m_rent:'房東要漲租金',m_audit:'國稅局來查家裡的帳',m_close:'家裡的店要收起來了',m_hospital:'家人住院了',z_contest:'{bff}的創業競賽',z_raise:'{bff}的公司在募資',z_fraud:'{bff}請你幫個忙',z_exit:'{bff}的公司被併購',t_speech:'回國中演講',t_retire:'{teacher}退休了',c_probe:'檢調的電話',c_media:'媒體爆料',c_karma:'當年的那個人',c_award:'年度誠信會計人',c_momclients:'店裡的老客人',c_zback:'{bff}的回報'};
function codexLoad(){try{return JSON.parse(localStorage.getItem(CODEX_KEY))||{}}catch(e){return {}}}
function codexSave(c){try{localStorage.setItem(CODEX_KEY,JSON.stringify(c))}catch(e){}}
function codexRecord(){
  if(S.codexDone)return;S.codexDone=1;
  const c=codexLoad();const add=(g,k)=>{c[g]=c[g]||{};c[g][k]=(c[g][k]||0)+1};
  add('endings',endingTitle()[0]);
  for(const k of Object.keys(S.exp||{}))if(JOBS[k]&&k!=='grad')add('jobs',k);if(S.job&&JOBS[S.job.key]&&S.job.key!=='grad')add('jobs',S.job.key);
  for(const k of S.titles||[])add('titles',k);for(const a of S.achv)add('achv',a);for(const k of Object.keys(S.certs))add('certs',k);
  for(const x of dmList(S))add('depts',x.k);for(const id in ARC_IDS)if(S.seen&&S.seen[id]!=null)add('arcs',id);
  if(S.origin)add('origins',S.origin);
  c.plays=(c.plays||0)+1;c.best=Math.max(c.best||-1e9,netWorth());
  codexSave(c);
}
function codexGroups(){
  const c=codexLoad();
  return [
    ['職業',Object.keys(JOBS).filter(k=>k!=='grad').map(k=>[k,JOBS[k].name]),c.jobs||{}],
    ['證照',Object.keys(EXAMS).map(k=>[k,EXAMS[k].name]),c.certs||{}],
    ['雙主修／輔系',Object.keys(DEPTS).map(k=>[k,DEPTS[k].n]),c.depts||{}],
    ['稱號',Object.keys(TITLES).map(k=>[k,TITLES[k].n]),c.titles||{}],
    ['家庭出身',ORIGINS.map(o=>[o.id,`${o.rel}的${o.shop}`]),c.origins||{}],
    ['人物故事',Object.entries(ARC_IDS).map(([k,v])=>[k,castTok(v)]),c.arcs||{}],
  ];
}
function codexPct(){let got=0,all=0;for(const [,list,have] of codexGroups()){all+=list.length;got+=list.filter(([k])=>have[k]).length}return all?Math.round(got/all*100):0}
function openCodex(){
  const c=codexLoad();const G=codexGroups();
  const d=document.createElement('div');d.className='msov codex';
  d.innerHTML=`<div class="card codexcard"><div class="cine-top"><span class="cine-title">📖 人生圖鑑・收集 ${codexPct()}%</span><button class="btn sm" id="cxc">✕ 關閉</button></div>
    <div class="codexbody"><p class="hint">玩過 ${c.plays||0} 次人生${c.best!=null&&c.plays?`・最高淨資產 ${fmt(c.best)} 萬`:''}。圖鑑存在這台裝置的瀏覽器裡。</p>
    ${G.map(([n,list,have])=>`<h3>${n}（${list.filter(([k])=>have[k]).length}/${list.length}）</h3><div class="badges">${list.map(([k,nm])=>have[k]?`<span class="badge cert">${nm}</span>`:'<span class="badge dim">？？？</span>').join('')}</div>`).join('')}
    <h3>看過的結局（${Object.keys(c.endings||{}).length}）</h3><div class="badges">${Object.entries(c.endings||{}).map(([k,v])=>`<span class="badge">${k}${v>1?` ×${v}`:''}</span>`).join('')||'<span class="hint">還沒有。</span>'}</div>
    <h3>成就（${Object.keys(c.achv||{}).length}）</h3><div class="badges">${Object.keys(c.achv||{}).map(k=>`<span class="badge">${k}</span>`).join('')||'<span class="hint">還沒有。</span>'}</div></div></div>`;
  document.body.appendChild(d);d.querySelector('#cxc').onclick=()=>d.remove();
}
/* ================= 挑戰連結：朋友打開就是同一個世界 ================= */
function challengeLink(){return location.origin+location.pathname+'?seed='+encodeURIComponent(S.seed)}

/* ================= 額外成就（會計人才懂的梗） ================= */
function extraAchv(){
  const A=S.achv;
  if(ex(S,'big4','tax','fas','itaudit')>=3)A.add('忙季倖存者');
  if(S.certs.CPA&&S.certs['律師'])A.add('會計師＋律師雙證');
  if(['高考','調查特考','關務特考'].filter(k=>S.certs[k]).length>=2)A.add('國考收集者');
  if(Object.keys(S.certs).length>=5)A.add('證照收藏家');
  if((S.flags.honest||0)>=4)A.add('誠信會計人');
  if((S.flags.shady||0)>=3)A.add('遊走灰色地帶');
  if(S.seen&&S.seen.m_hospital!=null&&S.seen.t_retire!=null)A.add('不忘初心');
  if(dmList(S).some(x=>x.type==='double'))A.add('雙主修');if(dmList(S).length>=3)A.add('一雙二輔');
  if(netWorth()<0)A.add('借貸不平衡');
  if(S.season&&SEASONS[S.season]&&Object.keys(S.seen||{}).some(k=>k.startsWith('se_')))A.add(SEASONS[S.season].achv);
}

/* ================= 資產走勢圖 ================= */
function nwChart(){
  const H=S.nwHist||[];if(H.length<2)return '';
  const W=600,Ht=150,p=24;const xs=H.map(h=>h[0]),ys=H.map(h=>h[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(0,...ys),y1=Math.max(1,...ys);
  const X=v=>p+(v-x0)/(x1-x0||1)*(W-2*p),Y=v=>Ht-p-(v-y0)/(y1-y0||1)*(Ht-2*p);
  const pts=H.map(h=>`${X(h[0]).toFixed(1)},${Y(h[1]).toFixed(1)}`).join(' ');
  const pk=H.reduce((a,b)=>b[1]>a[1]?b:a);
  return `<svg class="nwchart" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="淨資產走勢">
    <line x1="${p}" x2="${W-p}" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>
    <polyline points="${pts}" class="ln"/>
    ${(()=>{/* 金額標籤：只寫金額（年齡看下方時間軸）；在右半邊就往左長；最高點和最後一年太近就只標最後一年 */
      const L=H[H.length-1],lab=(h,cls)=>{const x=X(h[0]),right=x>W/2;return `<circle cx="${x}" cy="${Y(h[1])}" r="4" class="pk"/><text x="${right?x-8:x+8}" y="${Math.max(Y(h[1])-8,12)}" class="lb" text-anchor="${right?'end':'start'}">${fmt(h[1])} 萬</text>`};
      return (L!==pk&&Math.abs(X(L[0])-X(pk[0]))>130?lab(pk):'')+lab(L)})()}
    <text x="${p}" y="${Ht-6}" class="ax">${x0} 歲</text><text x="${W-p}" y="${Ht-6}" class="ax" text-anchor="end">${x1} 歲</text></svg>`;
}

/* ================= 結局分享圖：貼文尺寸 1080×1350、限時動態尺寸 1080×1920，都附挑戰 QR code ================= */
function drawQR(g,text,x,y,size){
  if(typeof qrcode!=='function')return false;
  try{const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount(),c=size/(n+2);
    g.fillStyle='#fffdf7';g.fillRect(x,y,size,size);g.fillStyle='#1d2a24';
    for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))g.fillRect(x+(k+1)*c,y+(r+1)*c,Math.ceil(c),Math.ceil(c));
    return true}catch(e){return false}
}
function shareImage(kind){
  const story=kind==='story';const W=1080,H=story?1920:1350;
  const [title,desc]=endingTitle();const nw=netWorth();
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const ink='#1d2a24',ink2='#55615a',green='#1f6b4f',gold='#b7862b',paper='#f5f1e6',red='#b3261e';
  const serif='"Noto Serif TC","Songti TC",serif',sans='"Noto Sans TC","PingFang TC",sans-serif';
  g.fillStyle=paper;g.fillRect(0,0,W,H);
  g.strokeStyle='#cfe0d6';g.lineWidth=2;for(let y=60;y<H;y+=48){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  g.fillStyle='#fffdf7';g.fillRect(60,60,W-120,H-120);g.strokeStyle=ink;g.lineWidth=4;g.strokeRect(60,60,W-120,H-120);
  let y=story?180:140;
  g.fillStyle=ink2;g.font=`500 ${story?34:30}px ${sans}`;g.fillText(`會計人生模擬器・${S.name?S.name+' 的':''}人生資產負債表・${S.age} 歲結帳`,110,y);y+=story?130:110;
  g.fillStyle=ink;g.font=`900 ${story?92:74}px ${serif}`;y=wrapText(g,title,110,y,W-220,story?108:86)+(story?80:60);
  g.fillStyle=ink2;g.font=`400 ${story?34:30}px ${sans}`;y=wrapText(g,desc,110,y,W-220,story?50:44)+(story?50:40);
  g.strokeStyle=ink;g.lineWidth=3;g.beginPath();g.moveTo(110,y);g.lineTo(W-110,y);g.stroke();y+=story?80:60;
  const fit=(t,max)=>{t=String(t);if(g.measureText(t).width<=max)return t;while(t.length>1&&g.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'};
  const row=(k,v,col)=>{g.fillStyle=ink2;g.font=`500 ${story?36:32}px ${sans}`;g.fillText(k,110,y);const lw=g.measureText(k).width;g.fillStyle=col||ink;g.font=`700 ${story?38:34}px ${sans}`;g.textAlign='right';g.fillText(fit(v,W-220-lw-40),W-110,y);g.textAlign='left';y+=story?78:62};
  const O=originOf();
  row('出身',`${O.rel}的${O.shop}`);
  row('學歷',S.edu.uni?uniName(S.edu.uni):(S.edu.hs?S.edu.hs.n:'國中'));
  if(dmList(S).length)row('雙主修／輔系',dmLabel(S));
  row('最高職位',S.peak?S.peak.t:'—');
  row('證照',Object.keys(S.certs).map(k=>k==='CPA'?'會計師':k).join('、')||'無');
  /* 小型資產負債表（2×2）：一生收入、一生支出、淨資產、折現回 15 歲的現值（單位：萬，負數加括號） */
  {const LG=lifeLedger(),bh=story?200:150,bx=110,bw=W-220,cw=bw/2,top=y-(story?38:34);
   g.fillStyle='#f3efe2';g.fillRect(bx,top,bw,bh);g.strokeStyle=ink;g.lineWidth=2;g.strokeRect(bx,top,bw,bh);
   g.beginPath();g.moveTo(bx+cw,top);g.lineTo(bx+cw,top+bh);g.moveTo(bx,top+bh/2);g.lineTo(bx+bw,top+bh/2);g.strokeStyle='#cfc6ad';g.stroke();
   const cell=(i,j,k,v,col,bold)=>{const x=bx+j*cw,yy=top+i*bh/2;g.fillStyle=ink2;g.font=`500 ${story?28:22}px ${sans}`;g.fillText(k,x+20,yy+(story?40:32));
     g.fillStyle=col;g.font=`${bold?800:700} ${story?42:32}px ${sans}`;g.textAlign='right';g.fillText(fmt2(v)+' 萬',x+cw-20,yy+(story?88:66));g.textAlign='left'};
   cell(0,0,'一生收入',LG.earn,ink);LG.spent>=0?cell(0,1,'一生支出',-LG.spent,red):cell(0,1,'投資與其他收入淨額',-LG.spent,ink);
   cell(1,0,'淨資產',LG.nw,LG.nw<0?red:green,true);cell(1,1,'折現回 15 歲的現值',LG.pv,LG.pv<0?red:ink);
   y=top+bh+(story?78:60);}
  const tl=(S.titles||[]).map(k=>TITLES[k].n).slice(0,5);
  g.fillStyle=gold;g.font=`700 ${story?34:30}px ${sans}`;y=wrapText(g,tl.length?'稱號：'+tl.join('・'):'稱號：平凡也是一種天賦',110,y+10,W-220,44)+(story?70:56);
  const ach=[...S.achv].slice(0,story?6:4);g.fillStyle=ink2;g.font=`500 ${story?30:28}px ${sans}`;y=wrapText(g,'成就：'+(ach.join('、')||'無'),110,y,W-220,40)+50;
  /* 限動版：中間畫一條人生淨資產走勢 */
  const Hh=S.nwHist||[];if(story&&Hh.length>1){const top=y+20,bot=H-110-300,x0=110,x1=W-110;if(bot-top>110){
    const ys=Hh.map(h=>h[1]),mn=Math.min(0,...ys),mx=Math.max(1,...ys);const X=i=>x0+i/(Hh.length-1)*(x1-x0),Y=v=>bot-(v-mn)/(mx-mn||1)*(bot-top-40);
    g.fillStyle=ink2;g.font=`500 28px ${sans}`;g.fillText('人生淨資產走勢',x0,top);
    g.strokeStyle='#cfc6ad';g.setLineDash([8,8]);g.beginPath();g.moveTo(x0,Y(0));g.lineTo(x1,Y(0));g.stroke();g.setLineDash([]);
    g.strokeStyle=green;g.lineWidth=6;g.beginPath();Hh.forEach((h,i)=>i?g.lineTo(X(i),Y(h[1])):g.moveTo(X(i),Y(h[1])));g.stroke();
    /* 金額標籤：最高點、最後一年 */
    const pk=Hh.reduce((a,b,i)=>b[1]>Hh[a][1]?i:a,0),li=Hh.length-1;g.font=`700 26px ${sans}`;
    const dot=(i,col)=>{g.fillStyle=col;g.beginPath();g.arc(X(i),Y(Hh[i][1]),9,0,Math.PI*2);g.fill()};
    const tag=(i,t,col,right)=>{const tx=right?Math.min(X(i),x1):Math.max(X(i),x0);g.fillStyle=col;g.textAlign=right?'right':'left';g.fillText(t,right?tx-6:tx+6,Math.max(Y(Hh[i][1])-18,top+34));g.textAlign='left'};
    if(pk!==li&&Math.abs(X(li)-X(pk))>220){dot(pk,gold);tag(pk,`${fmt(Hh[pk][1])} 萬`,gold,X(pk)>(x0+x1)/2)}
    dot(li,Hh[li][1]<0?red:green);tag(li,`${fmt(Hh[li][1])} 萬`,Hh[li][1]<0?red:green,true);
    g.fillStyle=ink2;g.font=`500 24px ${sans}`;g.fillText(`${Hh[0][0]} 歲`,x0,bot+36);g.textAlign='right';g.fillText(`${Hh[Hh.length-1][0]} 歲`,x1,bot+36);g.textAlign='left';}}
  /* 底部：挑戰 QR code */
  const qs=story?260:190,qx=W-110-qs,qy=H-110-qs;const hasQR=drawQR(g,challengeLink(),qx,qy,qs);
  g.fillStyle=ink;g.font=`700 ${story?38:30}px ${sans}`;g.fillText(story?'同一個世界，換你來活一次':'同一個世界，換你來',110,qy+(story?80:60));
  g.fillStyle=ink2;g.font=`500 ${story?30:24}px ${sans}`;
  g.fillText(`世界種子 ${S.seed}`,110,qy+(story?140:105));
  g.fillText(hasQR?'掃 QR code，挑戰同一個人生 →':'你的人生，借貸平衡了嗎？',110,qy+(story?195:145));
  c.toBlob(async b=>{
    const f=new File([b],story?'accountingsucks-story.png':'accountingsucks.png',{type:'image/png'});
    try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'會計人生模擬器'});return}}catch(e){}
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();a.remove();
  },'image/png');
}
/* 換行（避頭尾）：句號、逗號、右括號這類標點不放在行首，會留在上一行尾巴；左括號、左引號不放在行尾 */
const NOHEAD='，。、；：！？）」』〉》…—・,.!?;:)%';const NOTAIL='（「『〈《(';
function wrapText(g,t,x,y,w,lh){let line='';for(const ch of String(t)){
    if(line&&g.measureText(line+ch).width>w&&!NOHEAD.includes(ch)){let carry='';while(line.length>1&&NOTAIL.includes(line[line.length-1])){carry=line[line.length-1]+carry;line=line.slice(0,-1)}g.fillText(line,x,y);y+=lh;line=carry+ch}
    else line+=ch}
  if(line){g.fillText(line,x,y)}return y}

/* ================= PWA：加到主畫面 ================= */
try{if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
window.addEventListener&&window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ui.installEvt=e;if(!S)renderSetup()});
function installBtnHtml(){
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  if(standalone)return '';
  if(ui.installEvt)return '<button class="btn ghost" id="inst">📲 加到主畫面</button>';
  if(/iPhone|iPad/.test(navigator.userAgent||''))return '<span class="hint">📲 iPhone：點 Safari 的「分享」→「加入主畫面」，就能像 App 一樣開</span>';
  return '';
}
function bindInstall(){const b=$('inst');if(b)b.onclick=async()=>{const e=ui.installEvt;if(!e)return;e.prompt();await e.userChoice.catch(()=>{});ui.installEvt=null;renderSetup()}}

/* ================= 底部的幹話：每天換一句 ================= */
const QUIPS=[
  '本遊戲純屬虛構，若與你的人生雷同，請好好休息。',
  '借貸不平衡的不是帳，是你的人生。',
  '本遊戲不能抵免會計師考試的任何一科，但可以抵免一點點心理壓力。',
  '忙季期間請斟酌遊玩，主管可能就站在你後面。',
  '遊戲時數無法列入工作底稿，也無法申報加班費。',
  '你的存款可能是虛構的，但你的房貸是真的。',
  '本遊戲沒有呆帳，除了你欠自己的睡眠。',
  '玩到一半想離職，屬於正常現象。',
  '資產＝負債＋權益＋一點點夢想。',
  '本遊戲經吳岱璋老師審閱，確認無呆帳。',
];
(function(){const el=document.getElementById('quip');if(!el)return;const d=new Date();const day=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);el.textContent=QUIPS[day%QUIPS.length]})();
