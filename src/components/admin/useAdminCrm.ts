'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { AdminCrmSnapshot } from './types';

export function useAdminCrm() {
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

  return { data, error, isPending, refresh, mutate };
}

