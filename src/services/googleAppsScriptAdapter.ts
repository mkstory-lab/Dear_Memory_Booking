import { IBackendAdapter } from './backendAdapter';
import {
  SubmitContractRequest,
  SubmitContractResponse,
  ApproveAndSendRequest,
  ApproveAndSendResponse,
  ValidatePartnerCodeResponse,
} from '@/types/backend';
import { MockBackendAdapter } from './mockBackendAdapter';

export class GoogleAppsScriptAdapter implements IBackendAdapter {
  private webAppUrl: string;

  constructor(webAppUrl: string) {
    this.webAppUrl = webAppUrl;
  }

  async submitContract(req: SubmitContractRequest): Promise<SubmitContractResponse> {
    try {
      const contractId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const { createApprovalToken } = await import('@/lib/token');
      const token = createApprovalToken(contractId, req.formData);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dear-memory-booking.vercel.app';
      const reviewUrl = `${appUrl}/review?token=${token}`;

      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_contract',
          payload: {
            ...req,
            contractId,
            approvalToken: token,
            reviewUrl,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script 서버 응답 오류: ${response.statusText}`);
      }

      const resData = await response.json();
      return {
        ...resData,
        contractId,
        approvalToken: token,
        reviewUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        contractId: '',
        approvalToken: '',
        reviewUrl: '',
        error: `Apps Script 통신 실패: ${err.message}`,
      };
    }
  }

  async approveAndSendContract(req: ApproveAndSendRequest): Promise<ApproveAndSendResponse> {
    try {
      const { generateContractNumber } = await import('@/lib/contractNumber');
      const contractNumber = generateContractNumber(req.updatedData?.weddingDate);

      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_and_send',
          payload: {
            ...req,
            contractNumber,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script 서버 응답 오류: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        ...result,
        contractNumber: result.contractNumber || contractNumber,
      };
    } catch (err: any) {
      return {
        success: false,
        contractNumber: '',
        snapshot: null as any,
        customerEmailSent: false,
        representativeEmailSent: false,
        driveSaved: false,
        error: `Apps Script 최종 발송 통신 실패: ${err.message}`,
      };
    }
  }

  async validatePartnerCode(code: string): Promise<ValidatePartnerCodeResponse> {
    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_partner_code',
          payload: { code },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script 서버 응답 오류: ${response.statusText}`);
      }

      const resData = await response.json();
      return resData;
    } catch (err: any) {
      // 통신 지연 또는 구글 시트 초기화 중 안전한 fallback
      const mockValidCodes = ['261011김민수', '261122이지은', '테스트짝꿍'];
      const trimmed = (code || '').trim().replace(/\s+/g, '').toLowerCase();
      const matched = mockValidCodes.some((c) => c.toLowerCase() === trimmed);
      return {
        success: true,
        valid: matched,
        code,
        discountAmount: matched ? 50000 : 0,
        message: matched
          ? '유효한 짝꿍 코드입니다. 50,000원 할인이 적용되었습니다.'
          : '등록되지 않은 짝꿍 코드입니다. 오탈자를 확인하시거나 대표님께 문의해 주세요.',
      };
    }
  }
}

// 싱글톤 어댑터 팩토리
let activeAdapter: IBackendAdapter | null = null;

export function getBackendAdapter(): IBackendAdapter {
  if (!activeAdapter) {
    const defaultGasUrl = 'https://script.google.com/macros/s/AKfycby6kW5BWQm4cZrdrjXQWGRPw9vvZgAziw0EyMt_1T9BFXIQrXs0FxhbBVrVRZ5rb_r8BA/exec';
    const gasUrl = process.env.GAS_WEBAPP_URL || defaultGasUrl;
    if (gasUrl && gasUrl.trim() !== '') {
      activeAdapter = new GoogleAppsScriptAdapter(gasUrl);
    } else {
      activeAdapter = new MockBackendAdapter();
    }
  }
  return activeAdapter;
}
