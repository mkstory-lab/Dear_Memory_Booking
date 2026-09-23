import React from 'react';
import { Camera, Check, Sparkles, BookOpen, Layers } from 'lucide-react';
import { PRODUCTS_CONFIG } from '@/config/products';
import { formatKRW } from '@/lib/pricing';

interface ProductSelectSectionProps {
  selectedProductId: string;
  onSelect: (productId: string) => void;
  errors?: Record<string, string>;
}

export const ProductSelectSection: React.FC<ProductSelectSectionProps> = ({
  selectedProductId,
  onSelect,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#8F7A56]" />
          <span>3. 상품 선택</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1">
          디어메모리의 본식스냅 패키지를 선택해 주세요.
        </p>
      </div>

      {/* 실속형 · 화보형 전 상품 공통 포함 사항 배너 */}
      <div className="p-4 sm:p-4.5 bg-[#FAF8F5] border border-[#DDD1BD] rounded-2xl space-y-2 text-xs sm:text-sm text-[#6E5C3D] shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#322A1B]">
          <Layers className="w-4 h-4 text-[#8F7A56] shrink-0" />
          <span>전 상품 기본 공통 제공 사항 (실속형 / 화보형 공통)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span className="font-semibold text-[#322A1B]">스냅 촬영 + 원판(기념촬영) 포함</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span className="font-semibold text-[#322A1B]">신부대기실 ~ 본식 ~ 원판 ~ 연회장 인사</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span>정밀 세부 보정본 70장 전체 제공</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span>고화질 원본 2,000장 이상 전체 제공</span>
          </div>
        </div>
      </div>

      {/* 상품 선택 카드 (실속형 vs 화보형) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {PRODUCTS_CONFIG.map((product) => {
          const isSelected = selectedProductId === product.id;
          const isPlus = product.id === 'album_plus';

          return (
            <div
              key={product.id}
              onClick={() => onSelect(product.id)}
              className={`cursor-pointer rounded-3xl p-5 sm:p-6 transition-all duration-300 relative flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-[#FFFFFF] border-2 border-[#322A1B] shadow-md ring-2 ring-[#322A1B]/10'
                  : 'bg-[#FFFFFF] border border-[#EBE3D5] hover:border-[#8F7A56] shadow-sm'
              }`}
            >
              <div className="space-y-4">
                {/* 상단 라디오 & 뱃지 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isPlus
                        ? 'bg-[#322A1B] text-[#FAF8F5]'
                        : 'bg-[#F5F1EA] text-[#6E5C3D] border border-[#EBE3D5]'
                    }`}
                  >
                    {isPlus ? '대표 추천' : '기본 상품'}
                  </span>

                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#322A1B] bg-[#322A1B]'
                        : 'border-[#DDD1BD] bg-[#FFFFFF]'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FAF8F5]" />}
                  </div>
                </div>

                {/* 상품명 및 부제 */}
                <div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#322A1B]">
                    {product.name}
                  </h4>
                  <p className="text-sm sm:text-base font-semibold text-[#8F7A56] mt-1">
                    {product.subtitle}
                  </p>
                </div>

                {/* 가격 */}
                <div className="text-2xl sm:text-3xl font-bold text-[#322A1B] pb-3 border-b border-[#F5F1EA] tabular-nums">
                  {formatKRW(product.basePrice)}
                </div>

                {/* 앨범 사양 핵심 비교 박스 (두 카드 완벽한 행별 줄맞춤) */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#DDD1BD] space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-[#8F7A56] font-bold text-xs uppercase tracking-wide">
                    <BookOpen className="w-4 h-4 text-[#8F7A56]" />
                    <span>앨범 제공 구성</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* 1행: 부부 앨범 */}
                    <div className="flex items-center justify-between py-1 border-b border-[#EBE3D5]">
                      <span className="font-bold text-[#322A1B] text-xs sm:text-sm">부부 앨범 15×12 70p</span>
                      <span className="text-xs px-2 py-0.5 bg-[#EBE3D5] text-[#6E5C3D] font-semibold rounded-md">
                        1권 기본
                      </span>
                    </div>

                    {/* 2행: 부모님 앨범 */}
                    <div className="flex items-center justify-between py-1 border-b border-[#EBE3D5]">
                      <div className="flex items-center gap-1">
                        {isPlus ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#B09A74] shrink-0" />
                            <span className="font-bold text-[#322A1B] text-xs sm:text-sm">부모님 앨범 12×8 40p</span>
                          </>
                        ) : (
                          <span className="text-xs sm:text-sm text-[#8F7A56] font-medium">부모님 앨범 (양가)</span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 font-semibold rounded-md ${
                          isPlus
                            ? 'bg-[#322A1B] text-[#FAF8F5]'
                            : 'bg-[#F5F1EA] text-[#8F7A56]'
                        }`}
                      >
                        {isPlus ? '2권 기본 제공' : '미포함'}
                      </span>
                    </div>

                    {/* 3행: 패키지 특징 배너 */}
                    <div
                      className={`p-2 rounded-xl text-xs text-center font-medium leading-relaxed ${
                        isPlus
                          ? 'bg-[#FAF8F5] border border-[#B09A74]/50 text-[#6E5C3D] font-semibold'
                          : 'bg-[#FFFFFF] border border-[#DDD1BD] text-[#8F7A56]'
                      }`}
                    >
                      {isPlus ? (
                        <span>[원판·스냅 합본] 양가 부모님 선물용 2권</span>
                      ) : (
                        <span>부부 단독 소장용 (옵션에서 추가 가능)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 선택 안내 */}
              <div className="pt-4 mt-2">
                <div
                  className={`w-full py-2.5 rounded-xl text-center text-xs sm:text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#322A1B] text-[#FAF8F5]'
                      : 'bg-[#FAF8F5] text-[#8F7A56] border border-[#DDD1BD]'
                  }`}
                >
                  {isSelected ? '선택됨' : '선택하기'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errors.productId && (
        <p className="text-xs text-red-500 font-medium">{errors.productId}</p>
      )}
    </div>
  );
};
