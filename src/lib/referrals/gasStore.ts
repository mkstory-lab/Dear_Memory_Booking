import { createHmac, randomUUID } from 'node:crypto';
import type { Event } from './ledger';
import type { ReferralStore } from './issuance';
type Snapshot = { version: number; events: Event[] };
type Commit = { saved: boolean; conflict?: boolean };
export interface JournalTransport {
  read(): Promise<Snapshot>;
  append(version: number, transactionId: string, events: Event[]): Promise<Commit>;
}
/** Compare-and-swap retries re-evaluate the complete business command on current history. */
export class GasReferralStore implements ReferralStore {
  constructor(private transport: JournalTransport) {}
  async transaction<T>(operation: (history: Event[]) => { events: Event[]; result: T }): Promise<T> {
    for (let attempt = 0; attempt < 8; attempt++) {
      const snapshot = await this.transport.read();
      const { events, result } = operation(snapshot.events);
      if (!events.length) return result;
      const transactionId = randomUUID();
      // An unknown network outcome must retry the same transaction, not create a new payment.
      let committed: Commit;
      try { committed = await this.transport.append(snapshot.version, transactionId, events); }
      catch { committed = await this.transport.append(snapshot.version, transactionId, events); }
      if (committed.saved) return result;
      if (!committed.conflict) throw new Error('추천 이력을 저장하지 못했습니다.');
    }
    throw new Error('다른 관리 작업이 진행 중입니다. 잠시 후 다시 시도해 주세요.');
  }
}
/** Server-only use. Never expose this transport or its secret through a customer action. */
export function createGasJournalTransport(url: string, secret: string): JournalTransport {
  if (secret.length < 32 || !url.startsWith('https://script.google.com/macros/s/')) throw new Error('추천 저장소 설정을 확인해 주세요.');
  async function request<T>(operation: string, fields: object = {}): Promise<T> {
    const body = JSON.stringify({ ...fields, operation, timestamp: Date.now() });
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    const response = await fetch(url, {
      method: 'POST', cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'referral_journal', payload: { body, signature } }),
    });
    if (!response.ok) throw new Error('추천 저장소에 연결하지 못했습니다.');
    const result = await response.json();
    if (!result.success || !result.data) throw new Error('추천 저장소 요청이 거절되었습니다.');
    return result.data as T;
  }
  return { read: () => request<Snapshot>('read'), append: (version, transactionId, events) => request<Commit>('append', { version, transactionId, events }) };
}
