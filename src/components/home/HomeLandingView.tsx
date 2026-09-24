import React from 'react';
import { Camera, FileEdit, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { DEAR_MEMORY_LOGO_BASE64 } from '@/assets/images';

interface HomeLandingViewProps {
  onSelectCatalog: () => void;
  onSelectApply: () => void;
}

export const HomeLandingView: React.FC<HomeLandingViewProps> = ({
  onSelectCatalog,
  onSelectApply,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-5 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in">
      {/* 2대 선택 카드: 모바일에서도 한 화면에 좌우 2열(grid-cols-2)로 나란히 표시 */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6 items-stretch">
        
        {/* 카드 1: 계약상품 구경하기 */}
        <div
          onClick={onSelectCatalog}
          className="group cursor-pointer bg-[#FFFFFF] border border-[#EBE3D5] hover:border-[#322A1B] rounded-2xl sm:rounded-3xl p-3 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden"
        >
          <div className="space-y-2 sm:space-y-3.5 flex-1 flex flex-col">
            {/* 아이콘 */}
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#EBE3D5] flex items-center justify-center text-[#8F7A56] group-hover:bg-[#322A1B] group-hover:text-[#FAF8F5] transition-colors shrink-0">
              <Camera className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            {/* 헤더 & 제목 */}
            <div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase h-4 flex items-center">
                PRODUCTS
              </span>
              <h3 className="text-xs sm:text-xl font-serif font-bold text-[#322A1B] h-6 sm:h-8 flex items-center leading-tight">
                계약상품 구경하기
              </h3>
              <p className="text-[10px] sm:text-xs text-[#6E5C3D] leading-tight break-keep h-7 sm:h-9 flex items-center">
                실속형·화보형 구성과 혜택을 한눈에 살펴봅니다.
              </p>
            </div>

            {/* 주요 하이라이트 박스 (높이 완벽 일치) */}
            <div className="p-2 sm:p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EBE3D5] space-y-1 sm:space-y-1.5 text-[9.5px] sm:text-xs text-[#8F7A56] h-[78px] sm:h-[98px] flex flex-col justify-center">
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="font-semibold text-[#322A1B] truncate">실속 125만 / 화보 145만</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="truncate">2인촬영 · 폐백 옵션</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="truncate">일요일·짝꿍 할인</span>
              </div>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-[10.5px] sm:text-xs font-semibold text-[#322A1B] group-hover:text-[#8F7A56] transition-colors h-7 sm:h-8">
            <span>상품 보기</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 카드 2: 계약정보 작성하기 */}
        <div
          onClick={onSelectApply}
          className="group cursor-pointer bg-[#FFFFFF] border-2 border-[#322A1B]/80 hover:border-[#322A1B] rounded-2xl sm:rounded-3xl p-3 sm:p-7 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5]"
        >
          {/* 상단 추천 뱃지 */}
          <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#322A1B] text-[#FAF8F5] rounded-full text-[8.5px] sm:text-[10px] font-semibold tracking-wider flex items-center">
              <span className="hidden sm:inline">상담 완료 고객</span>
              <span className="sm:hidden">추천</span>
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3.5 flex-1 flex flex-col">
            {/* 아이콘 */}
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center shrink-0">
              <FileEdit className="w-4 h-4 sm:w-6 sm:h-6 text-[#C7B698]" />
            </div>

            {/* 헤더 & 제목 */}
            <div>
              <span className="text-[9px] sm:text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase h-4 flex items-center">
                APPLICATION
              </span>
              <h3 className="text-xs sm:text-xl font-serif font-bold text-[#322A1B] h-6 sm:h-8 flex items-center leading-tight">
                계약정보 작성하기
              </h3>
              <p className="text-[10px] sm:text-xs text-[#6E5C3D] leading-tight break-keep h-7 sm:h-9 flex items-center">
                약관을 확인하시고 예식 정보 및 일정을 작성합니다.
              </p>
            </div>

            {/* 안내 배지 박스 (높이 완벽 일치 & 3줄 정렬) */}
            <div className="p-2 sm:p-3.5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl space-y-1 sm:space-y-1.5 text-[9.5px] sm:text-xs text-[#8F7A56] h-[78px] sm:h-[98px] flex flex-col justify-center">
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="font-semibold text-[#322A1B] truncate">1. 약관 사전 확인 및 동의</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="truncate">2. 예식 및 계약정보 입력</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="text-[#B09A74] shrink-0">•</span>
                <span className="truncate">3. 대표 확인 후 메일 발송</span>
              </div>
            </div>
          </div>

          {/* 하단 액션 버튼 */}
          <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-[10.5px] sm:text-xs font-semibold text-[#322A1B] h-7 sm:h-8">
            <span>작성 시작</span>
            <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center group-hover:bg-[#1E1910] transition-colors">
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
        </div>

      </div>

      {/* 하단 신뢰 안내문 */}
      <div className="text-center text-xs text-[#8F7A56] pt-6 flex flex-col items-center space-y-2">
        <img
          src={DEAR_MEMORY_LOGO_BASE64}
          alt="Dear Memory Photography"
          className="h-8 sm:h-10 w-auto object-contain select-none opacity-85 hover:opacity-100 transition-opacity"
        />
        <p className="font-semibold text-[#322A1B] text-xs sm:text-sm">
          본식스냅 스튜디오 디어메모리
        </p>
        <p className="text-[11px] text-[#A8987E] leading-relaxed break-keep max-w-sm mx-auto">
          작성해 주신 정보는 안전하게 보호되며 대표 확인 및 계약서 발행 목적으로만 <span className="whitespace-nowrap">사용됩니다.</span>
        </p>
      </div>
    </div>
  );
};
