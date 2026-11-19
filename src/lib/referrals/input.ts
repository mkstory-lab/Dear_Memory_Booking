import type { Command, Contract } from './ledger';
function text(value: unknown, max = 200, optional = false): string {
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('입력 내용을 확인해 주세요.');
  return value.trim();
}
function amount(value: unknown, zero = false): number {
  if (!Number.isSafeInteger(value) || Number(value) < (zero ? 0 : 1) || Number(value) > 100000000) throw new Error('금액을 확인해 주세요.');
  return value as number;
}
export function identifier(value: unknown) {
  const result = text(value, 100);
  if (!/^[A-Za-z0-9_-]+$/.test(result)) throw new Error('식별자를 확인해 주세요.');
  return result;
}
function date(value: unknown) {
  const result = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) throw new Error('날짜를 확인해 주세요.');
  return result;
}
export function adminInput(body: any): { requestId: string; reason: string; command: Command | { type: 'issue_code'; contractId: string } } {
  if (!body || typeof body !== 'object') throw new Error('입력 내용을 확인해 주세요.');
  const requestId = identifier(body.requestId), reason = text(body.reason, 1000, true);
  const c = body.command; if (!c || typeof c !== 'object') throw new Error('작업을 선택해 주세요.');
  let command: Command | { type: 'issue_code'; contractId: string };
  if (c.type === 'register') {
    const d = c.contract || {};
    const contract: Contract = { id: identifier(d.id), coupleId: identifier(d.coupleId), number: text(d.number, 100), groom: text(d.groom, 80), bride: text(d.bride, 80), weddingDate: date(d.weddingDate), status: 'active', total: amount(d.total), deposit: amount(d.deposit), paid: 0 };
    command = { type: 'register', contract };
  } else if (c.type === 'code_status') {
    if (typeof c.active !== 'boolean') throw new Error('코드 상태를 확인해 주세요.');
    command = { type: c.type, code: text(c.code, 30).toUpperCase(), active: c.active };
  } else if (c.type === 'correct_payout') {
    command = { type: c.type, paymentId: identifier(c.paymentId), amount: amount(c.amount) };
  } else {
    const contractId = identifier(c.contractId);
    switch (c.type) {
      case 'issue_code': case 'remove_referral': case 'apply_balance': case 'cancel': command = { type: c.type, contractId }; break;
      case 'payment': command = { type: c.type, contractId, amount: amount(c.amount) }; break;
      case 'payout': command = { type: c.type, contractId, amount: amount(c.amount), paymentId: identifier(c.paymentId), paidAt: date(c.paidAt) }; break;
      case 'refer': command = { type: c.type, contractId, code: text(c.code, 30).toUpperCase() }; break;
      case 'update': command = { type: c.type, contractId, number: text(c.number, 100), weddingDate: date(c.weddingDate) }; break;
      default: throw new Error('허용되지 않은 관리 작업입니다.');
    }
  }
  return { requestId, reason, command };
}
