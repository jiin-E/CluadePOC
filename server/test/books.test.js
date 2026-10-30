import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import request from 'supertest'

// 실제 books.db 를 건드리지 않도록 app 을 불러오기 전에 메모리 DB 를 지정한다
process.env.DB_PATH = ':memory:'
// 반납 예정일을 PC 시간대와 상관없이 한국 시간 기준으로 확인한다
process.env.TZ = 'Asia/Seoul'
const { default: app } = await import('../app.js')
const { default: db } = await import('../db.js')

const schema = readFileSync(join(import.meta.dirname, '..', 'schema.sql'), 'utf8')

// 테스트마다 표를 비우고 시드를 다시 넣어 샘플 5권(모두 대여 가능)에서 시작한다
beforeEach(() => {
  db.exec('DELETE FROM books')
  db.exec(schema)
})

test('(a) 목록: GET /api/books 가 200 과 샘플 5권을 돌려준다', async () => {
  const res = await request(app).get('/api/books')

  assert.equal(res.status, 200)
  assert.equal(res.body.length, 5)
  for (const book of res.body) {
    assert.ok(book.title)
    assert.ok('borrower' in book)
    assert.ok('due_date' in book)
    assert.equal(book.borrower, null)
    assert.equal(book.due_date, null)
  }
})

test('(b) 대여: 이름을 넣으면 200 과 대여 정보가 채워지고, 빈 이름은 400', async (t) => {
  // KST 2026-10-31 08:00 (UTC 로는 전날 23:00) 에 빌리면 예정일은 KST 기준 11-14 여야 한다
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-31T08:00:00+09:00') })
  const res = await request(app).post('/api/books/1/borrow').send({ name: '김철수' })
  t.mock.timers.reset()

  assert.equal(res.status, 200)
  assert.equal(res.body.borrower, '김철수')
  assert.equal(res.body.borrowed_at, '2026-10-30T23:00:00.000Z')
  assert.equal(res.body.due_date, '2026-11-14')

  for (const name of ['', '   ']) {
    const bad = await request(app).post('/api/books/2/borrow').send({ name })
    assert.equal(bad.status, 400)
  }
  const list = await request(app).get('/api/books')
  assert.equal(list.body.find((b) => b.id === 2).borrower, null)
})

test('(c) 중복 대여 거부: 대여 중인 책을 다시 빌리면 409, 대여자는 그대로', async () => {
  const first = await request(app).post('/api/books/1/borrow').send({ name: '김철수' })
  assert.equal(first.status, 200)

  const res = await request(app).post('/api/books/1/borrow').send({ name: '이영희' })
  assert.equal(res.status, 409)
  assert.equal(res.body.error, '이미 대여 중인 책입니다.')

  const list = await request(app).get('/api/books')
  const book = list.body.find((b) => b.id === 1)
  assert.equal(book.borrower, '김철수')
  assert.equal(book.due_date, first.body.due_date)
})

test('(d) 반납: 대여 중인 책을 반납하면 200 과 대여 가능, 다시 대여할 수 있다', async () => {
  await request(app).post('/api/books/1/borrow').send({ name: '김철수' })

  const res = await request(app).post('/api/books/1/return')
  assert.equal(res.status, 200)
  assert.equal(res.body.borrower, null)
  assert.equal(res.body.borrowed_at, null)
  assert.equal(res.body.due_date, null)

  const again = await request(app).post('/api/books/1/borrow').send({ name: '이영희' })
  assert.equal(again.status, 200)
  assert.equal(again.body.borrower, '이영희')
})
