import { createHmac, randomUUID } from 'node:crypto';
import type { Event } from './ledger';
import type { ReferralStore } from './issuance';

type Snapshot = { version: number; events: Event[] };
type Commit = { saved: boolean; conflict?: boolean };

export interface JournalTransport {
  read(): Promise<Snapshot>;
  append(version: number, transactionId: string, events: Event[]): Promise<Commit>;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const retryDelay = (attempt: number) => Math.min(120 * (2 ** attempt), 1200) + Math.floor(Math.random() * 80);

/** Compare-and-swap retries re-evaluate the complete business command on current history. */
export class GasReferralStore implements ReferralStore {
  constructor(private transport: JournalTransport) {}

  async transaction<T>(operation: (history: Event[]) => { events: Event[]; result: T }): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 8; attempt++) {
      let snapshot: Snapshot;
      try {
        snapshot = await this.transport.read();
      } catch (error) {
        lastError = error;
        if (attempt === 7) throw error;
        await wait(retryDelay(attempt));
        continue;
      }

      const { events, result } = operation(snapshot.events);
      if (!events.length) return result;

      const transactionId = randomUUID();
      let committed: Commit;
      try {
        committed = await this.transport.append(snapshot.version, transactionId, events);
      } catch (firstError) {
        // Retry an unknown network outcome with the exact same transaction id.
        await wait(150 + Math.floor(Math.random() * 100));
        try {
          committed = await this.transport.append(snapshot.version, transactionId, events);
        } catch (secondError) {
          lastError = secondError || firstError;
          if (attempt === 7) throw secondError;
          await wait(retryDelay(attempt));
          continue;
        }
      }

      if (committed.saved) return result;
      if (!committed.conflict) throw new Error('추천 이력을 저장하지 못했습니다.');

      // Another request updated the journal first. Back off before re-reading so
      // several admin actions do not continuously collide with each other.
      await wait(retryDelay(attempt));
    }

    if (lastError instanceof Error) throw lastError;
    throw new Error('다른 관리 작업이 진행 중입니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** Server-only use. Never expose this transport or its secret through a customer action. */
export function createGasJournalTransport(url: string, secret: string): JournalTransport & { limit(key: string, maximum: number): Promise<{ allowed: boolean }> } {
  if (secret.length < 32 || !url.startsWith('https://script.google.com/macros/s/')) throw new Error('추천 저장소 설정을 확인해 주세요.');

  async function request<T>(operation: string, fields: object = {}): Promise<T> {
    const body = JSON.stringify({ ...fields, operation, timestamp: Date.now() });
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'referral_journal', payload: { body, signature } }),
    });

    if (!response.ok) throw new Error('추천 저장소에 연결하지 못했습니다.');
    const result = await response.json();
    if (!result.success || !result.data) {
      console.error('Referral journal request rejected', { operation, hasError: Boolean(result?.error), hasMessage: Boolean(result?.message) });
      throw new Error(`추천 저장소 요청이 거절되었습니다. (${operation})`);
    }
    return result.data as T;
  }

  return {
    limit: (key, maximum) => request<{ allowed: boolean }>('limit', { key, maximum }),
    read: () => request<Snapshot>('read'),
    append: (version, transactionId, events) => request<Commit>('append', { version, transactionId, events }),
  };
}
