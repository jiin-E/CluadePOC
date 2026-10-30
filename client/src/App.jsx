import { useEffect, useState } from 'react'
import './App.css'

// 오류 응답이면 본문의 error 메시지로 Error 를 던진다
async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `요청에 실패했습니다. (${res.status})`)
  }
  return body
}

function App() {
  const [books, setBooks] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function loadBooks() {
    try {
      setBooks(await request('/api/books'))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    request('/api/books')
      .then(setBooks)
      .catch((e) => setError(e.message))
  }, [])

  // 오류 안내는 3초 뒤 사라진다
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 3000)
    return () => clearTimeout(timer)
  }, [error])

  const nameEmpty = name.trim() === ''

  async function handle(action) {
    setError('')
    try {
      await action()
    } catch (e) {
      setError(e.message)
    }
    await loadBooks()
  }

  const borrow = (id) =>
    handle(() =>
      request(`/api/books/${id}/borrow`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    )

  const giveBack = (id) =>
    handle(() => request(`/api/books/${id}/return`, { method: 'POST' }))

  return (
    <main>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <h1>사내 도서 대여</h1>

      <label className="name">
        이름
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="대여자 이름"
        />
      </label>

      <table>
        <thead>
          <tr>
            <th>제목</th>
            <th>저자</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">
                등록된 책이 없습니다
              </td>
            </tr>
          )}
          {books.map((book) => (
            <tr
              key={book.id}
              className={book.borrower === null ? undefined : 'borrowed'}
            >
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>
                {book.borrower === null ? (
                  '대여 가능'
                ) : (
                  <>
                    대여 중 · <strong>{book.borrower}</strong> (~{book.due_date})
                  </>
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn-borrow"
                  onClick={() => borrow(book.id)}
                  disabled={nameEmpty}
                  title={nameEmpty ? '이름을 먼저 입력하세요' : undefined}
                >
                  대여
                </button>
                <button
                  type="button"
                  className="btn-return"
                  onClick={() => giveBack(book.id)}
                >
                  반납
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

export default App
