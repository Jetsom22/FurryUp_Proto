// 런 화면 찍기: node shots_run.mjs <index.html> <out dir> <prefix>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out, pre] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
await page.goto('file://' + file);
await page.waitForTimeout(600);
const ev = (f, a) => page.evaluate(f, a);
const shot = async (n) => { await page.waitForTimeout(1500); await page.screenshot({ path: `${out}/${pre}_${n}.png` }); };
const log = {};
// 전투: 장치 4개 든 채로 2번 칸
await ev(() => { const M = window.furryV3.meta(); for (const k of Object.keys(M.allies)) M.allies[k] = true; });
await ev(() => window.furryV3.quick('hanato'));
for (let i = 0; i < 40 && (await ev(() => window.furryV3.state.phase)) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(60); }
await ev(() => { const S = window.furryV3.state; S.devices = ['plus', 'mult', 'booster', 'bolt']; window.furryV3.rerender(); });
log.battle = await ev(() => ({ ph: window.furryV3.state.phase, node: window.furryV3.state.node, devs: window.furryV3.state.devices }));
await shot('battle');
// 정비까지: 이기고 증강 고르기 → 정비
await ev(() => { const S = window.furryV3.state; for (const e of S.enemies) e.hp = 1; });
for (let i = 0; i < 200; i++) {
  const ph = await ev(() => window.furryV3.state.phase);
  if (ph === 'shop') break;
  if (ph === 'aim') { await ev(() => { const S = window.furryV3.state; const t = S.enemies.find((e) => e.alive && !e.off) || S.enemies[0]; window.furryV3.shoot(t ? Math.atan2(-(t.y - S.ball.y), t.x - S.ball.x) * 180 / Math.PI : 90); }); }
  else await ev(() => window.furryV3.sim(0.5));
  await page.waitForTimeout(20);
}
await page.waitForTimeout(800);
await shot('aug');
await ev(() => document.getElementById('augPick') && document.getElementById('augPick').click());
await page.waitForTimeout(2500);
await ev(() => window.furryV3.addGold(200));
await shot('fix');
// 장치 쪽지를 사서 교체 창
log.fixDev = await ev(() => {
  const F = window.furryV3;
  for (let r = 0; r < 12; r++) {
    const n = document.querySelectorAll('#ovBody .se-post[data-w]').length;
    for (let i = 0; i < n; i++) { const el = document.querySelectorAll('#ovBody .se-post[data-w]')[i]; el.click(); const sel = F.state.fix.sel; if (sel && sel.g === 'dev' && !sel.sold) { document.getElementById('fixBuy').click(); return sel.k || true; } }
    F.restock();
  }
  return false;
});
await page.waitForTimeout(600);
log.swap = await ev(() => !!document.getElementById('swapGo'));
await shot('swap');
log.text = await ev(() => document.body.innerText.includes('엽전'));
console.log(JSON.stringify({ errors, log }));
await browser.close();
