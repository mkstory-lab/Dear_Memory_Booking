'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { money, productName, seoulToday } from './types';

export default function ContractsPage() {
  const { data, error, refresh } = useAdminCrm();
  const [recovering, setRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const candidates = (data?.contracts || []).filter(c => c.id.startsWith('drive_') && c.status !== 'cancelled' && c.driveFolderUrl && [c.weddingVenue,c.weddingHall,c.weddingTime,c.groomPhone,c.bridePhone,c.email,c.productId].some(v=>!v?.trim()));
  async function recoverOriginals() {
    if (recovering || !candidates.length) return;
    setRecovering(true);
    const ids = candidates.map(c=>c.id);
    let done=0, restored=0;
    const issues:string[]=[];
    try {
      for(let i=0;i<ids.length;i+=4) {
        const response=await fetch('/api/referrals/admin/crm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),command:{type:'recover_imported_metadata',contractIds:ids.slice(i,i+4)}})});
        const result=await response.json();
        if(!response.ok) { issues.push('일괄 복구 요청 실패: '+(result.error||response.status)); break; }
        for(const row of result.recoveryReport||[]) { if(row.fields.length) restored++; if(row.error) issues.push(row.number+': '+row.error); else if(!row.fields.length) issues.push(row.number+': 추가 복구 가능한 정보 없음'); }
        done+=ids.slice(i,i+4).length;
        setRecoveryMessage('원본 확인 '+done+'/'+ids.length+'건, 복구 '+restored+'건');
      }
      await refresh();
      setRecoveryMessage('원본 확인 '+done+'/'+ids.length+'건 · 복구 '+restored+'건'+(issues.length?' · 확인 필요: '+issues.join(' / '):' · 완료'));
    } catch { await refresh();setRecoveryMessage('연결 오류 · 복구 '+restored+'건. 새로고침 후 남은 항목 확인'); }
    finally {setRecovering(false);}
  }
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const today = seoulToday();
  const month = today.slice(0, 7);
  const nextMonth = `${Number(month.slice(0, 4)) + (month.endsWith('-12') ? 1 : 0)}-${String((Number(month.slice(5)) % 12) + 1).padStart(2, '0')}`;

  const rows = useMemo(() => (data?.contracts || []).filter(contract => {
    const needle = query.toLowerCase().replace(/\s/g, '');
    const haystack = [contract.groom, contract.bride, contract.groomPhone, contract.bridePhone, contract.number].join('').toLowerCase().replace(/\s/g, '');
    if (needle && !haystack.includes(needle)) return false;
    if (filter === 'month') return contract.weddingDate.startsWith(month);
    if (filter === 'next') return contract.weddingDate.startsWith(nextMonth);
    if (filter === 'unpaid') return contract.balance > 0;
    if (filter === 'completed') return contract.stage === '촬영완료' || contract.status === 'completed';
    return true;
  }), [data, query, filter, month, nextMonth]);

  if (error) return <div className="admin-error">{error}</div>;
  return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">CONTRACTS</p><h1>계약서 관리</h1><p>접수부터 발송, Drive 보관, 입금 상태를 계약별로 확인합니다.</p></div></div>
    <div className="admin-toolbar"><button type="button" disabled={recovering || !candidates.length} onClick={()=>void recoverOriginals()}>{recovering?'원본 대조 중…':'Drive 누락 정보 복구 ('+candidates.length+'건)'}</button><input aria-label="계약 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="신랑·신부, 연락처, 계약번호 검색" /><select aria-label="계약 필터" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">전체</option><option value="month">이번 달 촬영</option><option value="next">다음 달 촬영</option><option value="unpaid">잔금 미입금</option><option value="completed">촬영 완료</option></select><span className="admin-badge">{rows.length}건</span></div>
    {recoveryMessage && <p role="status" className="admin-badge">{recoveryMessage}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>계약일</th><th>신랑 · 신부</th><th>예식 장소</th><th>예식 일시</th><th>상품</th><th>총 계약금액</th><th>계약금 / 잔금</th><th>입금 상태</th><th>관리</th></tr></thead><tbody>{rows.map(contract => <tr key={contract.id}><td>{contract.createdAt.slice(0, 10)}</td><td><strong>{contract.groom} · {contract.bride}</strong><small>{contract.number}</small></td><td>{contract.weddingVenue || '-'}<small>{contract.weddingHall}</small></td><td>{contract.weddingDate}<small>{contract.weddingTime || '시간 확인 필요'}</small></td><td>{productName(contract.productId)}</td><td>{money(contract.total)}</td><td>{money(contract.deposit)}<small>잔금 {money(contract.balance)}</small></td><td><span className={`admin-badge ${contract.balance === 0 ? 'green' : contract.depositConfirmedAt ? 'orange' : 'red'}`}>{contract.balance === 0 ? '전액 완료' : contract.depositConfirmedAt ? '계약금 확인' : '미확인'}</span></td><td><Link href={`/admin/customers/${contract.id}`}>상세</Link>{contract.reviewUrl ? <><small><a href={contract.reviewUrl} target="_blank" rel="noreferrer">계약서 보기</a></small></> : null}{contract.driveFolderUrl ? <small><a href={contract.driveFolderUrl} target="_blank" rel="noreferrer">Drive</a></small> : null}</td></tr>)}</tbody></table>{!data ? <p className="admin-empty">계약 데이터를 불러오고 있습니다.</p> : !rows.length ? <p className="admin-empty">조건에 맞는 계약이 없습니다.</p> : null}</div>
  </main>;
}

