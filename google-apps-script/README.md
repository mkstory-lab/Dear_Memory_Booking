# Dear Memory Contract — Google Apps Script 연동 가이드

본 프로젝트는 Google Apps Script (GAS) Web App을 통해 **Gmail 계약서 발송**과 **Google Drive 자동 백업**을 지원합니다.

---

## 1. Google Apps Script 프로젝트 생성

1. [Google Apps Script 콘솔](https://script.google.com/) 접속
2. **새 프로젝트** 생성 (프로젝트명: `Dear Memory Contract WebApp`)
3. 기본 `Code.gs` 파일 내용을 지우고, 본 리포지토리의 `google-apps-script/Code.gs` 내용을 전체 복사하여 붙여넣습니다.
4. 상단의 `REP_EMAIL` 변수를 대표님의 실제 수신 Gmail 주소(예: `contact@dearmemory.kr`)로 수정합니다.

---

## 2. 웹 앱(Web App) 배포

1. 우측 상단의 **[배포] &rarr; [새 배포]** 클릭
2. 유형 선택 톱니바퀴 &rarr; **[웹 앱(Web App)]** 선택
3. 설정:
   - **설명:** `Dear Memory Contract v1.0`
   - **다음 사용자로 실행:** `나 (대표 Google 계정)`
   - **액세스 권한이 있는 사용자:** `모든 사용자 (Anyone)`
4. **[배포]** 버튼 클릭 후, Gmail 및 Google Drive 접근 권한 승인 진행
5. 완료 후 표시되는 **웹 앱 URL (`https://script.google.com/macros/s/.../exec`)**을 복사합니다.

---

## 3. 웹 애플리케이션 환경 변수 설정

`dear-memory-contract/.env.local` 파일에 복사한 Web App URL을 입력합니다:

```env
GAS_WEBAPP_URL=https://script.google.com/macros/s/AKfycb.../exec
```

*참고: `GAS_WEBAPP_URL`이 비어있으면 시스템이 자동으로 안전한 **Mock Backend Adapter(데모 모드)**로 동작하며, 브라우저 화면의 가상 메일함 시뮬레이터로 전체 플로우를 완벽하게 테스트할 수 있습니다.*

---

## 4. 저장되는 Google Drive 폴더 계층 구조

최종 승인 시 대표님 계정의 Google Drive에 아래 구조로 폴더가 자동 생성되고 파일이 저장됩니다:

```text
내 드라이브/
└── Dear Memory/
    └── Contracts/
        └── 2027/
            └── 2027-04-18_김민우_이서연/
                ├── DM-20270418-XXXX_계약서.pdf
                └── DM-20270418-XXXX_계약서.jpg
```
