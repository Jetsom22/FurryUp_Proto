# FurryUp 프로토타입

퍼리업 웹 프로토타입만 두는 저장소다.

- 열기: https://jetsom22.github.io/FurryUp_Proto/
- 파일: `index.html` 하나 (그림 · 소리 포함, 따로 받을 것 없음)
- 시험 스크립트: `tools/` (배포에는 안 나간다. 클라우드 세션의 Playwright로 돈다)
  - `node tools/fuzz.mjs <index.html 절대 경로> <메인마다 판 수>` — 메인 넷 무작위 원정, 오류 · 화면 어긋남
  - `node tools/shots.mjs <index.html> <폴더> [gift]` — 아웃게임 화면 찍기
  - `node tools/shots_run.mjs <index.html> <폴더> <접두>` — 전투 · 증강 · 정비 · 교체 창 찍기
  - `node tools/syn_test.mjs <index.html> <폴더>` — 시너지 단 (1 ~ 5명에서 2 · 3 · 5명 단)
  - `node tools/ch_lock_test.mjs <index.html> <폴더>` — 장 해금이 메인마다인지 (다른 메인이 깬 장은 잠김)
  - `node tools/ch2_test.mjs <index.html> <폴더>` — 2챕터: 1장 클리어 뒤 열림 · 배율 · 보상 · 티어 3
  - `node tools/transit_test.mjs <index.html> <폴더>` — 칸 사이 전환 (스토리 · 이벤트 · 보스 경고 판 · 넘기기)
  - `node tools/click_test.mjs <index.html>` — 단추를 마우스로 눌러 칸이 끝날 때 전환이 건너뛰어지지 않는지 (v0.13 회귀)
  - `node tools/tree_test.mjs <index.html> <폴더>` — 원정대 강화 트리 (티어 잠김 · 열기 · 효과)
  - `node tools/ef_test.mjs <index.html> <폴더>` — 유물 화면 · 프리셋 · 강화, 출발 준비 · 지난 짐, 옛 저장
  - `node tools/save_test.mjs <index.html> <폴더>` — 원정 도중 저장 · 이어하기
  - `node tools/art_shots.mjs <index.html> <폴더>` — 캐릭터 그림 확인
  - `python3 -I tools/make_icons.py <리소스 폴더> <출력 폴더>` — 새 리소스에서 얼굴 아이콘 · 전신 그림 만들기
