'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdminCrm } from '@/components/admin/useAdminCrm';
import Link from 'next/link';
import { RepresentativeReviewView } from '@/components/review/RepresentativeReviewView';
import type { ContractFormData, PriceCalculationResult } from '@/types/contract';
type View={data:ContractFormData;pricing:PriceCalculationResult;contractNumber:string;paid:number;deposit:number;balance:number;benefitDeduction:number;legacyPartnerDiscount:boolean;revision:number;pending:boolean;revisions:{revision:number;at:string;total:number;result:{revisionFolderUrl?:string}}[]};
export default function Page(){
  const {id}=useParams<{id:string}>(); const {refresh}=useAdminCrm(); const [view,setView]=useState<View>(); const [error,setError]=useState(''); const [recovering,setRecovering]=useState(false); const [recoverError,setRecoverError]=useState('');
  async function recover(){setRecovering(true);setRecoverError('');try{const r=await fetch('/api/referrals/admin/contract-revision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'recover',contractId:id})});const v=await r.json();if(!r.ok)throw new Error(v.error);window.location.reload();}catch(e){setRecoverError(e instanceof Error?e.message:'복구 실패');}finally{setRecovering(false);}}
  useEffect(()=>{fetch('/api/referrals/admin/contract-revision?id='+encodeURIComponent(id),{cache:'no-store'}).then(async r=>{const v=await r.json();if(!r.ok)throw new Error(v.error);setView(v);}).catch(e=>setError(e.message));},[id]);
  return <main className="admin-page"><div className="admin-page-heading"><div><h1>기존 계약서 수정 및 재발송</h1><p>계약번호, 입금 기록, 추천 혜택 및 기존 일정은 유지합니다.</p></div><Link className="admin-button" href={'/admin/customers/'+id}>고객 상세</Link></div>
    {error?<p className="admin-error">{error}</p>:!view?<p>계약서 조회 중...</p>:<><div className="admin-card"><p>기존 입금액: {view.paid.toLocaleString('ko-KR')}원 · 기존 잔금: {view.balance.toLocaleString('ko-KR')}원</p><p>상품·옵션·할인·특약을 수정할 수 있습니다. 예식 일정, 이름, 수신 이메일 및 짝꿍 정보는 변경되지 않습니다.</p>{view.revisions.map(r=><p key={r.revision}>수정 {r.revision}차 · {new Date(r.at).toLocaleString('ko-KR')} · {r.total.toLocaleString('ko-KR')}원 {r.result.revisionFolderUrl&&<a href={r.result.revisionFolderUrl} target="_blank" rel="noreferrer">수정 계약서</a>}</p>)}</div>
    {view.pending?<div className="admin-card"><p className="admin-error">이전 수정 계약서 발송 결과 확인이 필요합니다.</p><p>메일을 다시 보내지 않고 서버 발송 기록을 확인합니다. 미발송이면 이전 수정 내용이 복구됩니다.</p><button className="admin-button primary" disabled={recovering} onClick={()=>void recover()}>{recovering?"확인 중...":"발송 상태 확인 및 복구"}</button>{recoverError&&<p className="admin-error">{recoverError}</p>}</div>:<div className="max-w-3xl mx-auto py-6"><RepresentativeReviewView token="" contractId={id} initialData={view.data} initialPricing={view.pricing} isAlreadySent={false} contractNumber={view.contractNumber} adminRevision={view.revision} adminRevisionSettlement={{paid:view.paid,deposit:view.deposit,benefitDeduction:view.benefitDeduction,legacyPartnerDiscount:view.legacyPartnerDiscount}} onRevisionSent={()=>void refresh()}/></div>}</>}
  </main>;
}