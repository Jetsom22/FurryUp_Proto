// 장 해금이 메인마다인지 시험: node tools/ch_lock_test.mjs <index.html> <폴더>
// 리토로 1장 · 2장을 깨도 하나토는 2장이 잠겨 있어야 한다
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
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const card2 = () => ev(() => { const c = document.querySelector('.lob-ch[data-ch="2"]'); return { on: c.classList.contains('on'), text: c.textContent }; });
// 리토로 1장을 깬다 (실제 정산 경로)
await ev(() => { const F = window.furryV3; F.meta().mains.rito = true; F.quickCh('rito', 1); F.finish(true); });
const st = await ev(() => { const M = window.furryV3.meta(); return { clears: M.stat.clears, rito: M.rec.rito.clears, hanato: M.rec.hanato.clears }; });
ok(st.rito === 1 && st.hanato === 0, '리토 1장 클리어 기록 ' + JSON.stringify(st));
// 리토: 2장 열림
await ev(() => window.furryV3.screen('chapter', 'rito')); await page.waitForTimeout(300);
ok((await card2()).on, '리토 2장이 열려야 한다');
// 하나토: 2장 잠김 · 눌러도 안 바뀜 · → 키도 안 됨 · 억지로 2장 출발해도 1장
await ev(() => { window.furryV3.state.chSel = 2; window.furryV3.screen('chapter', 'hanato'); }); await page.waitForTimeout(300);
const h2 = await card2();
ok(!h2.on, '하나토 2장이 잠겨 있어야 한다');
ok(await ev(() => window.furryV3.state.chSel) === 1, '다른 메인에서 고른 2장이 하나토에 남으면 안 된다');
await page.screenshot({ path: `${out}/lock_hanato.png` });
await ev(() => document.querySelector('.lob-ch[data-ch="2"]').click()); await page.waitForTimeout(300);
ok(await ev(() => window.furryV3.state.chSel) === 1, '하나토 잠긴 2장을 눌러 고르면 안 된다');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
ok(await ev(() => window.furryV3.state.chSel) === 1, '하나토 → 키로 2장에 가면 안 된다');
ok(await ev(() => window.furryV3.quickCh('hanato', 2)) === 1, '하나토 2장 억지 출발은 1장이어야 한다');
// 리토로 2장까지 깨도 하나토 2장은 그대로 잠김, 리토 1장 클리어 수는 2장 클리어로 부풀지 않는다
await ev(() => { const F = window.furryV3; F.quickCh('rito', 2); F.finish(true); });
await ev(() => window.furryV3.screen('chapter', 'hanato')); await page.waitForTimeout(300);
ok(!(await card2()).on, '리토 2장 클리어 뒤에도 하나토 2장은 잠김');
// 하나토로 1장을 깨면 열린다
await ev(() => { const F = window.furryV3; F.quickCh('hanato', 1); F.finish(true); F.screen('chapter', 'hanato'); }); await page.waitForTimeout(300);
ok((await card2()).on, '하나토 1장 클리어 뒤 2장 열림');
ok(await ev(() => window.furryV3.quickCh('hanato', 2)) === 2, '하나토 2장 출발');
console.log(JSON.stringify({ errors, fails }, null, 1));
await browser.close();
process.exit(errors.length || fails.length ? 1 : 0);
