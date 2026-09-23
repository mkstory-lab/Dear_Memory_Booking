import React from 'react';
import { PriceCalculationResult } from '@/types/contract';
import { formatKRW } from '@/lib/pricing';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface PriceSummaryStickyProps {
  pricing: PriceCalculationResult;
  onProceed?: () => void;
  proceedLabel?: string;
  isSubmitting?: boolean;
}

export const PriceSummarySticky: React.FC<PriceSummaryStickyProps> = ({
  pricing,
  onProceed,
  proceedLabel = '최종 확인 및 제출',
  isSubmitting = false,
}) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <>
      {/* 1. 데스크톱용 카드 (또는 인라인) */}
      <div className="bg-[#FFFFFF] border border-[#EBE3D5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase pb-3 border-b border-[#F5F1EA]">
          실시간 계약금액 요약
        </h4>

        {/* 내역 테이블 */}
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-[#6E5C3D]">
            <span className="shrink-0">기본 상품</span>
            <span className="font-medium text-[#322A1B] tabular-nums whitespace-nowrap">{formatKRW(pricing.basePrice)}</span>
          </div>

          {pricing.optionTotal > 0 && (
            <div className="flex justify-between items-center text-[#6E5C3D]">
              <span className="shrink-0">추가 옵션</span>
              <span className="font-medium text-[#322A1B] tabular-nums whitespace-nowrap">+{formatKRW(pricing.optionTotal)}</span>
            </div>
          )}

          {pricing.immediateDiscountTotal > 0 && (
            <div className="flex justify-between items-center text-[#B09A74]">
              <span className="shrink-0">즉시 할인 적용</span>
              <span className="font-semibold text-[#B09A74] tabular-nums whitespace-nowrap">-{formatKRW(pricing.immediateDiscountTotal)}</span>
            </div>
          )}

          {pricing.manualAdjustmentAmount !== 0 && (
            <div className="flex justify-between items-center text-[#6E5C3D]">
              <span className="shrink-0">대표 수동 조정</span>
              <span className="font-medium text-[#322A1B] tabular-nums whitespace-nowrap">
                {pricing.manualAdjustmentAmount > 0 ? '+' : ''}
                {formatKRW(pricing.manualAdjustmentAmount)}
              </span>
            </div>
          )}

          {/* 최종 확정 계약금액 */}
          <div className="pt-3.5 border-t-2 border-[#322A1B]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#322A1B]">최종 계약금액</span>
              <span className="text-[11px] text-[#8F7A56]">VAT 포함 &bull; 촬영+원판</span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#322A1B] tabular-nums tracking-tight whitespace-nowrap inline-block">
                {formatKRW(pricing.contractTotal)}
              </span>
            </div>
          </div>

          {/* 입금 단계 안내 */}
          <div className="mt-3 p-3 bg-[#FAF8F5] rounded-xl text-xs space-y-1 text-[#6E5C3D]">
            <div className="flex justify-between items-center">
              <span className="shrink-0">계약금 (신청 시)</span>
              <span className="font-medium tabular-nums whitespace-nowrap">{formatKRW(pricing.depositAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="shrink-0">잔금 (예식 1주 전)</span>
              <span className="font-medium tabular-nums whitespace-nowrap">{formatKRW(pricing.balanceAmount)}</span>
            </div>
          </div>

          {/* 추후 페이백 별도 표기 */}
          {pricing.futureCashbackTotal > 0 && (
            <div className="p-3 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-[#8F7A56]">
                <span className="font-medium whitespace-nowrap">후기 작성 페이백 예정</span>
                <span className="text-[10px] text-[#A8987E] whitespace-nowrap">추후 지급</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#322A1B] tabular-nums whitespace-nowrap">
                  최대 {formatKRW(pricing.futureCashbackTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {onProceed && (
          <button
            type="button"
            onClick={onProceed}
            disabled={isSubmitting}
            className="w-full h-12 mt-2 bg-[#322A1B] text-[#FAF8F5] rounded-xl text-sm font-medium hover:bg-[#1E1910] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span>{isSubmitting ? '처리 중...' : proceedLabel}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. 모바일 전용 하단 고정 바 */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#EBE3D5] shadow-lg p-3">
        {/* 아코디언 상세 내역 */}
        {isMobileOpen && (
          <div className="p-3 mb-3 bg-[#FAF8F5] rounded-xl text-xs space-y-1.5 border border-[#EBE3D5] animate-fade-in">
            <div className="flex justify-between text-[#6E5C3D]">
              <span>기본 상품</span>
              <span className="tabular-nums">{formatKRW(pricing.basePrice)}</span>
            </div>
            {pricing.optionTotal > 0 && (
              <div className="flex justify-between text-[#6E5C3D]">
                <span>추가 옵션</span>
                <span className="tabular-nums">+{formatKRW(pricing.optionTotal)}</span>
              </div>
            )}
            {pricing.immediateDiscountTotal > 0 && (
              <div className="flex justify-between text-[#B09A74] font-medium">
                <span>즉시 할인</span>
                <span className="tabular-nums">-{formatKRW(pricing.immediateDiscountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#8F7A56] pt-1 border-t border-[#EBE3D5]">
              <span>계약금 / 잔금</span>
              <span className="tabular-nums">{formatKRW(pricing.depositAmount)} / {formatKRW(pricing.balanceAmount)}</span>
            </div>
            {pricing.futureCashbackTotal > 0 && (
              <div className="flex justify-between text-[#8F7A56]">
                <span>후기 페이백 예정</span>
                <span className="tabular-nums">최대 {formatKRW(pricing.futureCashbackTotal)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="cursor-pointer flex flex-col"
          >
            <div className="flex items-center gap-1 text-[11px] text-[#8F7A56]">
              <span>예상 계약금액</span>
              {isMobileOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </div>
            <span className="text-lg font-serif font-bold text-[#322A1B] tabular-nums whitespace-nowrap">
              {formatKRW(pricing.contractTotal)}
            </span>
          </div>

          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              disabled={isSubmitting}
              className="flex-1 max-w-[200px] h-11 bg-[#322A1B] text-[#FAF8F5] rounded-xl text-xs font-medium hover:bg-[#1E1910] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? '처리 중...' : proceedLabel}</span>
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
