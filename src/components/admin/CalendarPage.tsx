'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { seoulToday } from './types';

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function shiftMonth(month: string, change: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 1 + change, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { data, error } = useAdminCrm();
  const [month, setMonth] = useState(seoulToday().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState('');
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const byDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>['contracts']>();
    for (const contract of data?.contracts || []) {
      if (!contract.weddingDate.startsWith(month) || contract.status === 'cancelled') continue;
      map.set(contract.weddingDate, [...(map.get(contract.weddingDate) || []), contract]);
    }
    return map;
  }, [data, month]);
  const selected = selectedDate ? byDate.get(selectedDate) || [] : [];
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);

  if (error) return <div className="admin-error">{error}</div>;
  return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">SHOOTING CALENDAR</p><h1>촬영 캘린더</h1><p>같은 날짜의 모든 촬영을 표시하며, 2건 이상은 더블 부킹 가능성으로 강조됩니다.</p></div></div><section className="admin-card calendar-card"><div className="admin-calendar-head"><button className="admin-button" onClick={() => setMonth(value => shiftMonth(value, -1))} aria-label="이전 달"><ChevronLeft size={16} /></button><h2>{year}년 {monthNumber}월</h2><button className="admin-button" onClick={() => setMonth(value => shiftMonth(value, 1))} aria-label="다음 달"><ChevronRight size={16} /></button></div><div className="admin-calendar-grid">{weekdays.map(day => <div className="admin-calendar-weekday" key={day}>{day}</div>)}{cells.map((day, index) => {
    if (!day) return <div className="admin-calendar-day is-empty" key={`empty-${index}`} />;
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const events = byDate.get(date) || [];
    return <button type="button" onClick={() => setSelectedDate(date)} className={`admin-calendar-day ${events.length > 1 ? 'is-double' : ''}`} key={date} style={{ textAlign: 'left', cursor: 'pointer' }}><span className="admin-calendar-number">{day}{events.length > 1 ? ` · ${events.length}건` : ''}</span>{events.map(contract => <span className="admin-calendar-event" key={contract.id}><strong>{contract.groom} · {contract.bride}</strong>{contract.weddingTime || '시간 확인'} · {contract.weddingVenue || '장소 확인'}</span>)}</button>;
  })}</div></section>{selectedDate ? <section className="admin-card" style={{ marginTop: 18 }}><div className="admin-card-header"><h2>{selectedDate} 촬영 목록</h2><span className={`admin-badge ${selected.length > 1 ? 'red' : 'green'}`}>{selected.length}건</span></div><div className="admin-list">{selected.map(contract => <Link href={`/admin/customers/${contract.id}`} className="admin-list-item" key={contract.id}><div><strong>{contract.groom} · {contract.bride}</strong><span>{contract.weddingVenue} {contract.weddingHall}</span></div><span>{contract.weddingTime || '시간 확인'}</span></Link>)}</div></section> : null}</main>;
}

