'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Staff = { id: string; username: string; displayName: string; active: boolean; createdAt: string; updatedAt: string };
type Assignment = { contractId: string; staffIds: string[]; updatedAt: string };
type Contract = { id: string; number: string; groom: string; bride: string; weddingDate: string; weddingTime: string; weddingVenue: string; weddingHall: string; status: string };
type StaffData = { staff: Staff[]; assignments: Record<string, Assignment>; contracts: Contract[] };

export default function StaffAdminPage() {
  const [data, setData] = useState<StaffData | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/referrals/admin/staff', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '작가 정보를 불러오지 못했습니다.');
    setData(result);
  }, []);

  useEffect(() => { void load().catch(cause => setError(cause instanceof Error ? cause.message : '불러오지 못했습니다.')); }, [load]);

  async function mutate(command: Record<string, unknown>) {
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/referrals/admin/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: crypto.randomUUID(), command }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '저장하지 못했습니다.');
      setData(result);
      setMessage('저장했습니다.');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.');
      return false;
    } finally { setPending(false); }
  }

  const activeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!data) return counts;
    for (const assignment of Object.values(data.assignments)) {
      for (const id of assignment.staffIds) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }, [data]);

  return <main className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-kicker">TEAM</p><h1>작가 계정 · 스케줄 관리</h1><p>작가 계정을 만들고 계약별 촬영 스케줄을 배정합니다. 작가는 /staff에서 본인 일정만 확인합니다.</p></div></div>
    {error ? <p className="admin-error">{error}</p> : null}{message ? <p className="admin-badge green">{message}</p> : null}
    <section className="admin-card">
      <div className="admin-card-header"><h2>작가 계정 만들기</h2><span className="admin-badge">{data?.staff.length || 0}명</span></div>
      <div className="admin-toolbar">
        <label className="admin-field">작가 이름<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="예: 김동준" /></label>
        <label className="admin-field">로그인 아이디<input value={username} onChange={e => setUsername(e.target.value)} placeholder="예: dongjun" /></label>
        <label className="admin-field">비밀번호<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상" /></label>
        <button className="admin-button primary" disabled={pending || !displayName || !username || password.length < 8} onClick={async () => {
          if (await mutate({ type: 'create_staff', displayName, username, password })) { setDisplayName(''); setUsername(''); setPassword(''); }
        }}>계정 생성</button>
      </div>
    </section>
    <section className="admin-card" style={{ marginTop: 18 }}>
      <div className="admin-card-header"><h2>작가 목록</h2><span className="admin-badge">로그인 주소 /staff</span></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>작가</th><th>아이디</th><th>상태</th><th>배정 일정</th><th>관리</th></tr></thead><tbody>
        {(data?.staff || []).map(staff => <tr key={staff.id}>
          <td><strong>{staff.displayName}</strong></td><td>{staff.username}</td>
          <td><span className={`admin-badge ${staff.active ? 'green' : 'red'}`}>{staff.active ? '활성' : '비활성'}</span></td>
          <td>{activeCounts.get(staff.id) || 0}건</td>
          <td><div className="admin-toolbar">
            <button className="admin-button" disabled={pending} onClick={() => {
              const next = prompt('새 비밀번호를 입력하세요. (8자 이상)');
              if (next) void mutate({ type: 'change_staff_password', staffId: staff.id, password: next });
            }}>비밀번호 변경</button>
            <button className="admin-button" disabled={pending} onClick={() => void mutate({ type: 'set_staff_active', staffId: staff.id, active: !staff.active })}>{staff.active ? '로그인 중지' : '다시 활성화'}</button>
          </div></td>
        </tr>)}
      </tbody></table>{!data ? <p className="admin-empty">불러오는 중입니다.</p> : !data.staff.length ? <p className="admin-empty">아직 등록한 작가가 없습니다.</p> : null}</div>
    </section>
    <section className="admin-card" style={{ marginTop: 18 }}>
      <div className="admin-card-header"><h2>촬영 스케줄 배정</h2><span className="admin-badge">계약별 다중 배정 가능</span></div>
      <div className="admin-list">
        {(data?.contracts || []).filter(contract => contract.status !== 'cancelled').slice().sort((a,b) => a.weddingDate.localeCompare(b.weddingDate)).map(contract => {
          const assigned = new Set(data?.assignments[contract.id]?.staffIds || []);
          return <div className="admin-list-item" key={contract.id} style={{ alignItems: 'flex-start' }}>
            <div><strong>{contract.weddingDate} {contract.weddingTime} · {contract.groom} · {contract.bride}</strong><span>{contract.weddingVenue} {contract.weddingHall} · {contract.number}</span></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {(data?.staff || []).filter(staff => staff.active).map(staff => <label key={staff.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <input type="checkbox" checked={assigned.has(staff.id)} disabled={pending} onChange={event => {
                  const next = new Set(assigned);
                  if (event.target.checked) next.add(staff.id); else next.delete(staff.id);
                  void mutate({ type: 'assign_contract', contractId: contract.id, staffIds: [...next] });
                }} />{staff.displayName}
              </label>)}
            </div>
          </div>;
        })}
      </div>
    </section>
  </main>;
}
