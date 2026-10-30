# 작업 목록 — 사내 도서 대여 POC

[design.md](design.md) 를 바탕으로 나눈 작업이다. 괄호 안 (a)~(d) 는 [SPEC.md](SPEC.md) 의 성공 기준이다.
끝난 작업은 `[ ]` 를 `[x]` 로 바꾼다.

## 3차시 — 스캐폴딩 · DB

### 백엔드

- [ ] **B1. 스캐폴딩:** 루트 `package.json`(workspaces: server · client), `server/package.json`(express 5 · better-sqlite3, dev · test 스크립트), `app.js`(앱 생성, listen 안 함) · `server.js`(3000 포트 listen)
  - 완료: `npm run dev -w server` 로 3000 포트가 열린다
- [ ] **B2. DB:** `db.js` — `DB_PATH`(기본 `books.db`)로 연결, `books` 표(id · title · author · borrower · borrowed_at · due_date) 생성, 비어 있으면 샘플 5권 넣기
  - 완료: 서버를 두 번 시작해도 책이 5권이다
- [ ] **B3. 목록 API (a):** `GET /api/books` 와 테스트(`node:test` + supertest, `DB_PATH=:memory:`)
  - 완료: `npm test -w server` 에서 200 · 5권 테스트가 통과한다

### 프론트엔드

- [ ] **F1. 스캐폴딩:** `client/` 에 React + Vite, `vite.config.js` 에 5173 포트와 `/api` → `http://localhost:3000` proxy
  - 완료: `npm run dev -w client` 로 5173 에서 화면이 뜬다
- [ ] **F2. 목록 표 (a):** `App.jsx` 에서 `GET /api/books` 를 불러 표(제목 · 저자 · 상태 · 대여자 · 반납 예정일)로 보여 준다
  - 완료: 브라우저에 5권이 「대여 가능」 으로 보인다

## 4차시 — 대여 · 반납

### 백엔드

- [ ] **B4. 대여 API (b)(c):** `POST /api/books/:id/borrow` — 조건부 UPDATE, due_date 는 대여일 + 14일. 빈 이름 400 · 없는 책 404 · 대여 중 409(「이미 대여 중인 책입니다.」)와 테스트
  - 완료: 대여 200 · 400 · 404 · 409 테스트가 통과한다
- [ ] **B5. 반납 API (d):** `POST /api/books/:id/return` — borrower · borrowed_at · due_date 를 비운다. 없는 책 404 · 대여 중 아님 409 와 테스트
  - 완료: 반납 200 · 반납 후 다시 대여 200 · 404 · 409 테스트가 통과한다

### 프론트엔드

- [ ] **F3. 이름 입력 · 대여 (b):** 위쪽 이름 입력칸, 대여 가능한 책에 「대여」 버튼, 성공하면 목록 다시 불러오기
  - 완료: 대여하면 그 책이 「대여 중」 · 대여자 · 반납 예정일로 바로 바뀐다
- [ ] **F4. 반납 (d):** 대여 중인 책에 「반납」 버튼, 성공하면 목록 다시 불러오기
  - 완료: 반납하면 그 책이 「대여 가능」 으로 바로 바뀐다
- [ ] **F5. 오류 안내 (c):** 실패 응답의 `error` 메시지를 표 위에 빨간 글씨로 보여 주고, 다음 성공 시 지운다
  - 완료: 다른 탭에서 먼저 빌린 책을 대여하면 「이미 대여 중인 책입니다.」 가 보인다
