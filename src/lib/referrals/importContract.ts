import { verifyApprovalToken } from '../token';
import { calculateContractPrice } from '../pricing';
import { contactKeys } from './contractIntegration';
import type { Contract } from './ledger';
/** Only an explicit administrator import. Never search names or infer past referral relationships. */
export function previewContractImport(reviewUrl: string, number: string): Contract {
  if (reviewUrl.length > 30000 || number.length > 100 || !number.trim()) throw new Error('검토 링크와 계약번호를 확인해 주세요.');
  const url = new URL(reviewUrl);
  const allowed = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://dear-memory-booking.vercel.app');
  if (url.origin !== allowed.origin || url.pathname !== '/review') throw new Error('디어메모리 계약 검토 링크를 입력해 주세요.');
  const decoded = verifyApprovalToken(url.searchParams.get('token') || '');
  const d = decoded.data;
  if (!decoded.contractId || !d.groomName || !d.brideName || !d.weddingDate) throw new Error('계약 정보를 확인할 수 없습니다.');
  const p = calculateContractPrice(d);
  if (number.trim() === 'DM-20270516-XJWF' || (d.groomName === '이송현' && d.brideName === '이수정' && d.weddingDate === '2027-05-16')) throw new Error('지정된 취소 계약은 가져올 수 없습니다.');
  return {
    id: decoded.contractId,
    coupleId: decoded.contractId,
    number: number.trim(),
    groom: d.groomName,
    bride: d.brideName,
    weddingDate: d.weddingDate,
    total: p.contractTotal,
    deposit: p.depositAmount,
    identityKeys: contactKeys(d, process.env.REFERRAL_JOURNAL_SECRET || ''),
    paid: 0,
    status: 'active',
    legacyPartnerDiscount: !!d.partnerDiscount,
    crmData: {
      groomPhone: d.groomPhone,
      bridePhone: d.bridePhone,
      email: d.email,
      weddingTime: d.weddingTime,
      weddingVenue: d.weddingVenue,
      weddingHall: d.weddingHall,
      productId: d.productId,
      optionIds: d.optionIds,
    },
  };
}
