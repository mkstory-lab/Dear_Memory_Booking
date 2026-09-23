import React from 'react';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { formatKRW } from '@/lib/pricing';
import { CheckCircle, ArrowLeft, Send } from 'lucide-react';

interface FinalConfirmStepProps {
  formData: ContractFormData;
  pricing: PriceCalculationResult;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const FinalConfirmStep: React.FC<FinalConfirmStepProps> = ({
  formData,
  pricing,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const product = getProductById(formData.productId);
  const selectedOptionItems = formData.optionIds
    .map((id) => getOptionById(id))
    .filter(Boolean);

  const weddingDateFormatted = formData.weddingDate.replace(/-/g, '.');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 타이틀 안내 */}
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#8F7A56]" />
          <span>최종 확인 및 제출</span>
        </h3>
        <p className="text-xs text-[#8F7A56] mt-1">
          작성하신 계약정보를 마지막으로 꼼꼼히 확인해 주세요.
        </p>
      </div>

      {/* 요약 박스 */}
      <div className="bg-[#FFFFFF] border border-[#EBE3D5] rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
        
        {/* 1. 예식 정보 */}
        <div className="space-y-2 pb-4 border-b border-[#F5F1EA]">
          <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
            예식 정보
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#322A1B]">
            <div className="flex items-start">
              <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">예식일시</span>
              <span className="font-semibold text-[#322A1B] flex-1 break-keep">{weddingDateFormatted} {formData.weddingTime}</span>
            </div>
            <div className="flex items-start">
              <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">웨딩홀</span>
              <span className="font-semibold text-[#322A1B] flex-1 break-keep">{formData.weddingVenue} ({formData.weddingHall})</span>
            </div>
            {formData.makeupLocation && (
              <div className="sm:col-span-2 flex items-start">
                <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">메이크업 샵</span>
                <span className="flex-1 break-keep text-[#322A1B]">{formData.makeupLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. 고객 정보 */}
        <div className="space-y-2 pb-4 border-b border-[#F5F1EA]">
          <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
            고객 정보
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#322A1B]">
            <div className="flex flex-col">
              <div className="flex items-start">
                <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">신랑</span>
                <span className="flex-1 break-keep font-medium">{formData.groomName} <span className="text-[#8F7A56] font-normal">({formData.groomPhone})</span></span>
              </div>
              {formData.groomFamilyMembers && (
                <div className="flex items-start mt-1 text-xs text-[#6E5C3D]">
                  <span className="w-20 sm:w-28 shrink-0 text-[#A8987E]">직계 가족</span>
                  <span className="flex-1 break-keep">{formData.groomFamilyMembers}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-start">
                <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">신부</span>
                <span className="flex-1 break-keep font-medium">{formData.brideName} <span className="text-[#8F7A56] font-normal">({formData.bridePhone})</span></span>
              </div>
              {formData.brideFamilyMembers && (
                <div className="flex items-start mt-1 text-xs text-[#6E5C3D]">
                  <span className="w-20 sm:w-28 shrink-0 text-[#A8987E]">직계 가족</span>
                  <span className="flex-1 break-keep">{formData.brideFamilyMembers}</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 flex items-start pt-1">
              <span className="w-20 sm:w-28 shrink-0 text-[#8F7A56] pt-0.5">수신 이메일</span>
              <span className="font-medium text-[#322A1B] flex-1 break-all">{formData.email}</span>
            </div>
          </div>
        </div>

        {/* 3. 상품 및 옵션 */}
        <div className="space-y-2 pb-4 border-b border-[#F5F1EA]">
          <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
            선택 상품 및 추가 옵션
          </h4>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-[#322A1B] break-keep">{product?.name}</span>
              <span className="tabular-nums font-medium shrink-0 text-right">{formatKRW(pricing.basePrice)}</span>
            </div>
            {selectedOptionItems.length > 0 ? (
              selectedOptionItems.map((opt) => (
                <div key={opt!.id} className="flex justify-between items-center text-[#6E5C3D]">
                  <span className="break-keep">+ {opt!.name}</span>
                  <span className="tabular-nums font-medium shrink-0 text-right">+{formatKRW(opt!.price)}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#8F7A56]">추가 옵션 없음</div>
            )}
          </div>
        </div>

        {/* 4. 할인 혜택 */}
        {(pricing.immediateDiscountTotal > 0 || pricing.futureCashbackTotal > 0) && (
          <div className="space-y-2 pb-4 border-b border-[#F5F1EA]">
            <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
              할인 및 혜택 적용
            </h4>
            <div className="space-y-2 text-xs sm:text-sm">
              {pricing.isSunday && (
                <div className="flex justify-between items-start sm:items-center gap-2 text-[#B09A74]">
                  <span className="break-keep">일요일 예식 프로모션 할인</span>
                  <span className="font-semibold tabular-nums shrink-0 text-right">-100,000원</span>
                </div>
              )}
              {formData.partnerDiscount && (
                <div className="flex justify-between items-start sm:items-center gap-2 text-[#B09A74]">
                  <span className="break-keep">짝꿍 추천 할인 ({formData.partnerName})</span>
                  <span className="font-semibold tabular-nums shrink-0 text-right">-50,000원</span>
                </div>
              )}
              {formData.portfolioConsent && (
                <div className="flex justify-between items-start sm:items-center gap-2 text-[#B09A74]">
                  <span className="break-keep">사진 공개 감사 할인 (SNS & 포트폴리오)</span>
                  <span className="font-semibold tabular-nums shrink-0 text-right">-100,000원</span>
                </div>
              )}
              {pricing.futureCashbackTotal > 0 && (
                <div className="mt-2.5 p-3 bg-[#FAF8F5] rounded-xl text-xs flex justify-between items-center text-[#6E5C3D] gap-2">
                  <span className="break-keep">후기 이벤트 (잔금 차감 또는 페이백):</span>
                  <span className="font-bold text-[#322A1B] tabular-nums shrink-0 text-right whitespace-nowrap">최대 {formatKRW(pricing.futureCashbackTotal)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. 요청사항 및 참고정보 */}
        {(formData.shootRequestNotes || formData.retouchRequestNotes || formData.requestNotes || formData.referralSource || formData.instagramId || formData.blogUrl) && (
          <div className="space-y-3 pb-4 border-b border-[#F5F1EA] text-xs">
            <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
              요청사항 및 참고정보
            </h4>
            {formData.shootRequestNotes && (
              <div>
                <span className="font-semibold text-[#8F7A56] block mb-0.5">촬영 시 요청사항</span>
                <p className="text-[#322A1B] whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] p-2.5 rounded-lg border border-[#F0EAE1]">
                  {formData.shootRequestNotes}
                </p>
              </div>
            )}
            {formData.retouchRequestNotes && (
              <div>
                <span className="font-semibold text-[#8F7A56] block mb-0.5">후보정 시 요청사항</span>
                <p className="text-[#322A1B] whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] p-2.5 rounded-lg border border-[#F0EAE1]">
                  {formData.retouchRequestNotes}
                </p>
              </div>
            )}
            {formData.requestNotes && (
              <div>
                <span className="font-semibold text-[#8F7A56] block mb-0.5">기타 요청사항</span>
                <p className="text-[#322A1B] whitespace-pre-wrap leading-relaxed bg-[#FAF8F5] p-2.5 rounded-lg border border-[#F0EAE1]">
                  {formData.requestNotes}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[#6E5C3D]">
              {formData.referralSource && (
                <div>
                  <span className="text-[#8F7A56]">알게 된 경로: </span>
                  <span className="font-medium text-[#322A1B]">{formData.referralSource}</span>
                </div>
              )}
              {(formData.instagramId || formData.blogUrl) && (
                <div>
                  <span className="text-[#8F7A56]">SNS: </span>
                  <span className="font-medium text-[#322A1B]">
                    {[formData.instagramId && `인스타 @${formData.instagramId.replace(/^@/, '')}`, formData.blogUrl && `블로그 ${formData.blogUrl}`].filter(Boolean).join(' / ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. 최종 계약금액 강조 */}
        <div className="p-4 bg-[#FAF8F5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs text-[#8F7A56]">최종 계약 예정금액</span>
            <span className="block text-[11px] text-[#6E5C3D]">
              계약금: {formatKRW(pricing.depositAmount)} | 잔금: {formatKRW(pricing.balanceAmount)}
            </span>
          </div>
          <span className="text-2xl font-serif font-bold text-[#322A1B] tabular-nums whitespace-nowrap shrink-0">
            {formatKRW(pricing.contractTotal)}
          </span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-12 px-5 border border-[#EBE3D5] rounded-xl text-xs sm:text-sm font-medium text-[#6E5C3D] hover:bg-[#FFFFFF] transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>수정하기</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-[#322A1B] text-[#FAF8F5] rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#1E1910] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#FAF8F5] border-t-transparent rounded-full animate-spin" />
              <span>전달 중...</span>
            </div>
          ) : (
            <>
              <span>계약정보 제출하기</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
