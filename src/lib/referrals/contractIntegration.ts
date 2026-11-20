import { createHash, createHmac, randomUUID } from 'node:crypto';
import type { ContractFormData } from '@/types/contract';
import { calculateContractPrice } from '@/lib/pricing';
import { generateContractNumber } from '@/lib/contractNumber';
import { createApprovalToken, type DecodedApprovalPayload } from '@/lib/token';
import { execute, normalizeCode, project, type Event } from './ledger';
import type { ReferralStore } from './issuance';\nimport { buildBuddyReferralEvents, normalizeBuddyCode } from '@/lib/buddy/ledger';

export function contactKeys(data: Pick<ContractFormData, 'groomPhone' | 'bridePhone'>, secret: string) {
  return [...new Set([data.groomPhone, data.bridePhone].map(p => (p || '').replace(/\D/g, '')).filter(p => p.length >= 9))]
    .map(p => createHmac('sha256', secret).update('phone:' + p).digest('hex'));
}
export function customerData(body: any): ContractFormData {
  if (!body || typeof body !== 'object') throw new Error('계약 정보를 확인해 주세요.');
  const data: any = {};
  const strings = ['weddingDate','weddingTime','weddingVenue','weddingHall','makeupLocation','groomName','groomPhone','brideName','bridePhone','email','groomFamilyMembers','brideFamilyMembers','productId','shootRequestNotes','retouchRequestNotes','requestNotes','referralSource','instagramId','blogUrl'];
  for (const key of strings) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > 2000)) throw new Error('입력 내용의 길이를 확인해 주세요.');
    data[key] = body[key] || '';
  }
  for (const key of ['groomName','groomPhone','brideName','bridePhone','email','weddingDate','weddingTime','weddingVenue','weddingHall']) if (!data[key].trim()) throw new Error('필수 계약 정보를 입력해 주세요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.weddingDate) || (!Number.isFinite(Date.parse(data.weddingDate)) || new Date(data.weddingDate).toISOString().slice(0,10) !== data.weddingDate) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('예식일과 이메일을 확인해 주세요.');
  if (!['standard','album_plus'].includes(data.productId) || !Array.isArray(body.optionIds) || body.optionIds.some((x: unknown) => !['makeup_scene','second_shooter','pyebaek'].includes(String(x)))) throw new Error('상품과 옵션을 확인해 주세요.');
  data.optionIds = [...new Set(body.optionIds)];
  for (const key of ['portfolioConsent','reviewContractCashback','reviewMainCashback','termsAgreed']) data[key] = body[key] === true;
  if (!data.termsAgreed) throw new Error('약관 동의가 필요합니다.');
  const input = body.partnerName || body.referralCode || '';
  if (typeof input !== 'string' || input.length > 200) throw new Error('짝꿍코드 또는 추천인 정보는 200자 이내로 입력해 주세요.');
  // Compatibility policy: any nonblank text activates one 50k discount.
  // Only an active code in the server journal can create a referral/reward.
  data.partnerName = input.trim();
  data.partnerDiscount = !!data.partnerName;
  const candidate = normalizeCode(data.partnerName);
  data.referralCode = /^DM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(candidate) ? candidate : '';
  data.sundayDiscount = calculateContractPrice(data).isSunday;
  return data;
}
function event(requestId: string, type: string, data: any, actor = 'contract-service'): Event {
  return { id: requestId + ':' + type, requestId, type, data, actor, at: new Date().toISOString(), reason: '계약 접수·발송 연결' };
}
export async function registerSubmission(store: ReferralStore, data: ContractFormData, submissionId: string, secret: string) {
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(submissionId)) throw new Error('접수 식별자를 확인해 주세요.');
  const id = 'cnt_' + createHmac('sha256', secret).update('submission:' + submissionId).digest('hex').slice(0,32);
  const fingerprint = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const proposedNumber = generateContractNumber(data.weddingDate);
  return store.transaction(history => {
    const previous = history.find(e => e.type === 'submission_registered' && e.data.contractId === id);
    if (previous) {
      if (previous.data.fingerprint !== fingerprint) throw new Error('이미 접수된 요청입니다. 계약 내용 변경은 대표님께 문의해 주세요.');
      const reviewUrl = project(history).contracts[id].reviewUrl!;
      return { events: [], result: { contractId: id, token: new URL(reviewUrl).searchParams.get('token')!, reviewUrl, fingerprint } };
    }
    if (data.groomName === '이송현' && data.brideName === '이수정' && data.weddingDate === '2027-05-16') throw new Error('취소 계약은 새로 등록할 수 없습니다. 대표님께 문의해 주세요.');
    const s = project(history);
    const keys = contactKeys(data, secret);
    const owner = data.referralCode && s.codes[data.referralCode]?.active ? s.codes[data.referralCode] : undefined;
    const legacy = data.partnerDiscount && !owner;
    const finalData = { ...data, referralCode: owner ? owner.value : '', partnerName: owner ? owner.value : data.partnerName };
    if (owner && (s.contracts[owner.contractId].identityKeys || []).some(k => keys.includes(k))) throw new Error('자기 추천은 적용할 수 없습니다.');
    let number = proposedNumber;
    while (Object.values(s.contracts).some(c => c.number === number)) number = generateContractNumber(data.weddingDate);
    const token = createApprovalToken(id, finalData, undefined, { managedReferral: true, contractNumber: number });
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dear-memory-booking.vercel.app'}/review?token=${token}`;
    const pricing = calculateContractPrice({ ...finalData, partnerDiscount: legacy });
    const context = { actor: 'contract-service', role: 'admin' as const, at: new Date().toISOString(), requestId: id + ':register' };
    const events = execute(history, { type: 'register', contract: { id, coupleId: id, number, groom: data.groomName, bride: data.brideName, weddingDate: data.weddingDate, status: 'active', legacyPartnerDiscount: legacy, partnerText: finalData.partnerName, total: pricing.contractTotal, deposit: pricing.depositAmount, paid: 0, identityKeys: contactKeys(data, secret), reviewUrl } }, context);
    if (owner) events.push(...execute([...history, ...events], { type: 'refer', contractId: id, code: owner.value }, { ...context, requestId: id + ':refer' }));
    const buddyCode = normalizeBuddyCode(data.partnerName || '');
    if (buddyCode) {
      events.push(...buildBuddyReferralEvents([...history, ...events], {
        code: buddyCode,
        referredBrideName: data.brideName,
        referredWeddingDate: data.weddingDate,
        sourceContractId: id,
      }, {
        requestId: id + ':buddy-referral',
        actor: 'contract-service',
        at: context.at,
        reason: '계약서 짝꿍코드 자동 연결',
      }));
    }
    const result = { contractId: id, token, reviewUrl, fingerprint };
    events.push(event(id + ':submission', 'submission_registered', { contractId: id, fingerprint }));
    if (JSON.stringify(events).length > 40000) throw new Error('요청사항이 너무 깁니다. 내용을 줄인 뒤 제출해 주세요.');
    return { events, result };
  });
}
/** Durable claim before mail dispatch: retrying a submission never sends a second email. */
export async function notifySubmission(store: ReferralStore, id: string, send: () => Promise<{ success: boolean }>) {
  const claimed = await store.transaction(history => history.some(e => e.type === 'submission_notification_started' && e.data.contractId === id)
    ? { events: [], result: false }
    : { events: [event(id + ':notify', 'submission_notification_started', { contractId: id })], result: true });
  if (!claimed) return;
  let success = false;
  try { success = (await send()).success; } catch { /* Provider outcome can be unknown. Never auto-resend. */ }
  await store.transaction(history => history.some(e => e.id === id + ':notify:submission_notification_result') ? { events: [], result: true } : {
    events: [event(id + ':notify', 'submission_notification_result', { contractId: id, success })], result: true });
}
export function managedReview(history: Event[], decoded: DecodedApprovalPayload) {
  const s = project(history), c = s.contracts[decoded.contractId];
  if (!c || c.status === 'cancelled') throw new Error('취소되었거나 확인할 수 없는 계약입니다.');
  const referral = Object.values(s.referrals).find(r => r.contractId === c.id && !r.cancelledAt);
  const dispatched = history.find(e => e.type === 'contract_delivery_started' && e.data.contractId === c.id);
  const source = dispatched?.data.finalData || decoded.data;
  const data = { ...source, referralCode: referral?.code || '', partnerName: referral?.code || (c.legacyPartnerDiscount ? source.partnerName : ''), partnerDiscount: !!referral || !!c.legacyPartnerDiscount };
  const delivery = history.find(e => e.type === 'contract_delivery_result' && e.data.contractId === c.id);
  const started = history.some(e => e.type === 'contract_delivery_started' && e.data.contractId === c.id);
  return { data, contractNumber: c.number, isAlreadySent: !!delivery?.data.result.customerEmailSent, sentAt: c.sentAt, deliveryPending: started && !delivery?.data.result.customerEmailSent };
}
/** No reference to issueCode: a contract email can never activate a code or grant benefits. */
export async function sendManagedContract(store: ReferralStore, decoded: DecodedApprovalPayload, proposedData: ContractFormData, send: (data: ContractFormData, number: string) => Promise<any>) {
  const attempt = randomUUID();
  const claim = await store.transaction(history => {
    const view = managedReview(history, decoded), c = project(history).contracts[decoded.contractId];
    const completed = history.find(e => e.type === 'contract_delivery_result' && e.data.contractId === c.id && e.data.result.customerEmailSent);
    if (completed) return { events: [], result: { cached: completed.data.result, data: view.data, number: c.number } };
    if (view.deliveryPending) throw new Error('발송 처리 중이거나 결과 확인이 필요합니다. 중복 발송하지 말고 고객 메일과 처리 이력을 확인해 주세요.');
    if (!!proposedData.partnerDiscount !== view.data.partnerDiscount || normalizeCode(proposedData.referralCode || '') !== view.data.referralCode || (proposedData.partnerDiscount && proposedData.partnerName !== view.data.partnerName)) throw new Error('추천 정보가 변경되었습니다. 검토 페이지를 새로고침해 주세요.');
    const finalData = { ...proposedData, referralCode: view.data.referralCode, partnerDiscount: view.data.partnerDiscount, partnerName: view.data.partnerName };
    const pricing = calculateContractPrice({ ...finalData, partnerDiscount: !!c.legacyPartnerDiscount });
    if (c.depositConfirmedAt && pricing.contractTotal !== c.total) throw new Error('입금 확인 후 금액 변경은 별도 정산 확인이 필요합니다.');
    const events = [event(attempt, 'contract_updated', { id: c.id, before: c, patch: { groom: finalData.groomName, bride: finalData.brideName, weddingDate: finalData.weddingDate, total: pricing.contractTotal } })];
    events.push(event(attempt, 'contract_delivery_started', { contractId: c.id, number: c.number, amount: calculateContractPrice(finalData).contractTotal, finalData }));
    return { events, result: { cached: null, data: finalData, number: c.number } };
  });
  if (claim.cached) return claim.cached;
  // Once dispatch begins, errors must never invite an automatic second customer email.
  let result;
  try { result = await send(claim.data, claim.number); }
  catch { throw new Error('발송 결과 확인이 필요합니다. 중복 발송하지 말고 고객 메일을 확인해 주세요.'); }
  if (!result.success || !result.customerEmailSent) throw new Error('발송 결과 확인이 필요합니다. 중복 발송하지 말고 고객 메일을 확인해 주세요.');
  try {
    await store.transaction(history => {
      if (history.some(e => e.type === 'contract_delivery_result' && e.data.contractId === decoded.contractId)) return { events: [], result: true };
      return { events: [event(attempt, 'contract_delivery_result', { contractId: decoded.contractId, result }), ...execute(history, { type: 'sent', contractId: decoded.contractId }, { requestId: attempt + ':sent', actor: 'contract-service', role: 'admin', at: new Date().toISOString() })], result: true };
    });
  } catch {
    return { ...result, warning: '고객 메일은 발송되었습니다. 관리 이력 저장을 확인해 주세요. 메일을 다시 보내지 마세요.' };
  }
  return result;
}
