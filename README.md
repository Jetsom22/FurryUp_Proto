# FurryUp 프로토타입

퍼리업 웹 프로토타입만 두는 저장소다.

- 열기: https://jetsom22.github.io/FurryUp_Proto/
- 파일: `index.html` 하나 (그림 · 소리 포함, 따로 받을 것 없음)
- 시험 스크립트: `tools/` (배포에는 안 나간다. 클라우드 세션의 Playwright로 돈다)
  - `node tools/fuzz.mjs <index.html 절대 경로> <메인마다 판 수>` — 메인 넷 무작위 원정, 오류 · 화면 어긋남
  - `node tools/shots.mjs <index.html> <폴더> [gift]` — 아웃게임 화면 찍기
  - `node tools/shots_run.mjs <index.html> <폴더> <접두>` — 전투 · 증강 · 정비 · 교체 창 찍기
  - `node tools/syn_test.mjs <index.html> <폴더>` — 종족 시너지 단 (1 ~ 5명)
  - `node tools/ch_lock_test.mjs <index.html> <폴더>` — 장 해금이 메인마다인지 (다른 메인이 깬 장은 잠김)
