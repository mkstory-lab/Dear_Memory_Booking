import React from 'react';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { formatKRW } from '@/lib/pricing';
import { HANMINGYU_SEAL_BASE64 } from '@/assets/images';

export interface ContractDocumentProps {
  id?: string;
  contractNumber?: string;
  data: ContractFormData;
  pricing: PriceCalculationResult;
  isOfficialMode?: boolean;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  id = 'contract-doc-preview',
  contractNumber = 'DM-TEMP-0001',
  data,
  pricing,
}) => {
  const product = getProductById(data.productId);

  const selectedOptions = (data.optionIds || [])
    .map((optId) => getOptionById(optId))
    .filter(Boolean);

  const generatedDate = new Date()
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');

  const weddingDateFormatted = data.weddingDate
    ? data.weddingDate.replace(/-/g, '.')
    : '2026.09.27';

  return (
    <div id={id} className="space-y-8 select-none">
      {/* =========================================================================
          PAGE 1 : 본식스냅 계약서 본문 (A4 규격 210mm x 297mm)
          [고대비 인쇄 배색: 퓨어 화이트 배경 + 딥 챠콜 폰트 + 2~3pt 확대]
      ========================================================================= */}
      <div
        id={`${id}-page-1`}
        data-pdf-page="1"
        className="contract-page bg-white text-[#111827] mx-auto border border-[#E5E7EB] shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          padding: '11mm 15mm',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          color: '#111827',
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
        {/* 1. 상단 브랜드 헤더 */}
        <div className="border-b-2 border-[#111827] pb-2.5 flex justify-between items-end">
          <div>
            <p className="text-[11.5px] tracking-[0.25em] text-[#4B5563] font-semibold uppercase">
              WEDDING PHOTOGRAPHY
            </p>
            <h1 className="text-3xl font-serif font-bold text-[#111827] tracking-wider mt-0.5">
              DEAR MEMORY
            </h1>
            <p className="text-base text-[#374151] mt-0.5 font-semibold">본식스냅 계약서</p>
          </div>

          <div className="text-right">
            <div className="text-[13.5px] text-[#4B5563] font-medium">발행일자: {generatedDate}</div>
          </div>
        </div>

        {/* 2. 고객(계약자) 및 예식 정보 (2열 그리드) */}
        <div className="grid grid-cols-2 gap-3.5 my-1.5">
          {/* 고객(계약자) 정보 */}
          <div className="border border-[#D1D5DB] rounded-lg p-3.5 bg-[#F9FAFB] space-y-2">
            <h3 className="font-bold text-[#111827] text-base border-b border-[#E5E7EB] pb-1.5 mb-1.5">
              1. 고객 (계약자) 정보
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#4B5563] shrink-0 font-medium text-[14px]">신랑:</span>
              <span className="font-bold text-[#111827] text-right text-[15px]">
                {data.groomName} <span className="font-normal text-[#4B5563]">({data.groomPhone})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#4B5563] shrink-0 font-medium text-[14px]">신부:</span>
              <span className="font-bold text-[#111827] text-right text-[15px]">
                {data.brideName} <span className="font-normal text-[#4B5563]">({data.bridePhone})</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-[#4B5563] shrink-0 font-medium text-[14px]">이메일:</span>
              <span className="font-semibold text-[#111827] text-right text-[14.5px] font-mono">
                {data.email}
              </span>
            </div>
          </div>

          {/* 예식 일정 및 장소 */}
          <div className="border border-[#D1D5DB] rounded-lg p-3.5 bg-[#F9FAFB] space-y-2">
            <h3 className="font-bold text-[#111827] text-base border-b border-[#E5E7EB] pb-1.5 mb-1.5">
              2. 예식 일정 및 장소
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#4B5563] shrink-0 font-medium text-[14px]">예식 일시:</span>
              <span className="font-bold text-[#111827] text-right text-[15px]">
                {weddingDateFormatted} ({pricing.isSunday ? '일요일' : '토요일/평일'}) {data.weddingTime}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#4B5563] shrink-0 font-medium text-[14px]">예식 장소:</span>
              <span className="font-bold text-[#111827] text-right text-[15px]">
                {data.weddingVenue} {data.weddingHall}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 촬영 상품 및 상세 구성 */}
        <div className="border border-[#D1D5DB] rounded-lg p-3.5 my-1 bg-[#FFFFFF]">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-1.5 mb-2">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-[#111827] text-base">3. 촬영 상품 및 제공 구성</h3>
              <span className="px-2.5 py-0.5 bg-[#111827] text-white rounded text-[13px] font-bold">
                {product.name}
              </span>
            </div>
            <span className="font-bold text-[#111827] text-[17px] tabular-nums">
              기본가 {formatKRW(product.basePrice)}
            </span>
          </div>

          <div className="space-y-1.5 text-[14.5px] text-[#1F2937]">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-[#111827]">촬영 범위:</span> 신부대기실 ~ 본식 ~ 원판
                기념촬영 ~ 연회장 인사 (10~15분)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 pt-0.5">
              <div className="flex items-start">
                <span className="font-bold text-[#111827] shrink-0">앨범 사양:&nbsp;</span>
                <span className="whitespace-pre-line font-medium text-[#111827]">{product.albumSpec}</span>
              </div>
              <div>
                <span className="font-bold text-[#111827]">보정 및 원본:</span> 정밀보정{' '}
                <strong className="text-[#111827]">{product.retouchedCount}장</strong> / 원본{' '}
                <strong className="text-[#111827]">{product.originalCount}</strong> 전체 제공
              </div>
            </div>
          </div>
        </div>

        {/* 4. 계약 금액 정산 내역 (영수증 / 명세서 스타일) */}
        <div className="border-2 border-[#111827] rounded-lg p-3.5 bg-[#F9FAFB] my-1 text-[14px]">
          <div className="flex justify-between items-center border-b border-[#D1D5DB] pb-1.5 mb-2">
            <h3 className="font-bold text-[#111827] text-base">4. 계약 금액 정산 내역 (명세서)</h3>
            <span className="text-[12.5px] text-[#4B5563] font-medium">단위: 원 (VAT 포함)</span>
          </div>

          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[13px] text-[#4B5563]">
                <th className="py-1 text-left font-semibold w-1/4">구분</th>
                <th className="py-1 text-left font-semibold w-1/2">상세 내역</th>
                <th className="py-1 text-right font-semibold w-1/4">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {/* 기본 상품 행 */}
              <tr>
                <td className="py-2 font-bold text-[#111827] text-[14.5px]">기본 상품</td>
                <td className="py-2 text-[#111827] font-semibold text-[14.5px]">
                  {product.name}
                </td>
                <td className="py-2 text-right font-bold tabular-nums text-[#111827] text-[15.5px]">
                  {formatKRW(pricing.basePrice)}
                </td>
              </tr>

              {/* 추가 옵션 개별 행 */}
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <tr key={opt!.id}>
                    <td className="py-1.5 text-[#374151] font-semibold text-[14px]">추가 옵션</td>
                    <td className="py-1.5 text-[#111827] font-semibold text-[14px]">
                      {opt!.name}
                    </td>
                    <td className="py-1.5 text-right font-bold text-[#111827] tabular-nums text-[15px]">
                      +{formatKRW(opt!.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 text-[#6B7280] text-[13.5px]">추가 옵션</td>
                  <td className="py-1.5 text-[#6B7280] italic text-[13.5px]">선택된 추가 촬영 옵션 없음</td>
                  <td className="py-1.5 text-right text-[#6B7280] tabular-nums text-[13.5px]">-</td>
                </tr>
              )}

              {/* 즉시 할인 항목 개별 행 */}
              {pricing.isSunday && (
                <tr>
                  <td className="py-1.5 text-[#B45309] font-semibold text-[14px]">즉시 할인</td>
                  <td className="py-1.5 text-[#B45309] font-medium text-[14px]">일요일 예식 특별 할인</td>
                  <td className="py-1.5 text-right font-bold text-[#B45309] tabular-nums text-[15px]">
                    -100,000원
                  </td>
                </tr>
              )}
              {data.partnerDiscount && (
                <tr>
                  <td className="py-1.5 text-[#B45309] font-semibold text-[14px]">즉시 할인</td>
                  <td className="py-1.5 text-[#B45309] font-medium text-[14px]">
                    짝꿍 추천 할인 {data.partnerName ? `(추천인: ${data.partnerName})` : ''}
                  </td>
                  <td className="py-1.5 text-right font-bold text-[#B45309] tabular-nums text-[15px]">
                    -50,000원
                  </td>
                </tr>
              )}
              {data.portfolioConsent && (
                <tr>
                  <td className="py-1.5 text-[#B45309] font-semibold text-[14px]">즉시 할인</td>
                  <td className="py-1.5 text-[#B45309] font-medium text-[14px]">
                    포트폴리오(사진 공개 동의) 감사 할인
                  </td>
                  <td className="py-1.5 text-right font-bold text-[#B45309] tabular-nums text-[15px]">
                    -100,000원
                  </td>
                </tr>
              )}

              {/* 지인 할인 / 대표 특약 조정 (할인 시 즉시 할인 행으로 표시) */}
              {((data.manualAdjustment && data.manualAdjustment.amount !== 0) || (pricing.manualAdjustmentAmount && pricing.manualAdjustmentAmount !== 0)) && (() => {
                const adjAmount = data.manualAdjustment?.amount ?? pricing.manualAdjustmentAmount ?? 0;
                const adjReason = (data.manualAdjustment?.reason || '').trim() || (pricing.breakdown?.find(b => b.category === 'manual_adjustment')?.name) || '지인 특별 할인';
                const isDiscount = adjAmount < 0;
                return (
                  <tr key="manual-adjustment-row">
                    <td className={`py-1.5 font-semibold text-[14px] ${isDiscount ? 'text-[#B45309]' : 'text-[#374151]'}`}>
                      {isDiscount ? '즉시 할인' : '추가 금액'}
                    </td>
                    <td className={`py-1.5 font-medium text-[14px] ${isDiscount ? 'text-[#B45309]' : 'text-[#111827]'}`}>
                      {adjReason}
                    </td>
                    <td className={`py-1.5 text-right font-bold tabular-nums text-[15px] ${isDiscount ? 'text-[#B45309]' : 'text-[#111827]'}`}>
                      {adjAmount > 0 ? '+' : ''}
                      {formatKRW(adjAmount)}
                    </td>
                  </tr>
                );
              })()}

              {/* 최종 확정 계약 금액 행 */}
              <tr className="border-t-2 border-[#111827] bg-white">
                <td colSpan={2} className="py-3 font-bold text-[17px] text-[#111827]">
                  최종 확정 계약금액 (VAT 포함)
                </td>
                <td className="py-3 text-right text-[27px] font-serif font-bold text-[#111827] tabular-nums">
                  {formatKRW(pricing.contractTotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 결제 일정 카드 (계약금 & 잔금 2열 분할) */}
          <div className="grid grid-cols-2 gap-3.5 mt-2.5 pt-2.5 border-t border-[#D1D5DB]">
            <div className="p-3 bg-white rounded border border-[#D1D5DB] flex justify-between items-center shadow-xs">
              <div>
                <span className="text-[#4B5563] block text-[13px] font-medium">계약금 (신청 후 24시간 내)</span>
                <span className="font-bold text-[#111827] text-[19px] tabular-nums mt-0.5 block">
                  {formatKRW(pricing.depositAmount)}
                </span>
              </div>
              <span className="text-[12.5px] text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded font-semibold border border-[#E5E7EB]">
                스케줄 확정
              </span>
            </div>
            <div className="p-3 bg-white rounded border border-[#D1D5DB] flex justify-between items-center shadow-xs">
              <div>
                <span className="text-[#4B5563] block text-[13px] font-medium">잔금 (예식 1주 전 입금)</span>
                <span className="font-bold text-[#111827] text-[19px] tabular-nums mt-0.5 block">
                  {formatKRW(pricing.balanceAmount)}
                </span>
              </div>
              <span className="text-[12.5px] text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded font-semibold border border-[#E5E7EB]">
                최종 정산
              </span>
            </div>
          </div>

          {/* 후기 이벤트 별도 안내 */}
          {pricing.futureCashbackTotal > 0 && (
            <div className="mt-2 p-2 bg-[#F3F4F6] rounded border border-[#E5E7EB] text-[13px] flex justify-between items-center text-[#374151]">
              <span className="font-medium">* 후기 이벤트: 잔금에서 차감 또는 후기 확인 후 페이백 적용</span>
              <span className="font-bold text-[#111827] tabular-nums text-[13.5px]">
                최대 {formatKRW(pricing.futureCashbackTotal)} 혜택
              </span>
            </div>
          )}
        </div>

        {/* 별첨 안내 문구 */}
        <div className="p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB] text-[12px] text-[#4B5563] text-center my-1 font-medium">
          * 본 계약의 상세 약관 및 운영 정책은 <strong>[별첨. 본식스냅 촬영 약관 및 운영 정책]</strong>에 수록되어 있습니다.
        </div>

        {/* 5. 서명 및 날인 영역 */}
        <div className="border-t border-[#D1D5DB] pt-3 mt-auto">
          <p className="text-[13px] text-center text-[#374151] mb-2.5 font-medium">
            위와 같이 본식스냅 촬영 계약을 체결하며, 상호 신뢰와 성실로 본 계약 내용을 확약합니다.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* 신랑 · 신부 확인란 */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-lg border border-[#D1D5DB] flex items-center justify-between h-[68px]">
              <div className="flex items-center gap-2.5">
                <span className="text-[13.5px] text-[#4B5563] font-semibold">신랑 · 신부</span>
                <span className="font-bold text-[#111827] text-[17px] ml-1">
                  {data.groomName} · {data.brideName}
                </span>
              </div>
            </div>

            {/* 대표 서명 및 날인 */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-lg border border-[#D1D5DB] flex items-center justify-between h-[68px] relative">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[#111827] text-[17px] tracking-wide">DEAR MEMORY</span>
                <span className="text-[14px] font-semibold text-[#374151]">대표 한민규</span>
              </div>
              {/* 대표 정식 직인 날인 */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <img
                  src={HANMINGYU_SEAL_BASE64}
                  alt="대표 직인"
                  className="w-12 h-12 object-contain select-none transform rotate-[-2deg] drop-shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* 1페이지 하단 페이지 마크 */}
          <div className="flex justify-between items-center text-[11px] text-[#6B7280] mt-2.5 pt-2 border-t border-[#E5E7EB]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT</span>
            <span className="font-semibold text-[#111827]">
              1 / 2 Page &bull; 본식스냅 계약서 본문
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2 : [별첨] 본식스냅 촬영 약관 및 운영 정책 전문 (A4 규격 210mm x 297mm)
          [고대비 인쇄 배색: 퓨어 화이트 배경 + 딥 챠콜 폰트]
      ========================================================================= */}
      <div
        id={`${id}-page-2`}
        data-pdf-page="2"
        className="contract-page bg-white text-[#111827] mx-auto border border-[#E5E7EB] shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          padding: '11mm 15mm',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          color: '#111827',
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
        {/* 상단 별첨 약관 헤더 */}
        <div className="border-b-2 border-[#111827] pb-2 flex justify-between items-end">
          <div>
            <p className="text-[11px] tracking-[0.25em] text-[#4B5563] font-semibold uppercase">
              DEAR MEMORY &bull; ATTACHMENT
            </p>
            <h2 className="text-2xl font-serif font-bold text-[#111827] tracking-wider mt-0.5">
              [별첨] 본식스냅 촬영 약관 및 운영 정책 전문
            </h2>
            <p className="text-[13px] text-[#4B5563] mt-0.5 font-medium">
              본 약관은 고객님과 디어메모리 간의 권리와 의무, 상호 신뢰를 규정하는 법적 조항입니다.
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="text-[13px] text-[#4B5563] font-medium">
              약관 버전: {CONTRACT_POLICY_CONFIG.version}
            </div>
          </div>
        </div>

        {/* 제1조 ~ 제13조 전체 약관 전문 (독립 2단 컬럼 완벽 수납) */}
        <div className="grid grid-cols-2 gap-x-4 my-2 flex-1 items-start">
          {/* 좌측 컬럼: 제1조 ~ 제7조 */}
          <div className="space-y-1.5">
            {CONTRACT_POLICY_CONFIG.sections.slice(0, 7).map((section) => (
              <div
                key={section.id}
                className="border border-[#E5E7EB] rounded p-2 bg-[#F9FAFB] text-[9.5px] leading-snug"
              >
                <h4 className="font-bold text-[#111827] text-[10.5px] border-b border-[#E5E7EB] pb-0.5 mb-1">
                  {section.title}
                </h4>
                <p className="text-[#374151] whitespace-pre-line text-justify font-normal">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* 우측 컬럼: 제8조 ~ 제13조 */}
          <div className="space-y-1.5">
            {CONTRACT_POLICY_CONFIG.sections.slice(7).map((section) => (
              <div
                key={section.id}
                className="border border-[#E5E7EB] rounded p-2 bg-[#F9FAFB] text-[9.5px] leading-snug"
              >
                <h4 className="font-bold text-[#111827] text-[10.5px] border-b border-[#E5E7EB] pb-0.5 mb-1">
                  {section.title}
                </h4>
                <p className="text-[#374151] whitespace-pre-line text-justify font-normal">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 개인정보 고지 및 푸터 */}
        <div className="border-t border-[#D1D5DB] pt-2 mt-auto">
          <div className="p-2 bg-[#F9FAFB] rounded border border-[#E5E7EB] text-[9.5px] text-[#4B5563] leading-normal mb-1.5">
            {CONTRACT_POLICY_CONFIG.privacyNotice}
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT POLICY</span>
            <span className="font-semibold text-[#111827]">2 / 2 Page &bull; 본식스냅 촬영 약관 수록 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};
