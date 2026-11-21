'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CUSTOMER_STAGES, money, productName } from './types';
import { useAdminCrm } from './useAdminCrm';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, isPending, mutate } = useAdminCrm();
  const contract = data?.contracts.find(item => item.id === params.id);
  const [stage, setStage] = useState('계약');
  const [memo, setMemo] = useState('');
  const [groomPhone, setGroomPhone] = useState('');
  const [bridePhone, setBridePhone] = useState('');
  const [weddingVenue, setWeddingVenue] = useState('');
  const [weddingHall, setWeddingHall] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { if (contract) { setStage(contract.stage); setMemo(contract.memo); setGroomPhone(contract.groomPhone); setBridePhone(contract.bridePhone); setWeddingVenue(contract.weddingVenue); setWeddingHall(contract.weddingHall); } }, [contract]);
  if (error) return <div className="admin-error">{error}</div>;
  if (!data) return <div className="admin-auth-screen"><div className="admin-spinner" /></div>;
  if (!contract) return <div className="admin-card"><p>고객을 찾을 수 없습니다.</p><Link href="/admin/customers">고객 목록으로</Link></div>;

  async function save() {
    setMessage('');
    await mutate({ type: 'update_customer', contractId: contract!.id, stage, memo, groomPhone, bridePhone, weddingVenue, weddingHall });
    setMessage('고객 정보를 저장했습니다.');
  }

  const info = [
    ['신랑', `${contract.groom} · ${contract.groomPhone || '연락처 없음'}`], ['신부', `${contract.bride} · ${contract.bridePhone || '연락처 없음'}`],
    ['이메일', contract.email || '-'], ['예식 일시', `${contract.weddingDate} ${contract.weddingTime}`], ['예식 장소', `${contract.weddingVenue} ${contract.weddingHall}`.trim() || '-'],
    ['상품', productName(contract.productId)], ['계약금액', money(contract.total)], ['계약금', `${money(contract.deposit)} · ${contract.depositConfirmedAt ? '확인 완료' : '미확인'}`],
    ['잔금', money(contract.balance)], ['짝꿍코드', contract.referralCode || contract.buddyCode || '-'],
  ];

  return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMER DETAIL</p><h1>{contract.groom} · {contract.bride}</h1><p>{contract.number}</p></div><Link className="admin-button" href="/admin/customers">목록으로</Link></div><div className="admin-detail-grid"><section className="admin-card"><div className="admin-card-header"><h2>고객 · 계약 정보</h2><span className={`admin-badge ${contract.status === 'cancelled' ? 'red' : 'green'}`}>{contract.status === 'cancelled' ? '취소' : '진행 중'}</span></div><dl className="admin-definition">{info.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="admin-toolbar" style={{ marginTop: 20 }}>{contract.reviewUrl ? <a className="admin-button" href={contract.reviewUrl} target="_blank" rel="noreferrer">계약서 보기</a> : null}{contract.driveFolderUrl ? <a className="admin-button" href={contract.driveFolderUrl} target="_blank" rel="noreferrer">Google Drive</a> : null}<Link className="admin-button" href={`/admin/calendar?date=${contract.weddingDate}`}>캘린더 보기</Link></div></section><section className="admin-card"><div className="admin-card-header"><h2>진행 관리</h2><span className="admin-badge orange">{contract.stage}</span></div><label className="admin-field">현재 단계<select value={stage} onChange={event => setStage(event.target.value)}>{CUSTOMER_STAGES.map(item => <option value={item} key={item}>{item}</option>)}</select></label><div className="admin-card-header" style={{ marginTop: 18 }}><h2>연락처 · 예식장 보완</h2></div><div className="admin-toolbar"><label className="admin-field">신랑 연락처<input value={groomPhone} onChange={event => setGroomPhone(event.target.value)} placeholder="010-0000-0000" /></label><label className="admin-field">신부 연락처<input value={bridePhone} onChange={event => setBridePhone(event.target.value)} placeholder="010-0000-0000" /></label><label className="admin-field">예식장<input value={weddingVenue} onChange={event => setWeddingVenue(event.target.value)} placeholder="예식장명" /></label><label className="admin-field">홀명<input value={weddingHall} onChange={event => setWeddingHall(event.target.value)} placeholder="홀명" /></label></div><label className="admin-field">관리자 메모<textarea value={memo} onChange={event => setMemo(event.target.value)} placeholder="상담, 촬영, 셀렉, 수정 요청 등 내부 메모" /></label><button className="admin-button primary" disabled={isPending} onClick={() => void save()} style={{ marginTop: 14 }}>{isPending ? '저장 중' : '저장'}</button>{message ? <p className="admin-badge green" style={{ marginLeft: 10 }}>{message}</p> : null}<div className="admin-card-header" style={{ marginTop: 28 }}><h2>추천 혜택</h2></div><dl className="admin-definition"><div><dt>누적 혜택</dt><dd>{money(contract.benefitGranted)}</dd></div><div><dt>적용 / 지급</dt><dd>{money(contract.benefitPaid)}</dd></div><div><dt>미지급</dt><dd>{money(contract.benefitOutstanding)}</dd></div><div><dt>Calendar</dt><dd>{contract.calendarSaved ? '등록 완료' : '확인 필요'}</dd></div></dl></section></div></main>;
}

