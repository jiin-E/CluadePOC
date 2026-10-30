# 설계 — 사내 도서 대여 POC

[SPEC.md](SPEC.md) 의 목표와 성공 기준 (a)~(d) 를 구현하기 위한 설계다.

- 스택: Node.js 24 · Express 5 · better-sqlite3 · React + Vite
- 표 1개 · API 3개 · 화면 1개 · 샘플 책 5권
- 핵심 규칙: 대여 중인 책을 다시 빌리면 409 로 거부한다

## 1. 폴더 구조

```
package.json          # workspaces: ["server", "client"]
server/
  package.json
  app.js              # Express 앱을 만들고 라우트를 붙인다. listen 하지 않는다
  server.js           # app 을 가져와 3000 포트로 listen 한다
  db.js               # DB 연결 · 표 생성 · 샘플 5권 넣기
  test/
    books.test.js     # API 자동 테스트
client/
  package.json
  vite.config.js      # 5173 포트, /api 를 3000 으로 proxy
  index.html
  src/
    main.jsx
    App.jsx           # 화면 1개
docs/
  idea.md · SPEC.md · design.md
```

- 루트 `package.json` 은 npm workspaces 로 `server` · `client` 를 묶는다. 루트에서 `npm install` 한 번이면 둘 다 설치된다.
- `app.js` 와 `server.js` 를 나눈 이유: 테스트가 포트를 열지 않고 `app` 만 불러 요청을 보낼 수 있게 하기 위해서다.

## 2. DB

### 파일 경로

- 환경 변수 `DB_PATH` 로 바꿀 수 있다. 없으면 `books.db` 를 쓴다(서버를 실행한 폴더, 보통 `server/` 기준).
- 테스트는 `DB_PATH=:memory:` 로 메모리 DB 를 써서 실제 파일을 건드리지 않는다.
- `*.db` 는 `.gitignore` 에 들어 있어 커밋되지 않는다.

### 표 `books`

| 칸 | 타입 | 설명 |
|---|---|---|
| id | INTEGER PRIMARY KEY | 책 id |
| title | TEXT NOT NULL | 제목 |
| author | TEXT NOT NULL | 저자 |
| borrower | TEXT NULL | 대여자 이름. NULL 이면 대여 가능 |
| borrowed_at | TEXT NULL | 대여 시각(ISO 8601). 반납하면 NULL |
| due_date | TEXT NULL | 반납 예정일(YYYY-MM-DD). 대여할 때 서버가 대여일 + 14일로 채운다. 반납하면 NULL |

- 상태는 따로 칸을 두지 않는다. borrower 가 NULL 이면 「대여 가능」, 아니면 「대여 중」 이다.
- 반납 예정일은 보여 주기만 한다. 지나도 막거나 따로 표시하지 않는다(연체는 만들지 않는다).

### 시작할 때

1. `CREATE TABLE IF NOT EXISTS books (...)` 로 표를 만든다.
2. 표가 비어 있으면 샘플 5권을 넣는다. 모두 대여 가능 상태다.

| id | title | author |
|---|---|---|
| 1 | 클린 코드 | 로버트 C. 마틴 |
| 2 | 리팩터링 | 마틴 파울러 |
| 3 | 실용주의 프로그래머 | 데이비드 토머스 · 앤드류 헌트 |
| 4 | 객체지향의 사실과 오해 | 조영호 |
| 5 | 모던 자바스크립트 Deep Dive | 이웅모 |

### 중복 대여 방지

대여는 조건부 UPDATE 한 번으로 처리한다.

```sql
UPDATE books SET borrower = ?, borrowed_at = ?, due_date = ?
WHERE id = ? AND borrower IS NULL
```

바뀐 행이 0 이면 그 책이 없거나(404) 이미 대여 중(409)이다. 조회한 뒤 갱신하는 사이에 다른 요청이 끼어들 틈이 없다.
반납도 같은 방식으로 `WHERE id = ? AND borrower IS NOT NULL` 을 쓴다.

## 3. API

- 요청과 응답은 JSON 이다.
- 오류 응답은 `{ "error": "메시지" }` 형식이다.
- 검사 순서: 이름(400) → 책 존재(404) → 대여 상태(409)

### `GET /api/books`

책 목록을 id 순서로 돌려준다.

응답 200

```json
[
  { "id": 1, "title": "클린 코드", "author": "로버트 C. 마틴",
    "borrower": "김지인", "borrowed_at": "2026-10-30T09:00:00.000Z", "due_date": "2026-11-13" },
  { "id": 2, "title": "리팩터링", "author": "마틴 파울러",
    "borrower": null, "borrowed_at": null, "due_date": null }
]
```

### `POST /api/books/:id/borrow`

요청

```json
{ "name": "김지인" }
```

| 상태 | 언제 | 응답 본문 |
|---|---|---|
| 200 | 대여 성공 | 바뀐 책 1권 `{ "id": 1, ..., "borrower": "김지인", "borrowed_at": "...", "due_date": "2026-11-13" }` |
| 400 | name 이 없거나 공백뿐 | `{ "error": "이름을 입력하세요." }` |
| 404 | 없는 책 id | `{ "error": "책을 찾을 수 없습니다." }` |
| 409 | 이미 대여 중 | `{ "error": "이미 대여 중인 책입니다." }` |

- name 은 앞뒤 공백을 지우고 저장한다.

### `POST /api/books/:id/return`

요청 본문은 없다. 누구나 반납할 수 있다.

| 상태 | 언제 | 응답 본문 |
|---|---|---|
| 200 | 반납 성공 | 바뀐 책 1권 `{ "id": 1, ..., "borrower": null, "borrowed_at": null, "due_date": null }` |
| 404 | 없는 책 id | `{ "error": "책을 찾을 수 없습니다." }` |
| 409 | 대여 중이 아님 | `{ "error": "대여 중인 책이 아닙니다." }` |

## 4. 화면

`client/src/App.jsx` 하나로 만든다.

```
┌──────────────────────────────────────────────────────────────────┐
│ 사내 도서 대여                                                    │
│ 이름 [ 김지인        ]                                            │
│ ⚠ 이미 대여 중인 책입니다.                       (오류일 때만)    │
│ ┌──────────────┬──────────┬────────┬────────┬────────────┬──────┐ │
│ │ 제목         │ 저자     │ 상태   │ 대여자 │ 반납 예정일│      │ │
│ ├──────────────┼──────────┼────────┼────────┼────────────┼──────┤ │
│ │ 클린 코드    │ 마틴     │ 대여 중│ 김지인 │ 2026-11-13 │[반납]│ │
│ │ 리팩터링     │ 파울러   │대여 가능│        │            │[대여]│ │
│ └──────────────┴──────────┴────────┴────────┴────────────┴──────┘ │
└──────────────────────────────────────────────────────────────────┘
```

- 처음 열 때 `GET /api/books` 로 목록을 불러온다.
- 위쪽 이름 입력칸 하나를 모든 대여 버튼이 같이 쓴다.
- 버튼: 대여 가능한 책은 「대여」, 대여 중인 책은 「반납」 을 보여 준다.
- 대여 · 반납이 성공하면 목록을 다시 불러오고 오류 안내를 지운다.
- 실패하면 응답의 `error` 메시지를 표 위에 빨간 글씨로 보여 준다. 다음 요청이 성공하면 지운다.

## 5. 실행과 포트

| 대상 | 포트 | 비고 |
|---|---|---|
| 서버(Express) | 3000 | `server.js` 가 listen |
| 화면(Vite) | 5173 | `/api` 요청은 Vite proxy 가 `http://localhost:3000` 으로 넘긴다 |

화면이 같은 출처(5173)의 `/api` 로 요청하므로 서버에 CORS 설정이 필요 없다.

| 할 일 | 명령(루트에서) |
|---|---|
| 설치 | `npm install` |
| 서버 실행 | `npm run dev -w server` |
| 화면 실행 | `npm run dev -w client` |
| 테스트 | `npm test -w server` |

서버와 화면은 터미널 두 개에서 각각 실행한다.

## 6. 테스트 계획

Node 내장 `node:test` 와 `supertest` 로 `app` 에 직접 요청을 보낸다. `DB_PATH=:memory:` 로 매번 샘플 5권에서 시작한다.

| 성공 기준 | 테스트 |
|---|---|
| (a) 목록 | `GET /api/books` → 200, 5권, 모두 borrower · due_date 가 null |
| (b) 대여 | 1번 대여 → 200, borrower · borrowed_at 이 채워지고 due_date 가 대여일 + 14일 · 이름 `""` 이나 `"   "` → 400 |
| (c) 중복 대여 거부 | 1번 다시 대여 → 409, 메시지 「이미 대여 중인 책입니다.」, borrower 와 due_date 그대로 |
| (d) 반납 | 1번 반납 → 200, 세 칸 모두 null · 다시 대여 → 200 |
| 그 밖 | 없는 책 대여 · 반납 → 404 · 대여 가능한 책 반납 → 409 |

화면 부분은 브라우저에서 (a)~(d) 순서로 직접 눌러 확인한다.
