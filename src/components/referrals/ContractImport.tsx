'use client';
import { useRef, useState } from 'react';
import type { Contract } from '@/lib/referrals/ledger';
export default function ContractImport({ onImported }: { onImported: () => Promise<void> }) {
  const [url, setUrl] = useState(''), [number, setNumber] = useState('');
  const [preview, setPreview] = useState<{ contract: Contract; duplicate: string | null } | null>(null), [error, setError] = useState(''), [pending, setPending] = useState(false);
  const requestId = useRef('');
  async function request(mode: 'preview' | 'commit') {
    if (pending) return; setPending(true); setError('');
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try { const r = await fetch('/api/referrals/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, number, mode, requestId: requestId.current }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error);
      if (mode === 'preview') setPreview(d); else { setPreview(null); setUrl(''); setNumber(''); requestId.current = ''; await onImported(); }
    } catch (e) { setError((e as Error).message); } finally { setPending(false); }
  }
  function reset() { setPreview(null); requestId.current = ''; }
  return <section className="panel"><h2>계약 검토 링크로 가져오기</h2><p>대표님께 도착한 계약 접수 메일의 검토 링크와 실제 계약번호를 입력하세요. 만료된 링크나 이미 등록된 계약은 가져오지 않습니다.</p><label>계약 검토 링크<input type="url" value={url} onChange={e => { setUrl(e.target.value); reset(); }} /></label><label>실제 계약번호<input value={number} onChange={e => { setNumber(e.target.value); reset(); }} /></label><div className="actions"><button disabled={pending || !url || !number} onClick={() => void request('preview')}>가져올 내용 미리보기</button></div>{error && <p role="alert" className="error">{error}</p>}{preview && <><p>{preview.contract.groom} · {preview.contract.bride}<br />{preview.contract.weddingDate} / {preview.contract.number}<br />계약금액 {preview.contract.total.toLocaleString('ko-KR')}원</p>{preview.contract.legacyPartnerDiscount && <p>기존 수동 짝꿍 할인이 포함된 금액을 유지합니다. 과거 추천 실적은 생성하지 않으며 새 추천 할인을 중복 적용하지 않습니다.</p>}<p>입금 상태는 미확인으로 등록됩니다. 이메일·캘린더·기존 파일은 변경하지 않습니다.</p>{preview.duplicate ? <p role="alert">이미 등록된 계약입니다. 기존 고객 목록에서 선택해 주세요.</p> : <button className="primary" disabled={pending} onClick={() => void request('commit')}>이 내용으로 고객 등록</button>}</>}</section>;
}
