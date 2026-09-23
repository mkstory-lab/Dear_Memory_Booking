import React from 'react';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { formatKRW } from '@/lib/pricing';
import { HANMINGYU_SEAL_BASE64 } from '@/assets/images';

interface ContractDocumentProps {
  contractNumber: string;
  data: ContractFormData;
  pricing: PriceCalculationResult;
  generatedDate?: string;
  id?: string;
}

/**
 * Dear Memory for Booking — 공식 A4 본식스냅 계약서 컴포넌트 (정밀 2페이지 구성)
 * 
 * [A4 정밀 2페이지 레이아웃 설계]
 * 1. Page 1: 본식스냅 계약서 본문 (고객/예식 정보, 상품 구성, 정산 명세서, 서명 및 정식 직인 날인)
 * 2. Page 2: [별첨] 본식스냅 촬영 약관 및 운영 정책 전문 (제1조 ~ 제13조 전체 수록)
 */
export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contractNumber,
  data,
  pricing,
  generatedDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  id = 'dear-memory-contract-doc',
}) => {
  const product = getProductById(data.productId) || getProductById('standard')!;
  const selectedOptions = data.optionIds
    .map((optId) => getOptionById(optId))
    .filter(Boolean);

  const weddingDateFormatted = data.weddingDate ? data.weddingDate.replace(/-/g, '.') : '2026.09.27';

  return (
    <div id={id} className="space-y-8 select-none">
      {/* =========================================================================
          PAGE 1 : 본식스냅 계약서 본문 (A4 규격 210mm x 297mm)
      ========================================================================= */}
      <div
        id={`${id}-page-1`}
        data-pdf-page="1"
        className="contract-page bg-white text-[#22201D] mx-auto border border-[#EBE3D5] shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          padding: '13mm 16mm',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          color: '#22201D',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {/* 1. 상단 브랜드 헤더 (계약식별번호는 PDF상에서 미노출, 발행일자만 깔끔히 표시) */}
        <div className="border-b-2 border-[#322A1B] pb-3 flex justify-between items-end">
          <div>
            <p className="text-[11px] tracking-[0.25em] text-[#8F7A56] font-semibold uppercase">
              WEDDING PHOTOGRAPHY
            </p>
            <h1 className="text-3xl font-serif font-bold text-[#322A1B] tracking-wider mt-0.5">
              DEAR MEMORY
            </h1>
            <p className="text-sm text-[#6E5C3D] mt-0.5 font-medium">본식스냅 계약서</p>
          </div>

          <div className="text-right">
            <div className="text-xs text-[#8F7A56] font-medium">발행일자: {generatedDate}</div>
          </div>
        </div>

        {/* 2. 고객(계약자) 및 예식 정보 (2열 그리드 - 인적사항, 촬영스케줄 문구 삭제) */}
        <div className="grid grid-cols-2 gap-4 my-2">
          {/* 고객(계약자) 정보 */}
          <div className="border border-[#EBE3D5] rounded-lg p-4 bg-[#FAF8F5]/60 text-xs space-y-2">
            <h3 className="font-bold text-[#322A1B] text-sm border-b border-[#EBE3D5] pb-1.5 mb-2">
              1. 고객 (계약자) 정보
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium text-xs">신랑:</span>
              <span className="font-semibold text-[#322A1B] text-right text-[13px]">
                {data.groomName} <span className="font-normal text-[#6E5C3D]">({data.groomPhone})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium text-xs">신부:</span>
              <span className="font-semibold text-[#322A1B] text-right text-[13px]">
                {data.brideName} <span className="font-normal text-[#6E5C3D]">({data.bridePhone})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-[#8F7A56] shrink-0 font-medium text-xs">이메일:</span>
              <span className="font-medium text-[#322A1B] text-right text-[13px] font-mono">
                {data.email}
              </span>
            </div>
          </div>

          {/* 예식 일정 및 장소 */}
          <div className="border border-[#EBE3D5] rounded-lg p-4 bg-[#FAF8F5]/60 text-xs space-y-2">
            <h3 className="font-bold text-[#322A1B] text-sm border-b border-[#EBE3D5] pb-1.5 mb-2">
              2. 예식 일정 및 장소
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium text-xs">예식 일시:</span>
              <span className="font-semibold text-[#322A1B] text-right text-[13px]">
                {weddingDateFormatted} ({pricing.isSunday ? '일요일' : '토요일/평일'}) {data.weddingTime}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium text-xs">예식 장소:</span>
              <span className="font-semibold text-[#322A1B] text-right text-[13px]">
                {data.weddingVenue} {data.weddingHall}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 촬영 상품 및 상세 구성 */}
        <div className="border border-[#EBE3D5] rounded-lg p-4 my-1">
          <div className="flex justify-between items-center border-b border-[#EBE3D5] pb-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-[#322A1B] text-sm">3. 촬영 상품 및 제공 구성</h3>
              <span className="px-2.5 py-0.5 bg-[#F5F1EA] text-[#322A1B] rounded text-xs font-bold">
                {product.name}
              </span>
            </div>
            <span className="font-bold text-[#322A1B] text-base tabular-nums">
              기본가 {formatKRW(product.basePrice)}
            </span>
          </div>

          <div className="space-y-2 text-[12.5px] text-[#4E412A]">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-[#322A1B]">촬영 범위:</span> 신부대기실 ~ 본식 ~ 원판
                기념촬영 ~ 연회장 인사 (10~15분)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 pt-0.5">
              <div className="flex items-start">
                <span className="font-bold text-[#322A1B] shrink-0">앨범 사양:&nbsp;</span>
                <span className="whitespace-pre-line font-medium">{product.albumSpec}</span>
              </div>
              <div>
                <span className="font-bold text-[#322A1B]">보정 및 원본:</span> 정밀보정{' '}
                <strong className="text-[#322A1B]">{product.retouchedCount}장</strong> / 원본{' '}
                <strong className="text-[#322A1B]">{product.originalCount}</strong> 전체 제공
              </div>
            </div>
          </div>
        </div>

        {/* 4. 계약 금액 정산 내역 (영수증 / 명세서 스타일) */}
        <div className="border border-[#322A1B] rounded-lg p-4 bg-[#FAF8F5] my-1 text-xs">
          <div className="flex justify-between items-center border-b border-[#DDD1BD] pb-2 mb-2.5">
            <h3 className="font-bold text-[#322A1B] text-sm">4. 계약 금액 정산 내역 (명세서)</h3>
            <span className="text-[11px] text-[#8F7A56]">단위: 원 (VAT 포함)</span>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EBE3D5] text-[11px] text-[#8F7A56]">
                <th className="py-1.5 text-left font-medium w-1/4">구분</th>
                <th className="py-1.5 text-left font-medium w-1/2">상세 내역</th>
                <th className="py-1.5 text-right font-medium w-1/4">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F1EA]">
              {/* 기본 상품 행: 상세 내역에서 긴 설명 문구 삭제하고 상품명만 깔끔하게 노출 */}
              <tr>
                <td className="py-2.5 font-semibold text-[#322A1B] text-[13px]">기본 상품</td>
                <td className="py-2.5 text-[#322A1B] font-medium text-[13px]">
                  {product.name}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums text-[#322A1B] text-[13.5px]">
                  {formatKRW(pricing.basePrice)}
                </td>
              </tr>

              {/* 추가 옵션 개별 행 분리 출력 */}
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <tr key={opt!.id}>
                    <td className="py-2 text-[#6E5C3D] font-medium text-[12.5px]">추가 옵션</td>
                    <td className="py-2 text-[#4E412A] font-medium text-[12.5px]">
                      {opt!.name}
                    </td>
                    <td className="py-2 text-right font-semibold text-[#6E5C3D] tabular-nums text-[13px]">
                      +{formatKRW(opt!.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 text-[#8F7A56] text-[12px]">추가 옵션</td>
                  <td className="py-1.5 text-[#8F7A56] italic text-[12px]">선택된 추가 촬영 옵션 없음</td>
                  <td className="py-1.5 text-right text-[#8F7A56] tabular-nums text-[12px]">-</td>
                </tr>
              )}

              {/* 즉시 할인 항목 개별 행 분리 출력 */}
              {pricing.isSunday && (
                <tr>
                  <td className="py-2 text-[#B09A74] font-medium text-[12.5px]">즉시 할인</td>
                  <td className="py-2 text-[#B09A74] text-[12.5px]">일요일 예식 특별 할인</td>
                  <td className="py-2 text-right font-semibold text-[#B09A74] tabular-nums text-[13px]">
                    -100,000원
                  </td>
                </tr>
              )}
              {data.partnerDiscount && (
                <tr>
                  <td className="py-2 text-[#B09A74] font-medium text-[12.5px]">즉시 할인</td>
                  <td className="py-2 text-[#B09A74] text-[12.5px]">
                    짝꿍 추천 할인 {data.partnerName ? `(추천인: ${data.partnerName})` : ''}
                  </td>
                  <td className="py-2 text-right font-semibold text-[#B09A74] tabular-nums text-[13px]">
                    -50,000원
                  </td>
                </tr>
              )}
              {data.portfolioConsent && (
                <tr>
                  <td className="py-2 text-[#B09A74] font-medium text-[12.5px]">즉시 할인</td>
                  <td className="py-2 text-[#B09A74] text-[12.5px]">
                    포트폴리오(사진 공개 동의) 감사 할인
                  </td>
                  <td className="py-2 text-right font-semibold text-[#B09A74] tabular-nums text-[13px]">
                    -100,000원
                  </td>
                </tr>
              )}

              {/* 지인 할인 / 대표 특약 조정 (할인 시 즉시 할인 행으로 자연스럽게 표시) */}
              {((data.manualAdjustment && data.manualAdjustment.amount !== 0) || (pricing.manualAdjustmentAmount && pricing.manualAdjustmentAmount !== 0)) && (() => {
                const adjAmount = data.manualAdjustment?.amount ?? pricing.manualAdjustmentAmount ?? 0;
                const adjReason = (data.manualAdjustment?.reason || '').trim() || (pricing.breakdown?.find(b => b.category === 'manual_adjustment')?.name) || '지인 특별 할인';
                const isDiscount = adjAmount < 0;
                return (
                  <tr key="manual-adjustment-row">
                    <td className={`py-2 font-medium text-[12.5px] ${isDiscount ? 'text-[#B09A74]' : 'text-[#8F7A56]'}`}>
                      {isDiscount ? '즉시 할인' : '추가 금액'}
                    </td>
                    <td className={`py-2 text-[12.5px] ${isDiscount ? 'text-[#B09A74]' : 'text-[#8F7A56]'}`}>
                      {adjReason}
                    </td>
                    <td className={`py-2 text-right font-semibold tabular-nums text-[13px] ${isDiscount ? 'text-[#B09A74]' : 'text-[#322A1B]'}`}>
                      {adjAmount > 0 ? '+' : ''}
                      {formatKRW(adjAmount)}
                    </td>
                  </tr>
                );
              })()}

              {/* 최종 확정 계약 금액 행 */}
              <tr className="border-t-2 border-[#322A1B] bg-white/70">
                <td colSpan={2} className="py-3.5 font-bold text-base text-[#322A1B]">
                  최종 확정 계약금액 (VAT 포함)
                </td>
                <td className="py-3.5 text-right text-2xl font-serif font-bold text-[#322A1B] tabular-nums">
                  {formatKRW(pricing.contractTotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 결제 일정 카드 (계약금 & 잔금 2열 분할) */}
          <div className="grid grid-cols-2 gap-3.5 mt-3 pt-3 border-t border-[#DDD1BD] text-xs">
            <div className="p-3 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
              <div>
                <span className="text-[#8F7A56] block text-[11px] font-medium">계약금 (신청 후 24시간 내)</span>
                <span className="font-bold text-[#322A1B] text-base tabular-nums mt-0.5 block">
                  {formatKRW(pricing.depositAmount)}
                </span>
              </div>
              <span className="text-[11px] text-[#8F7A56] bg-[#FAF8F5] px-2.5 py-1 rounded font-medium">
                스케줄 확정
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
              <div>
                <span className="text-[#8F7A56] block text-[11px] font-medium">잔금 (예식 1주 전 입금)</span>
                <span className="font-bold text-[#322A1B] text-base tabular-nums mt-0.5 block">
                  {formatKRW(pricing.balanceAmount)}
                </span>
              </div>
              <span className="text-[11px] text-[#8F7A56] bg-[#FAF8F5] px-2.5 py-1 rounded font-medium">
                최종 정산
              </span>
            </div>
          </div>

          {/* 후기 이벤트 별도 안내 */}
          {pricing.futureCashbackTotal > 0 && (
            <div className="mt-2.5 p-2.5 bg-[#F5F1EA]/80 rounded border border-[#DDD1BD] text-xs flex justify-between items-center text-[#6E5C3D]">
              <span>* 후기 이벤트: 잔금에서 차감 또는 후기 확인 후 페이백 적용</span>
              <span className="font-bold text-[#322A1B] tabular-nums text-xs">
                최대 {formatKRW(pricing.futureCashbackTotal)} 혜택
              </span>
            </div>
          )}
        </div>

        {/* 별첨 안내 문구 */}
        <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#EBE3D5] text-[11px] text-[#8F7A56] text-center my-1">
          * 본 계약의 상세 약관 및 운영 정책은 <strong>[별첨. 본식스냅 촬영 약관 및 운영 정책]</strong>에 수록되어 있습니다.
        </div>

        {/* 5. 서명 및 날인 영역 (줄맞춤 완벽 정렬: 의뢰인/대행사/승인 텍스트 완전 삭제) */}
        <div className="border-t border-[#DDD1BD] pt-3.5 mt-auto">
          <p className="text-xs text-center text-[#6E5C3D] mb-3 font-medium">
            위와 같이 본식스냅 촬영 계약을 체결하며, 상호 신뢰와 성실로 본 계약 내용을 확약합니다.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* 신랑 · 신부 확인란 */}
            <div className="p-4 bg-[#FAF8F5] rounded-lg border border-[#EBE3D5] flex items-center justify-between h-[70px]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8F7A56] font-medium">신랑 · 신부</span>
                <span className="font-bold text-[#322A1B] text-base ml-1">
                  {data.groomName} · {data.brideName}
                </span>
              </div>
            </div>

            {/* 대표 서명 및 날인 (촬영 대행사 문구 삭제, 한민규 대표님 정식 직인 날인) */}
            <div className="p-4 bg-[#FAF8F5] rounded-lg border border-[#EBE3D5] flex items-center justify-between h-[70px] relative">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[#322A1B] text-base tracking-wide">DEAR MEMORY</span>
                <span className="text-[13px] font-semibold text-[#6E5C3D]">대표 한민규</span>
              </div>
              {/* 대표 정식 직인 날인 */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <img
                  src={HANMINGYU_SEAL_BASE64}
                  alt="대표 직인"
                  className="w-12 h-12 object-contain select-none transform rotate-[-2deg] drop-shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* 1페이지 하단 페이지 마크 (총 2페이지 구조) */}
          <div className="flex justify-between items-center text-[10px] text-[#8F7A56] mt-3 pt-2.5 border-t border-[#F5F1EA]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT</span>
            <span className="font-semibold text-[#322A1B]">
              1 / 2 Page &bull; 본식스냅 계약서 본문
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2 : [별첨] 본식스냅 촬영 약관 및 운영 정책 전문 (A4 규격 210mm x 297mm)
          [핵심 기능: 2페이지 전체를 온전한 약관 전문으로 구성하여 13개 조항 완벽 수납]
      ========================================================================= */}
      <div
        id={`${id}-page-2`}
        data-pdf-page="2"
        className="contract-page bg-white text-[#22201D] mx-auto border border-[#EBE3D5] shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          padding: '12mm 16mm',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          color: '#22201D',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {/* 상단 별첨 약관 헤더 (계약식별번호 미노출) */}
        <div className="border-b-2 border-[#322A1B] pb-2.5 flex justify-between items-end">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-[#8F7A56] font-semibold uppercase">
              DEAR MEMORY &bull; ATTACHMENT
            </p>
            <h2 className="text-xl font-serif font-bold text-[#322A1B] tracking-wider mt-0.5">
              [별첨] 본식스냅 촬영 약관 및 운영 정책 전문
            </h2>
            <p className="text-[11.5px] text-[#6E5C3D] mt-0.5 font-medium">
              본 약관은 고객님과 디어메모리 간의 권리와 의무, 상호 신뢰를 규정하는 법적 조항입니다.
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="text-xs text-[#8F7A56] font-medium">
              약관 버전: {CONTRACT_POLICY_CONFIG.version}
            </div>
          </div>
        </div>

        {/* 제1조 ~ 제13조 전체 약관 전문 (독립 2단 컬럼 완벽 수납) */}
        <div className="grid grid-cols-2 gap-x-4 my-2.5 flex-1 items-start">
          {/* 좌측 컬럼: 제1조 ~ 제7조 */}
          <div className="space-y-2">
            {CONTRACT_POLICY_CONFIG.sections.slice(0, 7).map((section) => (
              <div
                key={section.id}
                className="border border-[#EBE3D5] rounded p-2 bg-[#FAF8F5]/40 text-[8.5px] leading-snug"
              >
                <h4 className="font-bold text-[#322A1B] text-[9.5px] border-b border-[#EBE3D5] pb-0.5 mb-1">
                  {section.title}
                </h4>
                <p className="text-[#4E412A] whitespace-pre-line text-justify">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* 우측 컬럼: 제8조 ~ 제13조 */}
          <div className="space-y-2">
            {CONTRACT_POLICY_CONFIG.sections.slice(7).map((section) => (
              <div
                key={section.id}
                className="border border-[#EBE3D5] rounded p-2 bg-[#FAF8F5]/40 text-[8.5px] leading-snug"
              >
                <h4 className="font-bold text-[#322A1B] text-[9.5px] border-b border-[#EBE3D5] pb-0.5 mb-1">
                  {section.title}
                </h4>
                <p className="text-[#4E412A] whitespace-pre-line text-justify">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 개인정보 고지 및 푸터 */}
        <div className="border-t border-[#DDD1BD] pt-2 mt-auto">
          <div className="p-2 bg-[#FAF8F5] rounded border border-[#EBE3D5] text-[8.5px] text-[#6E5C3D] leading-normal mb-2">
            {CONTRACT_POLICY_CONFIG.privacyNotice}
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#8F7A56]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT POLICY</span>
            <span className="font-semibold text-[#322A1B]">2 / 2 Page &bull; 본식스냅 촬영 약관 수록 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};
