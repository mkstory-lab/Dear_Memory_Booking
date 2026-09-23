import React, { useState, useEffect } from 'react';
import { Tag, Gift, Check, Sparkles, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

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
  const [inputCode, setInputCode] = useState(partnerName || '');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(
    partnerDiscount && partnerName ? 'valid' : 'idle'
  );
  const [verifyMessage, setVerifyMessage] = useState(
    partnerDiscount && partnerName ? '유효한 짝꿍 코드입니다. 50,000원 할인이 적용되었습니다.' : ''
  );

  // 외부 partnerName 변경 시 동기화
  useEffect(() => {
    if (partnerName !== inputCode && !inputCode) {
      setInputCode(partnerName);
    }
  }, [partnerName]);

  // 코드 입력 시 검증 상태 리셋 (다시 확인 버튼을 눌러야 적용됨)
  const handleInputChange = (val: string) => {
    setInputCode(val);
    if (verifyStatus !== 'idle') {
      setVerifyStatus('idle');
      setVerifyMessage('');
      onChange({
        partnerDiscount: false,
        partnerName: val,
      });
    } else {
      onChange({ partnerName: val });
    }
  };

  // 짝꿍 코드 검증 요청
  const handleVerifyCode = async () => {
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setVerifyStatus('invalid');
      setVerifyMessage('짝꿍 코드(또는 추천인 성함)를 입력해 주세요.');
      onChange({ partnerDiscount: false, partnerName: '' });
      return;
    }

    setVerifyStatus('checking');
    setVerifyMessage('');

    try {
      const res = await fetch('/api/validate-partner-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (data.valid) {
        setVerifyStatus('valid');
        setVerifyMessage(data.message || '짝꿍 확인 완료! 50,000원 할인이 적용되었습니다.');
        onChange({
          partnerDiscount: true,
          partnerName: trimmed,
        });
      } else {
        setVerifyStatus('invalid');
        setVerifyMessage(data.message || '등록되지 않은 짝꿍 코드입니다. 대표님께 확인 후 다시 입력해 주세요.');
        onChange({
          partnerDiscount: false,
          partnerName: trimmed,
        });
      }
    } catch (err: any) {
      setVerifyStatus('invalid');
      setVerifyMessage('검증 중 오류가 발생했습니다. 다시 시도해 주세요.');
      onChange({
        partnerDiscount: false,
        partnerName: trimmed,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#8F7A56]" />
          <span>5. 할인 및 혜택</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1">
          적용 가능한 즉시 할인 항목과 후기 혜택을 확인해 주세요.
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
              <Sparkles className={`w-4 h-4 shrink-0 ${isSunday ? 'text-[#B09A74]' : 'text-[#C7B698]'}`} />
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

        {/* 1-2. 짝꿍 할인 (체크박스 없이 순수 빈칸 입력 및 사전 등록 코드 검증 방식) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            partnerDiscount
              ? 'bg-[#FFFFFF] border-2 border-[#322A1B] shadow-sm ring-2 ring-[#322A1B]/10'
              : 'bg-[#FFFFFF] border-[#EBE3D5]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#8F7A56] shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-[#322A1B] break-keep flex items-center gap-2">
                <span>짝꿍 할인</span>
                {partnerDiscount ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#322A1B] text-[#FAF8F5] font-semibold">
                    5만원 할인 적용됨
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD1BD] text-[#8F7A56]">
                    코드 입력 시 적용
                  </span>
                )}
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold text-[#B09A74] tabular-nums shrink-0 text-right">
              -50,000원
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2 leading-relaxed break-keep">
            사전에 한민규 대표님께 전달받으신 <strong>짝꿍 코드(또는 추천인 성함)</strong>를 입력 후 [코드 확인]을 눌러주세요.
          </p>

          {/* 짝꿍 코드 입력 빈칸 + 확인 버튼 */}
          <div className="mt-3.5 pt-3.5 border-t border-[#F5F1EA] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="예: 261011김민수 (코드 또는 성함 입력)"
                value={inputCode}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyCode();
                  }
                }}
                className={`flex-1 h-12 px-3.5 bg-[#FAF8F5] border ${
                  verifyStatus === 'valid'
                    ? 'border-emerald-600 bg-emerald-50/20 text-[#322A1B]'
                    : verifyStatus === 'invalid'
                    ? 'border-red-400 bg-red-50/20 text-[#322A1B]'
                    : 'border-[#DDD1BD] focus:border-[#322A1B]'
                } rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/60 font-medium`}
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifyStatus === 'checking'}
                className="h-12 px-4 sm:px-5 bg-[#322A1B] text-[#FAF8F5] hover:bg-[#1E1910] rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {verifyStatus === 'checking' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C7B698]" />
                    <span>확인 중</span>
                  </>
                ) : (
                  <span>코드 확인</span>
                )}
              </button>
            </div>

            {/* 검증 결과 실시간 안내 피드백 */}
            {verifyStatus === 'valid' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-fade-in font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span>{verifyMessage}</span>
              </div>
            )}
            {verifyStatus === 'invalid' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2 animate-fade-in font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{verifyMessage}</span>
              </div>
            )}

            {errors.partnerName && (
              <p className="text-xs text-red-500 font-medium">{errors.partnerName}</p>
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
            웨딩 커뮤니티 또는 개인 블로그에 계약 후기 작성 시 5만원 페이백 (다이렉트웨딩카페는 제외)
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
            본식 촬영 종료 및 최종본 수령 후 커뮤니티/블로그에 후기 작성 시 5만원 페이백
          </p>
        </div>
      </div>
    </div>
  );
};
