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
      // 직접 /review 접속 시: 대표 화면 기능 테스트 및 PDF 다운로드를 위한 최신 샘플 계약 데이터 제공
      const sampleData = {
        groomName: '강태양',
        groomPhone: '010-1234-5678',
        brideName: '이지은',
        bridePhone: '010-9876-5432',
        email: 'dearmemory@kakao.com',
        weddingDate: '2026-12-20',
        weddingTime: '12:30',
        weddingVenue: '라마다서울신도림호텔',
        weddingHall: '그랜드볼룸',
        productId: 'album_plus',
        optionIds: ['second_shooter'],
        portfolioConsent: true,
        partnerDiscount: false,
        reviewContractCashback: false,
        reviewMainCashback: false,
        shootRequestNotes: '',
        retouchRequestNotes: '',
        requestNotes: '',
        agreedToTerms: true,
      };

      const pricing = calculateContractPrice({
        productId: sampleData.productId,
        optionIds: sampleData.optionIds,
        weddingDate: sampleData.weddingDate,
        partnerDiscount: sampleData.partnerDiscount,
        portfolioConsent: sampleData.portfolioConsent,
        reviewContractCashback: false,
        reviewMainCashback: false,
      });

      return NextResponse.json({
        success: true,
        contractId: 'sample-contract-preview',
        data: sampleData,
        pricing,
        isAlreadySent: false,
        contractNumber: 'DM-20261220-01',
        isPreviewMode: true,
      });
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

    // 계약 식별 번호 (이미 발송된 번호 우선, 없으면 예식일 기반 정식 번호 생성)
    const { generateContractNumber } = await import('@/lib/contractNumber');
    const contractNumber = sentRecord?.contractNumber || generateContractNumber(data.weddingDate);

    return NextResponse.json({
      success: true,
      contractId,
      data,
      pricing,
      isAlreadySent: alreadySent,
      sentAt: sentRecord?.sentAt,
      contractNumber,
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
