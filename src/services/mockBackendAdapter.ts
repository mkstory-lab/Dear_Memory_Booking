import { IBackendAdapter } from './backendAdapter';
import {
  SubmitContractRequest,
  SubmitContractResponse,
  ApproveAndSendRequest,
  ApproveAndSendResponse,
  SentEmailRecord,
} from '@/types/backend';
import { calculateContractPrice } from '@/lib/pricing';
import { createApprovalToken, verifyApprovalToken } from '@/lib/token';
import { generateContractNumber } from '@/lib/contractNumber';
import {
  isContractAlreadySent,
  getSentRecord,
  markContractAsSent,
  acquireSendLock,
  releaseSendLock,
} from '@/lib/idempotency';
import {
  generateRepresentativeNotificationEmail,
  generateCustomerContractEmail,
  generateRepresentativeSentConfirmationEmail,
} from '@/lib/emailTemplates';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { ContractSnapshot } from '@/types/contract';

// 인메모리 가상 메일함
const mockMailbox: SentEmailRecord[] = [];

export class MockBackendAdapter implements IBackendAdapter {
  private repEmail = process.env.DEAR_MEMORY_REP_EMAIL || 'ldj.korea@gmail.com';
  private appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  async submitContract(req: SubmitContractRequest): Promise<SubmitContractResponse> {
    const { formData } = req;

    // 기본 필수 항목 검증
    if (!formData.groomName || !formData.brideName || !formData.email || !formData.weddingDate) {
      return {
        success: false,
        contractId: '',
        approvalToken: '',
        reviewUrl: '',
        error: '필수 예식 정보 또는 고객 정보가 누락되었습니다.',
      };
    }

    if (formData.partnerDiscount && (!formData.partnerName || !formData.partnerName.trim())) {
      return {
        success: false,
        contractId: '',
        approvalToken: '',
        reviewUrl: '',
        error: '짝꿍 할인을 선택하신 경우 짝꿍 성함을 반드시 입력해 주셔야 합니다.',
      };
    }

    // 계약 ID 생성
    const contractId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 보안 승인 토큰 생성 (암호화 + HMAC 서명)
    const token = createApprovalToken(contractId, formData);
    const reviewUrl = `${this.appUrl}/review?token=${token}`;

    // 가격 계산
    const pricing = calculateContractPrice({
      productId: formData.productId,
      optionIds: formData.optionIds,
      weddingDate: formData.weddingDate,
      partnerDiscount: formData.partnerDiscount,
      partnerName: formData.partnerName,
      portfolioConsent: formData.portfolioConsent,
      reviewContractCashback: formData.reviewContractCashback,
      reviewMainCashback: formData.reviewMainCashback,
      manualAdjustment: formData.manualAdjustment,
    });

    // 대표 알림 이메일 렌더링 및 가상 메일함 저장
    const repMail = generateRepresentativeNotificationEmail(formData, pricing, reviewUrl);
    mockMailbox.unshift({
      id: `mail_${Date.now()}_rep`,
      to: this.repEmail,
      subject: repMail.subject,
      html: repMail.html,
      hasAttachment: false,
      sentAt: new Date().toISOString(),
      type: 'rep_notification',
    });

    return {
      success: true,
      contractId,
      approvalToken: token,
      reviewUrl,
      message: '신규 계약정보가 대표 메일로 정상 전달되었습니다.',
    };
  }

  async approveAndSendContract(req: ApproveAndSendRequest): Promise<ApproveAndSendResponse> {
    const { token, updatedData } = req;

    // 1. 토큰 검증 및 복호화
    let decoded;
    try {
      decoded = verifyApprovalToken(token);
    } catch (err: any) {
      return {
        success: false,
        contractNumber: '',
        snapshot: null as any,
        customerEmailSent: false,
        representativeEmailSent: false,
        driveSaved: false,
        error: `토큰 검증 오류: ${err.message}`,
      };
    }

    const { contractId, data: originalData } = decoded;

    // 2. 중복 발송 방지 (Idempotency 검사)
    if (isContractAlreadySent(contractId)) {
      const existing = getSentRecord(contractId)!;
      return {
        success: false,
        contractNumber: existing.contractNumber,
        snapshot: null as any,
        customerEmailSent: false,
        representativeEmailSent: false,
        driveSaved: false,
        error: `이미 발송이 완료된 계약건입니다. (발송일시: ${new Date(existing.sentAt).toLocaleString('ko-KR')}, 계약번호: ${existing.contractNumber})`,
      };
    }

    // 락 획득
    if (!acquireSendLock(contractId)) {
      return {
        success: false,
        contractNumber: '',
        snapshot: null as any,
        customerEmailSent: false,
        representativeEmailSent: false,
        driveSaved: false,
        error: '현재 발송 처리가 진행 중입니다. 잠시 후 다시 확인해 주세요.',
      };
    }

    try {
      // 3. 최종 데이터 확정 (대표가 수정한 경우 updatedData 적용)
      const finalData = updatedData || originalData;

      // 4. 가격 최종 계산
      const finalPricing = calculateContractPrice({
        productId: finalData.productId,
        optionIds: finalData.optionIds,
        weddingDate: finalData.weddingDate,
        partnerDiscount: finalData.partnerDiscount,
        partnerName: finalData.partnerName,
        portfolioConsent: finalData.portfolioConsent,
        reviewContractCashback: finalData.reviewContractCashback,
        reviewMainCashback: finalData.reviewMainCashback,
        manualAdjustment: finalData.manualAdjustment,
      });

      // 5. 계약 식별번호 생성 (DM-YYYYMMDD-XXXX)
      const contractNumber = generateContractNumber(finalData.weddingDate);

      // 6. 계약 스냅샷 생성
      const snapshot: ContractSnapshot = {
        contractNumber,
        id: contractId,
        data: finalData,
        pricing: finalPricing,
        termsVersion: CONTRACT_POLICY_CONFIG.version,
        generatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        status: 'sent',
      };

      // 7. 고객 이메일 발송 시뮬레이션 (PDF 첨부)
      const customerEmail = generateCustomerContractEmail(finalData, finalPricing, contractNumber);
      mockMailbox.unshift({
        id: `mail_${Date.now()}_cust`,
        to: finalData.email,
        subject: customerEmail.subject,
        html: customerEmail.html,
        hasAttachment: true,
        sentAt: new Date().toISOString(),
        type: 'customer_contract',
      });

      // 8. 대표 완료 이메일 발송 시뮬레이션 (PDF 첨부)
      const repConfirmEmail = generateRepresentativeSentConfirmationEmail(finalData, finalPricing, contractNumber);
      mockMailbox.unshift({
        id: `mail_${Date.now()}_rep_done`,
        to: this.repEmail,
        subject: repConfirmEmail.subject,
        html: repConfirmEmail.html,
        hasAttachment: true,
        sentAt: new Date().toISOString(),
        type: 'rep_confirmation',
      });

      // 9. 발송 완료 기록 (Idempotency 확정)
      markContractAsSent(contractId, contractNumber, finalData.email);

      // [TODO: V1.1] Google Drive 자동 저장 및 JPG 생성 기능 활성화 예정
      // const weddingYear = finalData.weddingDate.substring(0, 4);
      // const driveFolder = `Dear Memory/Contracts/${weddingYear}/${finalData.weddingDate}_${finalData.groomName}_${finalData.brideName}`;

      return {
        success: true,
        contractNumber,
        snapshot,
        customerEmailSent: true,
        representativeEmailSent: true,
        driveSaved: false, // V1.1에서 활성화
        message: '고객 및 대표 메일로 계약서 PDF 발송이 완료되었습니다.',
      };
    } finally {
      releaseSendLock(contractId);
    }
  }

  async getMockMailbox(): Promise<SentEmailRecord[]> {
    return [...mockMailbox];
  }

  // 테스트 및 데모 편의 메서드
  static clearMailbox(): void {
    mockMailbox.length = 0;
  }
}
