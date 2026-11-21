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

export function buildIssueCodeEvents(history: Event[], contractId: string, context: Context) {
  if (context.role !== 'admin') throw new Error('관리자 권한이 필요합니다.');
  const state = project(history);
  const contract = state.contracts[contractId];
  if (!contract || contract.status === 'cancelled') {
    throw new Error('코드를 발급할 활성 계약을 선택해 주세요.');
  }
  const existing = Object.values(state.codes).find(code => code.contractId === contractId);
  if (existing) return { events: [] as Event[], code: existing };

  let candidate = generateCode();
  while (state.codes[candidate]) candidate = generateCode();

  // The administrator has checked the bank outside this app. A single explicit
  // issue action records that manual decision and grants benefits atomically.
  // Sending a contract never calls this function.
  const depositEvents = contract.depositConfirmedAt ? [] : execute(history,
    { type: 'deposit', contractId },
    { ...context, requestId: context.requestId + ':manual-deposit', reason: '관리자가 외부 입금 확인 후 코드 생성 버튼을 눌렀습니다.' });
  const events = [...depositEvents, ...execute([...history, ...depositEvents], { type: 'issue', contractId, candidate }, context)];
  const code = project([...history, ...events]).codes[candidate];
  return { events, code };
}

export async function issueCode(store: ReferralStore, contractId: string, context: Context) {
  return store.transaction(history => {
    const { events, code } = buildIssueCodeEvents(history, contractId, context);
    return { events, result: code };
  });
}
