import React from 'react';
import { PRODUCTS_CONFIG } from '@/config/products';
import { OPTIONS_CONFIG } from '@/config/options';
import { DISCOUNTS_CONFIG } from '@/config/discounts';
import { formatKRW } from '@/lib/pricing';
import { ArrowLeft, BookOpen, Check, Gift, Sparkles, PlusCircle, Tag, ArrowRight } from 'lucide-react';

interface ProductCatalogViewProps {
  onBackToHome: () => void;
  onSelectProductAndApply: (productId: string) => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  onBackToHome,
  onSelectProductAndApply,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-10 animate-fade-in">
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
          본식스냅 상품 라인업 & 혜택
        </span>
      </div>

      {/* 인트로 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#322A1B]">
          본식스냅 상품 안내
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C3D] max-w-lg mx-auto leading-relaxed">
          디어메모리는 신부대기실부터 예식 본식, 원판 사진, 연회장 인사까지<br className="hidden sm:inline" />
          하루의 가장 찬란한 순간을 정성껏 담아냅니다.
        </p>
      </div>

      {/* 1. 상품 비교 카드 (실속형 vs 화보형) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {PRODUCTS_CONFIG.map((product) => {
          const isPlus = product.isPlusPackage;

          return (
            <div
              key={product.id}
              className={`bg-white border ${
                isPlus ? 'border-[#B09A74] shadow-md ring-1 ring-[#B09A74]/30' : 'border-[#EBE3D5] shadow-sm'
              } rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden`}
            >
              {/* 상단 뱃지 */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    isPlus
                      ? 'bg-[#322A1B] text-[#FAF8F5] border-[#322A1B]'
                      : 'bg-[#FAF8F5] text-[#8F7A56] border-[#DDD1BD]'
                  }`}
                >
                  {product.badge || '스냅 구성'}
                </span>
                <span className="text-xs text-[#8F7A56]">VAT 포함</span>
              </div>

              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <div className="h-7 sm:h-8 flex items-center gap-2">
                    <h3 className="text-xl font-serif font-bold text-[#322A1B]">
                      {product.name}
                    </h3>
                    {isPlus && (
                      <span className="text-[11px] font-sans font-medium text-[#8F7A56] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#DDD1BD]">
                        부모님 앨범 포함
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8F7A56] mt-1.5 leading-relaxed min-h-[36px] sm:min-h-[32px] flex items-center break-keep">
                    {product.subtitle}
                  </p>
                </div>

                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#322A1B] pb-4 border-b border-[#F5F1EA] tabular-nums">
                  {formatKRW(product.basePrice)}
                </div>

                {/* 스펙 하이라이트 박스 (좌우 양끝 칼정렬) */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-2xl space-y-2 text-xs border border-[#EBE3D5] min-h-[110px] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[#8F7A56] shrink-0 font-medium pt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>앨범 사양</span>
                    </div>
                    <div className="font-semibold text-[#322A1B] text-right space-y-0.5">
                      {product.albumSpec.split('\n').map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[#6E5C3D] pt-1.5 border-t border-[#EBE3D5]">
                    <span className="text-[#8F7A56]">정밀 세부 보정본</span>
                    <span className="font-semibold text-[#322A1B] tabular-nums text-right">
                      {product.retouchedCount}장
                      {isPlus && <span className="text-[#B09A74] ml-1 font-normal">(+10장 증정)</span>}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[#6E5C3D]">
                    <span className="text-[#8F7A56]">웹용 고화질 원본</span>
                    <span className="font-semibold text-[#322A1B] text-right">
                      {product.originalCount} 전체 제공
                      {isPlus && <span className="text-[#B09A74] ml-1 font-normal">(+500장 증정)</span>}
                    </span>
                  </div>
                </div>

                {/* 상품 세부 구성 안내 */}
                {!isPlus ? (
                  /* 실속형: 기본 포함 구성 목록 */
                  <div className="space-y-2 text-xs text-[#4E412A] pt-2 flex-1">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-[#8F7A56]">
                      기본 포함 구성
                    </div>
                    <div className="space-y-1.5">
                      {product.includedItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-[#FAF8F5]/60 rounded-xl border border-[#EBE3D5]/60">
                          <Check className="w-3.5 h-3.5 text-[#B09A74] mt-0.5 shrink-0" />
                          <span className="break-keep">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 화보형: 실속형 기본 포함 + 화보형만의 추가 혜택 하이라이트 */
                  <div className="space-y-2.5 text-xs text-[#4E412A] pt-2 flex-1">
                    {/* 실속형 포함 확인 배너 */}
                    <div className="p-2.5 bg-[#FAF8F5] border border-[#DDD1BD] rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#8F7A56] shrink-0" />
                      <span className="text-xs font-semibold text-[#322A1B] break-keep">
                        {product.baseIncludedNotice || '실속형의 모든 촬영 및 원본 제공 혜택 기본 포함'}
                      </span>
                    </div>

                    {/* 추가 제공 혜택 3가지 */}
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8F7A56] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#B09A74]" />
                        <span>화보형 특별 추가 & 업그레이드 혜택 (+20만원)</span>
                      </div>
                      {product.plusBenefits?.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EBE3D5] space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#322A1B] break-keep">
                              {benefit.title}
                            </span>
                            {benefit.badge && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#EBE3D5] text-[#6E5C3D] rounded-full shrink-0">
                                {benefit.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6E5C3D] leading-relaxed break-keep">
                            {benefit.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA 버튼 */}
              <div className="mt-6 pt-4 border-t border-[#F5F1EA]">
                <button
                  type="button"
                  onClick={() => onSelectProductAndApply(product.id)}
                  className={`w-full h-12 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm ${
                    isPlus
                      ? 'bg-[#322A1B] text-[#FAF8F5] hover:bg-[#1E1910]'
                      : 'bg-[#FAF8F5] text-[#322A1B] border border-[#DDD1BD] hover:bg-[#F0EBE1]'
                  }`}
                >
                  <span>{product.name}으로 계약정보 작성하기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. 추가 촬영 옵션 안내 */}
      <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F5F1EA]">
          <PlusCircle className="w-5 h-5 text-[#8F7A56]" />
          <h3 className="text-base sm:text-lg font-semibold text-[#322A1B]">
            추가 촬영 옵션
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS_CONFIG.map((opt) => (
            <div key={opt.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-[#322A1B]">{opt.name}</span>
                <span className="font-bold text-sm text-[#322A1B] tabular-nums">+{formatKRW(opt.price)}</span>
              </div>
              <p className="text-xs text-[#6E5C3D] leading-relaxed">
                {opt.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 할인 및 페이백 혜택 안내 */}
      <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F5F1EA]">
          <Tag className="w-5 h-5 text-[#8F7A56]" />
          <h3 className="text-base sm:text-lg font-semibold text-[#322A1B]">
            할인 및 페이백 혜택 총정리
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* 즉시 할인 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-2">
            <span className="text-[10px] font-bold text-[#8F7A56] uppercase tracking-wider">
              계약금액 즉시 할인
            </span>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#322A1B]">일요일 예식 프로모션</span>
                <span className="font-bold text-[#B09A74] tabular-nums">-100,000원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#322A1B]">사진 공개 감사 할인 (SNS & 포트폴리오)</span>
                <span className="font-bold text-[#B09A74] tabular-nums">-100,000원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#322A1B]">짝꿍 추천 할인</span>
                <span className="font-bold text-[#B09A74] tabular-nums">-50,000원</span>
              </div>
            </div>
          </div>

          {/* 추후 페이백 */}
          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EBE3D5] space-y-2">
            <span className="text-[10px] font-bold text-[#8F7A56] uppercase tracking-wider">
              사후 후기 페이백 혜택
            </span>
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#322A1B]">계약 후기 작성 시</span>
                <span className="font-bold text-[#6E5C3D] tabular-nums">50,000원 페이백</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#322A1B]">본식 후기 작성 시</span>
                <span className="font-bold text-[#6E5C3D] tabular-nums">50,000원 페이백</span>
              </div>
              <p className="text-[11px] text-[#8F7A56] pt-1 border-t border-[#EBE3D5]">
                * 후기 작성 확인 후 대표가 계좌로 직접 페이백 지급해 드립니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 전체 액션 */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => onSelectProductAndApply('standard')}
          className="px-8 py-4 bg-[#322A1B] text-[#FAF8F5] rounded-2xl text-sm font-semibold hover:bg-[#1E1910] transition-colors inline-flex items-center gap-2 shadow-md"
        >
          <span>계약정보 작성하러 가기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
