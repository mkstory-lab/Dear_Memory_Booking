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
    <div className="max-w-3xl mx-auto py-8 sm:py-14 space-y-10 animate-fade-in">
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

      {/* 2대 선택 카드: 계약상품 구경하기 vs 계약정보 작성하기 */}
      {/* 2대 선택 카드: 계약상품 구경하기 vs 계약정보 작성하기 */}
      {/* 모바일 전용 좌우 안내 힌트 */}
      <div className="flex md:hidden items-center justify-between text-xs text-[#8F7A56] px-1 -mb-1">
        <span className="font-medium text-[#6E5C3D]">원하시는 항목을 선택해 주세요</span>
        <span className="text-[11px] bg-[#F5F1EA] text-[#8F7A56] px-2 py-0.5 rounded-full border border-[#EBE3D5] flex items-center gap-1 font-medium">
          좌우 넘김 ↔
        </span>
      </div>

      <div className="flex md:grid md:grid-cols-2 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 px-4 -mx-4 md:px-0 md:mx-0 items-stretch">
        
        {/* 카드 1: 계약상품 구경하기 */}
        <div
          onClick={onSelectCatalog}
          className="w-[86vw] sm:w-[360px] md:w-auto shrink-0 snap-center group cursor-pointer bg-[#FFFFFF] border border-[#EBE3D5] hover:border-[#322A1B] rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EBE3D5] flex items-center justify-center text-[#8F7A56] group-hover:bg-[#322A1B] group-hover:text-[#FAF8F5] transition-colors">
              <Camera className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase">
                PRODUCTS & OPTIONS
              </span>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#322A1B] mt-0.5">
                계약상품 구경하기
              </h3>
              <p className="text-xs text-[#6E5C3D] mt-2 leading-relaxed min-h-[44px] break-keep">
                실속형·화보형 상품의 상세 앨범 구성, 원본/보정 컷 수, 추가 촬영 옵션 및 할인 혜택을 한눈에 살펴보실 수 있습니다.
              </p>
            </div>

            {/* 주요 하이라이트 박스 */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EBE3D5] space-y-1.5 text-xs text-[#8F7A56] min-h-[92px] flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep">실속형 (125만원) & 화보형 (145만원)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep">2인 촬영 (+25만) / 폐백 촬영 (+10만)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#B09A74]">•</span>
                <span className="break-keep">일요일 · 짝꿍 · 사진 공개 감사 할인</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-xs font-semibold text-[#322A1B] group-hover:text-[#8F7A56] transition-colors">
            <span>상품 구성 자세히 보기</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 카드 2: 계약정보 작성하기 */}
        <div
          onClick={onSelectApply}
          className="w-[86vw] sm:w-[360px] md:w-auto shrink-0 snap-center group cursor-pointer bg-[#FFFFFF] border-2 border-[#322A1B]/80 hover:border-[#322A1B] rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-full relative overflow-hidden bg-gradient-to-br from-[#FFFFFF] to-[#FAF8F5]"
        >
          {/* 상단 추천 뱃지 */}
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 bg-[#322A1B] text-[#FAF8F5] rounded-full text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C7B698]" />
              <span>상담 완료 고객</span>
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center">
              <FileEdit className="w-6 h-6 text-[#C7B698]" />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#8F7A56] tracking-wider uppercase">
                CONTRACT APPLICATION
              </span>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#322A1B] mt-0.5">
                계약정보 작성하기
              </h3>
              <p className="text-xs text-[#6E5C3D] mt-2 leading-relaxed min-h-[44px] break-keep">
                상담을 완료하신 후 계약을 확정하고자 하실 때 약관을 확인하시고 예식 일정 및 고객 정보를 작성합니다.
              </p>
            </div>

            {/* 안내 배지 박스 */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl text-xs text-[#8F7A56] space-y-1.5 min-h-[92px] flex flex-col justify-center">
              <div className="flex items-center gap-1 font-semibold text-[#322A1B]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8F7A56] shrink-0" />
                <span>약관 사전 확인 후 안전 작성</span>
              </div>
              <p className="text-[11px] text-[#6E5C3D] leading-relaxed break-keep">
                약관 동의 &rarr; 계약정보 입력 &rarr; 대표 확인 후 이메일로 공식 PDF 계약서 발송
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#F5F1EA] flex items-center justify-between text-xs font-semibold text-[#322A1B]">
            <span>약관 확인 및 작성 시작</span>
            <div className="w-7 h-7 rounded-full bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center group-hover:bg-[#1E1910] transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
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
