// 원정대 강화 트리 시험: node tools/tree_test.mjs <index.html> <폴더>
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
const shot = async (n) => { await page.waitForTimeout(1600); await page.screenshot({ path: `${out}/tree_${n}.png` }); };
const buy = async (id) => { await ev((id) => document.querySelector(`#ovBody .tree-node[data-node="${id}"]`).click(), id); await page.waitForTimeout(150); await ev(() => document.getElementById('treeUp').click()); await page.waitForTimeout(900); };
const log = {};
// 성장 화면 탭 → 원정대 강화
await ev(() => window.furryV3.screen('growth', 'hanato'));
await page.waitForTimeout(500);
await ev(() => document.getElementById('tab_tree').click());
await shot('fresh');
log.fresh = await ev(() => ({ tier: window.furryV3.tree().tier, board: !!document.querySelector('.tree-board'), canTier2: document.querySelector('.tree-open') && document.querySelector('.tree-open').textContent }));
// 젤리 · 훈장을 주고 티어 1 칸 셋
await ev(() => { const M = window.furryV3.meta(); M.jelly = 3000; M.medal = 40; window.furryV3.screen('tree'); });
for (const id of ['reroll1', 'refresh1', 'jelly10']) await buy(id);
// 깨기 전에는 티어 2가 안 열린다
await ev(() => document.querySelector('.tree-open').click()); await page.waitForTimeout(300);
log.beforeClear = await ev(() => ({ tier: window.furryV3.tree().tier, medal: window.furryV3.meta().medal, lv: Object.keys(window.furryV3.tree().lv), jelly: window.furryV3.meta().jelly }));
// 1장 클리어 뒤 → 열기
await ev(() => { window.furryV3.meta().stat.clears = 1; window.furryV3.screen('tree'); });
await page.waitForTimeout(400);
await ev(() => document.querySelector('.tree-open').click()); await page.waitForTimeout(900);
log.afterOpen = await ev(() => ({ tier: window.furryV3.tree().tier, medal: window.furryV3.meta().medal }));
for (const id of ['seed3', 'rest1', 'xp10']) await buy(id);
// 먼저 찍을 칸이 있는 것: reroll2는 reroll1 뒤라 살 수 있고, union2는 union1 없이 못 산다
await buy('union2');
log.union2 = await ev(() => !!window.furryV3.tree().lv.union2);
await ev(() => window.furryV3.screen('tree', 'reroll2'));
await shot('bought');
log.fx = await ev(() => ({ rerolls: window.furryV3.treeFx('rerolls'), refresh: window.furryV3.treeFx('refresh'), startGold: window.furryV3.treeFx('startGold'), restOff: window.furryV3.treeFx('restOff'), jelly: window.furryV3.treeFx('jelly'), xp: window.furryV3.treeFx('xp') }));
// 원정에 얹히는가 (메인을 바꿔도)
for (const hero of ['rito', 'hanato']) {
  await ev((h) => window.furryV3.quick(h), hero);
  for (let i = 0; i < 40 && (await ev(() => window.furryV3.state.phase)) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(40); }
  await page.waitForTimeout(300);
  log['run_' + hero] = await ev(() => { const S = window.furryV3.state; return { augReroll: S.augReroll, gold: S.gold, treeGold: S.treeGold }; });
}
await ev(() => window.furryV3.skip()); await page.waitForTimeout(300);
await ev(() => { for (const e of window.furryV3.state.enemies) e.hp = 1; });
for (let i = 0; i < 200 && (await ev(() => window.furryV3.state.phase)) !== 'shop'; i++) {
  if ((await ev(() => window.furryV3.state.phase)) === 'aim') await ev(() => { const S = window.furryV3.state; const t = S.enemies.find((e) => e.alive && !e.off) || S.enemies[0]; window.furryV3.shoot(t ? Math.atan2(-(t.y - S.ball.y), t.x - S.ball.x) * 180 / Math.PI : 90); });
  else await ev(() => window.furryV3.sim(0.5));
  await page.waitForTimeout(20);
}
await page.waitForTimeout(600);
await ev(() => document.getElementById('augPick').click()); await page.waitForTimeout(2500);
log.shop = await ev(() => ({ fixReroll: window.furryV3.state.fix.reroll, rest: [...document.querySelectorAll('#ovBody .se-line')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()) }));
await page.screenshot({ path: `${out}/tree_fix.png` });
const j0 = await ev(() => window.furryV3.meta().jelly);
await ev(() => window.furryV3.finish(false)); await page.waitForTimeout(800);
log.result = await ev(() => ({ text: (document.querySelector('#ovBody .grow small') || {}).textContent, jelly: window.furryV3.meta().jelly }));
log.result.gain = log.result.jelly - j0;
console.log(JSON.stringify({ errors, log }, null, 1));
await browser.close();
