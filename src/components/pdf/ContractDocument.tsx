import React from 'react';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { formatKRW } from '@/lib/pricing';

interface ContractDocumentProps {
  contractNumber: string;
  data: ContractFormData;
  pricing: PriceCalculationResult;
  generatedDate?: string;
  id?: string;
}

/**
 * Dear Memory for Booking — 공식 A4 본식스냅 계약서 컴포넌트 (2페이지 정밀 분리)
 * 
 * [A4 정밀 레이아웃 설계 원칙]
 * 1. Page 1: 정식 계약서 본문 (고객 및 예식 정보, 상품 구성, 영수증형 정산 명세서, 서명란 줄맞춤)
 * 2. Page 2: 공식 약관 및 운영 정책 전문 (제1조 ~ 제13조 독립 2단 컬럼 수납으로 13조 잘림 방지)
 * 3. 추가 옵션 및 할인 옵션 개별 행(Row) 명세서 분리
 * 4. 한글 폰트(Pretendard) 무결성 및 word-break: keep-all 유지
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

  // 계약 식별 번호가 비어있거나 임시값일 때도 안전하게 보장
  const effectiveContractNumber =
    contractNumber && contractNumber !== 'DM-TEMP' && contractNumber.trim().length > 0
      ? contractNumber
      : `DM-${(data.weddingDate || '20260927').replace(/[^0-9]/g, '')}-01`;

  return (
    <div id={id} className="space-y-8 select-none">
      {/* =========================================================================
          PAGE 1 : 본식스냅 표준 계약서 본문 (A4 규격 210mm x 297mm)
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
        {/* 1. 상단 브랜드 헤더 & 계약 식별 번호 */}
        <div className="border-b-2 border-[#322A1B] pb-3 flex justify-between items-end">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-[#8F7A56] font-semibold uppercase">
              WEDDING PHOTOGRAPHY
            </p>
            <h1 className="text-2xl font-serif font-bold text-[#322A1B] tracking-wider mt-0.5">
              DEAR MEMORY
            </h1>
            <p className="text-xs text-[#6E5C3D] mt-0.5 font-medium">본식스냅 촬영 표준 계약서</p>
          </div>

          <div className="text-right text-xs">
            <div className="text-[10px] text-[#8F7A56] font-semibold">계약 식별 번호</div>
            <div className="text-base font-bold text-[#322A1B] tracking-wider font-mono mt-0.5">
              {effectiveContractNumber}
            </div>
            <div className="text-[10px] text-[#8F7A56] mt-0.5">발행일자: {generatedDate}</div>
          </div>
        </div>

        {/* 2. 고객(계약자) 및 예식 정보 (2열 그리드) */}
        <div className="grid grid-cols-2 gap-3.5 my-2">
          {/* 고객(계약자) 정보 */}
          <div className="border border-[#EBE3D5] rounded-lg p-3.5 bg-[#FAF8F5]/60 text-xs space-y-1.5">
            <h3 className="font-bold text-[#322A1B] text-[12px] border-b border-[#EBE3D5] pb-1.5 mb-1.5 flex items-center justify-between">
              <span>1. 고객 (계약자) 정보</span>
              <span className="text-[10px] font-normal text-[#8F7A56]">인적 사항</span>
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium">신랑:</span>
              <span className="font-semibold text-[#322A1B] text-right">
                {data.groomName} <span className="font-normal text-[#6E5C3D]">({data.groomPhone})</span>
                {data.groomFamilyMembers && (
                  <span className="text-[10.5px] text-[#8F7A56] block font-normal">
                    직계가족: {data.groomFamilyMembers}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium">신부:</span>
              <span className="font-semibold text-[#322A1B] text-right">
                {data.brideName} <span className="font-normal text-[#6E5C3D]">({data.bridePhone})</span>
                {data.brideFamilyMembers && (
                  <span className="text-[10.5px] text-[#8F7A56] block font-normal">
                    직계가족: {data.brideFamilyMembers}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-[#8F7A56] shrink-0 font-medium">이메일:</span>
              <span className="font-medium text-[#322A1B] text-right text-[11.5px] font-mono">
                {data.email}
              </span>
            </div>
          </div>

          {/* 예식 일정 및 장소 */}
          <div className="border border-[#EBE3D5] rounded-lg p-3.5 bg-[#FAF8F5]/60 text-xs space-y-1.5">
            <h3 className="font-bold text-[#322A1B] text-[12px] border-b border-[#EBE3D5] pb-1.5 mb-1.5 flex items-center justify-between">
              <span>2. 예식 일정 및 장소</span>
              <span className="text-[10px] font-normal text-[#8F7A56]">촬영 스케줄</span>
            </h3>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium">예식 일시:</span>
              <span className="font-semibold text-[#322A1B] text-right">
                {weddingDateFormatted} ({pricing.isSunday ? '일요일' : '토요일/평일'}) {data.weddingTime}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#8F7A56] shrink-0 font-medium">예식 장소:</span>
              <span className="font-semibold text-[#322A1B] text-right">
                {data.weddingVenue} {data.weddingHall}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-[#8F7A56] shrink-0 font-medium">메이크업:</span>
              <span className="font-medium text-[#322A1B] text-right text-[11.5px]">
                {data.makeupLocation || '미정 / 해당 없음'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. 촬영 상품 및 상세 구성 */}
        <div className="border border-[#EBE3D5] rounded-lg p-3.5 my-1 text-xs">
          <div className="flex justify-between items-center border-b border-[#EBE3D5] pb-1.5 mb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#322A1B] text-[12px]">3. 촬영 상품 및 제공 구성</h3>
              <span className="px-2 py-0.5 bg-[#F5F1EA] text-[#322A1B] rounded text-[10px] font-bold">
                {product.name}
              </span>
            </div>
            <span className="font-bold text-[#322A1B] text-sm tabular-nums">
              기본가 {formatKRW(product.basePrice)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px] text-[#4E412A]">
            <div>
              <span className="font-bold text-[#322A1B]">촬영 범위:</span> 신부대기실 ~ 본식 ~ 원판
              기념촬영 ~ 연회장 인사
            </div>
            <div>
              <span className="font-bold text-[#322A1B]">제공 규격:</span>{' '}
              {CONTRACT_POLICY_CONFIG.imageSpec}
            </div>
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

        {/* 4. 계약 금액 정산 내역 (영수증 / 명세서 스타일) */}
        <div className="border border-[#322A1B] rounded-lg p-3.5 bg-[#FAF8F5] my-1 text-xs">
          <div className="flex justify-between items-center border-b border-[#DDD1BD] pb-1.5 mb-2">
            <h3 className="font-bold text-[#322A1B] text-[12px]">4. 계약 금액 정산 내역 (명세서)</h3>
            <span className="text-[10px] text-[#8F7A56]">단위: 원 (VAT 포함)</span>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EBE3D5] text-[10.5px] text-[#8F7A56]">
                <th className="py-1 text-left font-medium w-1/4">구분</th>
                <th className="py-1 text-left font-medium w-1/2">상세 내역</th>
                <th className="py-1 text-right font-medium w-1/4">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F1EA]">
              {/* 기본 상품 행 */}
              <tr>
                <td className="py-1.5 font-semibold text-[#322A1B]">기본 상품</td>
                <td className="py-1.5 text-[#4E412A]">
                  {product.name} ({product.description || '본식스냅 기본 상품'})
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums text-[#322A1B]">
                  {formatKRW(pricing.basePrice)}
                </td>
              </tr>

              {/* 추가 옵션 개별 행 분리 출력 */}
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <tr key={opt!.id}>
                    <td className="py-1.5 text-[#6E5C3D] font-medium">추가 옵션</td>
                    <td className="py-1.5 text-[#4E412A]">
                      {opt!.name} <span className="text-[10px] text-[#8F7A56]">({opt!.description})</span>
                    </td>
                    <td className="py-1.5 text-right font-semibold text-[#6E5C3D] tabular-nums">
                      +{formatKRW(opt!.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1 text-[#8F7A56]">추가 옵션</td>
                  <td className="py-1 text-[#8F7A56] italic">선택된 추가 촬영 옵션 없음</td>
                  <td className="py-1 text-right text-[#8F7A56] tabular-nums">-</td>
                </tr>
              )}

              {/* 즉시 할인 항목 개별 행 분리 출력 */}
              {pricing.isSunday && (
                <tr>
                  <td className="py-1.5 text-[#B09A74] font-medium">즉시 할인</td>
                  <td className="py-1.5 text-[#B09A74]">일요일 예식 특별 할인</td>
                  <td className="py-1.5 text-right font-semibold text-[#B09A74] tabular-nums">
                    -100,000원
                  </td>
                </tr>
              )}
              {data.partnerDiscount && (
                <tr>
                  <td className="py-1.5 text-[#B09A74] font-medium">즉시 할인</td>
                  <td className="py-1.5 text-[#B09A74]">
                    짝꿍 추천 할인 {data.partnerName ? `(추천인: ${data.partnerName})` : ''}
                  </td>
                  <td className="py-1.5 text-right font-semibold text-[#B09A74] tabular-nums">
                    -50,000원
                  </td>
                </tr>
              )}
              {data.portfolioConsent && (
                <tr>
                  <td className="py-1.5 text-[#B09A74] font-medium">즉시 할인</td>
                  <td className="py-1.5 text-[#B09A74]">
                    포트폴리오(사진 공개 동의) 감사 할인
                  </td>
                  <td className="py-1.5 text-right font-semibold text-[#B09A74] tabular-nums">
                    -100,000원
                  </td>
                </tr>
              )}

              {/* 대표 수동 특약 조정 (있을 경우) */}
              {data.manualAdjustment && data.manualAdjustment.amount !== 0 && (
                <tr>
                  <td className="py-1.5 text-[#8F7A56] font-medium">특별 조정</td>
                  <td className="py-1.5 text-[#8F7A56]">
                    대표 특약 조정: {data.manualAdjustment.reason}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums text-[#322A1B]">
                    {data.manualAdjustment.amount > 0 ? '+' : ''}
                    {formatKRW(data.manualAdjustment.amount)}
                  </td>
                </tr>
              )}

              {/* 최종 확정 계약 금액 행 */}
              <tr className="border-t-2 border-[#322A1B] bg-white/70">
                <td colSpan={2} className="py-2.5 font-bold text-sm text-[#322A1B]">
                  최종 확정 계약금액 (VAT 포함)
                </td>
                <td className="py-2.5 text-right text-lg font-serif font-bold text-[#322A1B] tabular-nums">
                  {formatKRW(pricing.contractTotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 결제 일정 카드 (계약금 & 잔금 2열 분할) */}
          <div className="grid grid-cols-2 gap-2.5 mt-2.5 pt-2 border-t border-[#DDD1BD] text-xs">
            <div className="p-2 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
              <div>
                <span className="text-[#8F7A56] block text-[10px]">계약금 (신청 후 24시간 내)</span>
                <span className="font-bold text-[#322A1B] text-sm tabular-nums">
                  {formatKRW(pricing.depositAmount)}
                </span>
              </div>
              <span className="text-[10px] text-[#8F7A56] bg-[#FAF8F5] px-2 py-0.5 rounded">
                스케줄 확정
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
              <div>
                <span className="text-[#8F7A56] block text-[10px]">잔금 (예식 1주 전 입금)</span>
                <span className="font-bold text-[#322A1B] text-sm tabular-nums">
                  {formatKRW(pricing.balanceAmount)}
                </span>
              </div>
              <span className="text-[10px] text-[#8F7A56] bg-[#FAF8F5] px-2 py-0.5 rounded">
                최종 정산
              </span>
            </div>
          </div>

          {/* 후기 페이백 별도 안내 */}
          {pricing.futureCashbackTotal > 0 && (
            <div className="mt-2 p-1.5 bg-[#F5F1EA]/80 rounded border border-[#DDD1BD] text-[10.5px] flex justify-between items-center text-[#6E5C3D]">
              <span>* 후기 작성 혜택: 계약 후기 및 본식 후기 작성 확인 시 대표 계좌 입금</span>
              <span className="font-bold text-[#322A1B] tabular-nums">
                최대 {formatKRW(pricing.futureCashbackTotal)} 페이백
              </span>
            </div>
          )}
        </div>

        {/* 5. 특이사항 및 고객 요청사항 */}
        {(data.shootRequestNotes || data.retouchRequestNotes || data.requestNotes) && (
          <div className="border border-[#EBE3D5] rounded-lg p-2.5 my-1 text-[10.5px] text-[#4E412A] bg-[#FAF8F5]/40 space-y-1">
            <div className="font-bold text-[#322A1B] text-[11px] border-b border-[#EBE3D5] pb-0.5">
              5. 촬영 및 보정 고객 요청사항
            </div>
            {data.shootRequestNotes && (
              <p>
                <strong className="text-[#8F7A56]">촬영 스타일 요청:</strong> {data.shootRequestNotes}
              </p>
            )}
            {data.retouchRequestNotes && (
              <p>
                <strong className="text-[#8F7A56]">정밀보정 요청:</strong> {data.retouchRequestNotes}
              </p>
            )}
            {data.requestNotes && (
              <p>
                <strong className="text-[#8F7A56]">기타 문의/요청:</strong> {data.requestNotes}
              </p>
            )}
          </div>
        )}

        {/* 6. 서명 및 날인 영역 (줄맞춤 완벽 정렬) */}
        <div className="border-t border-[#DDD1BD] pt-3 mt-auto">
          <p className="text-[10.5px] text-center text-[#6E5C3D] mb-2 font-medium">
            위와 같이 본식스냅 촬영 계약을 체결하며, 상호 신뢰와 성실로 본 계약 내용을 확약합니다.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* 고객 온라인 동의란 */}
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EBE3D5] flex flex-col justify-between h-[72px]">
              <span className="text-[10.5px] text-[#8F7A56] font-medium">의뢰인 (신랑 · 신부)</span>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#322A1B] text-sm">
                  {data.groomName} · {data.brideName}
                </span>
                <span className="text-[#8F7A56] text-[10.5px] font-medium">[전자 서명 승인]</span>
              </div>
            </div>

            {/* 대표 서명 및 날인 (줄맞춤: DEAR MEMORY 옆에 대표 한민규) */}
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EBE3D5] flex flex-col justify-between h-[72px] relative">
              <span className="text-[10.5px] text-[#8F7A56] font-medium">촬영 대행사</span>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[#322A1B] text-sm tracking-wide">DEAR MEMORY</span>
                  <span className="text-xs font-semibold text-[#6E5C3D]">대표 한민규</span>
                </div>
                {/* 대표 인장 */}
                <div
                  className="w-11 h-11 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-serif text-[11px] font-bold rotate-[-10deg] select-none shadow-sm shrink-0"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.9)' }}
                >
                  한민규
                </div>
              </div>
            </div>
          </div>

          {/* 1페이지 하단 페이지 마크 */}
          <div className="flex justify-between items-center text-[9.5px] text-[#8F7A56] mt-2 pt-1.5 border-t border-[#F5F1EA]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT</span>
            <span className="font-medium text-[#322A1B]">
              1 / 2 Page &bull; 다음 페이지의 표준 약관 전문을 확인해 주시기 바랍니다.
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2 : 본식스냅 촬영 표준 약관 및 운영 정책 전문 (A4 규격 210mm x 297mm)
          [핵심 최적화: 독립 2단 수직 스택으로 제13조 하단 잘림 원천 차단]
      ========================================================================= */}
      <div
        id={`${id}-page-2`}
        data-pdf-page="2"
        className="contract-page bg-white text-[#22201D] mx-auto border border-[#EBE3D5] shadow-none"
        style={{
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          padding: '10mm 15mm',
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
        {/* 상단 약관 헤더 */}
        <div className="border-b-2 border-[#322A1B] pb-2 flex justify-between items-end">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-[#8F7A56] font-semibold uppercase">
              DEAR MEMORY &bull; TERMS & CONDITIONS
            </p>
            <h2 className="text-xl font-serif font-bold text-[#322A1B] tracking-wider mt-0.5">
              본식스냅 촬영 표준 약관 및 운영 정책 전문
            </h2>
            <p className="text-[10.5px] text-[#6E5C3D] mt-0.5">
              본 약관은 고객님과 디어메모리 간의 권리와 의무, 신뢰를 규정하는 법적 표준 조항입니다.
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="text-[10px] text-[#8F7A56] font-semibold">계약 식별 번호</div>
            <div className="text-sm font-bold text-[#322A1B] tracking-wider font-mono mt-0.5">
              {effectiveContractNumber}
            </div>
            <div className="text-[9.5px] text-[#8F7A56] mt-0.5">
              약관 버전: {CONTRACT_POLICY_CONFIG.version}
            </div>
          </div>
        </div>

        {/* 제1조 ~ 제13조 전체 약관 전문 (독립 2단 컬럼 배치로 13조 잘림 원천 차단) */}
        <div className="grid grid-cols-2 gap-x-3.5 my-2 flex-1 items-start">
          {/* 좌측 컬럼: 제1조 ~ 제7조 (균형 배분) */}
          <div className="space-y-1.5">
            {CONTRACT_POLICY_CONFIG.sections.slice(0, 7).map((section) => (
              <div
                key={section.id}
                className="border border-[#EBE3D5] rounded p-1.5 bg-[#FAF8F5]/40 text-[7.5px] leading-snug"
              >
                <h4 className="font-bold text-[#322A1B] text-[8.5px] border-b border-[#EBE3D5] pb-0.5 mb-0.5">
                  {section.title}
                </h4>
                <p className="text-[#4E412A] whitespace-pre-line text-justify">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* 우측 컬럼: 제8조 ~ 제13조 (긴 조항들 모음) */}
          <div className="space-y-1.5">
            {CONTRACT_POLICY_CONFIG.sections.slice(7).map((section) => (
              <div
                key={section.id}
                className="border border-[#EBE3D5] rounded p-1.5 bg-[#FAF8F5]/40 text-[7.5px] leading-snug"
              >
                <h4 className="font-bold text-[#322A1B] text-[8.5px] border-b border-[#EBE3D5] pb-0.5 mb-0.5">
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
        <div className="border-t border-[#DDD1BD] pt-1.5 mt-auto">
          <div className="p-1.5 bg-[#FAF8F5] rounded border border-[#EBE3D5] text-[7.5px] text-[#6E5C3D] leading-normal mb-1">
            {CONTRACT_POLICY_CONFIG.privacyNotice}
          </div>

          <div className="flex justify-between items-center text-[9px] text-[#8F7A56]">
            <span>DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT POLICY</span>
            <span className="font-semibold text-[#322A1B]">2 / 2 Page &bull; 표준 약관 전문 수록 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};
