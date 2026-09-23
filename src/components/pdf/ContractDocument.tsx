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
 * Dear Memory for Booking — 공식 A4 본식스냅 계약서 컴포넌트
 * 
 * [A4 정밀 레이아웃 설계 원칙]
 * 1. A4 세로 규격 (210mm x 297mm) 단면 완벽 수납 (오버플로우 방지)
 * 2. 한글 폰트 렌더링 깨짐 방지: Pretendard, Apple SD Gothic Neo, Noto Sans KR fallback
 * 3. 줄바꿈 최적화: word-break: keep-all, overflow-wrap: break-word
 * 4. 금액 및 표 정렬: 숫자 우측 정렬(tabular-nums), 라벨 좌측 정렬
 * 5. 핵심 계약 조항의 명확한 전달
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

  const weddingDateFormatted = data.weddingDate.replace(/-/g, '.');

  return (
    <div
      id={id}
      className="bg-white text-[#22201D] p-8 sm:p-10 mx-auto border border-[#EBE3D5] shadow-none select-none"
      style={{
        width: '210mm',
        height: '297mm', // A4 정확한 고정 규격
        maxHeight: '297mm',
        boxSizing: 'border-box',
        backgroundColor: '#FFFFFF',
        color: '#22201D',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
      }}
    >
      {/* ========================================================
          1. 상단 브랜드 헤더 & 계약 식별 번호
      ======================================================== */}
      <div className="border-b-2 border-[#322A1B] pb-3 flex justify-between items-end">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#8F7A56] font-semibold uppercase">
            WEDDING PHOTOGRAPHY
          </p>
          <h1 className="text-2xl font-serif font-bold text-[#322A1B] tracking-wider mt-0.5">
            DEAR MEMORY
          </h1>
          <p className="text-xs text-[#6E5C3D] mt-0.5">본식스냅 촬영 표준 계약서</p>
        </div>

        <div className="text-right text-xs">
          <div className="text-[10px] text-[#8F7A56] font-medium">계약 식별 번호</div>
          <div className="text-sm font-bold text-[#322A1B] tracking-wider font-mono mt-0.5">
            {contractNumber}
          </div>
          <div className="text-[10px] text-[#8F7A56] mt-0.5">
            발행일자: {generatedDate}
          </div>
        </div>
      </div>

      {/* ========================================================
          2. 고객(계약자) 및 예식 정보 (그리드)
      ======================================================== */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* 고객 정보 */}
        <div className="border border-[#EBE3D5] rounded-lg p-3 bg-[#FAF8F5]/40 text-xs space-y-1">
          <h3 className="font-semibold text-[#322A1B] text-[12px] border-b border-[#EBE3D5] pb-1 mb-1">
            고객 (계약자) 정보
          </h3>
          <div className="flex justify-between items-baseline">
            <span className="text-[#8F7A56] shrink-0">신랑:</span>
            <span className="font-medium text-[#322A1B] text-right truncate">
              {data.groomName} ({data.groomPhone})
              {data.groomFamilyMembers && <span className="text-[10px] text-[#6E5C3D] block font-normal">직계: {data.groomFamilyMembers}</span>}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#8F7A56] shrink-0">신부:</span>
            <span className="font-medium text-[#322A1B] text-right truncate">
              {data.brideName} ({data.bridePhone})
              {data.brideFamilyMembers && <span className="text-[10px] text-[#6E5C3D] block font-normal">직계: {data.brideFamilyMembers}</span>}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-0.5">
            <span className="text-[#8F7A56] shrink-0">이메일:</span>
            <span className="font-medium text-[#322A1B] text-right truncate text-[11px]">{data.email}</span>
          </div>
        </div>

        {/* 예식 정보 */}
        <div className="border border-[#EBE3D5] rounded-lg p-3 bg-[#FAF8F5]/40 text-xs space-y-1">
          <h3 className="font-semibold text-[#322A1B] text-[12px] border-b border-[#EBE3D5] pb-1 mb-1">
            예식 일정 및 장소
          </h3>
          <div className="flex justify-between">
            <span className="text-[#8F7A56] shrink-0">예식 일시:</span>
            <span className="font-medium text-[#322A1B] text-right">
              {weddingDateFormatted} ({pricing.isSunday ? '일요일' : '예식'}) {data.weddingTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8F7A56] shrink-0">예식 장소:</span>
            <span className="font-medium text-[#322A1B] text-right">
              {data.weddingVenue} {data.weddingHall}
            </span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span className="text-[#8F7A56] shrink-0">메이크업:</span>
            <span className="font-medium text-[#322A1B] text-right text-[11px] truncate">
              {data.makeupLocation || '미정 / 해당없음'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. 촬영 상품 및 상세 구성
      ======================================================== */}
      <div className="border border-[#EBE3D5] rounded-lg p-3 my-1 text-xs">
        <div className="flex justify-between items-center border-b border-[#EBE3D5] pb-1 mb-2">
          <h3 className="font-semibold text-[#322A1B] text-[12px]">촬영 상품 및 제공 구성</h3>
          <span className="font-bold text-[#322A1B]">
            {product.name} ({formatKRW(product.basePrice)})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#4E412A]">
          <div>
            <span className="font-semibold text-[#322A1B]">촬영 범위:</span> 신부대기실 ~ 본식 ~ 원판 기념촬영 ~ 연회장 인사
          </div>
          <div>
            <span className="font-semibold text-[#322A1B]">제공 규격:</span> {CONTRACT_POLICY_CONFIG.imageSpec}
          </div>
          <div className="flex items-start">
            <span className="font-semibold text-[#322A1B] shrink-0">앨범 사양:&nbsp;</span>
            <span className="whitespace-pre-line">{product.albumSpec}</span>
          </div>
          <div>
            <span className="font-semibold text-[#322A1B]">보정 및 원본:</span> 정밀보정 {product.retouchedCount}장 / 원본 {product.originalCount} 전체 제공
          </div>
        </div>

        {selectedOptions.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-[#F5F1EA] flex justify-between items-center text-[11px]">
            <span className="text-[#8F7A56] font-medium">추가 촬영 옵션:</span>
            <span className="font-semibold text-[#322A1B]">
              {selectedOptions.map((o) => `${o!.name} (+${formatKRW(o!.price)})`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================
          4. 계약 금액 정산 및 결제 일정 (표 및 금액 정렬)
      ======================================================== */}
      <div className="border border-[#322A1B] rounded-lg p-3.5 bg-[#FAF8F5] my-1 text-xs">
        <h3 className="font-semibold text-[#322A1B] text-[12px] border-b border-[#DDD1BD] pb-1 mb-2">
          계약 금액 정산 내역
        </h3>

        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <td className="py-0.5 text-[#6E5C3D]">기본 상품 ({product.name})</td>
              <td className="py-0.5 text-right font-medium tabular-nums">{formatKRW(pricing.basePrice)}</td>
            </tr>
            {pricing.optionTotal > 0 && (
              <tr>
                <td className="py-0.5 text-[#6E5C3D]">추가 옵션 합계</td>
                <td className="py-0.5 text-right font-medium tabular-nums">+{formatKRW(pricing.optionTotal)}</td>
              </tr>
            )}
            {pricing.immediateDiscountTotal > 0 && (
              <tr>
                <td className="py-0.5 text-[#B09A74]">
                  즉시 할인 적용
                  {pricing.isSunday && ' [일요일 예식 -100,000원]'}
                  {data.partnerDiscount && ` [짝꿍 할인(${data.partnerName}) -50,000원]`}
                  {data.portfolioConsent && ' [사진 공개 감사 할인 -100,000원]'}
                </td>
                <td className="py-0.5 text-right font-semibold text-[#B09A74] tabular-nums">
                  -{formatKRW(pricing.immediateDiscountTotal)}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-[#322A1B] font-bold text-[#322A1B]">
              <td className="pt-1.5 text-xs sm:text-sm">최종 확정 계약금액 (VAT 포함)</td>
              <td className="pt-1.5 text-right text-base font-serif tabular-nums">
                {formatKRW(pricing.contractTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 계약금 및 잔금 입금 일정 */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#DDD1BD] text-[11px]">
          <div className="p-1.5 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
            <span className="text-[#8F7A56]">계약금 (24시간 내):</span>
            <span className="font-bold text-[#322A1B] tabular-nums">{formatKRW(pricing.depositAmount)}</span>
          </div>
          <div className="p-1.5 bg-white rounded border border-[#EBE3D5] flex justify-between items-center">
            <span className="text-[#8F7A56]">잔금 (예식 1주 전):</span>
            <span className="font-bold text-[#322A1B] tabular-nums">{formatKRW(pricing.balanceAmount)}</span>
          </div>
        </div>

        {/* 후기 페이백 별도 기재 */}
        {pricing.futureCashbackTotal > 0 && (
          <div className="mt-2 p-1.5 bg-[#F5F1EA] rounded border border-[#DDD1BD] text-[10.5px] flex justify-between items-center text-[#6E5C3D]">
            <span>* 후기 작성 혜택 (계약 후기/본식 후기 작성 확인 후 대표 페이백 지급):</span>
            <span className="font-semibold text-[#322A1B] tabular-nums">최대 {formatKRW(pricing.futureCashbackTotal)}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          5. 핵심 계약 약관 및 운영 규정 요약 (한글 줄바꿈 최적화)
      ======================================================== */}
      <div className="border border-[#EBE3D5] rounded-lg p-3 my-1 text-[10px] text-[#4E412A] leading-relaxed space-y-1">
        <div className="flex justify-between items-center border-b border-[#EBE3D5] pb-0.5 mb-1">
          <h4 className="font-semibold text-[#322A1B] text-[11px]">
            핵심 계약 규정 및 운영 정책
          </h4>
          <span className="text-[#8F7A56] text-[9px]">
            공식 약관 ver {CONTRACT_POLICY_CONFIG.version}
          </span>
        </div>

        <p>
          <strong>1. 계약금 및 효력:</strong> 계약금 입금 후 72시간 이내 취소 시 전액 환불되며, 72시간 경과 후에는 일정 확정에 따라 환불이 불가합니다.
        </p>
        <p>
          <strong>2. 취소 위약금:</strong> 소비자 분쟁 기준에 따라 촬영 90일 전(계약금 위약금), 60~90일(총액 50%), 30~60일(총액 70%), 30일 이내(총액 80%) 규정을 준용합니다.
        </p>
        <p>
          <strong>3. 원본 보관 및 납품:</strong> 촬영 원본은 3중 백업으로 안전 관리되며, 완성본 전달일 기준 1개월간 보관되므로 수령 즉시 개인 백업을 권장합니다.
        </p>
        <p>
          <strong>4. 사진 공개 동의:</strong> {data.portfolioConsent ? '동의 완료 (Dear Memory 공식 SNS 및 웹사이트 게재 승인 / 10만원 할인 반영)' : '동의하지 않음'}
        </p>
        {(data.shootRequestNotes || data.retouchRequestNotes || data.requestNotes) && (
          <div className="pt-1 border-t border-[#F5F1EA] text-[#6E5C3D] space-y-0.5 text-[9.5px]">
            {data.shootRequestNotes && (
              <p>
                <strong>촬영 요청:</strong> {data.shootRequestNotes}
              </p>
            )}
            {data.retouchRequestNotes && (
              <p>
                <strong>보정 요청:</strong> {data.retouchRequestNotes}
              </p>
            )}
            {data.requestNotes && (
              <p>
                <strong>기타 요청:</strong> {data.requestNotes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          6. 서명 및 날인 영역 (하단 밀착)
      ======================================================== */}
      <div className="border-t border-[#DDD1BD] pt-3 mt-auto">
        <p className="text-[10px] text-center text-[#6E5C3D] mb-2.5">
          위와 같이 본식스냅 촬영 계약을 체결하며, 신뢰와 성실로 본 계약 내용을 확약합니다.
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* 고객 온라인 동의란 */}
          <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#EBE3D5] flex flex-col justify-between h-16">
            <span className="text-[10px] text-[#8F7A56]">의뢰인 (신랑 / 신부)</span>
            <div className="flex justify-between items-end">
              <span className="font-semibold text-[#322A1B] text-xs">
                {data.groomName} · {data.brideName}
              </span>
              <span className="text-[#A8987E] text-[10px]">(전자 승인 완료)</span>
            </div>
          </div>

          {/* 대표 서명 및 날인 */}
          <div className="p-2.5 bg-[#FAF8F5] rounded border border-[#EBE3D5] flex flex-col justify-between h-16 relative">
            <span className="text-[10px] text-[#8F7A56]">촬영 대행사</span>
            <div className="flex justify-between items-end">
              <div>
                <span className="font-semibold text-[#322A1B] text-xs">DEAR MEMORY</span>
                <span className="block text-[9px] text-[#8F7A56]">대표 한민규</span>
              </div>
              {/* 대표 인장 */}
              <div
                className="w-10 h-10 rounded-full border border-red-500 flex items-center justify-center text-red-500 font-serif text-[10px] font-bold rotate-[-10deg] select-none"
                style={{ borderColor: 'rgba(239, 68, 68, 0.9)' }}
              >
                한민규
              </div>
            </div>
          </div>
        </div>

        {/* 최하단 시스템 마크 */}
        <div className="text-center text-[9px] text-[#A8987E] mt-2">
          DEAR MEMORY FOR BOOKING &bull; OFFICIAL CONTRACT
        </div>
      </div>

    </div>
  );
};
