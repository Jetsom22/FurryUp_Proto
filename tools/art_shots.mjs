// 캐릭터 그림 확인: node art_shots.mjs <index.html> <폴더>
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
await page.waitForTimeout(800);
const ev = (f, a) => page.evaluate(f, a);
const shot = async (n) => { await page.waitForTimeout(2200); await page.screenshot({ path: `${out}/art_${n}.png` }); };
await shot('title');
await ev(() => { const M = window.furryV3.meta(); M.mains.rito = true; for (const k of Object.keys(M.allies)) M.allies[k] = true; });
await ev(() => window.furryV3.screen('select')); await shot('select');
await ev(() => window.furryV3.screen('lobby')); await shot('lobby_hanato');
await ev(() => window.furryV3.screen('codex', 'main')); await shot('codex');
for (const h of ['hanato', 'rito']) {
  await ev((h) => window.furryV3.quick(h), h);
  await shot(`story_${h}`);
  for (let i = 0; i < 40 && (await ev(() => window.furryV3.state.phase)) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(60); }
  await ev(() => { const S = window.furryV3.state; ['ryuto', 'santo', 'sato'].forEach((k) => { if (k in S.levels) S.levels[k] = 1; }); window.furryV3.rerender(); });
  await shot(`battle_${h}`);
}
console.log(JSON.stringify({ errors }));
await browser.close();
