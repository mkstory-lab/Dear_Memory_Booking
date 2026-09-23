import { DiscountItem } from '@/types/config';

export const DISCOUNTS_CONFIG: DiscountItem[] = [
  {
    id: 'sunday',
    name: '일요일 예식 프로모션',
    amount: 100000,
    description: '일요일에 예식을 진행하시는 신랑·신부님께 드리는 특별 일정 즉시 할인 혜택입니다.',
    active: true,
    isImmediate: true,
  },
  {
    id: 'partner',
    name: '짝꿍 추천 할인',
    amount: 50000,
    description: '기존 또는 신규 계약자와 짝꿍 추천 시 50,000원 즉시 할인 (짝꿍 성함 확인 필수).',
    active: true,
    isImmediate: true,
    requiresPartnerName: true,
  },
  {
    id: 'portfolio',
    name: '사진 공개 감사 할인 (SNS & 포트폴리오)',
    amount: 100000,
    description: 'Dear Memory 공식 SNS 및 웹사이트에 소중한 본식 사진 게재를 허락해주시는 신랑·신부님께 드리는 감사 할인입니다.',
    active: true,
    isImmediate: true,
  },
  {
    id: 'review_contract',
    name: '계약 후기 작성 혜택',
    amount: 50000,
    description: '웨딩 커뮤니티(다이렉트, 멕마웨 등) 또는 블로그에 정성스러운 계약 후기 작성 시 페이백 지급.',
    active: true,
    isImmediate: false, // 현재 계약금액 미차감, 추후 페이백
  },
  {
    id: 'review_main',
    name: '본식 촬영 후기 혜택',
    amount: 50000,
    description: '예식 종료 후 결과물 수령 후 커뮤니티/블로그에 본식 후기 작성 시 페이백 지급.',
    active: true,
    isImmediate: false, // 현재 계약금액 미차감, 추후 페이백
  },
];

export function getDiscountById(id: string): DiscountItem | undefined {
  return DISCOUNTS_CONFIG.find((d) => d.id === id);
}
