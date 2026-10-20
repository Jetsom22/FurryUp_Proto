// 아웃게임 화면 찍기: node shots.mjs <index.html> <out dir> [gift]
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out, gift] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
await page.clock.install();
await page.goto('file://' + file);
await page.clock.runFor(800);
const ev = (f, a) => page.evaluate(f, a);
const shot = async (n) => { await page.clock.runFor(2500); await page.waitForTimeout(1800); await page.clock.runFor(200); await page.screenshot({ path: `${out}/${n}.png` }); };
if (gift) await ev(() => { const M = window.furryV3.meta(); M.jelly += 2000; M.medal += 60; M.seen.dev = { crate: 1, bomb: 1 }; });
const log = {};
await ev(() => window.furryV3.screen('lobby')); await shot('01_lobby');
await ev(() => window.furryV3.screen('shop', 'ally')); await shot('02_shop_ally');
await ev(() => window.furryV3.screen('shop', 'main')); await shot('03_shop_main');
await ev(() => window.furryV3.screen('shop', 'supply')); await shot('04_shop_supply');
await ev(() => window.furryV3.screen('growth', 'hanato')); await shot('05_growth');
for (const t of ['main', 'ally', 'foe', 'dev']) { await ev((t) => window.furryV3.screen('codex', t), t); await shot('06_codex_' + t); }
await ev(() => window.furryV3.screen('select')); await shot('07_select');
log.meta = await ev(() => { const M = window.furryV3.meta(); return { jelly: M.jelly, medal: M.medal }; });
console.log(JSON.stringify({ errors, log }));
await browser.close();
