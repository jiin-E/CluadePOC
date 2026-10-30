# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 저장소 개요

KOSTA 「Claude Code로 POC 프로젝트 만들기」 실습용 저장소다. 작업 위치는 `C:\poc`.
강사 데모 아이디어는 사내 도서 대여(`docs/idea.md`)다. 수강생이 자기 POC 를 고르면 `docs/idea-template.md` 형식으로 `docs/idea.md` 를 다시 쓴다.

## 현재 상태

- 아직 코드가 없다. 빌드 · 린트 · 테스트 명령도 없다. `server/` · `client/` · 테스트 · 설계 문서는 실습을 진행하며 Claude Code 로 만든다.
- 처음 커밋된 파일은 `README.md` · `docs/idea.md` · `docs/idea-template.md` · `.gitignore` · `.gitattributes` 5개다.
- `따라하기_도서대여/` 는 차시별 실습 프롬프트(P1-2 ~ P6-3)를 담은 텍스트 파일 모음이다. git 에 커밋하지 않았고, 프로젝트 코드가 아니다.

## POC 규칙

- 목적: 사내 도서 대여 POC. 하루 안에 핵심 흐름(목록 · 대여 · 중복 대여 거부 · 반납)이 동작하는지 확인한다
- 스택: Node.js 24 · Express 5 · better-sqlite3 · React + Vite
- 폴더: `server/` 는 API, `client/` 는 화면, `docs/` 는 문서
- 만들지 않는 것: 로그인 · 회원 · 검색 · 연체 · 배포
- 보고: 작업이 끝나면 바꾼 파일과 내용을 3줄로 알려 준다
- 언어: 답과 문서는 한국어로 쓴다

## POC 범위 규칙 (`docs/idea-template.md` 기준)

- 스택 고정: Node.js 24 · Express 5 · better-sqlite3 · React + Vite
- 표 1~2개 · API 3~4개 · 화면 1개 · 샘플 데이터 5건
- 핵심 규칙 1개: 어기면 409 로 거부한다(도서 대여에서는 대여 중인 책을 다시 빌리려 할 때)
- 만들지 않음: 로그인 · 회원 · 배포 · 결제 · 외부 API 연동

## 참고

- `.gitignore` 에 `node_modules/` · `*.db`(SQLite 파일과 journal · wal · shm) · `.env` · `dist/` 가 들어 있다.
- 문서와 답변은 한국어로 쓴다(저장소 문서가 모두 한국어다).
