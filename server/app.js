import express from 'express'
import db from './db.js'

const app = express()

app.use(express.json())

// 책 목록을 id 순서로 돌려준다
app.get('/api/books', (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY id').all()
  res.json(books)
})

const findBook = db.prepare('SELECT * FROM books WHERE id = ?')

// 대여: 이름(400) → 책 존재(404) → 대여 상태(409) 순서로 검사한다
app.post('/api/books/:id/borrow', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    return res.status(400).json({ error: '이름을 입력하세요.' })
  }

  const book = findBook.get(req.params.id)
  if (!book) {
    return res.status(404).json({ error: '책을 찾을 수 없습니다.' })
  }

  // 반납 예정일은 대여일 + 14일(YYYY-MM-DD)
  const now = new Date()
  const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  // borrower IS NULL 조건으로 갱신해 동시에 빌려도 한 명만 성공한다
  const result = db
    .prepare('UPDATE books SET borrower = ?, borrowed_at = ?, due_date = ? WHERE id = ? AND borrower IS NULL')
    .run(name, now.toISOString(), due.toISOString().slice(0, 10), book.id)
  if (result.changes === 0) {
    return res.status(409).json({ error: '이미 대여 중인 책입니다.' })
  }

  res.json(findBook.get(book.id))
})

// 반납: 책 존재(404) → 대여 상태(409) 순서로 검사한다. 대여자 확인은 하지 않는다
app.post('/api/books/:id/return', (req, res) => {
  const book = findBook.get(req.params.id)
  if (!book) {
    return res.status(404).json({ error: '책을 찾을 수 없습니다.' })
  }

  const result = db
    .prepare('UPDATE books SET borrower = NULL, borrowed_at = NULL, due_date = NULL WHERE id = ? AND borrower IS NOT NULL')
    .run(book.id)
  if (result.changes === 0) {
    return res.status(409).json({ error: '대여 중인 책이 아닙니다.' })
  }

  res.json(findBook.get(book.id))
})

export default app
