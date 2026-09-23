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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm pt-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span className="font-semibold text-[#322A1B]">스냅 촬영 + 원판(기념촬영) 포함</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
            <span className="font-semibold text-[#322A1B]">신부대기실 ~ 본식 ~ 원판 ~ 연회장 인사 (10~15분)</span>
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
                    <div className="flex items-center justify-between py-1.5 border-b border-[#EBE3D5]">
                      <div className="text-left font-bold text-[#322A1B] leading-tight">
                        <div className="text-xs sm:text-sm">부부 앨범</div>
                        <div className="text-[#8F7A56] font-semibold text-[11px] sm:text-xs mt-0.5">
                          {isPlus ? '15×12 80p' : '15×12 70p'}
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 bg-[#EBE3D5] text-[#6E5C3D] font-bold text-xs rounded-lg text-center leading-tight shrink-0 min-w-[54px] flex items-center justify-center">
                        1권
                      </div>
                    </div>

                    {/* 2행: 부모님 앨범 */}
                    <div className="flex items-center justify-between py-1.5 border-b border-[#EBE3D5]">
                      {isPlus ? (
                        <div className="text-left font-bold text-[#322A1B] leading-tight">
                          <div className="text-xs sm:text-sm text-[#322A1B]">
                            부모님 앨범
                          </div>
                          <div className="text-[#8F7A56] font-semibold text-[11px] sm:text-xs mt-0.5">
                            12×8 40p
                          </div>
                        </div>
                      ) : (
                        <div className="text-left leading-tight">
                          <div className="text-xs sm:text-sm text-[#8F7A56] font-medium">부모님 앨범</div>
                          <div className="text-[#8F7A56]/80 font-medium text-[11px] sm:text-xs mt-0.5">(양가)</div>
                        </div>
                      )}

                      {isPlus ? (
                        <div className="px-2.5 py-1.5 bg-[#322A1B] text-[#FAF8F5] font-bold text-xs rounded-lg text-center leading-tight shrink-0 min-w-[54px] flex items-center justify-center">
                          2권
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-[#F5F1EA] text-[#8F7A56] font-bold text-xs rounded-lg text-center whitespace-nowrap shrink-0 min-w-[54px] min-h-[36px] flex items-center justify-center">
                          미포함
                        </div>
                      )}
                    </div>

                    {/* 3행: 패키지 특징 배너 */}
                    {isPlus ? (
                      <div className="p-2.5 rounded-xl text-xs text-center font-bold bg-[#FAF8F5] border border-[#B09A74]/50 text-[#6E5C3D] min-h-[50px] flex flex-col items-center justify-center leading-tight">
                        <div>[원판·스냅 합본]</div>
                        <div className="mt-0.5">양가 부모님 선물용 2권</div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl text-xs text-center font-bold bg-[#FFFFFF] border border-[#DDD1BD] text-[#8F7A56] min-h-[50px] flex items-center justify-center">
                        부부 단독 소장용
                      </div>
                    )}
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
