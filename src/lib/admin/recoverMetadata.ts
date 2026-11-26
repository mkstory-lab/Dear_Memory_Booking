import { project, type Contract, type Event } from '@/lib/referrals/ledger';
import { projectAdminCrm, type AdminContract } from './crm';

export type OriginalRows = Record<string, string>;
const text = (rows: OriginalRows, key: string) => String(rows[key] ?? '').trim();
const missing = (value: string | undefined) => !value?.trim();
export function recoverable(c: AdminContract) {
  return c.id.startsWith('drive_') && c.status !== 'cancelled' && !!c.driveFolderUrl &&
    [c.weddingVenue, c.weddingHall, c.weddingTime, c.groomPhone, c.bridePhone, c.email, c.productId].some(missing);
}

export function recoveryEvents(history: Event[], contractId: string, rows: OriginalRows, context: { requestId: string; actor: string; at: string }): Event[] {
  const contract = project(history).contracts[contractId];
  const current = projectAdminCrm(history).contracts.find(c => c.id === contractId);
  if (!contract || !current || !recoverable(current)) return [];
  if (text(rows, '계약번호') !== contract.number || text(rows, '신랑 성명') !== contract.groom ||
      text(rows, '신부 성명') !== contract.bride || text(rows, '예식일') !== contract.weddingDate) throw new Error('원본 계약번호·성명·본식일 불일치');
  // A completed revision has priority over the earlier source; avoid using stale original data.
  if (history.some(e => e.type === 'contract_revision_completed' && e.data?.contractId === contractId)) throw new Error('수정 계약 원본 재확인 필요');
  const patch: NonNullable<Contract['crmData']> = {};
  for (const [field, label, limit] of [
    ['weddingVenue', '예식장', 200], ['weddingHall', '홀', 200], ['weddingTime', '예식시간', 40],
    ['groomPhone', '신랑 연락처', 40], ['bridePhone', '신부 연락처', 40], ['email', '고객 이메일', 200],
  ] as const) {
    const value = text(rows, label);
    if (!missing(current[field]) || !value || value.length > limit) continue;
    if (field === 'weddingTime' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) continue;
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(value)) continue;
    patch[field] = value;
  }
  if (missing(current.productId)) {
    const product = text(rows, '선택상품');
    if (product === '화보형' || product === '실속형') {
      patch.productId = product === '화보형' ? 'album_plus' : 'standard';
      if (Object.prototype.hasOwnProperty.call(rows, '추가옵션') && !contract.crmData?.optionIds?.length) {
        const options = text(rows, '추가옵션');
        const mapping: Record<string, string> = {'2인 촬영':'second_shooter', '폐백 촬영':'pyebaek', second_shooter:'second_shooter', pyebaek:'pyebaek'};
        const parts = !options || options === '선택 없음' ? [] : options.split(',').map(x => x.trim());
        if (parts.every(x => !!mapping[x])) patch.optionIds = [...new Set(parts.map(x => mapping[x]))];
      }
    }
  }
  if (!Object.keys(patch).length) return [];
  const make = (type: string, data: object): Event => ({...context,id:context.requestId+':'+contractId+':'+type,type,data,reason:'Drive 원본 엑셀 대조 후 누락 정보만 복구'});
  return [
    make('contract_updated', {id:contractId,patch:{crmData:{...contract.crmData,...patch}}}),
    make('crm_import_metadata_recovered', {contractId,patch}),
  ];
}
