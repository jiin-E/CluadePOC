-- 표: books (docs/design.md 2절)
-- borrower 가 NULL 이면 대여 가능, 아니면 대여 중
CREATE TABLE IF NOT EXISTS books (
  id          INTEGER PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  borrower    TEXT NULL,
  borrowed_at TEXT NULL,
  due_date    TEXT NULL
);

-- 시드: 표가 비어 있을 때만 샘플 5권을 넣는다. 모두 대여 가능 상태다
INSERT INTO books (id, title, author)
SELECT column1, column2, column3 FROM (VALUES
  (1, '클린 코드', '로버트 C. 마틴'),
  (2, '리팩터링', '마틴 파울러'),
  (3, '실용주의 프로그래머', '데이비드 토머스 · 앤드류 헌트'),
  (4, '객체지향의 사실과 오해', '조영호'),
  (5, '모던 자바스크립트 Deep Dive', '이웅모')
)
WHERE NOT EXISTS (SELECT 1 FROM books);
