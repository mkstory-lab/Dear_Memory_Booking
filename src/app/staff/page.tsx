'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, LogOut } from 'lucide-react';
import './staff.css';

type Schedule = {
  id: string; number: string; groom: string; bride: string; groomPhone: string; bridePhone: string;
  weddingDate: string; weddingTime: string; weddingVenue: string; weddingHall: string; productId: string; stage: string; memo: string;
};
type Staff = { id: string; username: string; displayName: string };
const weekdays = ['일','월','화','수','목','금','토'];
const productName = (id: string) => id === 'album_plus' ? '화보형' : id === 'standard' ? '실속형' : '상품 확인';

function monthShift(month: string, delta: number) {
  const [y,m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}
function currentMonth() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year:'numeric', month:'2-digit' }).format(new Date());
}

export default function StaffPage() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [selectedId, setSelectedId] = useState('');

  async function loadSchedule() {
    const response = await fetch('/api/staff/schedule', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '스케줄을 불러오지 못했습니다.');
    setStaff(result.staff); setSchedules(result.schedules); setAuth(true);
  }
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/staff/session', { cache: 'no-store' });
        const result = await response.json();
        if (!result.authenticated) { setAuth(false); return; }
        await loadSchedule();
      } catch { setAuth(false); }
    })();
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const response = await fetch('/api/staff/session', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password }) });
    const result = await response.json();
    setPassword('');
    if (!response.ok) { setError(result.error || '로그인할 수 없습니다.'); return; }
    await loadSchedule();
  }
  async function logout() {
    await fetch('/api/staff/session', { method:'DELETE' });
    setAuth(false); setStaff(null); setSchedules([]);
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthSchedules = useMemo(() => schedules.filter(item => item.weddingDate.startsWith(month)), [schedules, month]);
  const byDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const item of monthSchedules) map.set(item.weddingDate, [...(map.get(item.weddingDate) || []), item]);
    return map;
  }, [monthSchedules]);
  const selected = schedules.find(item => item.id === selectedId);
  const cells = Array.from({length:firstDay + days}, (_,i) => i < firstDay ? null : i-firstDay+1);

  if (auth === null) return <main className="staff-loading">스케줄을 불러오고 있습니다.</main>;
  if (!auth) return <main className="staff-login"><section className="staff-login-card"><p className="staff-kicker">DEAR MEMORY</p><h1>작가 스케줄 로그인</h1><p>대표에게 받은 아이디와 비밀번호로 로그인해 주세요.</p><form onSubmit={login}><label>아이디<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required /></label><label>비밀번호<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label><button type="submit">로그인</button></form>{error ? <p className="staff-error">{error}</p> : null}</section></main>;

  return <main className="staff-app">
    <header className="staff-header"><div><p className="staff-kicker">DEAR MEMORY · STAFF</p><h1>{staff?.displayName} 작가님 스케줄</h1></div><button onClick={logout}><LogOut size={16}/>로그아웃</button></header>
    <section className="staff-summary"><CalendarDays size={18}/><strong>전체 배정 {schedules.length}건</strong><span>본인에게 배정된 일정만 표시됩니다.</span></section>
    <section className="staff-calendar-card">
      <div className="staff-calendar-head"><button onClick={()=>setMonth(v=>monthShift(v,-1))}>‹</button><h2>{year}년 {monthNumber}월</h2><button onClick={()=>setMonth(v=>monthShift(v,1))}>›</button></div>
      <div className="staff-calendar-grid">{weekdays.map(day=><div className="staff-weekday" key={day}>{day}</div>)}{cells.map((day,index)=>{
        if(!day) return <div className="staff-day empty" key={`empty-${index}`}/>;
        const date=`${month}-${String(day).padStart(2,'0')}`;
        const items=byDate.get(date)||[];
        return <div className="staff-day" key={date}><span className="staff-date">{day}</span>{items.map(item=><button key={item.id} onClick={()=>setSelectedId(item.id)}><strong>{item.weddingTime || '시간 확인'}</strong><span>{item.bride} 신부</span><small>{item.weddingVenue || '장소 확인'}</small></button>)}</div>;
      })}</div>
    </section>
    <section className="staff-list"><h2>이번 달 배정 일정</h2>{monthSchedules.length ? monthSchedules.map(item=><button key={item.id} onClick={()=>setSelectedId(item.id)}><div><strong>{item.weddingDate} {item.weddingTime}</strong><span>{item.groom} · {item.bride}</span></div><span>{item.weddingVenue} {item.weddingHall}</span></button>) : <p>이번 달 배정 일정이 없습니다.</p>}</section>
    {selected ? <div className="staff-modal-backdrop" onClick={()=>setSelectedId('')}><section className="staff-modal" onClick={e=>e.stopPropagation()}><button className="staff-close" onClick={()=>setSelectedId('')}>×</button><p className="staff-kicker">SHOOT DETAIL</p><h2>{selected.groom} · {selected.bride}</h2><dl><div><dt>예식 일시</dt><dd>{selected.weddingDate} {selected.weddingTime || '-'}</dd></div><div><dt>예식장</dt><dd>{selected.weddingVenue} {selected.weddingHall}</dd></div><div><dt>신부 연락처</dt><dd>{selected.bridePhone || '-'}</dd></div><div><dt>신랑 연락처</dt><dd>{selected.groomPhone || '-'}</dd></div><div><dt>상품</dt><dd>{productName(selected.productId)}</dd></div><div><dt>진행 상태</dt><dd>{selected.stage}</dd></div>{selected.memo ? <div><dt>대표 메모</dt><dd>{selected.memo}</dd></div>:null}</dl></section></div>:null}
  </main>;
}
