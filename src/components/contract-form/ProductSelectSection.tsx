import React from 'react';
import { PRODUCTS_CONFIG } from '@/config/products';
import { formatKRW } from '@/lib/pricing';
import { Camera, CheckCircle2, BookOpen, Sparkles, Check } from 'lucide-react';

interface ProductSelectSectionProps {
  selectedProductId: string;
  onSelect: (productId: string) => void;
}

export const ProductSelectSection: React.FC<ProductSelectSectionProps> = ({
  selectedProductId,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#8F7A56]" />
          <span>3. 상품 선택</span>
        </h3>
        <p className="text-xs text-[#8F7A56] mt-1">
          상담 시 결정하신 본식스냅 상품 구성을 선택해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
        {PRODUCTS_CONFIG.map((product) => {
          const isSelected = selectedProductId === product.id;
          const isPlus = product.isPlusPackage;

          return (
            <div
              key={product.id}
              onClick={() => onSelect(product.id)}
              className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all relative border flex flex-col justify-between ${
                isSelected
                  ? 'border-[#322A1B] bg-[#FFFFFF] shadow-md ring-2 ring-[#322A1B]/10'
                  : 'border-[#EBE3D5] bg-[#FFFFFF]/70 hover:border-[#C7B698] hover:bg-[#FFFFFF]'
              }`}
            >
              <div>
                {/* 상단 뱃지 & 선택 상태 */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span
                    className={`text-[9.5px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#322A1B] text-[#FAF8F5]'
                        : isPlus
                        ? 'bg-[#FAF8F5] text-[#8F7A56] border border-[#DDD1BD]'
                        : 'bg-[#F5F1EA] text-[#8F7A56]'
                    }`}
                  >
                    {product.badge || '기본'}
                  </span>
                  <CheckCircle2
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                      isSelected ? 'text-[#322A1B]' : 'text-[#DDD1BD]'
                    }`}
                  />
                </div>

                {/* 상품명 & 가격 */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                  <h4 className="text-sm sm:text-lg font-serif font-bold text-[#322A1B]">
                    {product.name}
                  </h4>
                  {isPlus && (
                    <span className="text-[9px] sm:text-[11px] font-sans font-normal text-[#8F7A56] bg-[#FAF8F5] px-1.5 py-0.5 rounded-full border border-[#DDD1BD]">
                      부모님 앨범
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-[#8F7A56] mb-2 sm:mb-4 min-h-[26px] sm:min-h-[32px] flex items-center leading-tight sm:leading-relaxed break-keep">
                  {product.subtitle}
                </p>

                <div className="text-base sm:text-2xl font-bold text-[#322A1B] mb-2.5 sm:mb-4 pb-2.5 sm:pb-4 border-b border-[#F5F1EA] tabular-nums">
                  {formatKRW(product.basePrice)}
                </div>

                {/* 상품 구성 */}
                {!isPlus ? (
                  /* 실속형: 기본 포함 구성 목록 */
                  <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-[#6E5C3D]">
                    <div className="flex items-start gap-1 font-medium text-[#322A1B] mb-1.5">
                      <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8F7A56] mt-0.5 shrink-0" />
                      <div className="space-y-0.5 text-[9.5px] sm:text-xs leading-tight">
                        {product.albumSpec.split('\n').map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    </div>
                    {product.includedItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-[9.5px] sm:text-xs leading-tight">
                        <span className="text-[#B09A74] shrink-0">•</span>
                        <span className="break-keep">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 화보형: 실속형 기본 포함 + 추가 혜택 */
                  <div className="space-y-1.5 sm:space-y-2.5 text-[10px] sm:text-xs text-[#4E412A]">
                    <div className="p-1.5 sm:p-2.5 bg-[#FAF8F5] border border-[#DDD1BD] rounded-lg sm:rounded-xl space-y-1">
                      <div className="flex items-center gap-1 text-[9.5px] sm:text-xs font-semibold text-[#322A1B]">
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8F7A56] shrink-0" />
                        <span className="break-keep leading-tight">{product.baseIncludedNotice || '실속형 기본 구성 100% 포함'}</span>
                      </div>
                      <div className="pl-4 text-[9px] sm:text-[11px] text-[#6E5C3D] space-y-0.5 font-medium border-t border-[#EBE3D5] pt-1">
                        <div className="text-[#8F7A56] font-semibold">화보형 업그레이드:</div>
                        {product.albumSpec.split('\n').map((line, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-[#B09A74]">•</span>
                            <span className="text-[#322A1B]">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#8F7A56]">
                        <Sparkles className="w-3 h-3 text-[#B09A74]" />
                        <span>화보형 추가 혜택 (+20만원)</span>
                      </div>
                      {product.plusBenefits?.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EBE3D5] space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#322A1B] break-keep">
                              {benefit.title}
                            </span>
                            {benefit.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-[#EBE3D5] text-[#6E5C3D] rounded shrink-0">
                                {benefit.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6E5C3D] leading-snug break-keep">
                            {benefit.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
