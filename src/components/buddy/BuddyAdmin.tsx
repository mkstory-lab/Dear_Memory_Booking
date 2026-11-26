'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAdminCrm } from '@/components/admin/useAdminCrm';
import type {
  BuddyCode,
  BuddyCustomer,
  BuddyPayment,
  BuddyPaymentMethod,
  BuddyReferral,
  BuddyReferralStatus,
  BuddyState,
} from '@/lib/buddy/ledger';

type Totals = {
  useCount: number;
  validUseCount: number;
  totalBenefit: number;
  paid: number;
  outstanding: number;
};

type Row = {
  customer: BuddyCustomer;
  code?: BuddyCode;
  totals: Totals;
};

type Summary = {
  issuedCodes: number;
  referralCount: number;
  validReferralCount: number;
  totalBenefit: number;
  paid: number;
  outstanding: number;
};

type AuditEvent = {
  id: string;
  type: string;
  at: string;
  actor: string;
  reason: string;
  data: Record<string, unknown>;
};

type Snapshot = {
  state: BuddyState;
  summary: Summary;
  rows: Row[];
  audit: AuditEvent[];
};

type Command =
  | { type: 'create_customer'; brideName: string; weddingDate: string; memo?: string; force?: boolean; manualCode?: string }
  | { type: 'update_customer'; customerId: string; brideName?: string; weddingDate?: string; memo?: string }
  | { type: 'code_status'; code: string; active: boolean }
  | { type: 'manual_referral'; code: string; referredBrideName: string; referredWeddingDate: string }
  | { type: 'referral_status'; referralId: string; status: Exclude<BuddyReferralStatus, 'needs_review'> }
  | { type: 'record_payment'; referralId: string; amount: number; method: BuddyPaymentMethod; paidAt: string; memo?: string };

const money = (value: number) => value.toLocaleString('ko-KR') + '원';

function todaySeoul() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function weddingFinished(weddingDate: string) {
  return weddingDate < todaySeoul();
}

function paymentMethodLabel(method: BuddyPaymentMethod) {
  return {
    balance_discount: '잔금 할인',
    payback: '페이백',
    other: '기타',
  }[method];
}

function referralStatusLabel(status: BuddyReferralStatus) {
  return {
    valid: '유효',
    cancelled: '취소',
    invalid: '무효',
    needs_review: '확인필요',
  }[status];
}

export default function BuddyAdmin() {
  const { refresh: refreshCrm } = useAdminCrm();
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'outstanding' | 'past_outstanding' | 'inactive'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [memo, setMemo] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualBride, setManualBride] = useState('');
  const [manualWeddingDate, setManualWeddingDate] = useState('');
  const retries = useRef(new Map<string, string>());

  useEffect(() => {
    const customer = new URLSearchParams(window.location.search).get('customer');
    if (customer) setSelectedId(customer);
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/referrals/buddy', { cache: 'no-store' });
      if (response.status === 401) {
        setAuthenticated(false);
        setData(null);
        return;
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '짝꿍코드 정보를 불러오지 못했습니다.');
      setAuthenticated(true);
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '짝꿍코드 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/referrals/admin/session', { cache: 'no-store' });
        const payload = await response.json();
        setConfigured(payload.configured !== false);
        if (payload.authenticated) {
          setAuthenticated(true);
          await load();
        }
      } catch {
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/referrals/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '로그인할 수 없습니다.');
      setPassword('');
      setAuthenticated(true);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function mutate(command: Command, reason = '') {
    const key = JSON.stringify(command);
    const requestId = retries.current.get(key) || crypto.randomUUID();
    retries.current.set(key, requestId);
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/referrals/buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, requestId, reason }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '저장하지 못했습니다.');
      retries.current.delete(key);
      setData(payload);
      void refreshCrm();
      setMessage('저장했습니다.');
      return payload as Snapshot;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    if (!data) return;

    const normalizedName = brideName.trim().replace(/\s+/g, ' ');
    const duplicate = data.rows.find(
      row => row.customer.brideName === normalizedName && row.customer.weddingDate === weddingDate,
    );
    let force = false;

    if (duplicate) {
      force = window.confirm(
        `이미 같은 신부명과 본식일의 고객이 있습니다.\n기존 코드: ${duplicate.code?.value || '코드 없음'}\n\n그래도 새 코드를 생성할까요?`,
      );
      if (!force) {
        setSelectedId(duplicate.customer.id);
        return;
      }
    }

    const result = await mutate(
      { type: 'create_customer', brideName: normalizedName, weddingDate, memo, force, manualCode: manualCode.trim() || undefined },
      '관리자 수동 짝꿍코드 발급',
    );

    if (result) {
      const created = [...result.rows]
        .reverse()
        .find(row => row.customer.brideName === normalizedName && row.customer.weddingDate === weddingDate);
      if (created) setSelectedId(created.customer.id);
      setBrideName('');
      setWeddingDate('');
      setMemo('');
      setManualCode('');
      setMessage('짝꿍코드를 생성했습니다. 코드를 복사해 고객에게 전달해 주세요.');
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`${code} 코드를 복사했습니다.`);
    } catch {
      setMessage(`복사할 코드: ${code}`);
    }
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();

    return data.rows.filter(row => {
      const referrals = Object.values(data.state.referrals).filter(r => r.ownerCustomerId === row.customer.id);
      const haystack = [
        row.customer.brideName,
        row.customer.weddingDate,
        row.customer.memo || '',
        row.code?.value || '',
        ...referrals.map(r => r.referredBrideName),
      ].join(' ').toLowerCase();

      if (query && !haystack.includes(query)) return false;
      if (filter === 'outstanding' && row.totals.outstanding <= 0) return false;
      if (filter === 'past_outstanding' && (!weddingFinished(row.customer.weddingDate) || row.totals.outstanding <= 0)) return false;
      if (filter === 'inactive' && row.code?.active !== false) return false;
      return true;
    });
  }, [data, search, filter]);

  const selected = data?.rows.find(row => row.customer.id === selectedId);
  const selectedReferrals = selected && data
    ? Object.values(data.state.referrals)
        .filter(r => r.ownerCustomerId === selected.customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  async function updateCustomer(row: Row) {
    const newName = window.prompt('신부 성함', row.customer.brideName);
    if (newName === null) return;
    const newDate = window.prompt('본식 날짜 (YYYY-MM-DD)\n기존 짝꿍코드는 변경되지 않습니다.', row.customer.weddingDate);
    if (newDate === null) return;
    const newMemo = window.prompt('관리자 메모', row.customer.memo || '');
    if (newMemo === null) return;

    await mutate({
      type: 'update_customer',
      customerId: row.customer.id,
      brideName: newName,
      weddingDate: newDate,
      memo: newMemo,
    }, '고객 기본정보 수정');
  }

  async function recordPayment(referral: BuddyReferral) {
    if (!data || !selected) return;
    const alreadyPaid = data.state.payments
      .filter(payment => payment.referralId === referral.id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = referral.benefitAmount - alreadyPaid;
    if (remaining <= 0) return;

    const amountText = window.prompt('지급 금액', String(remaining));
    if (amountText === null) return;
    const amount = Number(amountText);
    const defaultMethod: BuddyPaymentMethod = weddingFinished(selected.customer.weddingDate)
      ? 'payback'
      : 'balance_discount';
    const methodText = window.prompt(
      '지급 방식 입력\npayback = 페이백\nbalance_discount = 잔금 할인\nother = 기타',
      defaultMethod,
    );
    if (methodText === null) return;
    if (!['payback', 'balance_discount', 'other'].includes(methodText)) {
      setError('지급 방식은 payback, balance_discount, other 중 하나를 입력해 주세요.');
      return;
    }
    const paidAt = window.prompt('지급일 (YYYY-MM-DD)', todaySeoul());
    if (!paidAt) return;
    const paymentMemo = window.prompt('지급 메모', defaultMethod === 'payback' ? '본식 종료 후 페이백' : '잔금 할인 적용');
    if (paymentMemo === null) return;

    await mutate({
      type: 'record_payment',
      referralId: referral.id,
      amount,
      method: methodText as BuddyPaymentMethod,
      paidAt,
      memo: paymentMemo,
    }, '짝꿍 혜택 지급 처리');
  }

  async function addManualReferral(event: FormEvent) {
    event.preventDefault();
    if (!selected?.code) return;
    const result = await mutate({
      type: 'manual_referral',
      code: selected.code.value,
      referredBrideName: manualBride,
      referredWeddingDate: manualWeddingDate,
    }, '관리자 수동 코드 사용 이력 추가');

    if (result) {
      setManualBride('');
      setManualWeddingDate('');
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-4 py-10 text-[#322A1B]">
        <section className="mx-auto max-w-md rounded-2xl border border-[#E5DCCE] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold tracking-[0.24em] text-[#9A8562]">DEAR MEMORY</p>
          <h1 className="mt-2 text-2xl font-semibold">짝꿍코드 관리</h1>
          <p className="mt-2 text-sm leading-6 text-[#7B6A4D]">기존 추천 정산 화면과 분리된 간단한 짝꿍코드 전용 관리 화면입니다.</p>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!configured ? (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">관리자 인증 또는 저장소 설정을 확인해 주세요.</p>
          ) : (
            <form onSubmit={login} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                관리자 비밀번호
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[#DCCFBC] px-3 outline-none focus:border-[#8F7A56]"
                  required
                />
              </label>
              <button disabled={loading} className="h-12 w-full rounded-xl bg-[#322A1B] font-semibold text-white disabled:opacity-40">
                로그인
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-4 py-6 text-[#322A1B] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.24em] text-[#9A8562]">DEAR MEMORY</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">짝꿍코드 전용 관리</h1>
            <p className="mt-2 text-sm leading-6 text-[#756446]">계약 전체금액은 계산하지 않고 코드 사용·5만원 혜택·지급 여부만 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin/referrals" className="rounded-xl border border-[#D8CDBD] bg-white px-4 py-2 text-sm font-semibold">기존 추천관리</a>
            <button
              onClick={async () => {
                await fetch('/api/referrals/admin/session', { method: 'DELETE' });
                setAuthenticated(false);
                setData(null);
              }}
              className="rounded-xl border border-[#D8CDBD] bg-white px-4 py-2 text-sm"
            >
              로그아웃
            </button>
          </div>
        </header>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

        {data && (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                ['발급 코드', data.summary.issuedCodes.toLocaleString('ko-KR')],
                ['전체 사용', data.summary.referralCount.toLocaleString('ko-KR') + '건'],
                ['유효 사용', data.summary.validReferralCount.toLocaleString('ko-KR') + '건'],
                ['총 발생 혜택', money(data.summary.totalBenefit)],
                ['지급 완료', money(data.summary.paid)],
                ['미지급', money(data.summary.outstanding)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#E5DCCE] bg-white p-4">
                  <p className="text-xs font-semibold text-[#8F7A56]">{label}</p>
                  <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className="space-y-5">
                <form onSubmit={createCustomer} className="rounded-2xl border border-[#E5DCCE] bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold">새 짝꿍코드 생성</h2>
                  <p className="mt-1 text-xs leading-5 text-[#8F7A56]">기존 코드를 입력하면 그대로 등록됩니다. 비워두면 YYMMDD-XXXX 형식으로 자동 발급됩니다.</p>
                  <label className="mt-4 block text-sm font-semibold">
                    신부 성함
                    <input value={brideName} onChange={event => setBrideName(event.target.value)} required maxLength={80} className="mt-2 h-11 w-full rounded-xl border border-[#DCCFBC] px-3" />
                  </label>
                  <label className="mt-3 block text-sm font-semibold">
                    본식 날짜
                    <input type="date" value={weddingDate} onChange={event => setWeddingDate(event.target.value)} required className="mt-2 h-11 w-full rounded-xl border border-[#DCCFBC] px-3" />
                  </label>
                  <label className="mt-3 block text-sm font-semibold">
                    기존 짝꿍코드 수동 등록 (선택)
                    <input value={manualCode} onChange={event => setManualCode(event.target.value)} maxLength={80} placeholder="예: 271113_별명, 기존 닉네임" className="mt-2 h-11 w-full rounded-xl border border-[#DCCFBC] px-3" />
                  </label>
                  <label className="mt-3 block text-sm font-semibold">
                    메모 <span className="font-normal text-[#9A8562]">(선택)</span>
                    <textarea value={memo} onChange={event => setMemo(event.target.value)} maxLength={500} className="mt-2 min-h-20 w-full rounded-xl border border-[#DCCFBC] p-3" />
                  </label>
                  <button disabled={loading} className="mt-4 h-11 w-full rounded-xl bg-[#322A1B] font-semibold text-white disabled:opacity-40">{manualCode.trim() ? "기존 코드 등록" : "짝꿍코드 생성"}</button>
                </form>

                <section className="rounded-2xl border border-[#E5DCCE] bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">고객 · 코드</h2>
                    <span className="text-xs text-[#8F7A56]">{rows.length}명</span>
                  </div>
                  <input placeholder="신부명, 코드, 메모, 소개받은 신부명 검색" value={search} onChange={event => setSearch(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-[#DCCFBC] px-3 text-sm" />
                  <select value={filter} onChange={event => setFilter(event.target.value as typeof filter)} className="mt-2 h-11 w-full rounded-xl border border-[#DCCFBC] bg-white px-3 text-sm">
                    <option value="all">전체</option>
                    <option value="outstanding">미지급 있음</option>
                    <option value="past_outstanding">본식 종료 후 미지급</option>
                    <option value="inactive">비활성 코드</option>
                  </select>
                  <div className="mt-3 max-h-[560px] space-y-2 overflow-auto pr-1">
                    {rows.map(row => (
                      <button
                        key={row.customer.id}
                        type="button"
                        onClick={() => setSelectedId(row.customer.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${selectedId === row.customer.id ? 'border-[#322A1B] bg-[#F6F1E8]' : 'border-[#E7DED2] bg-white hover:border-[#B9A98F]'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong>{row.customer.brideName}</strong>
                          <span className="text-xs text-[#8F7A56]">{row.customer.weddingDate}</span>
                        </div>
                        <p className="mt-1 font-mono text-sm tracking-wide">{row.code?.value || '코드 없음'}</p>
                        {row.customer.memo && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6E5C3D]">메모: {row.customer.memo}</p>
                        )}
                        <p className="mt-1 text-xs text-[#756446]">사용 {row.totals.validUseCount}회 · 혜택 {money(row.totals.totalBenefit)} · 미지급 {money(row.totals.outstanding)}</p>
                      </button>
                    ))}
                    {!rows.length && <p className="rounded-xl bg-[#F8F5EF] p-4 text-sm text-[#8F7A56]">조건에 맞는 고객이 없습니다.</p>}
                  </div>
                </section>
              </div>

              <div>
                {!selected ? (
                  <section className="rounded-2xl border border-dashed border-[#D8CDBD] bg-white/60 p-10 text-center text-sm text-[#8F7A56]">
                    왼쪽에서 고객을 선택하면 코드 사용 내역과 지급 상태를 확인할 수 있습니다.
                  </section>
                ) : (
                  <section className="space-y-5">
                    <div className="rounded-2xl border border-[#E5DCCE] bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-semibold">{selected.customer.brideName}</h2>
                            {selected.code && (
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${selected.code.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                                {selected.code.active ? '활성' : '비활성'}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[#8F7A56]">본식 {selected.customer.weddingDate}{weddingFinished(selected.customer.weddingDate) ? ' · 본식 종료' : ''}</p>
                          <div className="mt-3 rounded-xl border border-[#E7DED2] bg-[#FAF8F5] px-3 py-2.5">
                            <p className="text-xs font-semibold text-[#8F7A56]">관리자 메모</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#4D402D]">{selected.customer.memo?.trim() || '등록된 메모가 없습니다.'}</p>
                          </div>
                        </div>
                        <button onClick={() => void updateCustomer(selected)} className="rounded-xl border border-[#D8CDBD] px-3 py-2 text-sm">정보 수정</button>
                      </div>

                      {selected.code && (
                        <div className="mt-5 rounded-2xl bg-[#322A1B] p-5 text-white">
                          <p className="text-xs text-[#D8CDBD]">평생 짝꿍코드</p>
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                            <strong className="font-mono text-2xl tracking-[0.14em]">{selected.code.value}</strong>
                            <button onClick={() => void copyCode(selected.code!.value)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#322A1B]">코드 복사</button>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-[#D8CDBD]">본식 날짜를 수정해도 이 코드는 그대로 유지되며, 본식이 끝난 후에도 계속 사용할 수 있습니다.</p>
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {[
                          ['전체 사용', selected.totals.useCount + '회'],
                          ['유효 사용', selected.totals.validUseCount + '회'],
                          ['총 혜택', money(selected.totals.totalBenefit)],
                          ['지급 완료', money(selected.totals.paid)],
                          ['미지급', money(selected.totals.outstanding)],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-[#F8F5EF] p-3">
                            <p className="text-xs text-[#8F7A56]">{label}</p>
                            <p className="mt-1 font-semibold tabular-nums">{value}</p>
                          </div>
                        ))}
                      </div>

                      {selected.code && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            disabled={loading}
                            onClick={() => void mutate({ type: 'code_status', code: selected.code!.value, active: !selected.code!.active }, '코드 상태 변경')}
                            className="rounded-xl border border-[#D8CDBD] px-4 py-2 text-sm"
                          >
                            {selected.code.active ? '코드 비활성화' : '코드 활성화'}
                          </button>
                        </div>
                      )}
                    </div>

                    {selected.code && (
                      <form onSubmit={addManualReferral} className="rounded-2xl border border-[#E5DCCE] bg-white p-5">
                        <h3 className="font-semibold">코드 사용 이력 수동 추가</h3>
                        <p className="mt-1 text-xs text-[#8F7A56]">과거 건이나 자동 연결되지 않은 건만 추가하세요. 동일 신부명·본식일·코드는 중복 등록되지 않습니다.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                          <input placeholder="코드를 사용한 신부 성함" value={manualBride} onChange={event => setManualBride(event.target.value)} required className="h-11 rounded-xl border border-[#DCCFBC] px-3 text-sm" />
                          <input type="date" value={manualWeddingDate} onChange={event => setManualWeddingDate(event.target.value)} required className="h-11 rounded-xl border border-[#DCCFBC] px-3 text-sm" />
                          <button disabled={loading} className="h-11 rounded-xl border border-[#322A1B] px-4 text-sm font-semibold">사용 이력 추가</button>
                        </div>
                      </form>
                    )}

                    <section className="rounded-2xl border border-[#E5DCCE] bg-white p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">이 코드로 예약한 고객</h3>
                          <p className="mt-1 text-xs text-[#8F7A56]">유효 1건당 코드 주인 50,000원 + 신규 고객 50,000원 혜택으로 기록됩니다.</p>
                        </div>
                        <span className="text-sm font-semibold">{selectedReferrals.length}건</span>
                      </div>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                          <thead>
                            <tr className="text-left text-xs text-[#8F7A56]">
                              <th className="border-b border-[#E7DED2] px-3 py-3">신부</th>
                              <th className="border-b border-[#E7DED2] px-3 py-3">본식일</th>
                              <th className="border-b border-[#E7DED2] px-3 py-3">상태</th>
                              <th className="border-b border-[#E7DED2] px-3 py-3">발생 혜택</th>
                              <th className="border-b border-[#E7DED2] px-3 py-3">지급</th>
                              <th className="border-b border-[#E7DED2] px-3 py-3">처리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReferrals.map(referral => {
                              const payments = data.state.payments.filter(payment => payment.referralId === referral.id);
                              const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
                              const remaining = Math.max(0, referral.benefitAmount - paid);
                              return (
                                <tr key={referral.id} className="align-top">
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">
                                    <strong>{referral.referredBrideName}</strong>
                                    {referral.sourceContractId && <p className="mt-1 text-[11px] text-[#9A8562]">계약서 자동 연결</p>}
                                    {referral.enteredCode && referral.enteredCode !== referral.code && (
                                      <p className="mt-1 text-[11px] leading-5 text-amber-700">입력 {referral.enteredCode} → 후보 {referral.code}</p>
                                    )}
                                  </td>
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">{referral.referredWeddingDate}</td>
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${referral.status === 'valid' ? 'bg-emerald-50 text-emerald-700' : referral.status === 'needs_review' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                                      {referralStatusLabel(referral.status)}
                                    </span>
                                  </td>
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">
                                    <p>코드주인 {money(referral.benefitAmount)}</p>
                                    <p className="mt-1 text-xs text-[#8F7A56]">신규고객 {money(referral.benefitAmount)}</p>
                                  </td>
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">
                                    <p>{money(paid)} / {money(referral.benefitAmount)}</p>
                                    {payments.map((payment: BuddyPayment) => (
                                      <p key={payment.id} className="mt-1 text-xs text-[#8F7A56]">{payment.paidAt} · {paymentMethodLabel(payment.method)} · {money(payment.amount)}</p>
                                    ))}
                                  </td>
                                  <td className="border-b border-[#F0E9DF] px-3 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                      {referral.status === 'needs_review' && (
                                        <>
                                          <button onClick={() => void mutate({ type: 'referral_status', referralId: referral.id, status: 'valid' }, '관리자 연결 승인')} className="rounded-lg border px-2 py-1 text-xs">연결 승인</button>
                                          <button onClick={() => void mutate({ type: 'referral_status', referralId: referral.id, status: 'invalid' }, '자기추천 또는 잘못된 연결')} className="rounded-lg border px-2 py-1 text-xs">무효</button>
                                        </>
                                      )}
                                      {referral.status === 'valid' && (
                                        <>
                                          {remaining > 0 && <button onClick={() => void recordPayment(referral)} className="rounded-lg bg-[#322A1B] px-2 py-1 text-xs text-white">{weddingFinished(selected.customer.weddingDate) ? '페이백/지급 처리' : '지급 처리'}</button>}
                                          <button onClick={() => void mutate({ type: 'referral_status', referralId: referral.id, status: 'cancelled' }, '계약 취소')} className="rounded-lg border px-2 py-1 text-xs">취소</button>
                                        </>
                                      )}
                                      {(referral.status === 'cancelled' || referral.status === 'invalid') && (
                                        <button onClick={() => void mutate({ type: 'referral_status', referralId: referral.id, status: 'valid' }, '관리자 유효 복원')} className="rounded-lg border px-2 py-1 text-xs">유효 복원</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {!selectedReferrals.length && <p className="mt-4 rounded-xl bg-[#F8F5EF] p-5 text-sm text-[#8F7A56]">아직 이 코드를 사용한 예약이 없습니다.</p>}
                    </section>
                  </section>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#E5DCCE] bg-white p-5">
              <details>
                <summary className="cursor-pointer font-semibold">최근 처리 이력</summary>
                <div className="mt-4 max-h-72 overflow-auto">
                  {[...data.audit].reverse().map(event => (
                    <div key={event.id} className="border-b border-[#F0E9DF] py-3 text-xs leading-5">
                      <strong>{new Date(event.at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</strong>
                      <span className="ml-2">{event.type}</span>
                      {event.reason && <span className="ml-2 text-[#8F7A56]">· {event.reason}</span>}
                    </div>
                  ))}
                  {!data.audit.length && <p className="text-sm text-[#8F7A56]">처리 이력이 없습니다.</p>}
                </div>
              </details>
            </section>
          </>
        )}

        {loading && <p className="fixed bottom-4 right-4 rounded-full bg-[#322A1B] px-4 py-2 text-xs font-semibold text-white shadow-lg">처리 중…</p>}
      </div>
    </main>
  );
}
