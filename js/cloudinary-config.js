/* ============================================================
   cloudinary-config.js
   작가 업로드 페이지에서 세로로 긴 웹툰 PNG 이미지를 올릴 수 있게
   하려면 이 파일을 채우세요. (Cloudinary 무료 플랜 - 카드 등록 불필요)

   1) https://cloudinary.com 에서 무료 회원가입
   2) 로그인 후 대시보드 상단에 보이는 "Cloud name" 값을 복사
   3) 오른쪽 위 톱니바퀴(Settings) 아이콘 → Upload 탭 →
      아래로 스크롤해서 "Upload presets" 항목 → "Add upload preset" 클릭
   4) Signing Mode를 반드시 "Unsigned"로 변경 → Save
      (Unsigned로 해야 서버/비밀키 없이 이 정적 사이트에서 바로 업로드할 수 있어요)
   5) 방금 만든 preset의 이름을 복사

   값을 채우지 않으면(placeholder 상태) 업로드 페이지에서 이미지 업로드 칸이
   비활성화되고, 이전처럼 자리표시 패널(색상 블록)만 사용됩니다.
   ============================================================ */

window.CLOUDINARY_CONFIG = {
  cloudName: "bywkhgjr",
  uploadPreset: "zty9ivtd"
};
