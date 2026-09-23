import React from 'react';
import { Tag, Gift, Check, Sparkles } from 'lucide-react';
import { formatKRW } from '@/lib/pricing';

interface DiscountBenefitSectionProps {
  isSunday: boolean;
  partnerDiscount: boolean;
  partnerName: string;
  portfolioConsent: boolean;
  reviewContractCashback: boolean;
  reviewMainCashback: boolean;
  onChange: (fields: Partial<{
    partnerDiscount: boolean;
    partnerName: string;
    portfolioConsent: boolean;
    reviewContractCashback: boolean;
    reviewMainCashback: boolean;
  }>) => void;
  errors?: Record<string, string>;
}

export const DiscountBenefitSection: React.FC<DiscountBenefitSectionProps> = ({
  isSunday,
  partnerDiscount,
  partnerName,
  portfolioConsent,
  reviewContractCashback,
  reviewMainCashback,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#8F7A56]" />
          <span>5. 할인 및 혜택</span>
        </h3>
        <p className="text-xs text-[#8F7A56] mt-1">
          적용 가능한 즉시 할인 항목과 추후 후기 페이백 혜택을 확인해 주세요.
        </p>
      </div>

      {/* 1. 즉시 할인 그룹 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
          즉시 적용 할인 (계약금액 차감)
        </h4>

        {/* 1-1. 일요일 예식 할인 (자동) */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            isSunday
              ? 'bg-[#FFFFFF] border-[#322A1B] shadow-sm'
              : 'bg-[#FAF8F5] border-[#EBE3D5] opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Sparkles className={`w-4 h-4 shrink-0 ${isSunday ? 'text-[#B09A74]' : 'text-[#C7B698]'}`} />
              <span className="text-sm font-semibold text-[#322A1B] break-keep">일요일 예식 할인</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${isSunday ? 'bg-[#322A1B] text-[#FAF8F5]' : 'bg-[#EBE3D5] text-[#8F7A56]'}`}>
                {isSunday ? '자동 적용됨' : '일요일 예식 시 자동'}
              </span>
            </div>
            <span className="text-sm font-bold text-[#B09A74] tabular-nums shrink-0 text-right">-100,000원</span>
          </div>
          <p className="text-xs text-[#8F7A56] mt-1.5 leading-relaxed break-keep">
            {isSunday
              ? '선택하신 예식일이 일요일이므로 10만원 즉시 할인이 자동 반영되었습니다.'
              : '예식일이 일요일인 경우 10만원 즉시 할인이 자동 적용됩니다.'}
          </p>
        </div>

        {/* 1-2. 짝꿍 할인 */}
        <div
          onClick={() => onChange({ partnerDiscount: !partnerDiscount })}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            partnerDiscount
              ? 'bg-[#FFFFFF] border-[#322A1B] shadow-sm ring-1 ring-[#322A1B]/10'
              : 'bg-[#FFFFFF]/70 border-[#EBE3D5] hover:border-[#C7B698]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                  partnerDiscount
                    ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                    : 'border-[#DDD1BD] bg-white'
                }`}
              >
                {partnerDiscount && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold text-[#322A1B] break-keep">짝꿍 추천 할인</span>
            </div>
            <span className="text-sm font-bold text-[#B09A74] tabular-nums shrink-0 text-right">-50,000원</span>
          </div>
          <p className="text-xs text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            디어메모리 기존 또는 신규 계약자와 상호 추천 시 5만원 즉시 할인이 적용됩니다.
          </p>

          {/* 짝꿍 성함 입력 필드 (체크 시 필수 노출) */}
          {partnerDiscount && (
            <div
              className="mt-3.5 pt-3.5 border-t border-[#F5F1EA] pl-7.5"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
                추천인(짝꿍) 성함 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 박지민 (또는 추천인 성함/예식일)"
                value={partnerName}
                onChange={(e) => onChange({ partnerName: e.target.value })}
                className={`w-full h-11 px-3.5 bg-[#FAF8F5] border ${
                  errors.partnerName ? 'border-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
                } rounded-xl text-xs sm:text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all`}
              />
              {errors.partnerName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.partnerName}</p>
              )}
            </div>
          )}
        </div>

        {/* 1-3. 사진 공개 감사 할인 (SNS & 포트폴리오) */}
        <div
          onClick={() => onChange({ portfolioConsent: !portfolioConsent })}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            portfolioConsent
              ? 'bg-[#FFFFFF] border-[#322A1B] shadow-sm ring-1 ring-[#322A1B]/10'
              : 'bg-[#FFFFFF]/70 border-[#EBE3D5] hover:border-[#C7B698]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                  portfolioConsent
                    ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                    : 'border-[#DDD1BD] bg-white'
                }`}
              >
                {portfolioConsent && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold text-[#322A1B] break-keep">
                사진 공개 감사 할인 <span className="text-xs text-[#8F7A56] font-normal inline-block">(SNS & 포트폴리오)</span>
              </span>
            </div>
            <span className="text-sm font-bold text-[#B09A74] tabular-nums shrink-0 text-right">-100,000원</span>
          </div>
          <p className="text-xs text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            Dear Memory 공식 SNS 및 웹사이트에 소중한 본식 사진 게재를 허락해주시는 감사 할인입니다.
          </p>
        </div>
      </div>

      {/* 2. 추후 페이백 그룹 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
            추후 페이백 혜택 (계약금액 미차감 / 사후 지급)
          </h4>
          <span className="text-[11px] text-[#B09A74] font-medium flex items-center gap-1 shrink-0">
            <Gift className="w-3.5 h-3.5" />
            <span className="tabular-nums">최대 100,000원</span>
          </span>
        </div>

        <div className="p-3 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl text-xs text-[#8F7A56] leading-relaxed break-keep">
          * 후기 작성 혜택은 현재 계약서 금액에서 바로 차감되지 않으며, 후기 작성 후 대표 확인을 거쳐 계좌로 페이백됩니다.
        </div>

        {/* 2-1. 계약 후기 작성 */}
        <div
          onClick={() => onChange({ reviewContractCashback: !reviewContractCashback })}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            reviewContractCashback
              ? 'bg-[#FFFFFF] border-[#B09A74] shadow-sm ring-1 ring-[#B09A74]/20'
              : 'bg-[#FFFFFF]/70 border-[#EBE3D5] hover:border-[#C7B698]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                  reviewContractCashback
                    ? 'bg-[#B09A74] border-[#B09A74] text-[#FAF8F5]'
                    : 'border-[#DDD1BD] bg-white'
                }`}
              >
                {reviewContractCashback && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold text-[#322A1B] break-keep">계약 후기 작성 혜택</span>
            </div>
            <span className="text-sm font-semibold text-[#6E5C3D] tabular-nums shrink-0 text-right">50,000원 페이백</span>
          </div>
          <p className="text-xs text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            웨딩 커뮤니티(다이렉트, 멕마웨 등) 또는 개인 블로그에 계약 후기 작성 시 5만원 페이백
          </p>
        </div>

        {/* 2-2. 본식 후기 작성 */}
        <div
          onClick={() => onChange({ reviewMainCashback: !reviewMainCashback })}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            reviewMainCashback
              ? 'bg-[#FFFFFF] border-[#B09A74] shadow-sm ring-1 ring-[#B09A74]/20'
              : 'bg-[#FFFFFF]/70 border-[#EBE3D5] hover:border-[#C7B698]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                  reviewMainCashback
                    ? 'bg-[#B09A74] border-[#B09A74] text-[#FAF8F5]'
                    : 'border-[#DDD1BD] bg-white'
                }`}
              >
                {reviewMainCashback && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold text-[#322A1B] break-keep">본식 후기 작성 혜택</span>
            </div>
            <span className="text-sm font-semibold text-[#6E5C3D] tabular-nums shrink-0 text-right">50,000원 페이백</span>
          </div>
          <p className="text-xs text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            본식 촬영 종료 및 최종본 수령 후 커뮤니티/블로그에 후기 작성 시 5만원 페이백
          </p>
        </div>
      </div>
    </div>
  );
};
