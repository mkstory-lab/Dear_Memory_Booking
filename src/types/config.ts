/**
 * Dear Memory 중앙 설정 관련 타입 정의
 */

export interface ProductPlusBenefit {
  title: string;
  detail: string;
  badge?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  subtitle: string;
  basePrice: number;
  description: string;
  includedItems: string[];
  originalCount: string;
  retouchedCount: number;
  albumSpec: string;
  active: boolean;
  displayOrder: number;
  badge?: string;
  isPlusPackage?: boolean;
  baseIncludedNotice?: string;
  plusBenefits?: ProductPlusBenefit[];
}

export interface OptionItem {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  displayOrder: number;
}

export type DiscountType = 'sunday' | 'portfolio' | 'partner' | 'review_contract' | 'review_main';

export interface DiscountItem {
  id: DiscountType;
  name: string;
  amount: number;
  description: string;
  active: boolean;
  isImmediate: boolean; // 즉시 할인 여부 (true: 계약금액 차감, false: 사후 페이백)
  requiresPartnerName?: boolean;
}

export interface PolicySection {
  id: string;
  title: string;
  content: string;
}

export interface ContractPolicyConfig {
  version: string;
  defaultDepositAmount: number;
  imageSpec: string;
  rawFilePolicy: string;
  deliveryTimeline: string;
  backupRetention: string;
  sections: PolicySection[];
  privacyNotice?: string;
}
