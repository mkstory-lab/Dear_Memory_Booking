import React from 'react';
import { Camera, FileEdit, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface HomeLandingViewProps {
  onSelectCatalog: () => void;
  onSelectApply: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onSelectCatalog,
  onSelectApply,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-14 space-y-5 sm:space-y-10 animate-fade-in">
      {/* 인트로 환영 섹션 */}
      <div className="text-center space-y-3.5">
        <span className="inline-block px-3.5 py-1 bg-[#F5F1EA] text-[#8F7A56] rounded-full text-[11px] font-semibold tracking-[0.2em] uppercase border border-[#EBE3D5]">
          DEAR MEMORY FOR BOOKING
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#322A1B] tracking-tight leading-snug">
          소중한 그날의 시작을 함께합니다
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C3D] leading-relaxed max-w-md mx-auto font-normal">
          상담이 완료된 신랑·신부님을 위한 전용 안내 페이지입니다.<br />
          상품 구성을 확인하시거나 계약정보를 작성해 주세요.
        </p>
      </div>

      {/* 2대 선택 카드: 모바일에서도 한 화면에 좌우 2열(grid-cols-2)로 나란히 표시 */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6 items-stretch">
        
        {/* 카드 1: 계약상품 구경하기 */}
        <div
          onClick={onSelectCatalog}
          className="group cursor-pointer bg-[#FFFFFF] border border-[#EBE3D5] hover:border-[#322A1B] rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden"
        >
          <div className="space-y-2.5 sm:space-y-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#EBE3D5] flex items-center justify-center text-[#8F7A56] group-hover:bg-[#322A1B] group-hover:text-[#FAF8F5] transition-colors">
              <Camera className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase">
                PRODUCTS
              </span>
              <h3 className="text-sm sm:text-xl font-serif font-bold text-[#322A1B] mt-0.5 leading-snug">
                계약상품 구경하기
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6E5C3D] mt-1 sm:mt-2 leading-relaxed break-keep">
                실속형·화보형 구성과 혜택을 한눈에 살펴봅니다.
              </p>
            </div>

            {/* 주요 하이라이트 박스 */}
            <div className="p-2 sm:p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EBE3D5] space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-[#8F7A56]">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep font-medium text-[#322A1B]">실속 125만 / 화보 145만</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep">2인촬영 · 폐백 옵션</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep">일요일·짝꿍 할인</span>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#322A1B] group-hover:text-[#8F7A56] transition-colors">
            <span>상품 보기</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 카드 2: 계약정보 작성하기 */}
        <div
          onClick={onSelectApply}
          className="group cursor-pointer bg-[#FFFFFF] border-2 border-[#322A1B]/80 hover:border-[#322A1B] rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5]"
        >
          {/* 상단 추천 뱃지 */}
          <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4">
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#322A1B] text-[#FAF8F5] rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider flex items-center gap-0.5 sm:gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C7B698]" />
              <span className="hidden sm:inline">상담 완료 고객</span>
              <span className="sm:hidden">추천</span>
            </span>
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center">
              <FileEdit className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[#C7B698]" />
            </div>

            <div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase">
                APPLICATION
              </span>
              <h3 className="text-sm sm:text-xl font-serif font-bold text-[#322A1B] mt-0.5 leading-snug">
                계약정보 작성하기
              </h3>
              <p className="text-[11px] sm:text-xs text-[#6E5C3D] mt-1 sm:mt-2 leading-relaxed break-keep">
                약관을 확인하시고 예식 일정 및 고객 정보를 작성합니다.
              </p>
            </div>

            {/* 안내 배지 박스 */}
            <div className="p-2 sm:p-3.5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl text-[10px] sm:text-xs text-[#8F7A56] space-y-1 sm:space-y-1.5">
              <div className="flex items-center gap-1 font-semibold text-[#322A1B]">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8F7A56] shrink-0" />
                <span>약관 사전 확인</span>
              </div>
              <p className="text-[9.5px] sm:text-[11px] text-[#6E5C3D] leading-tight break-keep">
                약관 동의 &rarr; 정보 입력 &rarr; 대표 확인 후 이메일 발송
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-8 pt-3 sm:pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#322A1B]">
            <span>작성 시작</span>
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center group-hover:bg-[#1E1910] transition-colors">
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
        </div>

      </div>

      {/* 하단 신뢰 안내문 */}
      <div className="text-center text-xs text-[#8F7A56] pt-4 space-y-1">
        <p className="font-medium tracking-wide text-[#6E5C3D]">
          DEAR MEMORY &bull; 웨딩 본식스냅 전문 스튜디오
        </p>
        <p className="text-[11px] text-[#A8987E] leading-relaxed">
          작성해 주신 정보는 안전하게 보호되며 대표 확인 및 계약서 발행 목적으로만 사용됩니다.
        </p>
      </div>
    </div>
  );
};
