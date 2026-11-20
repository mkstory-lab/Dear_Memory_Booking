import React, { useEffect, useRef, useState } from 'react';
import { Tag, Gift, Check, UserCheck } from 'lucide-react';

interface DiscountBenefitSectionProps {
  isSunday: boolean;
  partnerDiscount: boolean;
  partnerName: string;
  referralCode?: string;
  portfolioConsent: boolean;
  reviewContractCashback: boolean;
  reviewMainCashback: boolean;
  onChange: (fields: Partial<{
    partnerDiscount: boolean;
    partnerName: string;
    referralCode: string;
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
  referralCode = '',
  portfolioConsent,
  reviewContractCashback,
  reviewMainCashback,
  onChange,
  errors = {},
}) => {
  const [draft, setDraft] = useState(referralCode);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState('');
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; }, []);
  function editCode(value: string) {
    sequence.current++; setChecking(false); setCodeError(''); setDraft(value.toUpperCase());
    onChange({ partnerDiscount: false, partnerName: '', referralCode: '' });
  }
  async function verifyCode() {
    const request = ++sequence.current;
    setChecking(true); setCodeError('');
    try {
      const code = draft.trim().toUpperCase();
      const response = await fetch('/api/referrals/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const result = await response.json();
      if (request !== sequence.current) return;
      if (!response.ok) throw new Error('지금은 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      if (!result.valid) throw new Error('사용할 수 없는 코드입니다. 코드를 다시 확인해 주세요.');
      setDraft(code); onChange({ partnerDiscount: true, partnerName: code, referralCode: code });
    } catch (error) {
      if (request === sequence.current) { onChange({ partnerDiscount: false, partnerName: '', referralCode: '' }); setCodeError((error as Error).message); }
    } finally { if (request === sequence.current) setChecking(false); }
  }

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

        <div className={`p-4 sm:p-5 rounded-2xl border ${partnerDiscount ? 'border-2 border-[#322A1B] bg-[#FAF8F5]' : 'border-[#EBE3D5] bg-white'}`}>
          <div className="flex justify-between items-center gap-3">
            <h4 className="text-base font-semibold text-[#322A1B] flex items-center gap-2"><UserCheck className="w-4 h-4" />짝꿍 추천 할인</h4>
            <strong className="text-lg text-[#8F7A56] whitespace-nowrap">-50,000원</strong>
          </div>
          <p className="text-sm text-[#6E5C3D] mt-2 leading-relaxed">소개해 주신 분의 짝꿍코드를 확인하면 5만원 할인 예정액이 반영됩니다. 계약금 입금 확인 후 확정됩니다.</p>
          <label htmlFor="referral-code" className="block text-sm font-semibold text-[#322A1B] mt-4 mb-2">짝꿍코드</label>
          <div className="flex gap-2">
            <input id="referral-code" value={draft} onChange={e => editCode(e.target.value)} maxLength={20} autoCapitalize="characters" autoCorrect="off" spellCheck={false} placeholder="DM-A7K9M2Q8" aria-describedby="referral-code-status" className="min-w-0 flex-1 h-12 px-3 bg-white border border-[#DDD1BD] rounded-xl text-base text-[#322A1B]" />
            <button type="button" disabled={checking || !draft.trim()} onClick={() => void verifyCode()} className="px-4 rounded-xl bg-[#322A1B] text-white text-sm font-semibold disabled:opacity-50">{checking ? '확인 중' : '확인'}</button>
          </div>
          <div id="referral-code-status" aria-live="polite" className="text-sm mt-2 leading-relaxed">
            {partnerDiscount && referralCode ? <p className="text-[#3F6547] font-semibold">확인 완료 · 50,000원 할인 예정 <button type="button" onClick={() => editCode('')} className="underline ml-3 text-[#6E5C3D]">해제</button></p> : <p className="text-[#8F7A56]">코드 확인 후 적용됩니다.</p>}
            {(codeError || errors.partnerName) && <p role="alert" className="text-red-600">{codeError || errors.partnerName}</p>}
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
