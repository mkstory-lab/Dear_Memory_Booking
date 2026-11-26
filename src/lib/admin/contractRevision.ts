import { calculateContractPrice } from '@/lib/pricing';
import { getOptionById } from '@/config/options';
import { readApprovalTokenForAdmin } from '@/lib/token';
import { amounts, project, remainingBalance, type Event } from '@/lib/referrals/ledger';
import type { ContractFormData } from '@/types/contract';

export function revisionView(history: Event[], id: string, importedData?: ContractFormData) {
  const state = project(history), contract = state.contracts[id];
  if (!contract || contract.status === 'cancelled') throw new Error('수정할 계약을 찾을 수 없습니다.');
  const original = history.find(e => e.type === 'contract_delivery_result' && e.data.contractId === id && e.data.result?.customerEmailSent);
  if (!original && !contract.sentAt && !contract.driveFolderUrl) throw new Error('최초 발송이 완료된 계약만 수정할 수 있습니다.');
  const revisions = history.filter(e => e.type === 'contract_revision_completed' && e.data.contractId === id);
  const latest = revisions.at(-1);
  const pending = history.find(e => e.type === 'contract_revision_started' && e.data.contractId === id && !revisions.some(r => r.data.revisionId === e.data.revisionId));
  const delivery = history.find(e => e.type === 'contract_delivery_started' && e.data.contractId === id);
  let data: ContractFormData | undefined = latest?.data.finalData || delivery?.data.finalData;
  if (!data && contract.reviewUrl) {
    const token = new URL(contract.reviewUrl).searchParams.get('token');
    if (token) data = readApprovalTokenForAdmin(token).data;
  }
  const imported = !data && !!importedData;
  if (imported) {
    data = importedData;
    if (!data || data.groomName !== contract.groom || data.brideName !== contract.bride || data.weddingDate !== contract.weddingDate || calculateContractPrice(data).contractTotal !== contract.total) throw new Error('원본 계약서와 관리 원장의 이름·날짜·금액이 일치하지 않습니다. 확인 후 진행해 주세요.');
  }
  if (!data || !data.productId || !Array.isArray(data.optionIds)) throw new Error('원본 계약서 데이터를 확인할 수 없습니다.');
  const folderUrl: string = original?.data.result?.driveFolderUrl || contract.driveFolderUrl || '';
  const referral = Object.values(state.referrals).find(r => r.contractId === id && !r.cancelledAt);
  const benefitDeduction = Object.values(state.benefits).filter(b => b.contractId === id).reduce((n,b) => n + amounts(state,b).balance,0);
  const legacyPartnerDiscount = imported ? !!data.partnerDiscount && !referral : !!contract.legacyPartnerDiscount;
  return { contract, data, folderUrl, referral: !!referral, legacyPartnerDiscount, benefitDeduction, revision: revisions.length, pending: !!pending,
    originalTotal: calculateContractPrice(data).contractTotal, balance: remainingBalance(state,id),
    revisions: revisions.map(e => ({ revision: e.data.revision, at: e.at, total: calculateContractPrice(e.data.finalData).contractTotal, result: e.data.result })) };
}
export function validateRevision(view: ReturnType<typeof revisionView>, input: ContractFormData) {
  if (view.pending) throw new Error('이전 수정 발송 결과 확인이 필요합니다. 중복 발송하지 마세요.');
  if (!input || !['standard','album_plus'].includes(input.productId) || !Array.isArray(input.optionIds) ||
      input.optionIds.some(id => !getOptionById(id)?.active) || new Set(input.optionIds).size !== input.optionIds.length) throw new Error('상품과 옵션을 확인해 주세요.');
  const data = { ...view.data, productId: input.productId, optionIds: input.optionIds };
  for (const key of ['groomName','brideName','weddingDate','weddingTime','weddingVenue','weddingHall','email','partnerName','partnerDiscount','referralCode'] as const) {
    if (input[key] !== view.data[key]) throw new Error('고객 식별 정보, 예식 일정, 수신 이메일, 짝꿍 정보는 이 화면에서 변경할 수 없습니다.');
  }
  for (const key of ['groomPhone','bridePhone','groomFamilyMembers','brideFamilyMembers','makeupLocation','shootRequestNotes','retouchRequestNotes','requestNotes'] as const) {
    const value = input[key]; if (value !== undefined && (typeof value !== 'string' || value.length > 2000)) throw new Error('입력 내용을 확인해 주세요.');
    if (value !== undefined) data[key] = value;
  }
  for (const key of ['portfolioConsent','reviewContractCashback','reviewMainCashback'] as const) {
    if (typeof input[key] !== 'boolean') throw new Error('할인 내용을 확인해 주세요.');
    data[key] = input[key];
  }
  const adjustment = input.manualAdjustment;
  if (adjustment && (!Number.isSafeInteger(adjustment.amount) || Math.abs(adjustment.amount) > 10000000 || typeof adjustment.reason !== 'string' || !adjustment.reason.trim() || adjustment.reason.length > 200)) throw new Error('조정 금액과 사유를 확인해 주세요.');
  data.manualAdjustment = adjustment?.amount ? { amount: adjustment.amount, reason: adjustment.reason } : undefined;
  const basePricing = calculateContractPrice(data);
  const pricing = { ...basePricing, depositAmount: view.contract.deposit, balanceAmount: Math.max(0, basePricing.contractTotal - view.contract.deposit) };
  const total = calculateContractPrice({ ...data, partnerDiscount: view.legacyPartnerDiscount }).contractTotal;
  if (pricing.contractTotal < view.contract.deposit || total < view.contract.paid + view.benefitDeduction) throw new Error('이미 납부한 금액보다 낮은 변경은 별도 정산이 필요합니다.');
  if (!view.folderUrl) throw new Error('기존 Drive 계약서 폴더를 확인할 수 없습니다. 원본 보존을 위해 발송하지 않습니다.');
  if (JSON.stringify(data) === JSON.stringify(view.data)) throw new Error('변경된 계약 내용이 없습니다.');
  return { data, pricing, total, balance: Math.max(0, total - view.contract.paid - view.benefitDeduction) };
}