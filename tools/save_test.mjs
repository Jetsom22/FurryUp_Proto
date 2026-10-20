// 원정 도중 저장 · 이어하기 시험: node tools/save_test.mjs <index.html> <폴더>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { if (!localStorage.getItem('furryup-persona')) localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
await page.goto('file://' + file);
await page.waitForTimeout(600);
const ev = (f, a) => page.evaluate(f, a);
const ph = () => ev(() => window.furryV3.state.phase);
const log = {};
await ev(() => window.furryV3.quick('hanato'));
log.start = await ev(() => { const R = window.furryV3.runSave(); return R && { node: R.node, hero: R.hero }; });
for (let i = 0; i < 40 && (await ph()) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(40); }
await ev(() => window.furryV3.skip()); await page.waitForTimeout(300);
// 전투 중 상태를 바꾸고 이긴다 → 증강 → 정비 → 다음 칸 (저장)
await ev(() => { const S = window.furryV3.state; S.main.hp = 55; S.levels.sato = 1; S.devices.push('mult'); for (const e of S.enemies) e.hp = 1; });
for (let i = 0; i < 600 && (await ph()) !== 'shop'; i++) {
  if ((await ph()) === 'aim') await ev(() => { const S = window.furryV3.state; const t = S.enemies.find((e) => e.alive && !e.off) || S.enemies[0]; window.furryV3.shoot(t ? Math.atan2(-(t.y - S.ball.y), t.x - S.ball.x) * 180 / Math.PI : 90); });
  else await ev(() => window.furryV3.sim(0.5));
  await page.waitForTimeout(20);
}
await page.waitForTimeout(600);
log.preShop = await ev(() => ({ ph: window.furryV3.state.phase, aug: !!document.getElementById('augPick'), hp: window.furryV3.state.main.hp }));
await ev(() => { const b = document.getElementById('augPick'); if (b) b.click(); }); await page.waitForTimeout(2500);
const before = await ev(() => { const S = window.furryV3.state; return { gold: S.gold, hp: S.main.hp, up: S.up, levels: S.levels.sato, devices: S.devices, battles: S.battles, stories: S.stories }; });
await ev(() => document.getElementById('shopNext').click()); await page.waitForTimeout(400);
log.atTransit = await ev(() => { const R = window.furryV3.runSave(); return { ph: window.furryV3.state.phase, node: R.node, gold: R.gold, hp: R.main.hp }; });
log.before = before;
// 창을 닫았다 연다
await page.reload(); await page.waitForTimeout(1200);
log.title = await ev(() => { const b = document.getElementById('titleRun'); return b && b.textContent; });
await page.waitForTimeout(2500); await page.screenshot({ path: `${out}/save_title.png` });
await ev(() => document.getElementById('titleRun').click()); await page.waitForTimeout(800);
log.resumed = await ev(() => { const S = window.furryV3.state; return { ph: S.phase, node: S.node, gold: S.gold, hp: S.main.hp, up: S.up, levels: S.levels.sato, devices: S.devices, battles: S.battles, stories: S.stories, inRun: S.inRun, view: window.furryV3.view() }; });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/save_resumed.png` });
// 끝나면 지운다
await ev(() => window.furryV3.finish(false)); await page.waitForTimeout(500);
log.afterFinish = await ev(() => window.furryV3.runSave());
await ev(() => window.furryV3.screen('title')); await page.waitForTimeout(300);
log.titleAfter = await ev(() => !!document.getElementById('titleRun'));
console.log(JSON.stringify({ errors, log }, null, 1));
await browser.close();
