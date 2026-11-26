'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { money, productName, seoulToday } from './types';
import { TASKS, taskRows, taskInfo, balanceDue, validDay } from '@/lib/admin/delivery';

function seoulDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso));
}

function dueDate(weddingDate: string) {
  return validDay(weddingDate) ? balanceDue(weddingDate) : '';
}

export default function DashboardPage() {
  const { data, error } = useAdminCrm();
  const today = seoulToday();
  const month = today.slice(0, 7);

  const view = useMemo(() => {
    const contracts = data?.contracts || [];
    const active = contracts.filter(contract => contract.status !== 'cancelled');
    const monthCreated = active.filter(contract => seoulDate(contract.createdAt).startsWith(month));
    const monthDeposits = active.filter(contract => contract.depositConfirmedAt && seoulDate(contract.depositConfirmedAt).startsWith(month));
    const expectedBalance = active.filter(contract => dueDate(contract.weddingDate).startsWith(month) && contract.balance > 0).reduce((sum, contract) => sum + contract.balance, 0);
    const revenue = monthDeposits.reduce((sum, contract) => sum + contract.total, 0);
    const receivables = active.reduce((sum, contract) => sum + contract.balance, 0);
    const shoots = active.filter(contract => contract.weddingDate.startsWith(month));
    const upcoming = active.filter(contract => contract.weddingDate >= today).sort((a, b) => `${a.weddingDate}${a.weddingTime}`.localeCompare(`${b.weddingDate}${b.weddingTime}`)).slice(0, 6);
    const attention = active.filter(contract => !contract.depositConfirmedAt || contract.balance > 0).sort((a, b) => a.weddingDate.localeCompare(b.weddingDate)).slice(0, 6);
    return { monthCreated, monthDeposits, expectedBalance, revenue, receivables, shoots, upcoming, attention, recent: contracts.slice(0, 7) };
  }, [data, month, today]);

  if (error) return <div className="admin-error" role="alert">{error}</div>;
  if (!data) return <div className="admin-auth-screen"><div className="admin-spinner" /><p>대시보드 데이터를 불러오고 있습니다.</p></div>;

  const stats = [
    ['이번 달 신규 계약', `${view.monthCreated.length}건`],
    ['이번 달 계약금', money(view.monthDeposits.reduce((sum, contract) => sum + contract.deposit, 0))],
    ['이번 달 예정 잔금', money(view.expectedBalance)],
    ['이번 달 확정 매출', money(view.revenue)],
    ['미수금', money(view.receivables)],
    ['이번 달 촬영', `${view.shoots.length}건`],
  ];

  return <main className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-kicker">OVERVIEW</p><h1>안녕하세요, 대표님</h1><p>{today.replaceAll('-', '.')} 기준 디어메모리 운영 현황입니다.</p></div><Link className="admin-button primary" href="/admin/contracts">전체 계약 보기</Link></div>
    <section className="admin-stats" aria-label="이번 달 주요 통계">{stats.map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-card delivery-dashboard"><div className="admin-card-header"><h2>업무 처리 현황</h2><Link href="/admin/delivery">납품 관리 →</Link></div><div className="delivery-summary">{TASKS.map(t=>{const rows=taskRows(data.contracts,t.key,today);const overdue=rows.filter(c=>taskInfo(c,t.key,today).late).length;return <Link className="admin-stat delivery-tile" href={'/admin/delivery?filter='+t.key} key={t.key}><span>{t.label}</span><strong>{rows.length}팀</strong><small className={overdue?'delivery-late':''}>{t.rule}{overdue?' · 지연 '+overdue+'팀':''}</small></Link>})}</div><p className="delivery-note">잔금은 7일 이내 기한 및 지연 건 · 발송은 본식일 이후 고객 기준</p></section>
    <div className="admin-grid">
      <section className="admin-card"><div className="admin-card-header"><h2>오늘 / 가까운 촬영 일정</h2><Link href="/admin/calendar">캘린더 보기</Link></div><div className="admin-list">{view.upcoming.map(contract => <Link className="admin-list-item" key={contract.id} href={`/admin/customers/${contract.id}`}><div><strong>{contract.groom} · {contract.bride}</strong><span>{contract.weddingVenue || '예식장 확인 필요'} · {contract.weddingTime || '시간 확인 필요'}</span></div><span><b>{contract.weddingDate}</b><small>{productName(contract.productId)}</small></span></Link>)}{!view.upcoming.length ? <p className="admin-empty">예정된 촬영이 없습니다.</p> : null}</div></section>
      <section className="admin-card"><div className="admin-card-header"><h2>입금 확인 필요</h2><Link href="/admin/payments">입금 관리</Link></div><div className="admin-list">{view.attention.map(contract => <Link className="admin-list-item" key={contract.id} href={`/admin/customers/${contract.id}`}><div><strong>{contract.groom} · {contract.bride}</strong><span>{contract.number}</span></div><span className={`admin-badge ${contract.depositConfirmedAt ? 'orange' : 'red'}`}>{contract.depositConfirmedAt ? `잔금 ${money(contract.balance)}` : '계약금 미확인'}</span></Link>)}{!view.attention.length ? <p className="admin-empty">확인이 필요한 입금이 없습니다.</p> : null}</div></section>
      <section className="admin-card"><div className="admin-card-header"><h2>최근 계약</h2><Link href="/admin/contracts">모두 보기</Link></div><div className="admin-list">{view.recent.map(contract => <Link className="admin-list-item" key={contract.id} href={`/admin/customers/${contract.id}`}><div><strong>{contract.groom} · {contract.bride}</strong><span>{contract.weddingDate} · {contract.weddingVenue || '장소 확인 필요'}</span></div><span className={`admin-badge ${contract.sentAt ? 'green' : 'orange'}`}>{contract.sentAt ? '발송 완료' : '검토 대기'}</span></Link>)}</div></section>
      <section className="admin-card"><div className="admin-card-header"><h2>최근 짝꿍코드 사용</h2><Link href="/admin/buddy">짝꿍 관리</Link></div><div className="admin-list">{data.buddyUsages.slice(0, 6).map(usage => <div className="admin-list-item" key={usage.id}><div><strong>{usage.ownerName} → {usage.referredBrideName}</strong><span>{usage.code} · 본식 {usage.referredWeddingDate}</span></div><span className={`admin-badge ${usage.status === 'valid' ? 'green' : 'orange'}`}>{usage.status === 'valid' ? '유효' : '확인 필요'}</span></div>)}{!data.buddyUsages.length ? <p className="admin-empty">최근 추천 내역이 없습니다.</p> : null}</div></section>
    </div>
  </main>;
}

