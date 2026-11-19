import { randomInt } from 'node:crypto';
import { execute, project, type Event, type Context } from './ledger';

/** The storage adapter must serialize reads and append atomically across server instances. */
export interface ReferralStore {
  transaction<T>(operation: (history: Event[]) => { events: Event[]; result: T }): Promise<T>;
}
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
  return 'DM-' + Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
export async function issueCode(store: ReferralStore, contractId: string, context: Context) {
  if (context.role !== 'admin') throw new Error('관리자 권한이 필요합니다.');
  return store.transaction(history => {
    const state = project(history);
    const contract = state.contracts[contractId];
    if (!contract?.depositConfirmedAt || contract.status === 'cancelled') {
      throw new Error('활성 계약의 계약금 입금을 먼저 확인해 주세요.');
    }
    const existing = Object.values(state.codes).find(code => code.contractId === contractId);
    if (existing) return { events: [], result: existing };
    let candidate = generateCode();
    while (state.codes[candidate]) candidate = generateCode();
    const events = execute(history, { type: 'issue', contractId, candidate }, context);
    const code = project([...history, ...events]).codes[candidate];
    return { events, result: code };
  });
}
