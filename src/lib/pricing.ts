import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { DISCOUNTS_CONFIG } from '@/config/discounts';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { PriceCalculationResult, PriceBreakdownItem } from '@/types/contract';

export interface CalculatePriceParams {
  productId: string;
  optionIds?: string[];
  weddingDate?: string;
  partnerDiscount?: boolean;
  partnerName?: string;
  portfolioConsent?: boolean;
  reviewContractCashback?: boolean;
  reviewMainCashback?: boolean;
  manualAdjustment?: {
    amount: number;
    reason: string;
  };
}

/**
 * 예식 날짜가 일요일인지 판별합니다.
 */
export function checkIsSunday(dateString?: string): boolean {
  if (!dateString) return false;
  // 'YYYY-MM-DD' 형태 가정
  const parts = dateString.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return date.getDay() === 0; // 0이 일요일
}

/**
 * 계약 금액 및 혜택 종합 계산 엔진
 * Single Source of Truth for Pricing
 */
export function calculateContractPrice(params: CalculatePriceParams): PriceCalculationResult {
  const {
    productId,
    optionIds = [],
    weddingDate = '',
    partnerDiscount = false,
    portfolioConsent = false,
    reviewContractCashback = false,
    reviewMainCashback = false,
    manualAdjustment,
  } = params;

  const breakdown: PriceBreakdownItem[] = [];

  // 1. 기본 상품 가격
  const product = getProductById(productId) || getProductById('standard')!;
  const basePrice = product.basePrice;
  breakdown.push({
    category: 'base',
    name: product.name,
    amount: basePrice,
    description: product.subtitle,
  });

  // 2. 추가 옵션 가격
  let optionTotal = 0;
  for (const optId of optionIds) {
    const opt = getOptionById(optId);
    if (opt && opt.active) {
      optionTotal += opt.price;
      breakdown.push({
        category: 'option',
        name: opt.name,
        amount: opt.price,
        description: opt.description,
      });
    }
  }

  // 3. 즉시 할인 계산
  let immediateDiscountTotal = 0;

  // 3-1. 일요일 식 할인 (자동 판정)
  const isSunday = checkIsSunday(weddingDate);
  if (isSunday) {
    const sundayDiscountItem = DISCOUNTS_CONFIG.find((d) => d.id === 'sunday');
    const sundayAmount = sundayDiscountItem?.amount ?? 100000;
    immediateDiscountTotal += sundayAmount;
    breakdown.push({
      category: 'immediate_discount',
      name: '일요일 예식 프로모션 할인',
      amount: -sundayAmount,
      description: '일요일 예식 고객 대상 즉시 할인',
    });
  }

  // 3-2. 짝꿍 할인
  if (partnerDiscount) {
    const partnerDiscountItem = DISCOUNTS_CONFIG.find((d) => d.id === 'partner');
    const partnerAmount = partnerDiscountItem?.amount ?? 50000;
    immediateDiscountTotal += partnerAmount;
    breakdown.push({
      category: 'immediate_discount',
      name: '짝꿍 추천 할인',
      amount: -partnerAmount,
      description: '추천인 확인 시 즉시 적용 할인',
    });
  }

  // 3-3. 사진 공개 감사 할인 (포트폴리오 동의)
  if (portfolioConsent) {
    const portfolioDiscountItem = DISCOUNTS_CONFIG.find((d) => d.id === 'portfolio');
    const portfolioAmount = portfolioDiscountItem?.amount ?? 100000;
    immediateDiscountTotal += portfolioAmount;
    breakdown.push({
      category: 'immediate_discount',
      name: '사진 공개 감사 할인 (SNS & 포트폴리오)',
      amount: -portfolioAmount,
      description: '공식 SNS 및 포트폴리오 게재 동의 감사 할인',
    });
  }

  // 4. 대표 수동 조정 금액
  const manualAdjustmentAmount = manualAdjustment?.amount || 0;
  if (manualAdjustmentAmount !== 0) {
    breakdown.push({
      category: 'manual_adjustment',
      name: manualAdjustment?.reason || '대표 수동 금액 조정',
      amount: manualAdjustmentAmount,
      description: manualAdjustment?.reason,
    });
  }

  // 5. 최종 계약 금액 산출
  // 최종 계약금액 = 기본상품 + 옵션 - 즉시할인 + 수동조정
  const contractTotal = Math.max(0, basePrice + optionTotal - immediateDiscountTotal + manualAdjustmentAmount);

  // 계약금 및 잔금
  const depositAmount = CONTRACT_POLICY_CONFIG.defaultDepositAmount;
  const balanceAmount = Math.max(0, contractTotal - depositAmount);

  // 6. 추후 페이백 (현재 계약금액에 절대 혼입되지 않음)
  let futureCashbackTotal = 0;
  if (reviewContractCashback) {
    const reviewContractItem = DISCOUNTS_CONFIG.find((d) => d.id === 'review_contract');
    const amount = reviewContractItem?.amount ?? 50000;
    futureCashbackTotal += amount;
    breakdown.push({
      category: 'future_cashback',
      name: '계약 후기 작성 페이백',
      amount: amount,
      description: '웨딩 커뮤니티 정성 후기 작성 시 페이백 지급',
    });
  }
  if (reviewMainCashback) {
    const reviewMainItem = DISCOUNTS_CONFIG.find((d) => d.id === 'review_main');
    const amount = reviewMainItem?.amount ?? 50000;
    futureCashbackTotal += amount;
    breakdown.push({
      category: 'future_cashback',
      name: '본식 후기 작성 페이백',
      amount: amount,
      description: '본식 촬영 종료 후 후기 작성 시 페이백 지급',
    });
  }

  return {
    basePrice,
    optionTotal,
    immediateDiscountTotal,
    manualAdjustmentAmount,
    contractTotal,
    depositAmount,
    balanceAmount,
    futureCashbackTotal,
    breakdown,
    isSunday,
  };
}

/**
 * 한국 원화 금액 포맷팅 (예: 1,450,000원)
 */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
