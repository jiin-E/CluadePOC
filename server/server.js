import app from './app.js'

const PORT = 3000

app.listen(PORT, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`포트 ${PORT} 이(가) 이미 사용 중입니다.`)
    } else {
      console.error(err)
    }
    process.exit(1)
  }
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
