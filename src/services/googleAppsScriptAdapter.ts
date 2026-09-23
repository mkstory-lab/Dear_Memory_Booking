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
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_contract',
          payload: req,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script 서버 응답 오류: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_and_send',
          payload: req,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script 서버 응답 오류: ${response.statusText}`);
      }

      return await response.json();
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
    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (gasUrl && gasUrl.trim() !== '') {
      activeAdapter = new GoogleAppsScriptAdapter(gasUrl);
    } else {
      activeAdapter = new MockBackendAdapter();
    }
  }
  return activeAdapter;
}
