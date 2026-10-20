// 회귀 시험: 단추를 마우스로 눌러 칸이 끝날 때 칸 사이 전환이 바로 건너뛰어지지 않는가 (v0.13 버그).
// node tools/click_test.mjs <index.html>
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
await page.goto('file://' + file);
await page.waitForTimeout(600);
const ev = (f, a) => page.evaluate(f, a);
const ph = () => ev(() => window.furryV3.state.phase);
// 누른 뒤 1.5초 동안 0.1초마다 단계를 본다. 전환이 3번(0.3초) 넘게 보여야 통과
const watch = async () => { const seen = []; for (let i = 0; i < 15; i++) { seen.push(await ph()); await page.waitForTimeout(100); } return { ok: seen.filter((p) => p === 'transit').length >= 3, seen: seen.join(' ') }; };
const res = {};
await ev(() => window.furryV3.quick('hanato'));
for (let i = 0; i < 40 && (await ph()) === 'story'; i++) { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(40); }
await ev(() => window.furryV3.skip());
await page.waitForTimeout(300);
// 전투를 이겨 정비까지
await ev(() => { for (const e of window.furryV3.state.enemies) e.hp = 1; });
for (let i = 0; i < 200 && (await ph()) !== 'shop'; i++) {
  if ((await ph()) === 'aim') await ev(() => { const S = window.furryV3.state; const t = S.enemies.find((e) => e.alive && !e.off) || S.enemies[0]; window.furryV3.shoot(t ? Math.atan2(-(t.y - S.ball.y), t.x - S.ball.x) * 180 / Math.PI : 90); });
  else await ev(() => window.furryV3.sim(0.5));
  await page.waitForTimeout(20);
}
await page.waitForTimeout(800);
await ev(() => document.getElementById('augPick').click());
await page.waitForTimeout(2500);
await page.locator('#shopNext').click({ force: true });
res.shopNext = await watch();
// 이벤트 선택지
await ev(() => window.furryV3.forceEvent('kid'));
await ev(() => window.furryV3.jump(3));
await page.waitForTimeout(200);
await ev(() => window.furryV3.skip());
await page.waitForTimeout(500);
res.eventPhase = await ph();
await page.locator('#ovBody button[id^="evt"]:not([disabled])').first().click({ force: true });
res.event = await watch();
console.log(JSON.stringify({ errors, res }));
await browser.close();
process.exit(errors.length || !res.shopNext.ok || !res.event.ok ? 1 : 0);
