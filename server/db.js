import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

// DB_PATH 가 없으면 서버를 실행한 폴더의 books.db 를 쓴다. 테스트는 :memory: 를 쓴다
const db = new Database(process.env.DB_PATH ?? 'books.db')

// 시작할 때 표를 만들고, 비어 있으면 샘플 5권을 넣는다
db.exec(readFileSync(join(import.meta.dirname, 'schema.sql'), 'utf8'))

export default db
