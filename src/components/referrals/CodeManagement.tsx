'use client';
import { useRef, useState } from 'react';
import type { Code, Contract } from '@/lib/referrals/ledger';

type Customer = { contract: Contract; code?: Code };
type Action = { type: 'issue_code'; contractId: string; requestId: string };
// Mount only within an authenticated administrator page. Callbacks must enforce server authorization.
export default function CodeManagement({ customers, onAction }: {
  customers: Customer[];
  onAction: (action: Action) => Promise<Customer>;
}) {
  const [rows, setRows] = useState(customers);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('');
  const inFlight = useRef(false);
  const requests = useRef(new Map<string, string>());
  const selected = rows.find(row => row.contract.id === selectedId);
  const filtered = rows.filter(({ contract, code }) =>
    [contract.groom, contract.bride, contract.number, code?.value || ''].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  );
  async function save(type: Action['type']) {
    if (!selected || inFlight.current) return;
    const contractId = selected.contract.id;
    const key = `${type}:${contractId}`;
    const requestId = requests.current.get(key) || crypto.randomUUID();
    requests.current.set(key, requestId);
    inFlight.current = true;
    setPending(true); setError(''); setMessage('');
    try {
      const updated = await onAction({ type, contractId, requestId });
      setRows(current => current.map(row => row.contract.id === contractId ? updated : row));
      setMessage('짝꿍코드를 저장했습니다. 안내 문구를 복사해 고객에게 전달해 주세요.');
    } catch {
      setError('저장 결과를 확인하지 못했습니다. 다시 시도하면 같은 요청으로 확인합니다.');
    } finally { inFlight.current = false; setPending(false); }
  }
  async function copy(value: string) {
    setCopyText('');
    try { await navigator.clipboard.writeText(value); setMessage('복사했습니다.'); }
    catch { setCopyText(value); setMessage('아래 내용을 선택해 복사해 주세요.'); }
  }
  const button = 'rounded-lg border border-stone-300 px-4 py-3 text-sm disabled:opacity-40';
  return <section className="mx-auto max-w-3xl space-y-5 p-5 text-stone-800">
    <h1 className="text-2xl font-semibold">고객 짝꿍코드 관리</h1>
    <p className="text-sm leading-6">은행에서 입금을 직접 확인하셨다면 고객을 선택하고 짝꿍코드 생성 버튼을 눌러 주세요.</p>
    <label className="block">고객 검색<input className="mt-2 w-full rounded-lg border p-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="신랑·신부 이름, 계약번호, 코드" /></label>
    <div className="grid gap-2" aria-label="고객 목록">
      {filtered.length === 0 && <p className="rounded-lg bg-stone-100 p-5">검색된 고객이 없습니다.</p>}
      {filtered.map(({contract, code}) => <button disabled={pending} aria-pressed={selectedId === contract.id} key={contract.id} className={`${button} text-left ${selectedId === contract.id ? 'bg-stone-100 border-stone-700' : ''}`} onClick={() => {setSelectedId(contract.id); setError(''); setMessage(''); setCopyText('');}}>
        <strong>{contract.groom} · {contract.bride}</strong><span className="mt-1 block text-sm">{contract.number} · {contract.weddingDate}</span>
        <span className="mt-1 block text-sm">{contract.status === 'cancelled' ? '취소 계약' : code ? '코드 발급 완료' : '코드 미발급'}{code && ` · ${code.value}`}</span>
      </button>)}
    </div>
    {selected && <div className="space-y-4 rounded-xl border p-5">
      <h2 className="text-lg font-semibold">{selected.contract.groom} · {selected.contract.bride}</h2>
      <p>계약금 {selected.contract.deposit.toLocaleString('ko-KR')}원</p>
      {selected.code ? <>
        <p className="text-xl font-semibold tracking-wider">{selected.code.value}</p>
        <p className="text-sm">{selected.code.active ? '활성' : '비활성'} · 발급일 {new Date(selected.code.issuedAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
        <div className="flex flex-wrap gap-2">
          <button className={button} onClick={() => void copy(selected.code!.value)}>코드 복사</button>
          <button className={button} disabled={!selected.code.active} onClick={() => void copy(`안녕하세요, 디어메모리입니다.\n두 분의 평생 짝꿍코드는 ${selected.code!.value}입니다.\n새로 계약하시는 지인에게 코드를 공유해 주세요. 지인의 계약금 입금이 확인되면 지인에게 5만 원 할인, 두 분에게 5만 원 추천 혜택이 확정됩니다.\n추천 혜택은 남은 잔금에서 차감하고, 잔금 완납 후에는 페이백으로 안내해 드립니다.\n코드는 유효기간 없이 사용하실 수 있으며 혜택은 코드 소유자인 두 분께 귀속됩니다.`)}>코드 안내 문구 복사</button>
        </div>
      </> : <div><button className={button} disabled={pending || selected.contract.status === 'cancelled'} onClick={() => void save('issue_code')}>짝꿍코드 생성</button></div>}
    </div>}
    {pending && <p role="status">저장 중입니다…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status">{message}</p>}
    {copyText && <label className="block">복사할 안내 문구<textarea readOnly value={copyText} onFocus={e => e.currentTarget.select()} className="mt-2 min-h-48 w-full border p-3" /></label>}
  </section>;
}
