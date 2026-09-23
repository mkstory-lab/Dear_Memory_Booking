/**
 * 디어메모리 계약 식별 번호 생성기
 * 포맷: DM-YYYYMMDD-XXXX (예: DM-20270418-K8M2)
 */

export function generateContractNumber(weddingDate?: string): string {
  let datePart = '';
  if (weddingDate && weddingDate.includes('-')) {
    datePart = weddingDate.replace(/-/g, '');
  } else {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    datePart = `${yyyy}${mm}${dd}`;
  }

  // 충돌 가능성을 방지하는 4자리 영숫자 랜덤 접미사 (가독성 높은 문자 집합)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `DM-${datePart}-${suffix}`;
}
