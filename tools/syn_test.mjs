// 시너지 단 시험: node syn_test.mjs <index.html> <out dir>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out] = process.argv.slice(2);
const browser = await chromium.launch();
const res = {}, errors = [];
for (const hero of ['hanato', 'doris']) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
  await page.goto('file://' + file);
  await page.waitForTimeout(600);
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => { const M = window.furryV3.meta(); for (const k of Object.keys(M.allies)) M.allies[k] = true; });
  await ev((h) => window.furryV3.quick(h), hero);
  for (let i = 0; i < 40 && (await ev(() => window.furryV3.state.phase)) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(60); }
  for (let n = 1; n <= 5; n++) {
    const r = await ev((n) => {
      const F = window.furryV3, S = F.state;
      const kinds = Object.keys(S.levels).filter((k) => ['ryuto', 'sato', 'oto', 'santo', 'bosung', 'pongsung', 'jilsung', 'mongsung'].includes(k));
      const mine = { hanato: ['ryuto', 'sato', 'oto', 'santo'], doris: ['bosung', 'pongsung', 'jilsung', 'mongsung'] }[S.hero];
      for (const k of kinds) S.levels[k] = 0;
      mine.slice(0, n - 1).forEach((k) => { S.levels[k] = 1; });
      F.rerender();
      return { n, syn: F.syn(), stat: F.stat(), wap: document.getElementById('syn').innerText.replace(/\n/g, ' | '), op: document.getElementById('syn').style.opacity, wap2: getComputedStyle(document.getElementById('syn2')).display };
    }, n);
    res[`${hero}_${n}`] = r;
    if (n === 1 || n === 2 || n === 4 || n === 5) { await page.waitForTimeout(300); await page.screenshot({ path: `${out}/b_${hero}_${n}.png`, clip: { x: 1500, y: 580, width: 420, height: 330 } }); }
  }
  // 갯민숭: 첫 라운드 보호막 (2명 단)
  if (hero === 'doris') {
    res.shield = await ev(() => { const F = window.furryV3, S = F.state; S.levels.bosung = 1; S.levels.pongsung = 0; S.levels.jilsung = 0; S.levels.mongsung = 0; F.rerender(); return { round: S.round, shield: S.main.shield, tier: F.stat().slug }; });
  }
  await page.close();
}
console.log(JSON.stringify({ errors, res }, null, 1));
await browser.close();
