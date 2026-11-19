import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';
import { GasReferralStore } from '../src/lib/referrals/gasStore';
import type { Event } from '../src/lib/referrals/ledger';
const event: Event = { id: 'request:event', requestId: 'request', actor: 'test-admin', at: new Date().toISOString(), reason: '', type: 'command', data: {} };
function journal() {
  const secret = 'test-only-secret-not-for-production-123456';
  const rows: unknown[][] = [['transaction_id', 'events_json']];
  let opens = 0; let locks = 0;
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => key.endsWith('SECRET') ? secret : 'test-sheet' }) },
    Utilities: { Charset: { UTF_8: 'utf8' }, computeHmacSha256Signature: (body: string, key: string) => [...createHmac('sha256', key).update(body).digest()] },
    LockService: { getScriptLock: () => ({ waitLock() { locks++; }, releaseLock() { locks--; } }) },
    SpreadsheetApp: { flush() {}, openById() { opens++; return { getSheetByName: () => ({ getDataRange: () => ({ getValues: () => rows }), getRange: (row: number) => ({ setValues: (values: unknown[][]) => { rows[row - 1] = values[0]; } }) }) }; } },
  });
  new vm.Script(readFileSync('google-apps-script/ReferralJournal.gs', 'utf8')).runInContext(context);
  const sign = (fields: object) => { const body = JSON.stringify({ timestamp: Date.now(), ...fields }); return { body, signature: createHmac('sha256', secret).update(body).digest('hex') }; };
  return { call: (fields: object) => context.dmReferralJournal_(sign(fields)), raw: context.dmReferralJournal_, opens: () => opens, locks: () => locks, rows };
}
test('unauthenticated journal requests never open the sheet', () => {
  const j = journal(); assert.throws(() => j.raw({ body: '{}', signature: '0'.repeat(64) }), /인증 실패/); assert.equal(j.opens(), 0);
  assert.throws(() => j.call({ operation: 'read', timestamp: 0 }), /만료/); assert.equal(j.opens(), 0);
});
test('journal commits atomically, detects conflicts and deduplicates retries', () => {
  const j = journal(); const command = { operation: 'append', version: 0, transactionId: 'transaction_000001', events: [event] };
  assert.equal(j.call(command).saved, true); assert.equal(j.call(command).existing, true); assert.equal(j.rows.length, 2);
  assert.equal(j.call({ ...command, transactionId: 'transaction_000002' }).conflict, true);
  assert.throws(() => j.call({ ...command, events: [{ ...event, actor: 'different' }] }), /内容|내용/);
  assert.equal(j.locks(), 0); assert.equal(j.call({ operation: 'read' }).events.length, 1);
});
test('storage adapter recomputes command after concurrent change', async () => {
  let reads = 0; let appends = 0;
  const store = new GasReferralStore({ read: async () => ({ version: reads++, events: reads === 1 ? [] : [event] }), append: async () => ({ saved: ++appends > 1, conflict: true }) });
  const result = await store.transaction(history => ({ events: [{ ...event, id: 'second' }], result: history.length }));
  assert.equal(result, 1); assert.equal(appends, 2);
});
test('unknown commit outcome retries exact transaction identity', async () => {
  const ids: string[] = [];
  const store = new GasReferralStore({ read: async () => ({ version: 0, events: [] }), append: async (_v, id) => { ids.push(id); if (ids.length === 1) throw new Error('network'); return { saved: true }; } });
  await store.transaction(() => ({ events: [event], result: true })); assert.equal(ids.length, 2); assert.equal(ids[0], ids[1]);
});
