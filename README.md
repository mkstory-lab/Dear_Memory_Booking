# Dear Memory for Booking (본식스냅 계약 자동화 시스템 V1)

디어메모리(DEAR MEMORY) 대표의 **수작업 계약서 작성 업무(Excel 재입력 &rarr; PDF 변환 &rarr; 메일 수동 발송)**를 완전히 자동화하는 독립 웹 애플리케이션입니다.

---

## 1. V1 핵심 프로세스 (최종 성공 조건)

```text
고객: 접속 시 홈 화면 (/ 또는 /apply)
  ├── 1. [계약상품 구경하기] 선택 시: 실속형/화보형 상세 구성, 옵션, 할인 안내 확인
  └── 2. [계약정보 작성하기] 선택 시:
        ↓
    [약관 확인 및 사전 동의] (계약금, 취소/환불, 위약금, 3중 백업 보관 핵심 규정 동의)
        ↓
    [계약정보 작성] (예식일시/홀명, 고객정보, 상품/옵션, 할인/페이백 입력 및 실시간 금액 확인)
        ↓
    [최종 확인 및 제출]
        ↓
대표 Gmail: 신규 계약정보 알림 도착 (요약 카드 + 보안 승인 링크)
        ↓
대표: 모바일에서 [계약서 확인 및 발송] 클릭 (GET - 1회성 확인 화면만 렌더링, 오발송 방지)
        ↓
Signed Approval Token 기반 내용 확인 (필요 시 기본정보/상품/옵션/할인 수정 & 자동 재계산)
        ↓
[최종 계약서 발송] 클릭 (POST)
        ↓
시스템 자동 처리:
  • 계약 식별번호 발급 (DM-YYYYMMDD-XXXX)
  • 한글 폰트 무결성 A4 브랜드 PDF 계약서 생성
  • 고객 이메일 발송 (PDF 첨부)
  • 대표 이메일 발송 (동일 PDF 첨부)
  • 중복 발송 방지 (Idempotency)
```

---

## 2. 버전별 로드맵

- **V1 (현재 릴리즈)**
  - 고객 모바일 친화적 Step Form (예식/고객/상품/옵션/할인/약관/최종확인)
  - 일요일 예식 자동 감지 및 즉시 할인 엔진
  - 대표 Gmail HTML 알림 및 암호화 서명 보안 토큰 (URL 평문 노출 금지, GET 발송 차단)
  - 대표 Review Page (내용 수정 및 원클릭 발송)
  - A4 규격 프리미엄 브랜드 PDF 계약서 자동 생성 (한글 폰트 무결성 보장)
  - 고객 및 대표 이메일 자동 발송
  - 중복 발송 차단 레지스트리
  - 전체 시뮬레이션 데모 샌드박스 메일함
- **V1.1 (후속 예정)**
  - Google Drive 최종 계약서 자동 저장 (폴더 계층 자동 생성)
  - JPG 계약서 동시 생성 및 다운로드
- **V1.2 (후속 예정)**
  - 대표 수동 금액 조정 (manualAdjustment)
  - 금액 조정 사유 기록 및 계약서 명시

---

## 3. 시작하기

### 설치 및 로컬 서버 구동
```powershell
# 의존성 설치 (Windows PowerShell: npm.cmd)
npm.cmd install

# 개발 서버 실행 (포트: 3000)
npm.cmd run dev

# 프로덕션 빌드
npm.cmd run build

# V1 인수 테스트(Acceptance Tests) 15개 시나리오 전수 검증
npm.cmd run test:acceptance
```

---

## 4. 환경 변수 (.env.local)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_SECRET=dear-memory-secret-key-2026-contract-hmac
GAS_WEBAPP_URL=  # 빈칸일 경우 MockBackendAdapter(데모 모드) 동작
DEAR_MEMORY_REP_EMAIL=contact@dearmemory.kr
DEAR_MEMORY_REP_PHONE=010-4822-2615
```


## 계약서 PDF 안정화 (운영 반영 전 검토 필수)

- 계약서 본문은 A4 1페이지, 약관은 A4 1페이지로 유지합니다. 옵션과 할인 내역이 많은 경우 첫 페이지의 표 간격 및 여백을 조정해 한 장에 담고, 길이가 더욱 늘면 가독성을 유지할 수 있는 범위에서만 축소합니다. 과도한 내용은 잘라내지 않고 PDF 생성 오류를 표시합니다.
- 정산 명세서 각 행의 글씨와 구분선 간격을 확보하고, 계약서 서명란 위에 몰리던 빈 공간을 분산했습니다. 상품명 검정 배지와 회색 상태 배지는 실제 렌더링 이미지에서 한글 글씨가 시각적으로 중앙에 위치하도록 보정했습니다.
- 화보형 PDF의 앨범 사양은 부부앨범 뒤에 부모님앨범을 이어 붙여 하나의 줄에 표기합니다. `ContractDocument`에서 개행을 구분자(`/`)로 변환하므로 상품 설정값의 원본 정보는 변경되지 않습니다. PDF 이미지 렌더링으로 줄바꿈 없음, 상품명 검정 배지 시각적 중앙 및 2페이지 유지 검증 완료.
- 상품 구성: 실속형 보정 70장 / 원본 2,000장 이상, 화보형 보정 80장 / 원본 3,000장 이상. 앨범 70p/80p와 사진 보정 장수는 별개입니다.
- 입금 계좌는 아래 NEXT_PUBLIC_ 환경변수를 세 개 모두 설정했을 때만 PDF에 표시합니다. 하나라도 빠지면 별도 확인 안내가 표시됩니다.
  - NEXT_PUBLIC_DEAR_MEMORY_BANK_NAME: 은행명
  - NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_NUMBER: 계좌번호
  - NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_HOLDER: 예금주
- 이 값들은 고객에게 보여주는 공개 정보입니다. 정확한 계좌를 확인한 뒤 배포 환경에서 설정하고 재빌드해야 반영됩니다.
- 테스트 명령: npm run test:pdf-config / npm run test:acceptance / npx tsc --noEmit
- 실제 운영 서비스 배포와 데이터 변경은 별도 승인 후 진행합니다.
