import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';
import './admin.css';

export const metadata: Metadata = { title: 'DEAR MEMORY | 통합 관리자', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}

