// 유물 화면 · 출발 준비 시험: node tools/ef_test.mjs <index.html> <폴더>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, out] = process.argv.slice(2);
const browser = await chromium.launch();
const errors = [];
const open = async (init) => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript((init) => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); if (init) localStorage.setItem('furryup-meta2', init); } catch (e) {} }, init);
  await page.goto('file://' + file);
  await page.waitForTimeout(600);
  return page;
};
const log = {};
let page = await open();
const ev = (f, a) => page.evaluate(f, a);
const shot = async (n) => { await page.waitForTimeout(1600); await page.screenshot({ path: `${out}/ef_${n}.png` }); };
const click = async (sel) => { await ev((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(250); };
await ev(() => window.furryV3.screen('lobby')); await shot('lobby');
// 유물 화면 · 강화
await ev(() => { const M = window.furryV3.meta(); Object.assign(M.relics, { thornknot: 1, seedbell: 1, clover: 1, luckycoin: 1 }); M.jelly = 3000; window.furryV3.screen('relic', 'seedbell'); });
await page.waitForTimeout(400);
await click('#relUp'); await page.waitForTimeout(800); await click('#relUp'); await page.waitForTimeout(800);
log.upgrade = await ev(() => ({ lv: window.furryV3.meta().relics.seedbell, jelly: window.furryV3.meta().jelly }));
// 프리셋: 씨앗 방울 → 프리셋 1 칸 1, 토끼풀 → 칸 2
await click('.rl-slot[data-p="0"][data-j="0"]');
await click('.rl-it[data-rel="clover"]'); await click('.rl-slot[data-p="0"][data-j="1"]');
log.preset = await ev(() => window.furryV3.meta().presets[0]);
await shot('relic');
// 성장 화면에 유물이 없다
await ev(() => window.furryV3.screen('growth', 'hanato')); await page.waitForTimeout(300);
log.growthRelic = await ev(() => !!document.querySelector('#ovBody .shp-rel, #ovBody .shp-slot'));
// 출발 준비: 처음 (연합 · 보급 칸 없음)
await ev(() => window.furryV3.screen('setup', 'hanato')); await shot('setup_fresh');
log.fresh = await ev(() => window.furryV3.load('hanato'));
// 원정대 강화로 칸을 연다 + 보급 해금
await ev(() => { const M = window.furryV3.meta(); M.tree.lv.supply1 = 1; M.tree.lv.union1 = 1; M.supply.lunch = true; M.supply.purse = true; window.furryV3.state.setup = null; window.furryV3.screen('setup', 'hanato'); });
await page.waitForTimeout(400);
await click('.su-pre[data-p="0"]');
await click('.su-vp[data-vil="slug"]');
await click('.su-rel[data-sup="lunch"]');
await click('.su-rel[data-sup="purse"]');   // 칸이 1이라 들어가지 않아야 한다
await shot('setup_full');
// 연합 칸이 하나 더 열려 있는지: 세 번째 마을 칸은 잠김
log.slots = await ev(() => ({ vil: document.querySelectorAll('.su-vil.lock').length, sup: document.querySelectorAll('.su-slot.lock').length }));
await click('#suGo'); await page.waitForTimeout(500);
log.run = await ev(() => { const S = window.furryV3.state; return { ph: S.phase, relics: S.relics, vil: S.villages.map((F) => F.name), maxHp: S.main.maxHp, load: window.furryV3.meta().load.hanato }; });
for (let i = 0; i < 40 && (await ev(() => window.furryV3.state.phase)) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(40); }
await ev(() => window.furryV3.skip()); await page.waitForTimeout(400);
log.battle = await ev(() => { const S = window.furryV3.state; return { ph: S.phase, gauge: S.gauge, gold: S.gold }; });
// 한 판 더! → 출발 준비 (지난 짐)
await ev(() => window.furryV3.finish(false)); await page.waitForTimeout(800);
await click('#again'); await page.waitForTimeout(500);
log.again = await ev(() => ({ ph: window.furryV3.state.phase, vp: [...document.querySelectorAll('.su-vp.on')].map((b) => b.dataset.vil), eq: [...document.querySelectorAll('.su-slot[data-un]')].map((b) => b.dataset.un), sup: [...document.querySelectorAll('.su-slot[data-sun]')].map((b) => b.dataset.sun) }));
await page.close();
// 옛 저장 (presets · load · tree 없음)으로 열기
page = await open(JSON.stringify({ v: 2, jelly: 50, medal: 3, relics: { thornknot: 1 }, equip: ['thornknot'], supply: { lunch: true } }));
log.old = await page.evaluate(() => { window.furryV3.screen('setup', 'hanato'); return { load: window.furryV3.load('hanato'), tree: window.furryV3.tree(), presets: window.furryV3.meta().presets.length }; });
await page.evaluate(() => window.furryV3.screen('relic')); await page.waitForTimeout(500);
log.oldRelicPresets = await page.evaluate(() => document.querySelectorAll('.rl-p').length);
console.log(JSON.stringify({ errors, log }, null, 1));
await browser.close();
