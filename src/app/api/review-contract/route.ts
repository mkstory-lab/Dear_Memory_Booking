import { NextRequest, NextResponse } from 'next/server';
import { verifyApprovalToken } from '@/lib/token';
import { calculateContractPrice } from '@/lib/pricing';
import { isContractAlreadySent, getSentRecord } from '@/lib/idempotency';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: '보안 승인 토큰이 전달되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 토큰 복호화 및 유효성 검증
    const decoded = verifyApprovalToken(token);
    const { contractId, data } = decoded;

    // 중복 발송 여부 확인
    const alreadySent = isContractAlreadySent(contractId);
    const sentRecord = alreadySent ? getSentRecord(contractId) : undefined;

    // 가격 계산
    const pricing = calculateContractPrice({
      productId: data.productId,
      optionIds: data.optionIds,
      weddingDate: data.weddingDate,
      partnerDiscount: data.partnerDiscount,
      partnerName: data.partnerName,
      portfolioConsent: data.portfolioConsent,
      reviewContractCashback: data.reviewContractCashback,
      reviewMainCashback: data.reviewMainCashback,
      manualAdjustment: data.manualAdjustment,
    });

    return NextResponse.json({
      success: true,
      contractId,
      data,
      pricing,
      isAlreadySent: alreadySent,
      sentAt: sentRecord?.sentAt,
      contractNumber: sentRecord?.contractNumber,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `승인 정보 확인 실패: ${err.message}`,
      },
      { status: 400 }
    );
  }
}
