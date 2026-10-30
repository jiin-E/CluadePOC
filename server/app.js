import express from 'express'
import db from './db.js'

const app = express()

app.use(express.json())

// 책 목록을 id 순서로 돌려준다
app.get('/api/books', (req, res) => {
  const books = db.prepare('SELECT * FROM books ORDER BY id').all()
  res.json(books)
})

export default app
