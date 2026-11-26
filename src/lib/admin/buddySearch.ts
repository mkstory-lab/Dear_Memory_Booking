import type { AdminCrmSnapshot } from './crm';
export function findBuddyOwners(owners: AdminCrmSnapshot['buddyOwners'], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const compact = (value: string) => value.toLowerCase().replace(/[_\s-]+/g, '');
  return owners.filter(owner =>
    [owner.brideName, owner.code, owner.memo, owner.weddingDate].some(value => value.toLowerCase().includes(needle)) ||
    (compact(needle).length > 0 && compact(owner.code).includes(compact(needle)))
  ).slice(0, 6);
}
