import React, { useState } from 'react';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { ShieldCheck, ArrowLeft, ArrowRight, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TermsAgreementStepProps {
  termsAgreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
  onProceed: () => void;
  onBackToHome: () => void;
}

export const TermsAgreementStep: React.FC<TermsAgreementStepProps> = ({
  termsAgreed,
  onAgreeChange,
  onProceed,
  onBackToHome,
}) => {
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const handleNext = () => {
    if (!termsAgreed) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    onProceed();
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6E5C3D] hover:text-[#322A1B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>홈으로 돌아가기</span>
        </button>
        <span className="text-xs text-[#8F7A56] font-medium">
          Step 1 of 3 &bull; 약관 확인 및 사전 동의
        </span>
      </div>

      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#DDD1BD] flex items-center justify-center mx-auto text-[#8F7A56] mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#322A1B]">
          계약 약관 및 운영 정책 동의
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C3D] max-w-md mx-auto leading-relaxed">
          디어메모리는 상호 신뢰를 바탕으로 투명하고 안전한 촬영 계약을 체결합니다.<br className="hidden sm:inline" />
          계약정보 작성에 앞서 주요 정책을 먼저 확인해 주세요.
        </p>
      </div>

      {/* 1. 핵심 규정 요약 카드 */}
      <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F5F1EA] pb-3">
          <h3 className="font-semibold text-sm sm:text-base text-[#322A1B]">
            핵심 계약 규정 요약
          </h3>
          <span className="text-xs text-[#8F7A56]">
            버전: {CONTRACT_POLICY_CONFIG.version}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-stretch">
          {/* 계약금 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-1.5 flex flex-col justify-start">
            <span className="font-bold text-[#322A1B] text-[13px] block">
              1. 계약금 및 입금 기한
            </span>
            <p className="text-[#6E5C3D] leading-relaxed break-keep">
              계약금은 <strong>30만원</strong> 입금을 원칙으로 하며, 계약 신청서 제출 이후 <strong>24시간 이내</strong> 입금 시 스케줄이 최종 확정됩니다.
            </p>
          </div>

          {/* 환불/취소 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-1.5 flex flex-col justify-start">
            <span className="font-bold text-[#322A1B] text-[13px] block">
              2. 환불 규정 (72시간 안심)
            </span>
            <p className="text-[#6E5C3D] leading-relaxed break-keep">
              계약금 입금 후 <strong>72시간 이내</strong> 취소 요청 시 계약금 전액을 환불해 드립니다. 단, 72시간 경과 후에는 일정 마감에 따라 환불이 불가합니다.
            </p>
          </div>

          {/* 데이터 보관 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-1.5 flex flex-col justify-start">
            <span className="font-bold text-[#322A1B] text-[13px] block">
              3. 원본 3중 백업 및 보관
            </span>
            <p className="text-[#6E5C3D] leading-relaxed break-keep">
              촬영 데이터는 3중 백업으로 안전하게 관리되며, 원본은 완성본 전달일 기준 <strong>1개월간 보관</strong>되므로 수령 즉시 개인 백업을 권장합니다.
            </p>
          </div>

          {/* 제공 사양 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-1.5 flex flex-col justify-start">
            <span className="font-bold text-[#322A1B] text-[13px] block">
              4. 결과물 사양 및 납품
            </span>
            <p className="text-[#6E5C3D] leading-relaxed break-keep">
              웹용 고화질 원본 전체 및 정밀 보정본은 JPG 파일(장축 3,000픽셀)로 이메일 제공되며, 앨범 수령 후 1주일 이내 수정 요청이 가능합니다.
            </p>
          </div>
        </div>

        {/* 위약금 단계 안내 */}
        <div className="p-4 bg-[#FAF8F5]/60 rounded-2xl border border-[#EBE3D5] text-xs space-y-1 text-[#6E5C3D]">
          <strong className="text-[#322A1B] block">촬영 취소 시 위약금 규정:</strong>
          <p className="break-keep">&bull; 촬영 확정일 90일 이전: 계약금을 위약금으로 갈음</p>
          <p className="break-keep">&bull; 촬영 60~90일 내: 총 상품 금액의 50% | 30~60일 내: 70% | 30일 내: 80%</p>
        </div>

        {/* 약관 12개 조항 전문 토글 아코디언 */}
        <div className="pt-2 border-t border-[#F5F1EA]">
          <button
            type="button"
            onClick={() => setShowAllArticles(!showAllArticles)}
            className="w-full py-2.5 flex items-center justify-between text-xs font-semibold text-[#8F7A56] hover:text-[#322A1B] transition-colors"
          >
            <span>약관 전문 (제1조 ~ 제12조) 전체 펼쳐보기</span>
            {showAllArticles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAllArticles && (
            <div className="mt-3 p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] max-h-72 overflow-y-auto space-y-4 text-xs text-[#4E412A] leading-relaxed animate-fade-in">
              {CONTRACT_POLICY_CONFIG.sections.map((sec) => (
                <div key={sec.id} className="pb-3 border-b border-[#EBE3D5] last:border-none">
                  <h4 className="font-semibold text-[#322A1B] mb-1">{sec.title}</h4>
                  <p className="whitespace-pre-line text-[#6E5C3D] break-keep">{sec.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 필수 동의 체크박스 및 다음 버튼 */}
      <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div
          onClick={() => {
            onAgreeChange(!termsAgreed);
            if (!termsAgreed) setShowValidationError(false);
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
            termsAgreed
              ? 'bg-[#FFFFFF] border-[#322A1B] ring-1 ring-[#322A1B]/20 shadow-sm'
              : 'bg-[#FAF8F5] border-[#DDD1BD] hover:border-[#C7B698]'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
              termsAgreed
                ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                : 'border-[#DDD1BD] bg-[#FFFFFF]'
            }`}
          >
            {termsAgreed && <Check className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <span className="text-xs sm:text-sm font-semibold text-[#322A1B] break-keep leading-relaxed">
              본식스냅 계약 약관 및 운영 정책의 내용을 모두 확인하였으며 이에 동의합니다.
            </span>
            <span className="text-red-500 font-bold ml-1 shrink-0">* [필수]</span>
          </div>
        </div>

        {showValidationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>계약정보 작성을 진행하시려면 필수 약관 동의에 체크해 주셔야 합니다.</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-14 bg-[#322A1B] text-[#FAF8F5] rounded-2xl text-sm sm:text-base font-semibold hover:bg-[#1E1910] transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <span>동의하고 계약정보 작성 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
