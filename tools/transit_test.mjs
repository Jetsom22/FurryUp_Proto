// 칸 사이 전환 시험: node tools/transit_test.mjs <index.html> <폴더>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
await page.goto('file://' + file);
await page.waitForTimeout(600);
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => { const S = window.furryV3.state; return { ph: S.phase, node: S.node, n: S.transits, view: window.furryV3.view() }; });
const log = [];
await ev(() => window.furryV3.quick('hanato'));
log.push(['start', await st()]);
// 스토리 끝 → 전환
for (let i = 0; i < 40 && (await st()).ph === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(40); }
log.push(['after story', await st()]);
await page.waitForTimeout(200); await page.screenshot({ path: `${out}/tr_drop.png` });
await page.waitForTimeout(700); await page.screenshot({ path: `${out}/tr_walk.png` });
await page.waitForTimeout(1200); await page.screenshot({ path: `${out}/tr_panel.png` });
await page.waitForTimeout(1600);
log.push(['auto', await st()]);
// 중간 보스 · 보스 · 이벤트 · 스토리 패널
for (const [i, name] of [[7, 'mid'], [15, 'boss'], [3, 'event'], [6, 'story']]) {
  await ev((i) => window.furryV3.jump(i), i);
  await page.waitForTimeout(1900);
  await page.screenshot({ path: `${out}/tr_${name}.png` });
  log.push([name, await st()]);
  await ev(() => window.furryV3.skip());
  await page.waitForTimeout(300);
  log.push([name + ' skip', await st()]);
}
// Enter로 넘기기 · 빠르게
await ev(() => { window.furryV3.state.opts.fast = true; });
await ev(() => window.furryV3.jump(2));
const t0 = Date.now(); while ((await st()).ph === 'transit' && Date.now() - t0 < 5000) await page.waitForTimeout(50);
log.push(['fast ms', Date.now() - t0, await st()]);
await ev(() => { window.furryV3.state.opts.fast = false; });
await ev(() => window.furryV3.jump(9));
await page.waitForTimeout(300); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
log.push(['enter', await st()]);
console.log(JSON.stringify({ errors, log }, null, 0));
await browser.close();
