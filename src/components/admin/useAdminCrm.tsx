'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from 'react';
import type { AdminCrmSnapshot } from './types';

type AdminCrmContextValue = {
  data: AdminCrmSnapshot | null;
  error: string;
  isPending: boolean;
  refresh: () => Promise<void>;
  mutate: (command: Record<string, unknown>) => Promise<AdminCrmSnapshot>;
};

const AdminCrmContext = createContext<AdminCrmContextValue | null>(null);

export function AdminCrmProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AdminCrmSnapshot | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/referrals/admin/crm', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '관리 데이터를 불러오지 못했습니다.');
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '관리 데이터를 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const mutate = useCallback(async (command: Record<string, unknown>) => {
    setError('');
    const response = await fetch('/api/referrals/admin/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: crypto.randomUUID(), command }),
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result.error || '저장하지 못했습니다.';
      setError(message);
      throw new Error(message);
    }
    startTransition(() => setData(result));
    return result as AdminCrmSnapshot;
  }, []);

  const value = useMemo(() => ({ data, error, isPending, refresh, mutate }), [data, error, isPending, refresh, mutate]);
  return <AdminCrmContext.Provider value={value}>{children}</AdminCrmContext.Provider>;
}

export function useAdminCrm() {
  const context = useContext(AdminCrmContext);
  if (!context) throw new Error('관리자 데이터 Provider가 필요합니다.');
  return context;
}

