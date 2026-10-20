// 무작위 원정 여러 판: 오류(pageerror · console.error)와 화면 · 단계 어긋남을 모은다. node tools/fuzz.mjs <index.html 절대 경로> <메인마다 판 수>
// 결과 end: clear (승) · lose (패) · ending (보스 뒤 엔딩) · 빈 값 (900걸음 안에 못 끝냄). lastNode = 마지막 칸
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [file, nRuns] = process.argv.slice(2);
const browser = await chromium.launch();
const heroes = ['hanato', 'rito', 'doris', 'hipsel'];
const out = [];
for (let r = 0; r < +nRuns; r++) for (const hero of heroes) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  let ctx = '';
  page.on('pageerror', (e) => errs.push({ msg: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join(' | '), ctx }));
  page.on('console', (m) => { if (m.type() === 'error') errs.push({ msg: 'console: ' + m.text(), ctx }); });
  await page.addInitScript(() => { try { localStorage.setItem('furryup-persona', JSON.stringify({ name: '시험', race: 'rabbit', color: 0, size: '소형', suggested: 'rabbit', custom: false })); } catch (e) {} });
  await page.goto('file://' + file);
  await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => { const M = window.furryV3.meta(); for (const k of Object.keys(M.allies)) M.allies[k] = true; ['oto', 'santo', 'pongsung', 'jilsung', 'mongsung', 'ryuto'].forEach((k) => { M.allies[k] = true; }); });
  await ev((h) => window.furryV3.quick(h), hero);
  const seen = {};
  let steps = 0, end = '', lastNode = 0;
  while (steps++ < 900) {
    const st = await ev(() => { const S = window.furryV3.state; return { ph: S.phase, node: S.node, hp: S.main && S.main.hp, swap: !!S.swapCancel, aug: !!(S.aug && !S.aug.done), view: document.getElementById('app').dataset.view, ov: document.getElementById('ovBody').children.length, bh: document.getElementById('battle').hidden, sh: document.getElementById('story').hidden, oh: document.getElementById('overlay').hidden }; });
    ctx = `${hero} r${r} node${st.node} ${st.ph}`; lastNode = st.node;
    seen[st.ph] = (seen[st.ph] || 0) + 1;
    // 화면과 단계가 맞는지
    const battleP = ['aim', 'shot', 'iai', 'enemy', 'wait', 'dry', 'cutin', 'place'].includes(st.ph);
    if (battleP && st.bh && !st.swap) errs.push({ msg: `battle phase but #battle hidden (view ${st.view})`, ctx });
    if (st.ph === 'story' && st.sh) errs.push({ msg: `story phase but #story hidden (view ${st.view})`, ctx });
    if (['shop', 'event'].includes(st.ph) && (st.oh || st.ov === 0)) errs.push({ msg: `${st.ph} but overlay hidden/empty (view ${st.view}, ov ${st.ov})`, ctx });
    if (st.ph === 'result') { await ev(() => { const b = document.getElementById('resultNext'); if (b) b.click(); }); await page.waitForTimeout(600); continue; }
    if (['title', 'lobby', 'ending', 'clear', 'lose'].includes(st.ph) || (!st.ph)) { end = st.ph; break; }
    if (st.swap) { await ev(() => { const b = document.getElementById(Math.random() < 0.6 ? 'swapGo' : 'swapCancel'); if (b) b.click(); }); await page.waitForTimeout(900); continue; }
    if (st.ph === 'aim') {
      await ev(() => {
        const F = window.furryV3, S = F.state;
        if (Math.random() < 0.15) F.fillGauge();
        const sk = document.getElementById('skillBtn') || document.querySelector('[data-skill], .skill-btn');
        if (S.gauge >= F.gaugeMax && sk && Math.random() < 0.7) { sk.click(); return; }
        const es = S.enemies.filter((e) => e.alive && !e.off), t = es[Math.floor(Math.random() * Math.max(1, es.length))], b = S.ball;
        F.shoot(t && Math.random() < 0.8 ? Math.atan2(-(t.y - b.y), t.x - b.x) * 180 / Math.PI + (Math.random() * 30 - 15) : Math.random() * 360);
      });
      await page.waitForTimeout(30);
      continue;
    }
    if (battleP) { await ev(() => window.furryV3.sim(0.4)); await page.waitForTimeout(20); continue; }
    if (st.ph === 'story') { await ev(() => document.getElementById('storyNext').click()); await page.waitForTimeout(20); continue; }
    if (st.ph === 'event') { await ev(() => { const bs = [...document.querySelectorAll('#ovBody button[id^="evt"]')].filter((b) => !b.disabled); if (bs.length) bs[Math.floor(Math.random() * bs.length)].click(); }); await page.waitForTimeout(400); continue; }
    if (st.ph === 'shop' && st.aug) { await ev(() => { const b = document.getElementById('augPick'); if (b) b.click(); }); await page.waitForTimeout(1500); continue; }
    if (st.ph === 'shop') {
      await ev(() => {
        const its = [...document.querySelectorAll('#ovBody .se-post[data-w], #ovBody .se-tag[data-it], #ovBody .se-line[data-rest]')];
        const r = Math.random();
        if (r < 0.45 && its.length) { its[Math.floor(Math.random() * its.length)].click(); const b = document.getElementById('fixBuy'); if (b) b.click(); }
        else if (r < 0.55) { const b = document.getElementById('fixReroll'); if (b) b.click(); }
        else if (r < 0.62) { const b = document.getElementById('fixPin'); if (b) b.click(); }
        else { const b = document.getElementById('shopNext'); if (b) b.click(); }
      });
      await page.waitForTimeout(Math.random() < 0.5 ? 60 : 900);
      continue;
    }
    await ev(() => window.furryV3.sim(0.3)); await page.waitForTimeout(50);
  }
  out.push({ hero, r, end, steps, lastNode, seen, errs: errs.slice(0, 8), nErr: errs.length });
  await page.close();
}
console.log(JSON.stringify(out.map((o) => ({ ...o, seen: undefined })), null, 1));
await browser.close();
