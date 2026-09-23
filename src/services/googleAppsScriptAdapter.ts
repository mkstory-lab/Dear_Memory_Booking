import { IBackendAdapter } from './backendAdapter';
import {
  SubmitContractRequest,
  SubmitContractResponse,
  ApproveAndSendRequest,
  ApproveAndSendResponse,
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
}

// 싱글톤 어댑터 팩토리
let activeAdapter: IBackendAdapter | null = null;

export function getBackendAdapter(): IBackendAdapter {
  if (!activeAdapter) {
    const defaultGasUrl = 'https://script.google.com/macros/s/AKfycbxJ9SkHKRfA_SeG9cGi2m3zney4pKyrkglNTD8mjIfNXk5DGLGazcnpRwd4qYW2N-q5mg/exec';
    const gasUrl = process.env.GAS_WEBAPP_URL || defaultGasUrl;
    if (gasUrl && gasUrl.trim() !== '') {
      activeAdapter = new GoogleAppsScriptAdapter(gasUrl);
    } else {
      activeAdapter = new MockBackendAdapter();
    }
  }
  return activeAdapter;
}
