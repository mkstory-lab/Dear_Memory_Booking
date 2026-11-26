import { readApprovalTokenForAdmin } from '@/lib/token';
import { amounts, project, remainingBalance, type Event, type State } from '@/lib/referrals/ledger';
import { ownerTotals, projectBuddy } from '@/lib/buddy/ledger';
import { projectStaff, publicStaff } from '@/lib/admin/staff';
import type { ContractFormData } from '@/types/contract';

export const CUSTOMER_STAGES = [
  '계약', '사전안내', '촬영', '촬영완료', '사진 셀렉', '보정', '수정요청', '앨범제작', '출고완료',
] as const;

export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

export type AdminContract = {
  id: string;
  number: string;
  groom: string;
  bride: string;
  groomPhone: string;
  bridePhone: string;
  email: string;
  weddingDate: string;
  weddingTime: string;
  weddingVenue: string;
  weddingHall: string;
  productId: string;
  optionIds: string[];
  total: number;
  deposit: number;
  paid: number;
  balance: number;
  depositConfirmedAt?: string;
  balanceConfirmedAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  stage: CustomerStage;
  memo: string;
  reviewUrl?: string;
  driveFolderUrl?: string;
  excelFileUrl?: string;
  calendarEventId?: string;
  calendarSaved: boolean;
  referralCode?: string;
  buddyCode?: string;
  benefitGranted: number;
  benefitPaid: number;
  benefitOutstanding: number;
};

export type AdminBuddyUsage = {
  id: string;
  code: string;
  ownerName: string;
  referredBrideName: string;
  referredWeddingDate: string;
  status: string;
  createdAt: string;
};

export type AdminCrmSnapshot = {
  contracts: AdminContract[];
  buddyUsages: AdminBuddyUsage[];
  staffAssignments: Record<string, string[]>;
  staff: Array<{ id: string; username: string; displayName: string; active: boolean; createdAt: string; updatedAt: string }>;
  manualSchedules: Array<{ id: string; title: string; date: string; time: string; venue: string; details: string; contact: string; staffIds: string[]; active: boolean; createdAt: string; updatedAt: string }>;
  generatedAt: string;
};

type CrmMeta = { stage?: CustomerStage; memo?: string; groomPhone?: string; bridePhone?: string; weddingTime?: string; weddingVenue?: string; weddingHall?: string; updatedAt: string };

function eventDate(event: Event | undefined) {
  return event?.at || new Date(0).toISOString();
}

function latest(events: Event[], type: string, contractId: string) {
  return [...events].reverse().find(event => event.type === type && event.data?.contractId === contractId);
}

function contractData(events: Event[], state: State, contractId: string): Partial<ContractFormData> {
  const revision = latest(events, 'contract_revision_completed', contractId);
  if (revision?.data?.finalData) return revision.data.finalData as ContractFormData;
  const delivery = latest(events, 'contract_delivery_started', contractId);
  if (delivery?.data?.finalData) return delivery.data.finalData as ContractFormData;
  const contract = state.contracts[contractId];
  if (!contract?.reviewUrl) return {};
  try {
    const token = new URL(contract.reviewUrl).searchParams.get('token');
    return token ? readApprovalTokenForAdmin(token).data : {};
  } catch {
    return {};
  }
}

function crmMeta(events: Event[], contractId: string): CrmMeta {
  const meta: CrmMeta = { updatedAt: new Date(0).toISOString() };
  for (const event of events) {
    if (event.type !== 'crm_customer_updated' || event.data?.contractId !== contractId) continue;
    if (CUSTOMER_STAGES.includes(event.data.stage)) meta.stage = event.data.stage;
    if (typeof event.data.memo === 'string') meta.memo = event.data.memo;
    if (typeof event.data.groomPhone === 'string') meta.groomPhone = event.data.groomPhone;
    if (typeof event.data.bridePhone === 'string') meta.bridePhone = event.data.bridePhone;
    if (typeof event.data.weddingTime === 'string') meta.weddingTime = event.data.weddingTime;
    if (typeof event.data.weddingVenue === 'string') meta.weddingVenue = event.data.weddingVenue;
    if (typeof event.data.weddingHall === 'string') meta.weddingHall = event.data.weddingHall;
    meta.updatedAt = event.at;
  }
  return meta;
}

function benefitTotals(state: State, contractId: string) {
  return Object.values(state.benefits)
    .filter(benefit => benefit.contractId === contractId)
    .reduce((total, benefit) => {
      const value = amounts(state, benefit);
      total.granted += value.granted;
      total.paid += value.paid + value.balance;
      total.outstanding += value.available;
      return total;
    }, { granted: 0, paid: 0, outstanding: 0 });
}

function defaultStage(weddingDate: string, status: string): CustomerStage {
  if (status === 'completed') return '촬영완료';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  return weddingDate && weddingDate < today ? '촬영완료' : '계약';
}

export function projectAdminCrm(events: Event[]): AdminCrmSnapshot {
  const state = project(events);
  const buddy = projectBuddy(events);
  const staffState = projectStaff(events);
  const buddyCodeByContract = new Map(
    Object.values(buddy.referrals)
      .filter(referral => referral.sourceContractId)
      .map(referral => [referral.sourceContractId as string, referral.code]),
  );

  const contracts = Object.values(state.contracts).map(contract => {
    const data = contractData(events, state, contract.id);
    const registered = events.find(event => event.type === 'contract_registered' && event.data?.id === contract.id);
    const delivery = latest(events, 'contract_delivery_result', contract.id);
    const lastContractEvent = [...events].reverse().find(event =>
      (event.type === 'contract_updated' && event.data?.id === contract.id)
      || event.data?.contractId === contract.id,
    );
    const meta = crmMeta(events, contract.id);
    const benefits = benefitTotals(state, contract.id);
    const balance = remainingBalance(state, contract.id);
    const balanceEvent = [...events].reverse().find(event =>
      event.type === 'command' && event.data?.type === 'payment' && event.data?.contractId === contract.id && balance === 0,
    );
    const result = delivery?.data?.result || {};

    return {
      id: contract.id,
      number: contract.number,
      groom: contract.groom,
      bride: contract.bride,
      groomPhone: meta.groomPhone ?? data.groomPhone ?? contract.crmData?.groomPhone ?? '',
      bridePhone: meta.bridePhone ?? data.bridePhone ?? contract.crmData?.bridePhone ?? '',
      email: data.email || contract.crmData?.email || '',
      weddingDate: contract.weddingDate,
      weddingTime: meta.weddingTime ?? data.weddingTime ?? contract.crmData?.weddingTime ?? '',
      weddingVenue: meta.weddingVenue ?? data.weddingVenue ?? contract.crmData?.weddingVenue ?? '',
      weddingHall: meta.weddingHall ?? data.weddingHall ?? contract.crmData?.weddingHall ?? '',
      productId: data.productId || contract.crmData?.productId || '',
      optionIds: data.optionIds || contract.crmData?.optionIds || [],
      total: contract.total,
      deposit: contract.deposit,
      paid: contract.paid,
      balance,
      depositConfirmedAt: contract.depositConfirmedAt,
      balanceConfirmedAt: balanceEvent?.at,
      sentAt: contract.sentAt,
      createdAt: eventDate(registered),
      updatedAt: meta.updatedAt > eventDate(lastContractEvent) ? meta.updatedAt : eventDate(lastContractEvent),
      status: contract.status,
      stage: meta.stage || defaultStage(contract.weddingDate, contract.status),
      memo: meta.memo || '',
      reviewUrl: contract.reviewUrl,
      driveFolderUrl: result.driveFolderUrl || contract.driveFolderUrl,
      excelFileUrl: result.excelFileUrl || contract.excelFileUrl,
      calendarEventId: result.calendarEventId,
      calendarSaved: result.calendarSaved === true,
      referralCode: Object.values(state.referrals).find(referral => referral.contractId === contract.id && !referral.cancelledAt)?.code,
      buddyCode: buddyCodeByContract.get(contract.id),
      benefitGranted: benefits.granted,
      benefitPaid: benefits.paid,
      benefitOutstanding: benefits.outstanding,
    } satisfies AdminContract;
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const buddyUsages = Object.values(buddy.referrals).map(referral => {
    const owner = buddy.customers[referral.ownerCustomerId];
    return {
      id: referral.id,
      code: referral.code,
      ownerName: owner?.brideName || '확인 필요',
      referredBrideName: referral.referredBrideName,
      referredWeddingDate: referral.referredWeddingDate,
      status: referral.status,
      createdAt: referral.createdAt,
    };
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const staffAssignments = Object.fromEntries(Object.values(staffState.assignments).map(assignment => [assignment.contractId, assignment.staffIds.map(id => staffState.staff[id]?.displayName).filter((name): name is string => !!name)]));
  const staff = publicStaff(staffState);
  const manualSchedules = Object.values(staffState.manualSchedules).filter(item => item.active).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  return { contracts, buddyUsages, staffAssignments, staff, manualSchedules, generatedAt: new Date().toISOString() };
}

