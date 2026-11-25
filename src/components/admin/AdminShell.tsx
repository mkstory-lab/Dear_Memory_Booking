'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, HandCoins, LayoutDashboard, LogOut, Menu, Search, Settings, Users, X } from 'lucide-react';
import { AdminCrmProvider, useAdminCrm } from './useAdminCrm';

const navigation = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/contracts', label: '계약서 관리', icon: FileText },
  { href: '/admin/customers', label: '고객 관리', icon: Users },
  { href: '/admin/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/admin/payments', label: '매출 / 입금 관리', icon: HandCoins },
  { href: '/admin/staff', label: '작가 · 스케줄', icon: Users },
  { href: '/admin/buddy', label: '짝꿍코드 관리', icon: Users },
  { href: '/admin/referrals', label: '기존 추천 관리', icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/referrals/admin/session', { cache: 'no-store' });
        const result = await response.json();
        setConfigured(result.configured !== false);
        setAuthenticated(result.authenticated === true);
      } catch {
        setError('관리자 인증 서버에 연결하지 못했습니다.');
        setAuthenticated(false);
      }
    })();
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/referrals/admin/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
    });
    const result = await response.json();
    setPassword('');
    if (!response.ok) { setError(result.error || '로그인할 수 없습니다.'); return; }
    setAuthenticated(true);
  }

  if (authenticated === null) return <div className="admin-auth-screen"><div className="admin-spinner" /><p>관리자 화면을 준비하고 있습니다.</p></div>;
  if (!authenticated) return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <p className="admin-eyebrow">DEAR MEMORY</p>
        <h1>통합 관리자 로그인</h1>
        <p>계약부터 촬영, 입금, 짝꿍 혜택까지 한 곳에서 확인합니다.</p>
        {!configured ? <div className="admin-alert">관리자 인증과 저장소 연결 설정을 확인해 주세요.</div> : (
          <form onSubmit={login}>
            <label>관리자 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required autoFocus /></label>
            <button type="submit">로그인</button>
          </form>
        )}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );

  return <AdminCrmProvider><AdminWorkspace onLogout={() => setAuthenticated(false)}>{children}</AdminWorkspace></AdminCrmProvider>;
}

function AdminWorkspace({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const pathname = usePathname();
  const { data } = useAdminCrm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setMenuOpen(false);
    setQuery('');
  }, [pathname]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\D/g, '');
    const rawNeedle = query.trim().toLowerCase();
    if (!rawNeedle || !data) return [];
    return data.contracts.filter(contract => {
      const words = [contract.groom, contract.bride, contract.number, contract.referralCode, contract.buddyCode]
        .filter(Boolean).join(' ').toLowerCase();
      const phones = `${contract.groomPhone}${contract.bridePhone}`.replace(/\D/g, '');
      return words.includes(rawNeedle) || (needle.length >= 3 && phones.includes(needle));
    }).slice(0, 6);
  }, [query, data]);

  async function logout() {
    await fetch('/api/referrals/admin/session', { method: 'DELETE' });
    onLogout();
  }

  return (
    <div className="admin-app">
      <button className="admin-mobile-menu" onClick={() => setMenuOpen(value => !value)} aria-label="관리 메뉴 열기">{menuOpen ? <X /> : <Menu />}</button>
      <aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="admin-brand"><span>DEAR MEMORY</span><small>STUDIO CRM</small></div>
        <nav aria-label="관리자 메뉴">
          {navigation.map(item => {
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} prefetch className={active ? 'is-active' : ''}><item.icon size={18} /><span>{item.label}</span></Link>;
          })}
        </nav>
        <button className="admin-logout" onClick={logout}><LogOut size={18} /> 로그아웃</button>
      </aside>
      {menuOpen ? <button className="admin-scrim" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기" /> : null}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-global-search">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="이름, 연락처, 계약번호, 짝꿍코드 검색" aria-label="통합 고객 검색" />
            {query ? <div className="admin-search-results">{matches.length ? matches.map(contract => (
              <Link key={contract.id} href={`/admin/customers/${contract.id}`}><strong>{contract.groom} · {contract.bride}</strong><span>{contract.number} · {contract.weddingDate}</span></Link>
            )) : <p>검색 결과가 없습니다.</p>}</div> : null}
          </div>
          <div className="admin-owner"><span>대표 관리자</span><small>Owner</small></div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

