import React from 'react';
import { Tag, Gift, Check, UserCheck } from 'lucide-react';

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
  // 짝꿍 코드/성함 입력 핸들러: 한 글자라도 입력 시 5만원 즉시 자동 차감, 내용 비우면 해제
  const handlePartnerNameChange = (val: string) => {
    const hasValue = val.trim().length > 0;
    onChange({
      partnerName: val,
      partnerDiscount: hasValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#8F7A56]" />
          <span>5. 할인 및 혜택</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1 break-keep leading-relaxed">
          적용 가능한 즉시 할인 항목과 후기 혜택을 <span className="whitespace-nowrap">확인해 주세요.</span>
        </p>
      </div>

      {/* 1. 즉시 적용 할인 그룹 */}
      <div className="space-y-3.5">
        <h4 className="text-xs sm:text-sm font-bold tracking-wider text-[#8F7A56] uppercase">
          즉시 적용 할인 (계약금액 자동 차감)
        </h4>

        {/* 1-1. 일요일 예식 할인 (자동) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isSunday
              ? 'bg-[#FFFFFF] border-2 border-[#322A1B] shadow-sm'
              : 'bg-[#FAF8F5] border-[#EBE3D5] opacity-75'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Tag className={`w-4 h-4 shrink-0 ${isSunday ? 'text-[#B09A74]' : 'text-[#C7B698]'}`} />
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep">
                일요일 예식 할인
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full shrink-0 font-medium ${isSunday ? 'bg-[#322A1B] text-[#FAF8F5]' : 'bg-[#EBE3D5] text-[#8F7A56]'}`}>
                {isSunday ? '자동 적용됨' : '일요일 예식 시 자동'}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#B09A74] tabular-nums shrink-0 text-right">
              -100,000원
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 leading-relaxed break-keep">
            {isSunday
              ? '선택하신 예식일이 일요일이므로 10만원 즉시 할인이 자동 반영되었습니다.'
              : '예식일이 일요일인 경우 10만원 즉시 할인이 자동 적용됩니다.'}
          </p>
        </div>

        {/* 1-2. 짝꿍 할인 (복잡한 검증 없이 입력 즉시 5만원 자동 차감 복원) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            partnerDiscount
              ? 'bg-[#FFFFFF] border-2 border-[#322A1B] shadow-sm ring-2 ring-[#322A1B]/10'
              : 'bg-[#FFFFFF] border-[#EBE3D5]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => {
                  if (partnerDiscount) {
                    onChange({ partnerDiscount: false, partnerName: '' });
                  } else {
                    onChange({ partnerDiscount: true });
                  }
                }}
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                  partnerDiscount
                    ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                    : 'border-[#DDD1BD] bg-white'
                }`}
              >
                {partnerDiscount && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#8F7A56]" />
                <span>짝꿍 할인</span>
                {partnerDiscount ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#322A1B] text-[#FAF8F5] font-semibold">
                    5만원 할인 적용됨
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD1BD] text-[#8F7A56]">
                    입력 시 5만원 자동 차감
                  </span>
                )}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#B09A74] tabular-nums shrink-0 text-right">
              -50,000원
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            아래 빈칸에 <strong>짝꿍 코드(또는 추천인 성함)</strong>를 입력하시면 <strong>50,000원 즉시 할인</strong>이 전체 금액에서 자동 차감됩니다.
          </p>

          {/* 짝꿍 코드/성함 입력 빈칸 (상시 노출) */}
          <div className="mt-3.5 pt-3.5 border-t border-[#F5F1EA] pl-7.5 space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B]">
              짝꿍 코드 (또는 추천인 성함)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="예: 261011김민수 (또는 추천인 성함 입력 시 자동 차감)"
                value={partnerName}
                onChange={(e) => handlePartnerNameChange(e.target.value)}
                className="w-full h-12 px-3.5 bg-[#FAF8F5] border border-[#DDD1BD] focus:border-[#322A1B] rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium"
              />
            </div>
            {errors.partnerName && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.partnerName}</p>
            )}
          </div>
        </div>

        {/* 1-3. 사진 공개 감사 할인 (SNS & 포트폴리오) */}
        <div
          onClick={() => onChange({ portfolioConsent: !portfolioConsent })}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all select-none ${
            portfolioConsent
              ? 'bg-[#FFFFFF] border-2 border-[#322A1B] shadow-sm ring-2 ring-[#322A1B]/10'
              : 'bg-[#FFFFFF] border-[#EBE3D5] hover:border-[#8F7A56]'
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
                {portfolioConsent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep">
                사진 공개 감사 할인 <span className="text-xs sm:text-sm text-[#8F7A56] font-normal">(SNS & 포트폴리오)</span>
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#B09A74] tabular-nums shrink-0 text-right">
              -100,000원
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            Dear Memory 공식 SNS 및 웹사이트에 소중한 본식 사진 게재를 허락해주시는 감사 할인입니다.
          </p>
        </div>
      </div>

      {/* 2. 추후 페이백 그룹 */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold tracking-wider text-[#8F7A56] uppercase">
            추후 페이백 혜택
          </h4>
          <span className="text-xs sm:text-sm text-[#B09A74] font-bold flex items-center gap-1 shrink-0">
            <Gift className="w-4 h-4" />
            <span className="tabular-nums">최대 100,000원 혜택</span>
          </span>
        </div>

        {/* 핵심 공지 문구 */}
        <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border border-[#DDD1BD] rounded-xl text-xs sm:text-sm text-[#6E5C3D] leading-relaxed break-keep space-y-1">
          <p className="font-semibold text-[#322A1B]">
            * 후기 이벤트는 잔금에서 차감 또는 페이백 적용.
          </p>
          <div className="text-xs text-[#8F7A56] space-y-0.5 pt-0.5 font-medium">
            <p>(후기 작성 후 URL 주소 채널톡으로 전달)</p>
            <p>(최소 6개월 글 유지)</p>
          </div>
        </div>

        {/* 2-1. 계약 후기 할인 */}
        <div
          onClick={() => onChange({ reviewContractCashback: !reviewContractCashback })}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all select-none ${
            reviewContractCashback
              ? 'bg-[#FFFFFF] border-2 border-[#B09A74] shadow-sm ring-2 ring-[#B09A74]/15'
              : 'bg-[#FFFFFF] border-[#EBE3D5] hover:border-[#8F7A56]'
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
                {reviewContractCashback && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep">
                계약 후기 할인
              </span>
            </div>
            <span className="text-sm sm:text-base font-bold text-[#6E5C3D] tabular-nums shrink-0 text-right bg-[#F5F1EA] px-2.5 py-0.5 rounded-lg border border-[#DDD1BD]">
              50,000원 할인
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            웨딩 커뮤니티 또는 개인 블로그에 계약 후기 작성 시 5만원 페이백 <span className="whitespace-nowrap">(다이렉트웨딩카페 제외)</span>
          </p>
        </div>

        {/* 2-2. 촬영 후 후기 할인 */}
        <div
          onClick={() => onChange({ reviewMainCashback: !reviewMainCashback })}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all select-none ${
            reviewMainCashback
              ? 'bg-[#FFFFFF] border-2 border-[#B09A74] shadow-sm ring-2 ring-[#B09A74]/15'
              : 'bg-[#FFFFFF] border-[#EBE3D5] hover:border-[#8F7A56]'
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
                {reviewMainCashback && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep">
                촬영 후 후기 할인
              </span>
            </div>
            <span className="text-sm sm:text-base font-bold text-[#6E5C3D] tabular-nums shrink-0 text-right bg-[#F5F1EA] px-2.5 py-0.5 rounded-lg border border-[#DDD1BD]">
              50,000원 할인
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 pl-7.5 leading-relaxed break-keep">
            본식 촬영 종료 및 최종본 수령 후 커뮤니티/블로그에 후기 작성 시 <span className="whitespace-nowrap">5만원 페이백</span>
          </p>
        </div>
      </div>
    </div>
  );
};
