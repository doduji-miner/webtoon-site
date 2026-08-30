# WebToon Viewer 2000

2000년대 초반 데스크톱 프로그램(윈도우 클래식 UI) 감성의 웹툰 연재 사이트입니다.
순수 HTML/CSS/JavaScript로만 만들어졌고, 별도의 빌드 도구나 서버 없이
GitHub Pages 같은 정적 호스팅에 바로 배포할 수 있습니다.

## 주요 기능

- 웹툰 목록 + 장르별 분류 / 검색 (`index.html`)
- 작품 상세 정보 + 회차 목록 (`series.html`)
- 회차 세로 스크롤 뷰어 (`viewer.html`)
- 좋아요, 댓글 (`viewer.html`)
- 작가 업로드 페이지 - 신규 작품 등록 / 회차 추가 (`upload.html`)

## ⚠️ 정적 사이트의 한계, 그리고 Firebase로 해결하기

이 사이트는 원래 백엔드 서버나 데이터베이스가 없는 **완전 정적(static) 사이트**라
아래 데이터가 **각 사용자의 브라우저(localStorage)에만** 저장되는 게 기본값입니다.

- 작가 업로드 페이지에서 등록한 작품/회차
- 좋아요
- 댓글

즉, 내가 올린 웹툰이 다른 사람 화면에는 보이지 않고, 브라우저 캐시/저장소를
지우면 사라집니다. 하지만 아래 "Firebase로 모두에게 공유하기"를 설정하면
**서버 코드를 직접 작성하지 않고도** 이 세 가지가 전부 모든 방문자에게
공유되도록 미리 연결해 두었습니다(로그인/회원가입은 없고, 누구나 자유롭게
올리고 볼 수 있는 게시판 형태입니다).

설정하지 않아도 사이트는 정상적으로 작동합니다(자동으로 이전처럼 이
브라우저에만 저장되는 방식으로 폴백). 표지·원고 이미지 업로드나 회원 인증처럼
더 큰 기능이 필요하면 `js/data.js`의 `WebtoonStore` 객체를 확장하면 됩니다
(현재 구조상 화면 코드는 이 파일의 함수만 바꾸면 재사용할 수 있습니다).

## 🔥 Firebase로 모두에게 공유하기 (업로드 · 좋아요 · 댓글)

`js/data.js`는 **Firestore(Firebase의 무료 클라우드 데이터베이스)** 를 붙일 수
있도록 미리 연결되어 있습니다. 설정하면 아래가 전부 모든 방문자에게 실시간/공용으로
공유됩니다.

- 작가 업로드 페이지에서 등록한 작품/회차 → `index.html`, `series.html`에 모두에게 표시
- 좋아요 수 → 작품 목록/상세/뷰어에서 공용 집계
- 댓글 → `viewer.html`에서 새로고침 없이 실시간 반영

**1) Firebase 프로젝트 만들기**

1. https://console.firebase.google.com 접속 → 로그인 → "프로젝트 추가"
2. 프로젝트 이름 입력 후 생성 (Google 애널리틱스는 꺼도 됩니다)

**2) Firestore 데이터베이스 만들기**

1. 왼쪽 메뉴 **빌드 → Firestore Database** → "데이터베이스 만들기"
2. 위치는 가까운 리전 선택 (예: `asia-northeast3` 서울)
3. 처음엔 "테스트 모드"로 시작해도 되지만, 배포 전에 아래 4)의 보안 규칙을
   꼭 적용하세요. 테스트 모드는 누구나 모든 데이터를 읽고 쓸 수 있는 상태라
   댓글이 아닌 다른 데이터까지 노출/변조될 수 있습니다.

**3) 웹 앱 등록 후 설정값 복사**

1. 프로젝트 개요 옆 톱니바퀴 → **프로젝트 설정**
2. "내 앱" 섹션에서 `</>`(웹) 아이콘 클릭 → 앱 닉네임 입력 → 앱 등록
3. 화면에 표시되는 `firebaseConfig` 객체 값을 복사해서
   `js/firebase-config.js` 파일의 `window.FIREBASE_CONFIG` 안에 그대로
   붙여넣습니다.

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "my-project.firebaseapp.com",
     projectId: "my-project",
     storageBucket: "my-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

   apiKey는 이 사이트처럼 공개 정적 페이지에 그대로 들어가도 되는 값입니다
   (비밀키가 아니라 프로젝트 식별용입니다). 실제 접근 제어는 4)의 보안 규칙이
   담당합니다.

**4) 보안 규칙 적용 (필수)**

Firestore Database → **규칙** 탭에서 아래 내용으로 교체하고 "게시"를 누르세요.
누구나 읽고 새로 등록할 수 있지만, 남의 글을 수정·삭제하거나 이상한 필드/형식을
넣는 것은 막아줍니다. (로그인이 없는 구조라 "내가 쓴 것만 수정"까지는 지원하지
않습니다 - 필요하면 Firebase Authentication을 추가로 붙여야 합니다.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(
                        ['seriesId', 'episodeId', 'author', 'text', 'date', 'createdAt']
                      )
                    && request.resource.data.author is string
                    && request.resource.data.author.size() <= 16
                    && request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 200;
      allow update, delete: if false;
    }

    match /series/{seriesId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(
                        ['title', 'author', 'genres', 'status', 'color', 'description', 'likes', 'createdAt']
                      )
                    && request.resource.data.title is string
                    && request.resource.data.title.size() > 0
                    && request.resource.data.title.size() <= 40
                    && request.resource.data.author is string
                    && request.resource.data.author.size() <= 20
                    && request.resource.data.genres is list
                    && request.resource.data.likes == 0;
      allow update, delete: if false;
    }

    match /episodes/{episodeId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(
                        ['seriesId', 'title', 'date', 'panelCount', 'likes', 'createdAt']
                      )
                    && request.resource.data.title is string
                    && request.resource.data.title.size() > 0
                    && request.resource.data.title.size() <= 40
                    && request.resource.data.panelCount is number
                    && request.resource.data.panelCount >= 1
                    && request.resource.data.panelCount <= 20
                    && request.resource.data.likes == 0;
      allow update, delete: if false;
    }

    // 좋아요 집계 전용 문서(likeCounts/{seriesId 또는 seriesId:episodeId}).
    // count는 1씩만 늘거나 줄 수 있고 음수가 될 수 없도록 제한합니다.
    match /likeCounts/{key} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['count'])
                    && request.resource.data.count is int
                    && request.resource.data.count >= 0
                    && request.resource.data.count <= 1;
      allow update: if request.resource.data.keys().hasOnly(['count'])
                    && request.resource.data.count is int
                    && request.resource.data.count >= 0
                    && (request.resource.data.count == resource.data.count + 1
                        || request.resource.data.count == resource.data.count - 1);
      allow delete: if false;
    }
  }
}
```

**5) 확인하기**

- `viewer.html`을 열어 댓글 영역 위에 "모든 방문자에게 실시간으로 공유되는
  댓글입니다"라는 문구가 보이면 연동이 완료된 것입니다.
- `upload.html` 상단 안내문이 "Firebase(Firestore)와 연동되어 있습니다..."로
  바뀌었는지 확인하세요.
- `index.html` 하단 상태 표시줄이 "Firebase 연동됨 (모두에게 공유)"로 바뀝니다.
- 서로 다른 브라우저(또는 시크릿 창)에서 같은 사이트를 열어 작품을 올리거나
  댓글/좋아요를 남기면, 다른 브라우저에서도(댓글은 새로고침 없이, 나머지는
  새로고침 시) 함께 보입니다.

**참고 (무료 한도)**: Firestore의 Spark(무료) 요금제는 하루 문서 쓰기
2만 건, 읽기 5만 건 등을 제공합니다. 개인 프로젝트/포트폴리오 수준에서는
충분하지만, 실제 서비스로 트래픽이 늘어나면 사용량 기반 요금제(Blaze)로
전환이 필요할 수 있습니다. (Firebase 콘솔의 "사용량 및 청구" 메뉴에서 최신
한도를 확인하세요.)

## 실제 웹툰 이미지로 교체하기

현재 회차 뷰어는 실제 원고 이미지 대신 색상 블록(플레이스홀더 패널)을
세로로 이어 붙여 보여줍니다. `js/viewer.js`의 `panelStackHTML` 함수 안에서
`<div class="panel">...</div>` 부분을 실제 `<img>` 태그로 교체하면
진짜 웹툰 컷 이미지를 세로 스크롤로 보여줄 수 있습니다.

## 로컬에서 미리보기

정적 파일이라 별도 서버 없이 `index.html`을 브라우저로 직접 열어도 되지만,
`fetch` 등을 쓰게 될 경우를 대비해 간단한 로컬 서버로 보는 것을 추천합니다.

```bash
# 이 폴더(webtoon-site)에서 실행
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## GitHub Pages로 배포하기

1. GitHub에서 새 저장소를 만듭니다. (예: `webtoon-site`)
2. 이 폴더의 내용을 저장소에 push 합니다.

   ```bash
   cd webtoon-site
   git init
   git add .
   git commit -m "Initial commit: WebToon Viewer 2000"
   git branch -M main
   git remote add origin https://github.com/<내-깃허브아이디>/webtoon-site.git
   git push -u origin main
   ```

3. GitHub 저장소 페이지에서 **Settings → Pages**로 이동합니다.
4. **Build and deployment → Source**를 `Deploy from a branch`로 선택합니다.
5. **Branch**를 `main`, 폴더를 `/ (root)`로 선택하고 저장합니다.
6. 몇 분 뒤 아래와 같은 링크가 발급됩니다.

   ```
   https://<내-깃허브아이디>.github.io/webtoon-site/
   ```

이 저장소에는 `.nojekyll` 파일이 포함되어 있어 GitHub Pages가 파일을
Jekyll로 한 번 더 가공하지 않고 그대로 서빙합니다.

## 폴더 구조

```
webtoon-site/
├── index.html      홈 (작품 목록 / 장르 / 검색)
├── series.html     작품 상세 / 회차 목록
├── viewer.html     회차 뷰어 (세로 스크롤, 좋아요, 댓글)
├── upload.html     작가 업로드 (신규 작품 / 회차 추가)
├── css/
│   └── style.css   레트로 테마 스타일
├── js/
│   ├── data.js             시드 데이터 + localStorage/Firestore 저장소 유틸
│   ├── firebase-config.js  Firebase 프로젝트 설정값 (업로드/좋아요/댓글 공유용, 선택)
│   ├── main.js             index.html 로직
│   ├── series.js           series.html 로직
│   ├── viewer.js           viewer.html 로직
│   └── upload.js           upload.html 로직
└── .nojekyll
```
