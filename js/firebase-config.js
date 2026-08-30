/* ============================================================
   firebase-config.js
   업로드한 작품/회차, 좋아요, 댓글을 모든 방문자에게 공통으로
   보이게 하려면 이 파일을 채우세요.

   1) https://console.firebase.google.com 에서 새 프로젝트 생성
   2) 왼쪽 메뉴 "빌드 > Firestore Database" > 데이터베이스 만들기
      (테스트 모드로 시작해도 되지만, README.md의 보안 규칙을 꼭 적용하세요)
   3) 프로젝트 설정(톱니바퀴 아이콘) > 일반 탭 > "내 앱"에서 웹 앱 추가( </> 아이콘)
   4) 발급되는 firebaseConfig 값을 아래 객체에 그대로 붙여넣기

   값을 채우지 않으면(placeholder 상태) 사이트는 자동으로
   이전처럼 "이 브라우저에만 저장되는" 방식으로 동작합니다.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyC5AyJcBEakksC5mtdz2Oa93H0nm-SdNXg",
  authDomain: "doduji-webtoon.firebaseapp.com",
  projectId: "doduji-webtoon",
  storageBucket: "doduji-webtoon.firebasestorage.app",
  messagingSenderId: "465382133772",
  appId: "1:465382133772:web:ce4f6b06fdffba22761e29",
  measurementId: "G-P9ETCT3PFL"
};