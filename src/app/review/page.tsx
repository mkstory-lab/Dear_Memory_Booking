'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { RepresentativeReviewView } from '@/components/review/RepresentativeReviewView';
import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DemoMailboxModal } from '@/components/demo/DemoMailboxModal';

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<{
    contractId: string;
    data: ContractFormData;
    pricing: PriceCalculationResult;
    isAlreadySent: boolean;
    sentAt?: string;
    contractNumber?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('보안 승인 토큰이 전달되지 않았습니다. 이메일 링크를 다시 확인해 주세요.');
      setLoading(false);
      return;
    }

    // 서버로 GET 요청하여 토큰 복호화 및 데이터 조회 (주의: 절대 발송 처리 안 됨!)
    const fetchContractDetails = async () => {
      try {
        const res = await fetch(`/api/review-contract?token=${encodeURIComponent(token)}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || '계약 정보를 불러올 수 없습니다.');
        }

        setContractData({
          contractId: result.contractId,
          data: result.data,
          pricing: result.pricing,
          isAlreadySent: result.isAlreadySent,
          sentAt: result.sentAt,
          contractNumber: result.contractNumber,
        });
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetails();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* 간결한 브랜드 헤더 */}
      <Header
        title="계약서 발송 확인"
        subtitle="접수된 신규 계약정보를 확인하고 최종 계약서를 발송합니다."
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#8F7A56]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs">보안 토큰을 검증하고 계약정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-12 p-6 bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#322A1B]">확인 링크 접근 오류</h3>
            <p className="text-xs text-[#6E5C3D] leading-relaxed">{error}</p>
          </div>
        ) : contractData ? (
          <RepresentativeReviewView
            token={token!}
            contractId={contractData.contractId}
            initialData={contractData.data}
            initialPricing={contractData.pricing}
            isAlreadySent={contractData.isAlreadySent}
            sentAt={contractData.sentAt}
            contractNumber={contractData.contractNumber}
          />
        ) : null}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-[#EBE3D5] py-6 text-center text-xs text-[#8F7A56]">
        <p>DEAR MEMORY FOR BOOKING &bull; 한민규 대표 전용 승인 페이지</p>
      </footer>

      {/* 데모 메일함 */}
      <DemoMailboxModal />
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-[#8F7A56]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
