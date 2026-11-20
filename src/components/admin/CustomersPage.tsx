'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { productName } from './types';

export default function CustomersPage() {
  const { data, error } = useAdminCrm();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => (data?.contracts || []).filter(contract => [contract.groom, contract.bride, contract.groomPhone, contract.bridePhone, contract.weddingVenue, contract.number].join(' ').toLowerCase().includes(query.toLowerCase())), [data, query]);
  if (error) return <div className="admin-error">{error}</div>;
  return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">CUSTOMERS</p><h1>고객 관리</h1><p>고객별 진행 단계와 계약, 촬영, 정산 정보를 관리합니다.</p></div></div><div className="admin-toolbar"><input aria-label="고객 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="고객명, 연락처, 예식장 검색" /><span className="admin-badge">{rows.length}명</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>고객명</th><th>연락처</th><th>예식일</th><th>예식장</th><th>상품</th><th>현재 단계</th><th>최근 수정일</th><th>관리</th></tr></thead><tbody>{rows.map(contract => <tr key={contract.id}><td><strong>{contract.groom} · {contract.bride}</strong><small>{contract.number}</small></td><td>{contract.bridePhone || contract.groomPhone || '-'}</td><td>{contract.weddingDate}<small>{contract.weddingTime}</small></td><td>{contract.weddingVenue || '-'}</td><td>{productName(contract.productId)}</td><td><span className="admin-badge orange">{contract.stage}</span></td><td>{contract.updatedAt.slice(0, 10)}</td><td><Link href={`/admin/customers/${contract.id}`}>상세 관리</Link></td></tr>)}</tbody></table>{!data ? <p className="admin-empty">고객 데이터를 불러오고 있습니다.</p> : !rows.length ? <p className="admin-empty">고객이 없습니다.</p> : null}</div></main>;
}

