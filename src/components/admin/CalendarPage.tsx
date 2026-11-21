'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { seoulToday, type AdminContract } from './types';

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function shiftMonth(month: string, change: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 1 + change, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { data, error, isPending, mutate } = useAdminCrm();
  const [month, setMonth] = useState(seoulToday().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState('');
  const [editing, setEditing] = useState<AdminContract | null>(null);
  const [form, setForm] = useState({ weddingTime: '', weddingVenue: '', weddingHall: '', groomPhone: '', bridePhone: '' });
  const [message, setMessage] = useState('');
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
  const assignees = (contractId: string) => data?.staffAssignments?.[contractId] || [];

  function openEdit(contract: AdminContract) {
    setEditing(contract);
    setMessage('');
    setForm({
      weddingTime: contract.weddingTime,
      weddingVenue: contract.weddingVenue,
      weddingHall: contract.weddingHall,
      groomPhone: contract.groomPhone,
      bridePhone: contract.bridePhone,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    await mutate({
      type: 'update_customer',
      contractId: editing.id,
      stage: editing.stage,
      memo: editing.memo,
      weddingTime: form.weddingTime,
      weddingVenue: form.weddingVenue,
      weddingHall: form.weddingHall,
      groomPhone: form.groomPhone,
      bridePhone: form.bridePhone,
    });
    setMessage('수정 내용을 저장했습니다.');
  }

  if (error) return <div className="admin-error">{error}</div>;

  return <main className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-kicker">SHOOTING CALENDAR</p><h1>촬영 캘린더</h1><p>촬영 일정과 배정 작가를 한눈에 확인하고, 일정 정보를 바로 수정할 수 있습니다.</p></div></div>
    <section className="admin-card calendar-card">
      <div className="admin-calendar-head">
        <button className="admin-button" onClick={() => setMonth(value => shiftMonth(value, -1))} aria-label="이전 달"><ChevronLeft size={16} /></button>
        <h2>{year}년 {monthNumber}월</h2>
        <button className="admin-button" onClick={() => setMonth(value => shiftMonth(value, 1))} aria-label="다음 달"><ChevronRight size={16} /></button>
      </div>
      <div className="admin-calendar-grid">
        {weekdays.map(day => <div className="admin-calendar-weekday" key={day}>{day}</div>)}
        {cells.map((day, index) => {
          if (!day) return <div className="admin-calendar-day is-empty" key={`empty-${index}`} />;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const events = byDate.get(date) || [];
          return <div className={`admin-calendar-day ${events.length > 1 ? 'is-double' : ''}`} key={date} style={{ textAlign: 'left' }}>
            <button type="button" onClick={() => setSelectedDate(date)} style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}>
              <span className="admin-calendar-number">{day}{events.length > 1 ? ` · ${events.length}건` : ''}</span>
            </button>
            {events.map(contract => {
              const names = assignees(contract.id);
              return <button type="button" className="admin-calendar-event" key={contract.id} onClick={() => openEdit(contract)} style={{ width: '100%', border: 0, cursor: 'pointer', textAlign: 'left' }}>
                <strong>{contract.groom} · {contract.bride}</strong>
                <span>{contract.weddingTime || '시간 확인'} · {contract.weddingVenue || '장소 확인'}</span>
                <small style={{ display: 'block', marginTop: 3, fontWeight: 700 }}>{names.length ? `작가: ${names.join(', ')}` : '작가 미배정'}</small>
              </button>;
            })}
          </div>;
        })}
      </div>
    </section>

    {selectedDate ? <section className="admin-card" style={{ marginTop: 18 }}>
      <div className="admin-card-header"><h2>{selectedDate} 촬영 목록</h2><span className={`admin-badge ${selected.length > 1 ? 'red' : 'green'}`}>{selected.length}건</span></div>
      <div className="admin-list">{selected.map(contract => <div className="admin-list-item" key={contract.id}>
        <div><strong>{contract.groom} · {contract.bride}</strong><span>{contract.weddingVenue || '장소 확인'} {contract.weddingHall}</span><small>{assignees(contract.id).length ? `배정: ${assignees(contract.id).join(', ')}` : '작가 미배정'}</small></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span>{contract.weddingTime || '시간 확인'}</span><button className="admin-button" onClick={() => openEdit(contract)}>상세 · 수정</button><Link className="admin-button" href={`/admin/customers/${contract.id}`}>고객</Link></div>
      </div>)}</div>
    </section> : null}

    {editing ? <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 18, zIndex: 80 }}>
      <section className="admin-card" onClick={event => event.stopPropagation()} style={{ width: 'min(620px, 100%)', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <button onClick={() => setEditing(null)} aria-label="닫기" style={{ position: 'absolute', right: 18, top: 18, border: 0, background: 'transparent', cursor: 'pointer' }}><X size={22} /></button>
        <p className="admin-kicker">SHOOT DETAIL</p><h2>{editing.groom} · {editing.bride}</h2>
        <p style={{ marginTop: 4 }}>{editing.weddingDate} · {assignees(editing.id).length ? `배정 작가: ${assignees(editing.id).join(', ')}` : '작가 미배정'}</p>
        <div className="admin-toolbar" style={{ marginTop: 18 }}>
          <label className="admin-field">예식 시간<input value={form.weddingTime} onChange={e => setForm(value => ({ ...value, weddingTime: e.target.value }))} placeholder="예: 13:00" /></label>
          <label className="admin-field">예식장<input value={form.weddingVenue} onChange={e => setForm(value => ({ ...value, weddingVenue: e.target.value }))} placeholder="예식장명" /></label>
          <label className="admin-field">홀명<input value={form.weddingHall} onChange={e => setForm(value => ({ ...value, weddingHall: e.target.value }))} placeholder="홀명" /></label>
          <label className="admin-field">신부 연락처<input value={form.bridePhone} onChange={e => setForm(value => ({ ...value, bridePhone: e.target.value }))} placeholder="010-0000-0000" /></label>
          <label className="admin-field">신랑 연락처<input value={form.groomPhone} onChange={e => setForm(value => ({ ...value, groomPhone: e.target.value }))} placeholder="010-0000-0000" /></label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
          <button className="admin-button primary" disabled={isPending} onClick={() => void saveEdit()}>{isPending ? '저장 중' : '수정 저장'}</button>
          <Link className="admin-button" href={`/admin/customers/${editing.id}`}>고객 상세</Link>
          {message ? <span className="admin-badge green">{message}</span> : null}
        </div>
      </section>
    </div> : null}
  </main>;
}
