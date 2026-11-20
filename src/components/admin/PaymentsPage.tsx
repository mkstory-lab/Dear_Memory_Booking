'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { money, seoulToday } from './types';
import { useAdminCrm } from './useAdminCrm';

function monthLabel(offset: number) {
  const today = seoulToday();
  const date = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function seoulMonth(iso?: string) {
  return iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso)).slice(0, 7) : '';
}

export default function PaymentsPage() {
  const { data, error, isPending, mutate } = useAdminCrm();
  const [filter, setFilter] = useState('all');
  const currentMonth = monthLabel(0);
  const active = useMemo(() => (data?.contracts || []).filter(contract => contract.status !== 'cancelled'), [data]);
  const rows = useMemo(() => active.filter(contract => filter === 'all' || (filter === 'unconfirmed' && !contract.depositConfirmedAt) || (filter === 'balance' && !!contract.depositConfirmedAt && contract.balance > 0) || (filter === 'complete' && contract.balance === 0)), [active, filter]);
  const monthDeposits = active.filter(contract => seoulMonth(contract.depositConfirmedAt) === currentMonth).reduce((sum, contract) => sum + contract.deposit, 0);
  const receivables = active.reduce((sum, contract) => sum + contract.balance, 0);
  const completed = active.filter(contract => contract.balance === 0).reduce((sum, contract) => sum + contract.total, 0);
  const months = Array.from({ length: 6 }, (_, index) => monthLabel(index - 5));
  const sales = months.map(month => ({ month, value: active.filter(contract => seoulMonth(contract.depositConfirmedAt) === month).reduce((sum, contract) => sum + contract.total, 0) }));
  const max = Math.max(...sales.map(item => item.value), 1);

  async function confirmDeposit(id: string, names: string, deposit: number) {
    if (!window.confirm(`${names} 고객의 계약금 ${money(deposit)} 입금을 직접 확인했나요?`)) return;
    await mutate({ type: 'confirm_deposit', contractId: id });
  }

  async function recordBalance(id: string, names: string, balance: number) {
    const value = window.prompt(`${names} 고객의 직접 확인한 입금액`, String(balance));
    if (value === null) return;
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > balance) { window.alert('남은 잔금 이하의 올바른 금액을 입력해 주세요.'); return; }
    if (!window.confirm(`${money(amount)} 입금을 기록할까요?`)) return;
    await mutate({ type: 'record_payment', contractId: id, amount });
  }

  if (error) return <div className="admin-error">{error}</div>;
  return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">PAYMENTS</p><h1>매출 / 입금 관리</h1><p>은행에서 직접 확인한 계약금과 잔금만 기록합니다.</p></div></div><section className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}><article className="admin-stat"><span>이번 달 계약금</span><strong>{money(monthDeposits)}</strong></article><article className="admin-stat"><span>이번 달 확정 매출</span><strong>{money(active.filter(contract => seoulMonth(contract.depositConfirmedAt) === currentMonth).reduce((sum, contract) => sum + contract.total, 0))}</strong></article><article className="admin-stat"><span>누적 입금 완료</span><strong>{money(completed)}</strong></article><article className="admin-stat"><span>미수금</span><strong>{money(receivables)}</strong></article></section><section className="admin-card" style={{ marginTop: 18 }}><div className="admin-card-header"><h2>최근 6개월 확정 매출</h2></div><div className="admin-monthly-bars">{sales.map(item => <div className="admin-monthly-row" key={item.month}><span>{item.month}</span><div className="admin-monthly-track"><div className="admin-monthly-fill" style={{ width: `${Math.max(item.value / max * 100, item.value ? 3 : 0)}%` }} /></div><strong>{money(item.value)}</strong></div>)}</div></section><div className="admin-toolbar" style={{ marginTop: 18 }}><select aria-label="입금 상태 필터" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">전체</option><option value="unconfirmed">계약금 미확인</option><option value="balance">잔금 미입금</option><option value="complete">전액 완료</option></select><span className="admin-badge">{rows.length}건</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>고객</th><th>예식일</th><th>총액</th><th>계약금</th><th>잔금</th><th>상태</th><th>입금 확인일</th><th>관리</th></tr></thead><tbody>{rows.map(contract => { const names = `${contract.groom} · ${contract.bride}`; return <tr key={contract.id}><td><strong>{names}</strong><small>{contract.number}</small></td><td>{contract.weddingDate}</td><td>{money(contract.total)}</td><td>{money(contract.deposit)}</td><td>{money(contract.balance)}</td><td><span className={`admin-badge ${contract.balance === 0 ? 'green' : contract.depositConfirmedAt ? 'orange' : 'red'}`}>{contract.balance === 0 ? '전액 완료' : contract.depositConfirmedAt ? '잔금 대기' : '미확인'}</span></td><td>{contract.balanceConfirmedAt?.slice(0, 10) || contract.depositConfirmedAt?.slice(0, 10) || '-'}</td><td><div style={{ display: 'flex', gap: 6 }}>{!contract.depositConfirmedAt ? <button className="admin-button primary" disabled={isPending} onClick={() => void confirmDeposit(contract.id, names, contract.deposit)}>계약금 확인</button> : contract.balance > 0 ? <button className="admin-button primary" disabled={isPending} onClick={() => void recordBalance(contract.id, names, contract.balance)}>잔금 기록</button> : null}<Link href={`/admin/customers/${contract.id}`}>상세</Link></div></td></tr>; })}</tbody></table>{!data ? <p className="admin-empty">입금 데이터를 불러오고 있습니다.</p> : !rows.length ? <p className="admin-empty">해당 상태의 계약이 없습니다.</p> : null}</div></main>;
}

