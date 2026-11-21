'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { seoulToday, type AdminContract, type AdminManualSchedule } from './types';

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function shiftMonth(month: string, change: number) {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 1 + change, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { data, error, isPending, mutate } = useAdminCrm();
  const [month, setMonth] = useState(seoulToday().slice(0, 7));
  const [editing, setEditing] = useState<AdminContract | null>(null);
  const [manualDetail, setManualDetail] = useState<AdminManualSchedule | null>(null);
  const [createDate, setCreateDate] = useState('');
  const [form, setForm] = useState({ weddingTime: '', weddingVenue: '', weddingHall: '', groomPhone: '', bridePhone: '' });
  const [manual, setManual] = useState({ title: '', time: '', venue: '', contact: '', details: '', staffIds: [] as string[] });
  const [message, setMessage] = useState('');

  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const contractsByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>['contracts']>();
    for (const contract of data?.contracts || []) {
      if (!contract.weddingDate.startsWith(month) || contract.status === 'cancelled') continue;
      map.set(contract.weddingDate, [...(map.get(contract.weddingDate) || []), contract]);
    }
    return map;
  }, [data, month]);

  const manualByDate = useMemo(() => {
    const map = new Map<string, AdminManualSchedule[]>();
    for (const item of data?.manualSchedules || []) {
      if (!item.date.startsWith(month) || !item.active) continue;
      map.set(item.date, [...(map.get(item.date) || []), item]);
    }
    return map;
  }, [data, month]);

  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const assignees = (contractId: string) => data?.staffAssignments?.[contractId] || [];
  const manualAssignees = (item: AdminManualSchedule) =>
    item.staffIds.map(id => data?.staff.find(staff => staff.id === id)?.displayName).filter((name): name is string => !!name);

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

  function openCreate(date: string) {
    setCreateDate(date);
    setMessage('');
    setManual({ title: '', time: '', venue: '', contact: '', details: '', staffIds: [] });
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

  async function saveManual() {
    if (!createDate) return;
    await mutate({ type: 'create_manual_schedule', date: createDate, ...manual });
    setCreateDate('');
    setManual({ title: '', time: '', venue: '', contact: '', details: '', staffIds: [] });
  }

  async function deleteManual() {
    if (!manualDetail) return;
    await mutate({ type: 'delete_manual_schedule', id: manualDetail.id });
    setManualDetail(null);
  }

  if (error) return <div className="admin-error">{error}</div>;

  return <main className="admin-page">
    <div className="admin-page-heading">
      <div>
        <p className="admin-kicker">SHOOTING CALENDAR</p>
        <h1>촬영 캘린더</h1>
        <p>날짜를 클릭하면 그 날짜에 수동 일정을 바로 추가할 수 있습니다. 기존 계약 일정은 일정 카드를 눌러 상세를 수정합니다.</p>
      </div>
    </div>

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
          const contracts = contractsByDate.get(date) || [];
          const manuals = manualByDate.get(date) || [];
          const count = contracts.length + manuals.length;
          return <div
            className={`admin-calendar-day ${count > 1 ? 'is-double' : ''}`}
            key={date}
            role="button"
            tabIndex={0}
            aria-label={`${date} 수동 일정 추가`}
            onClick={() => openCreate(date)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCreate(date);
              }
            }}
            style={{ textAlign: 'left', cursor: 'pointer' }}
          >
            <span className="admin-calendar-number">{day}{count > 1 ? ` · ${count}건` : ''}</span>

            {contracts.map(contract => {
              const names = assignees(contract.id);
              return <button
                type="button"
                className="admin-calendar-event"
                key={contract.id}
                onClick={event => { event.stopPropagation(); openEdit(contract); }}
                style={{ width: '100%', border: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                <strong>{contract.groom} · {contract.bride}</strong>
                <span>{contract.weddingTime || '시간 확인'} · {contract.weddingVenue || '장소 확인'}</span>
                <small style={{ display: 'block', marginTop: 3, fontWeight: 700 }}>{names.length ? `작가: ${names.join(', ')}` : '작가 미배정'}</small>
              </button>;
            })}

            {manuals.map(item => {
              const names = manualAssignees(item);
              return <button
                type="button"
                className="admin-calendar-event"
                key={item.id}
                onClick={event => { event.stopPropagation(); setManualDetail(item); }}
                style={{ width: '100%', border: 0, cursor: 'pointer', textAlign: 'left', opacity: .88 }}
              >
                <strong>[수동] {item.title}</strong>
                <span>{item.time || '시간 미입력'} · {item.venue || '장소 미입력'}</span>
                <small style={{ display: 'block', marginTop: 3, fontWeight: 700 }}>{names.length ? `작가: ${names.join(', ')}` : '작가 미배정'}</small>
              </button>;
            })}
          </div>;
        })}
      </div>
    </section>

    {createDate ? <div onClick={() => setCreateDate('')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 18, zIndex: 80 }}>
      <section className="admin-card" onClick={event => event.stopPropagation()} style={{ width: 'min(640px, 100%)', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <button onClick={() => setCreateDate('')} aria-label="닫기" style={{ position: 'absolute', right: 18, top: 18, border: 0, background: 'transparent', cursor: 'pointer' }}><X size={22} /></button>
        <p className="admin-kicker">MANUAL SCHEDULE</p>
        <h2>{createDate} 일정 직접 입력</h2>
        <div className="admin-toolbar" style={{ marginTop: 18 }}>
          <label className="admin-field">일정 제목<input value={manual.title} onChange={e => setManual(v => ({ ...v, title: e.target.value }))} placeholder="예: 외부 웨딩 서브 촬영" /></label>
          <label className="admin-field">시간<input value={manual.time} onChange={e => setManual(v => ({ ...v, time: e.target.value }))} placeholder="예: 13:00" /></label>
          <label className="admin-field">장소<input value={manual.venue} onChange={e => setManual(v => ({ ...v, venue: e.target.value }))} placeholder="예: 지타워컨벤션 2층" /></label>
          <label className="admin-field">연락처<input value={manual.contact} onChange={e => setManual(v => ({ ...v, contact: e.target.value }))} placeholder="고객/현장 담당자 연락처" /></label>
        </div>
        <label className="admin-field" style={{ marginTop: 12 }}>상세 메모<textarea value={manual.details} onChange={e => setManual(v => ({ ...v, details: e.target.value }))} placeholder="도착시간, 촬영범위, 준비사항 등" /></label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          {(data?.staff || []).filter(staff => staff.active).map(staff => <label key={staff.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <input type="checkbox" checked={manual.staffIds.includes(staff.id)} onChange={e => setManual(v => ({ ...v, staffIds: e.target.checked ? [...v.staffIds, staff.id] : v.staffIds.filter(id => id !== staff.id) }))} />
            {staff.displayName}
          </label>)}
        </div>
        <button className="admin-button primary" style={{ marginTop: 18 }} disabled={isPending || !manual.title || !manual.staffIds.length} onClick={() => void saveManual()}>{isPending ? '등록 중' : '이 날짜에 일정 등록'}</button>
      </section>
    </div> : null}

    {editing ? <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 18, zIndex: 80 }}>
      <section className="admin-card" onClick={event => event.stopPropagation()} style={{ width: 'min(620px, 100%)', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
        <button onClick={() => setEditing(null)} aria-label="닫기" style={{ position: 'absolute', right: 18, top: 18, border: 0, background: 'transparent', cursor: 'pointer' }}><X size={22} /></button>
        <p className="admin-kicker">SHOOT DETAIL</p>
        <h2>{editing.groom} · {editing.bride}</h2>
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

    {manualDetail ? <div onClick={() => setManualDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 18, zIndex: 80 }}>
      <section className="admin-card" onClick={event => event.stopPropagation()} style={{ width: 'min(540px, 100%)', position: 'relative' }}>
        <button onClick={() => setManualDetail(null)} aria-label="닫기" style={{ position: 'absolute', right: 18, top: 18, border: 0, background: 'transparent', cursor: 'pointer' }}><X size={22} /></button>
        <p className="admin-kicker">MANUAL SCHEDULE</p>
        <h2>{manualDetail.title}</h2>
        <p>{manualDetail.date} {manualDetail.time || ''}</p>
        <p>{manualDetail.venue || '장소 미입력'}</p>
        {manualDetail.contact ? <p>연락처: {manualDetail.contact}</p> : null}
        {manualDetail.details ? <p style={{ whiteSpace: 'pre-wrap' }}>{manualDetail.details}</p> : null}
        <p>배정 작가: {manualAssignees(manualDetail).join(', ') || '-'}</p>
        <button className="admin-button" style={{ marginTop: 14 }} disabled={isPending} onClick={() => void deleteManual()}>수동 일정 삭제</button>
      </section>
    </div> : null}
  </main>;
}
