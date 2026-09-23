import React, { useState, useEffect } from 'react';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { calculateContractPrice, formatKRW } from '@/lib/pricing';
import { getProductById, PRODUCTS_CONFIG } from '@/config/products';
import { getOptionById, OPTIONS_CONFIG } from '@/config/options';
import {
  CheckCircle,
  Edit3,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  FileCheck,
  Download,
  Tag,
  Calculator,
} from 'lucide-react';
import { ContractDocument } from '@/components/pdf/ContractDocument';
import { exportContractToPdfAndJpg, triggerFileDownload } from '@/lib/pdfGenerator';

interface RepresentativeReviewViewProps {
  token: string;
  contractId: string;
  initialData: ContractFormData;
  initialPricing: PriceCalculationResult;
  isAlreadySent: boolean;
  sentAt?: string;
  contractNumber?: string;
}

interface ManualAdjustmentControlProps {
  manualAmount: number;
  manualReason: string;
  targetTotalInput: string;
  basePlusOptionsMinusDiscounts: number;
  contractTotal: number;
  onAmountChange: (amount: number) => void;
  onReasonChange: (reason: string) => void;
  onTargetTotalChange: (target: string) => void;
  onReset: () => void;
}

const ManualAdjustmentControl: React.FC<ManualAdjustmentControlProps> = ({
  manualAmount,
  manualReason,
  targetTotalInput,
  basePlusOptionsMinusDiscounts,
  contractTotal,
  onAmountChange,
  onReasonChange,
  onTargetTotalChange,
  onReset,
}) => {
  return (
    <div className="p-4 bg-[#FAF8F5] border border-[#DDD1BD] rounded-2xl space-y-3.5 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#8F7A56]" />
          <span className="font-bold text-[#322A1B] text-xs sm:text-sm">
            대표 특별 할인 및 금액 직접 조정
          </span>
        </div>
        {manualAmount !== 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
          >
            조정 초기화
          </button>
        )}
      </div>

      <p className="text-[11.5px] text-[#8F7A56] leading-relaxed">
        대체공휴일 할인, 지인 할인 등 대표 재량으로 계약 총액을 직접 할인하거나 변경할 수 있습니다.
      </p>

      {/* 추천 사유 빠른 선택 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-[#8F7A56] font-medium mr-1">빠른 사유:</span>
        {['지인 특별 할인', '대체공휴일 할인', '프로모션 추가 할인', '일정 조정 감사'].map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={() => onReasonChange(reason)}
            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
              manualReason === reason
                ? 'bg-[#322A1B] text-[#FAF8F5] border-[#322A1B] font-semibold'
                : 'bg-white text-[#6E5C3D] border-[#DDD1BD] hover:bg-[#F5F1EA]'
            }`}
          >
            {reason}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* 사유 직접 입력 */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6E5C3D] mb-1">
            할인 / 조정 사유 (계약서 표기)
          </label>
          <input
            type="text"
            placeholder="예: 지인 특별 할인, 대체공휴일 등"
            value={manualReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-[#DDD1BD] focus:border-[#322A1B] rounded-xl text-xs text-[#322A1B] font-medium"
          />
        </div>

        {/* 조정 금액 직접 입력 */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6E5C3D] mb-1">
            할인 / 조정 금액 (원, 할인은 마이너스)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="예: -50000, -100000"
              value={manualAmount ? String(manualAmount) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9-]/g, '');
                const val = parseInt(raw, 10) || 0;
                onAmountChange(val);
                if (!manualReason) onReasonChange('대표 특별 할인');
              }}
              className="w-full h-10 px-3 bg-white border border-[#DDD1BD] focus:border-[#322A1B] rounded-xl text-xs text-[#322A1B] font-bold tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* 최종 계약금액 직접 지정으로 맞추기 */}
      <div className="pt-2 border-t border-[#EBE3D5] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 text-[11px] text-[#6E5C3D]">
          <Calculator className="w-3.5 h-3.5 text-[#8F7A56]" />
          <span>또는 <strong>최종 계약금액을 직접 입력</strong>하여 맞추기:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            placeholder="예: 1100000"
            value={targetTotalInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              onTargetTotalChange(raw);
              if (raw) {
                const targetNum = parseInt(raw, 10);
                const diff = targetNum - basePlusOptionsMinusDiscounts;
                onAmountChange(diff);
                if (!manualReason) onReasonChange('대표 특별 금액 조정');
              }
            }}
            className="w-36 h-9 px-2.5 bg-white border border-[#DDD1BD] focus:border-[#322A1B] rounded-lg text-xs font-bold text-right tabular-nums text-[#322A1B]"
          />
          <span className="text-xs font-semibold text-[#322A1B]">원</span>
        </div>
      </div>

      {/* 현재 적용 상태 피드백 */}
      {manualAmount !== 0 && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between font-medium animate-fade-in">
          <span>
            ✓ {manualReason || '특별 조정'}: <strong>{manualAmount > 0 ? `+${formatKRW(manualAmount)}` : formatKRW(manualAmount)}</strong> 적용 중
          </span>
          <span className="text-emerald-700 font-bold">최종 {formatKRW(contractTotal)}</span>
        </div>
      )}
    </div>
  );
};

export const RepresentativeReviewView: React.FC<RepresentativeReviewViewProps> = ({
  token,
  contractId,
  initialData,
  initialPricing,
  isAlreadySent: initialAlreadySent,
  sentAt: initialSentAt,
  contractNumber: initialContractNumber,
}) => {
  const [formData, setFormData] = useState<ContractFormData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isAlreadySent, setIsAlreadySent] = useState(initialAlreadySent);
  const [sentAt, setSentAt] = useState(initialSentAt);
  const [contractNumber, setContractNumber] = useState(initialContractNumber || 'DM-TEMP');

  // 수동 조정 모달/인풋 토글
  const [showManualAdjustment, setShowManualAdjustment] = useState(
    !!initialData.manualAdjustment && initialData.manualAdjustment.amount !== 0
  );
  const [manualAmount, setManualAmount] = useState<number>(initialData.manualAdjustment?.amount || 0);
  const [manualReason, setManualReason] = useState<string>(initialData.manualAdjustment?.reason || '');
  const [targetTotalInput, setTargetTotalInput] = useState<string>('');

  // 실시간 재계산
  const [pricing, setPricing] = useState<PriceCalculationResult>(initialPricing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 데이터 변경 시 가격 자동 재계산 (Acceptance Test #62 대표 수정 시 자동 재계산)
  useEffect(() => {
    const updatedPricing = calculateContractPrice({
      productId: formData.productId,
      optionIds: formData.optionIds,
      weddingDate: formData.weddingDate,
      partnerDiscount: formData.partnerDiscount,
      partnerName: formData.partnerName,
      portfolioConsent: formData.portfolioConsent,
      reviewContractCashback: formData.reviewContractCashback,
      reviewMainCashback: formData.reviewMainCashback,
      manualAdjustment:
        manualAmount !== 0 && manualReason.trim()
          ? { amount: manualAmount, reason: manualReason }
          : undefined,
    });
    setPricing(updatedPricing);
  }, [formData, manualAmount, manualReason]);

  // 최종 계약서 발송 핸들러 (POST /api/approve-and-send)
  const handleApproveAndSend = async () => {
    if (isAlreadySent || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. 브라우저에서 A4 고화질 PDF 및 JPG 생성
      let pdfBase64 = '';
      let jpgBase64 = '';
      try {
        const docResult = await exportContractToPdfAndJpg('review-contract-doc-preview', contractNumber);
        pdfBase64 = docResult.pdfBase64;
        jpgBase64 = docResult.jpgBase64 || '';
      } catch (docErr) {
        console.warn('클라이언트 PDF 생성 경고 (백엔드 fallback 진행):', docErr);
      }

      // 2. 대표 최종 발송 API 호출 (POST)
      const res = await fetch('/api/approve-and-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          updatedData: {
            ...formData,
            manualAdjustment:
              manualAmount !== 0 && manualReason.trim()
                ? { amount: manualAmount, reason: manualReason }
                : undefined,
          },
          pdfBase64,
          jpgBase64,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || '계약서 발송에 실패했습니다.');
      }

      setContractNumber(result.contractNumber);
      setIsAlreadySent(true);
      setSentAt(new Date().toISOString());
      setSendSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || '발송 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weddingDateFormatted = formData.weddingDate.replace(/-/g, '.');
  const product = getProductById(formData.productId);
  const selectedOptionObjects = formData.optionIds
    .map((id) => getOptionById(id))
    .filter(Boolean);
  const selectedOptions = selectedOptionObjects.map((opt) => opt!.name);
  const basePlusOptionsMinusDiscounts = (pricing.basePrice || 0) + (pricing.optionTotal || 0) - (pricing.immediateDiscountTotal || 0);

  return (
    <>
      {isAlreadySent && !sendSuccess ? (
        <div className="max-w-xl mx-auto my-12 p-8 bg-[#FFFFFF] border border-[#EBE3D5] rounded-3xl text-center space-y-5 shadow-sm animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#F5F1EA] text-[#8F7A56] flex items-center justify-center mx-auto">
            <FileCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#322A1B]">
            이미 발송이 완료된 계약건입니다
          </h2>
          <p className="text-xs text-[#6E5C3D] leading-relaxed">
            계약번호: <strong>{contractNumber}</strong><br />
            발송일시: {sentAt ? new Date(sentAt).toLocaleString('ko-KR') : '확인 완료'}
          </p>
          <p className="text-xs text-[#8F7A56]">
            고객({formData.email}) 및 대표 이메일로 계약서 PDF가 이미 발송되었습니다. 중복 발송을 방지하기 위해 추가 발송이 제한됩니다.
          </p>
        </div>
      ) : sendSuccess ? (
        <div className="max-w-xl mx-auto my-12 p-8 bg-[#FFFFFF] border border-[#EBE3D5] rounded-3xl text-center space-y-6 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#DDD1BD] text-[#8F7A56] flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#8F7A56] uppercase">
              DEAR MEMORY
            </p>
            <h2 className="text-2xl font-serif font-bold text-[#322A1B] mt-1">
              최종 계약서 발송 완료
            </h2>
            <p className="text-xs sm:text-sm text-[#6E5C3D] mt-2">
              고객(<strong className="text-[#322A1B]">{formData.email}</strong>) 및 대표 메일로 계약서 PDF가 정상 발송되었습니다.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl text-xs space-y-1.5 text-left text-[#6E5C3D]">
            <div className="flex justify-between">
              <span className="text-[#8F7A56]">계약번호:</span>
              <span className="font-semibold text-[#322A1B]">{contractNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8F7A56]">예식일자:</span>
              <span>{weddingDateFormatted} {formData.weddingTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8F7A56]">신랑/신부:</span>
              <span>{formData.groomName} · {formData.brideName}</span>
            </div>
            <div className="flex justify-between border-t border-[#EBE3D5] pt-1.5 font-medium">
              <span>최종 계약금액:</span>
              <span className="text-[#322A1B] font-bold">{formatKRW(pricing.contractTotal)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await exportContractToPdfAndJpg('review-contract-doc-preview', contractNumber);
                  triggerFileDownload(res.pdfBlob, `${contractNumber}_${formData.groomName}_${formData.brideName}_촬영계약서.pdf`);
                } catch (e) {
                  alert('PDF 다운로드 중 오류가 발생했습니다.');
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#322A1B] text-[#FAF8F5] rounded-xl text-xs font-semibold hover:bg-[#1E1910] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>계약서 PDF 다운로드 보관</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#8F7A56] uppercase">
            REPRESENTATIVE REVIEW
          </span>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#322A1B]">
            계약서 발송 확인 및 검토
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
            isEditing
              ? 'bg-[#322A1B] text-[#FAF8F5] border-[#322A1B]'
              : 'bg-white text-[#6E5C3D] border-[#DDD1BD] hover:bg-[#FAF8F5]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? '수정 완료' : '내용 수정'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 대표 검토 카드 */}
      <div className="bg-[#FFFFFF] border border-[#EBE3D5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* 헤더: 고객명 및 예식정보 */}
        <div className="text-center pb-5 border-b border-[#F5F1EA]">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#322A1B]">
            {formData.groomName} ♥ {formData.brideName}
          </h3>
          <p className="text-sm font-medium text-[#6E5C3D] mt-1">
            {weddingDateFormatted} {formData.weddingTime}
          </p>
          <p className="text-xs text-[#8F7A56] mt-0.5">
            {formData.weddingVenue} {formData.weddingHall}
          </p>
        </div>

        {/* 1. 내용 수정 모드 폼 (대표가 수정할 수 있는 입력란들) */}
        {isEditing ? (
          <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-4 text-xs">
            <h4 className="font-semibold text-[#322A1B] text-sm flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#8F7A56]" />
              <span>계약 내용 수정 (수정 시 금액 자동 재계산)</span>
            </h4>

            {/* 신랑/신부/이메일 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#8F7A56] mb-1">신랑 성명</label>
                <input
                  type="text"
                  value={formData.groomName}
                  onChange={(e) => setFormData({ ...formData, groomName: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">신랑 연락처</label>
                <input
                  type="text"
                  value={formData.groomPhone}
                  onChange={(e) => setFormData({ ...formData, groomPhone: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[#8F7A56] mb-1">신랑 직계 가족구성원</label>
                <input
                  type="text"
                  value={formData.groomFamilyMembers || ''}
                  onChange={(e) => setFormData({ ...formData, groomFamilyMembers: e.target.value })}
                  placeholder="예: 부모님, 누나 1명"
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">신부 성명</label>
                <input
                  type="text"
                  value={formData.brideName}
                  onChange={(e) => setFormData({ ...formData, brideName: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">신부 연락처</label>
                <input
                  type="text"
                  value={formData.bridePhone}
                  onChange={(e) => setFormData({ ...formData, bridePhone: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[#8F7A56] mb-1">신부 직계 가족구성원</label>
                <input
                  type="text"
                  value={formData.brideFamilyMembers || ''}
                  onChange={(e) => setFormData({ ...formData, brideFamilyMembers: e.target.value })}
                  placeholder="예: 부모님, 남동생 1명"
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[#8F7A56] mb-1">계약서 수신 이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg font-medium text-xs"
                />
              </div>
            </div>

            {/* 예식 일시 및 웨딩홀 & 메이크업 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DDD1BD]">
              <div>
                <label className="block text-[#8F7A56] mb-1">예식일자</label>
                <input
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">예식시간</label>
                <input
                  type="time"
                  value={formData.weddingTime}
                  onChange={(e) => setFormData({ ...formData, weddingTime: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">웨딩홀</label>
                <input
                  type="text"
                  value={formData.weddingVenue}
                  onChange={(e) => setFormData({ ...formData, weddingVenue: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">홀명칭</label>
                <input
                  type="text"
                  value={formData.weddingHall}
                  onChange={(e) => setFormData({ ...formData, weddingHall: e.target.value })}
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[#8F7A56] mb-1">메이크업 장소 / in, out 시간</label>
                <input
                  type="text"
                  value={formData.makeupLocation || ''}
                  onChange={(e) => setFormData({ ...formData, makeupLocation: e.target.value })}
                  placeholder="예: 꼼나나 비앙 / in 07:00, out 10:30 (미정이면 미정)"
                  className="w-full h-9 px-2.5 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
            </div>

            {/* 상품 선택 변경 (실속형 / 화보형) */}
            <div className="pt-2 border-t border-[#DDD1BD]">
              <label className="block text-[#8F7A56] mb-1.5 font-medium">촬영 상품 변경</label>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCTS_CONFIG.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, productId: p.id })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      formData.productId === p.id
                        ? 'bg-white border-[#322A1B] ring-1 ring-[#322A1B]'
                        : 'bg-white/60 border-[#DDD1BD]'
                    }`}
                  >
                    <div className="font-semibold text-[#322A1B]">{p.name}</div>
                    <div className="text-[11px] text-[#8F7A56]">{formatKRW(p.basePrice)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 옵션 토글 */}
            <div className="pt-2 border-t border-[#DDD1BD]">
              <label className="block text-[#8F7A56] mb-1.5 font-medium">추가 옵션</label>
              <div className="grid grid-cols-2 gap-2">
                {OPTIONS_CONFIG.map((opt) => {
                  const hasOpt = formData.optionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const newOpts = hasOpt
                          ? formData.optionIds.filter((id) => id !== opt.id)
                          : [...formData.optionIds, opt.id];
                        setFormData({ ...formData, optionIds: newOpts });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        hasOpt
                          ? 'bg-white border-[#322A1B] ring-1 ring-[#322A1B]'
                          : 'bg-white/60 border-[#DDD1BD]'
                      }`}
                    >
                      <div className="font-medium text-[#322A1B]">{opt.name}</div>
                      <div className="text-[11px] text-[#8F7A56]">+{formatKRW(opt.price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 할인 옵션 */}
            <div className="pt-2 border-t border-[#DDD1BD] space-y-2">
              <label className="block text-[#8F7A56] mb-1 font-medium">할인 및 동의</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.partnerDiscount}
                  onChange={(e) => setFormData({ ...formData, partnerDiscount: e.target.checked })}
                  className="rounded"
                />
                <span>짝꿍 할인 (-50,000원)</span>
              </label>
              {formData.partnerDiscount && (
                <input
                  type="text"
                  placeholder="짝꿍 성함"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  className="w-full h-8 px-2 bg-white border border-[#DDD1BD] rounded text-xs"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.portfolioConsent}
                  onChange={(e) => setFormData({ ...formData, portfolioConsent: e.target.checked })}
                  className="rounded"
                />
                <span>사진 공개 감사 할인 (-100,000원)</span>
              </label>
            </div>

            {/* 대표 특별 할인 및 금액 직접 조정 */}
            <div className="pt-2 border-t border-[#DDD1BD]">
              <ManualAdjustmentControl
                manualAmount={manualAmount}
                manualReason={manualReason}
                targetTotalInput={targetTotalInput}
                basePlusOptionsMinusDiscounts={basePlusOptionsMinusDiscounts}
                contractTotal={pricing.contractTotal}
                onAmountChange={(amt) => setManualAmount(amt)}
                onReasonChange={(rsn) => setManualReason(rsn)}
                onTargetTotalChange={(tgt) => setTargetTotalInput(tgt)}
                onReset={() => {
                  setManualAmount(0);
                  setManualReason('');
                  setTargetTotalInput('');
                }}
              />
            </div>

            {/* 요청사항 및 SNS */}
            <div className="pt-2 border-t border-[#DDD1BD] space-y-3">
              <label className="block text-[#8F7A56] font-medium">세부 요청사항 및 참고정보</label>
              <div>
                <label className="block text-[#8F7A56] mb-1">촬영 시 요청사항</label>
                <textarea
                  rows={2}
                  value={formData.shootRequestNotes || ''}
                  onChange={(e) => setFormData({ ...formData, shootRequestNotes: e.target.value })}
                  placeholder="예: 신부 좌측 얼굴 선호, 양가 부모님 사진 다양하게"
                  className="w-full p-2 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">후보정 시 요청사항</label>
                <textarea
                  rows={2}
                  value={formData.retouchRequestNotes || ''}
                  onChange={(e) => setFormData({ ...formData, retouchRequestNotes: e.target.value })}
                  placeholder="예: 자연스러운 피부톤, 체형 라인 보정"
                  className="w-full p-2 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[#8F7A56] mb-1">기타 요청사항</label>
                <textarea
                  rows={2}
                  value={formData.requestNotes || ''}
                  onChange={(e) => setFormData({ ...formData, requestNotes: e.target.value })}
                  placeholder="추가 전달사항"
                  className="w-full p-2 bg-white border border-[#DDD1BD] rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#8F7A56] mb-1">알게 된 경로</label>
                  <input
                    type="text"
                    value={formData.referralSource || ''}
                    onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                    placeholder="인스타그램, 블로그 등"
                    className="w-full h-8 px-2 bg-white border border-[#DDD1BD] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#8F7A56] mb-1">인스타그램 ID</label>
                  <input
                    type="text"
                    value={formData.instagramId || ''}
                    onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                    placeholder="@아이디"
                    className="w-full h-8 px-2 bg-white border border-[#DDD1BD] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[#8F7A56] mb-1">블로그 주소</label>
                  <input
                    type="text"
                    value={formData.blogUrl || ''}
                    onChange={(e) => setFormData({ ...formData, blogUrl: e.target.value })}
                    placeholder="블로그 URL"
                    className="w-full h-8 px-2 bg-white border border-[#DDD1BD] rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 2. 일반 뷰: 선택 상품 및 정산 내역 */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-2.5">
            <div className="flex justify-between font-medium pb-1.5 border-b border-[#EBE3D5]">
              <span className="text-[#8F7A56]">기본 상품</span>
              <span className="font-semibold text-[#322A1B] tabular-nums">{product?.name} ({formatKRW(pricing.basePrice)})</span>
            </div>

            {/* 추가 옵션 개별 내역 및 금액 */}
            {selectedOptionObjects.length > 0 ? (
              <div className="space-y-1.5 py-0.5">
                {selectedOptionObjects.map((opt) => (
                  <div key={opt!.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#6E5C3D]">+ {opt!.name}</span>
                    <span className="font-semibold text-[#6E5C3D] tabular-nums">+{formatKRW(opt!.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between text-xs text-[#8F7A56]">
                <span>추가 옵션</span>
                <span>없음</span>
              </div>
            )}

            {/* 즉시 할인 상세 개별 분리 */}
            {pricing.immediateDiscountTotal > 0 && (
              <div className="space-y-1.5 py-1 border-t border-[#EBE3D5] text-xs sm:text-sm text-[#B09A74]">
                {pricing.isSunday && (
                  <div className="flex justify-between">
                    <span>일요일 예식 특별 할인</span>
                    <span className="font-semibold tabular-nums">-100,000원</span>
                  </div>
                )}
                {formData.partnerDiscount && (
                  <div className="flex justify-between">
                    <span>짝꿍 추천 할인 {formData.partnerName ? `(${formData.partnerName})` : ''}</span>
                    <span className="font-semibold tabular-nums">-50,000원</span>
                  </div>
                )}
                {formData.portfolioConsent && (
                  <div className="flex justify-between">
                    <span>사진 공개 감사 할인 (포트폴리오)</span>
                    <span className="font-semibold tabular-nums">-100,000원</span>
                  </div>
                )}
              </div>
            )}

            {pricing.manualAdjustmentAmount !== 0 && (
              <div className="flex justify-between text-[#6E5C3D] py-1 border-t border-[#EBE3D5]">
                <span>수동 특약 조정 ({manualReason || '조정'})</span>
                <span className="tabular-nums font-semibold">
                  {pricing.manualAdjustmentAmount > 0 ? '+' : ''}
                  {formatKRW(pricing.manualAdjustmentAmount)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-[#DDD1BD] flex justify-between items-baseline">
              <span className="font-bold text-[#322A1B] text-sm shrink-0">최종 계약금액</span>
              <span className="text-2xl font-serif font-bold text-[#322A1B] tabular-nums whitespace-nowrap shrink-0">
                {formatKRW(pricing.contractTotal)}
              </span>
            </div>
          </div>

          {/* 후기 이벤트 요약 */}
          {pricing.futureCashbackTotal > 0 && (
            <div className="p-3 bg-[#F5F1EA] border border-[#DDD1BD] rounded-xl text-xs flex justify-between items-center text-[#6E5C3D]">
              <span className="break-keep">후기 이벤트 (잔금 차감 또는 페이백)</span>
              <span className="font-bold text-[#322A1B] tabular-nums whitespace-nowrap shrink-0">최대 {formatKRW(pricing.futureCashbackTotal)}</span>
            </div>
          )}

          {/* 대표 수동 특약 금액 조정 카드 (상시 노출) */}
          {!isEditing && (
            <ManualAdjustmentControl
              manualAmount={manualAmount}
              manualReason={manualReason}
              targetTotalInput={targetTotalInput}
              basePlusOptionsMinusDiscounts={basePlusOptionsMinusDiscounts}
              contractTotal={pricing.contractTotal}
              onAmountChange={(amt) => setManualAmount(amt)}
              onReasonChange={(rsn) => setManualReason(rsn)}
              onTargetTotalChange={(tgt) => setTargetTotalInput(tgt)}
              onReset={() => {
                setManualAmount(0);
                setManualReason('');
                setTargetTotalInput('');
              }}
            />
          )}

          {/* 고객 입력 상세 정보 카드 (메이크업, 가족구성, 세부 요청사항, SNS) */}
          <div className="p-4 bg-[#FFFFFF] border border-[#EBE3D5] rounded-2xl text-xs space-y-3 text-[#6E5C3D]">
            <h4 className="font-semibold text-[#322A1B] border-b border-[#F5F1EA] pb-2">고객 신청 세부 정보</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {formData.makeupLocation && (
                <div className="sm:col-span-2">
                  <span className="text-[#8F7A56] font-medium">메이크업: </span>
                  <span className="text-[#322A1B]">{formData.makeupLocation}</span>
                </div>
              )}
              {formData.groomFamilyMembers && (
                <div>
                  <span className="text-[#8F7A56] font-medium">신랑 직계가족: </span>
                  <span className="text-[#322A1B]">{formData.groomFamilyMembers}</span>
                </div>
              )}
              {formData.brideFamilyMembers && (
                <div>
                  <span className="text-[#8F7A56] font-medium">신부 직계가족: </span>
                  <span className="text-[#322A1B]">{formData.brideFamilyMembers}</span>
                </div>
              )}
              {formData.referralSource && (
                <div>
                  <span className="text-[#8F7A56] font-medium">알게 된 경로: </span>
                  <span className="text-[#322A1B]">{formData.referralSource}</span>
                </div>
              )}
              {(formData.instagramId || formData.blogUrl) && (
                <div>
                  <span className="text-[#8F7A56] font-medium">SNS: </span>
                  <span className="text-[#322A1B]">
                    {[formData.instagramId && `인스타 @${formData.instagramId.replace(/^@/, '')}`, formData.blogUrl && `블로그 ${formData.blogUrl}`].filter(Boolean).join(' / ')}
                  </span>
                </div>
              )}
            </div>

            {formData.shootRequestNotes && (
              <div className="pt-1">
                <span className="text-[#8F7A56] font-medium block mb-0.5">촬영 시 요청사항:</span>
                <p className="bg-[#FAF8F5] p-2 rounded border border-[#F0EAE1] text-[#322A1B] whitespace-pre-wrap">{formData.shootRequestNotes}</p>
              </div>
            )}
            {formData.retouchRequestNotes && (
              <div className="pt-1">
                <span className="text-[#8F7A56] font-medium block mb-0.5">후보정 시 요청사항:</span>
                <p className="bg-[#FAF8F5] p-2 rounded border border-[#F0EAE1] text-[#322A1B] whitespace-pre-wrap">{formData.retouchRequestNotes}</p>
              </div>
            )}
            {formData.requestNotes && (
              <div className="pt-1">
                <span className="text-[#8F7A56] font-medium block mb-0.5">기타 요청사항:</span>
                <p className="bg-[#FAF8F5] p-2 rounded border border-[#F0EAE1] text-[#322A1B] whitespace-pre-wrap">{formData.requestNotes}</p>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* 발송 액션 버튼 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleApproveAndSend}
          disabled={isSubmitting || isAlreadySent}
          className="w-full h-14 bg-[#322A1B] text-[#FAF8F5] rounded-2xl text-sm font-semibold hover:bg-[#1E1910] transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#FAF8F5] border-t-transparent rounded-full animate-spin" />
              <span>계약서 PDF 생성 및 발송 중...</span>
            </div>
          ) : (
            <>
              <span>최종 계약서 발송하기</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-[#8F7A56] mt-2">
          * 최종 발송 버튼 클릭 시 PDF가 생성되어 고객 및 대표 메일로 즉시 자동 전송됩니다.
        </p>
      </div>

        </div>
      )}

      {/* 백그라운드 계약서 렌더링 (PDF/JPG 캡처 소스: DOM 상에 상시 존재하되 화면 밖 배치) */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -100,
          pointerEvents: 'none',
          opacity: 1, // 화면 밖 배치 상태에서 100% 원본 선명도 및 텍스트 안티앨리어싱 보장
        }}
        aria-hidden="true"
      >
        <ContractDocument
          id="review-contract-doc-preview"
          contractNumber={contractNumber}
          data={formData}
          pricing={pricing}
        />
      </div>
    </>
  );
};
