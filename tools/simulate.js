// 平衡測試：用「自動模擬」跑很多段人生，統計大學、結局、死亡率等。
// 用法（在專案資料夾的終端機）：node tools/simulate.js [每種策略幾局，預設 100]
// 改完數值後跑一下，確認沒有錯誤、分布合理。
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
/* 照 index.html 裡 script 的順序載入（順序很重要） */
const files = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="(js\/[^"?]+)/g)].map(m => m[1]);
const el = () => ({ innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, value: '', querySelector: () => null, querySelectorAll: () => [], appendChild() {}, remove() {}, isConnected: false });
global.document = { getElementById: el, querySelectorAll: () => [], querySelector: el, createElement: el, body: { classList: { toggle() {}, add() {}, remove() {} }, contains: () => true, appendChild() {} } };
global.window = { scrollTo() {}, matchMedia: () => ({ matches: true }), innerWidth: 1200 }; global.navigator = {};
global.location = { search: '', origin: '', pathname: '/' }; global.localStorage = { getItem: () => null, setItem() {} };
global.matchMedia = global.window.matchMedia; global.requestAnimationFrame = f => f();
/* 每個檔案依序在同一個全域環境執行（跟瀏覽器載入 <script> 一樣，彼此共用頂層變數） */
for (const f of files) new vm.Script(fs.readFileSync(path.join(root, f), 'utf8'), { filename: path.join(root, f) }).runInThisContext();
const G = new vm.Script('({get S(){return S},ui,setupDice,newGame,autoStep,AUTO,endingTitle,TRAITS,EVENTS,SUDDEN})', { filename: 'simulate-bridge' }).runInThisContext();
const N = +process.argv[2] || 100;
const top = (o, n = 10) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join('、');
console.log(`事件庫：一般 ${G.EVENTS.length}、突發 ${G.SUDDEN.length}\n`);
for (const strat of ['balanced', 'career', 'cert', 'life']) {
  G.AUTO.strat = strat; G.AUTO.on = true; // 讓遊戲知道是自動模擬，跳過動畫
  const st = { end: {}, uni: {}, job: {}, origin: {}, death: 0, err: 0, age: 0, titles: 0 };
  for (let t = 0; t < N; t++) {
    try {
      G.ui.seed = String(t * 104729 + 7); G.ui.trait = Object.keys(G.TRAITS)[t % 8];
      G.newGame(); let g = 0;
      while (G.S.stage !== 'end' && g++ < 6000) G.autoStep();
      if (G.S.stage !== 'end') throw new Error('卡住了：' + G.S.stage);
      const S = G.S, [title] = G.endingTitle();
      st.end[title] = (st.end[title] || 0) + 1; if (S.endType === 'death') st.death++;
      const u = S.edu.uni ? S.edu.uni.n.replace('國立', '') + S.edu.uni.d : '沒讀大學';
      st.uni[u] = (st.uni[u] || 0) + 1; st.age += S.age; st.titles += S.titles.length;
      for (const k in S.exp) st.job[k] = (st.job[k] || 0) + 1;
      st.origin[S.origin] = (st.origin[S.origin] || 0) + 1;
    } catch (e) { st.err++; if (st.err < 3) console.log('錯誤', e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  console.log(`=== ${strat}｜錯誤 ${st.err}｜死亡 ${st.death}/${N}｜平均結束年齡 ${(st.age / N).toFixed(1)}｜結局平均稱號 ${(st.titles / N).toFixed(1)}`);
  console.log('大學：' + top(st.uni)); console.log('待過：' + top(st.job)); console.log('結局：' + top(st.end, 8)); console.log('家庭出身：' + top(st.origin, 12)); console.log();
}
