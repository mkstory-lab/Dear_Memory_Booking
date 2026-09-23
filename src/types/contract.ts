/**
 * Dear Memory 계약 데이터 및 가격 스냅샷 타입 정의
 */

export interface ContractFormData {
  // 예식 및 메이크업 정보
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:mm
  weddingVenue: string; // 웨딩홀
  weddingHall: string; // 홀명 (예: 그랜드볼룸)
  makeupLocation?: string; // 메이크업 장소 / in, out 시간 (예: 정샘물 웨스트 / in 07:00, out 10:00)

  // 고객 및 가족 정보
  groomName: string; // 신랑 성명
  groomPhone: string; // 신랑 연락처
  brideName: string; // 신부 성명
  bridePhone: string; // 신부 연락처
  email: string; // 계약서 수신 이메일
  groomFamilyMembers?: string; // 신랑님 직계 가족 구성원 (예: 부모님, 형, 남동생)
  brideFamilyMembers?: string; // 신부님 직계 가족 구성원 (예: 부모님, 언니)

  // 상품 및 옵션
  productId: string; // 'standard' | 'album_plus'
  optionIds: string[]; // ['makeup_scene', 'second_shooter', 'pyebaek']

  // 할인 및 혜택
  partnerDiscount: boolean; // 짝꿍 할인 (즉시 -50,000원)
  partnerName: string; // 짝꿍 성함/예식일 (필수)
  sundayDiscount: boolean; // 일요일 식 할인 (즉시 -100,000원, 자동)
  portfolioConsent: boolean; // 사진 공개 감사 할인 (즉시 -100,000원)
  reviewContractCashback: boolean; // 계약 후기 작성 페이백 (추후 50,000원)
  reviewMainCashback: boolean; // 본식 후기 작성 페이백 (추후 50,000원)

  // 요청사항 및 사후 확인
  shootRequestNotes?: string; // 본식스냅 촬영 시 요청사항 (자세히)
  retouchRequestNotes?: string; // 후보정 시 요청사항 (자세히)
  requestNotes: string; // 기타 요청사항
  referralSource?: string; // 알게 된 경로 (블로그 후기, 카페 후기, 인스타그램, 지인소개, 기타)
  instagramId?: string; // 인스타그램 아이디 (후기 할인 등 확인용)
  blogUrl?: string; // 블로그 주소 (후기 할인 등 확인용)

  // 약관 동의
  termsAgreed: boolean; // 필수 약관 및 개인정보 수집이용 동의

  // 대표 수동 조정 (선택적)
  manualAdjustment?: {
    amount: number; // 음수/양수 가능 (예: -50000)
    reason: string; // 사유 (예: '프로모션 추가 할인')
  };
}

export interface PriceBreakdownItem {
  category: 'base' | 'option' | 'immediate_discount' | 'manual_adjustment' | 'future_cashback';
  name: string;
  amount: number;
  description?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  optionTotal: number;
  immediateDiscountTotal: number;
  manualAdjustmentAmount: number;
  contractTotal: number; // 최종 계약금액 = basePrice + optionTotal - immediateDiscountTotal + manualAdjustmentAmount
  depositAmount: number; // 계약금 (기본 300,000원)
  balanceAmount: number; // 잔금 = contractTotal - depositAmount
  futureCashbackTotal: number; // 추후 페이백 총액 (계약 후기 + 본식 후기)
  breakdown: PriceBreakdownItem[];
  isSunday: boolean;
}

export interface ContractSnapshot {
  contractNumber: string; // 'DM-YYYYMMDD-XXXX'
  id: string; // 고유 ID
  data: ContractFormData;
  pricing: PriceCalculationResult;
  termsVersion: string;
  policyNotes?: string;
  generatedAt: string; // ISO 8601
  approvedAt?: string;
  sentAt?: string;
  status: 'submitted' | 'approved' | 'sent';
}

export interface ApprovalPayload {
  contractId: string;
  data: ContractFormData;
  generatedAt: string;
  exp: number; // 만료 타임스탬프
}
