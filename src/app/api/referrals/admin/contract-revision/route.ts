import { createHmac, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';
import { calculateContractPrice } from '@/lib/pricing';
import { revisionView, validateRevision } from '@/lib/admin/contractRevision';
import { project, type Event } from '@/lib/referrals/ledger';
import type { ContractFormData } from '@/types/contract';
import { dataFromContractRows } from '@/lib/admin/importedContractRows';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store' };
function actor(req: NextRequest) { return verifySession(req.cookies.get(SESSION_COOKIE)?.value,referralSettings().sessionSecret)?.actor; }
function id(value: unknown) { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new Error('계약 ID를 확인해 주세요.'); return value; }
function response(data: object, status = 200) { return NextResponse.json(data,{status,headers}); }
async function importedSource(contractId:string):Promise<ContractFormData|undefined> {
  const info=await referralStore().transaction(history=>{
    const c=project(history).contracts[contractId];
    if(!c||c.status==='cancelled') throw new Error('수정할 계약을 찾을 수 없습니다.');
    if(history.some(e=>['contract_revision_completed','contract_delivery_started'].includes(e.type)&&e.data.contractId===contractId&&e.data.finalData)||c.reviewUrl) return {events:[],result:null};
    if(!c.driveFolderUrl) return {events:[],result:null};
    return {events:[],result:{folderUrl:c.driveFolderUrl,contractNumber:c.number}};
  });
  if(!info)return undefined;
  const {secret,url}=referralSettings();
  const body=JSON.stringify({operation:'read_original',timestamp:Date.now(),...info});
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revise_contract',payload:{body,signature:createHmac('sha256',secret).update(body).digest('hex')}}),cache:'no-store',signal:AbortSignal.timeout(20000)});
  const result=await res.json();
  if(!res.ok||!result.success||!result.rows)throw new Error(result.error || 'Drive 원본 계약서를 불러오지 못했습니다.');
  return dataFromContractRows(result.rows,info.contractNumber);
}
export async function GET(req: NextRequest) {
  try {
    if (!actor(req)) return response({error:'관리자 로그인이 필요합니다.'},401);
    const contractId = id(req.nextUrl.searchParams.get('id'));
    const imported=await importedSource(contractId);
    const view = await referralStore().transaction(history => ({events:[],result:revisionView(history,contractId,imported)}));
    const basePricing=calculateContractPrice(view.data);
    return response({data:view.data, pricing:{...basePricing,depositAmount:view.contract.deposit,balanceAmount:Math.max(0,basePricing.contractTotal-view.contract.deposit)}, contractNumber:view.contract.number, paid:view.contract.paid, deposit:view.contract.deposit, balance:view.balance, benefitDeduction:view.benefitDeduction, legacyPartnerDiscount:view.legacyPartnerDiscount, revision:view.revision, pending:view.pending, revisions:view.revisions});
  } catch (e) { return response({error:e instanceof Error ? e.message : '조회 실패'},400); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return response({error:'잘못된 요청'},403);
  try {
    const user=actor(req); if (!user) return response({error:'관리자 로그인이 필요합니다.'},401);
    const body=await req.json(), contractId=id(body.contractId);
    if (typeof body.pdfBase64 !== 'string' || !body.pdfBase64 || typeof body.jpgBase64 !== 'string' || !body.jpgBase64 || body.pdfBase64.length+body.jpgBase64.length>4500000) throw new Error('PDF/JPG 생성 결과를 확인해 주세요.');
    const {secret,url}=referralSettings();
    // Check that the separately deployed GAS action is available before claiming any delivery.
    const probeBody=JSON.stringify({operation:'probe',timestamp:Date.now()});
    const probe=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revise_contract',payload:{body:probeBody,signature:createHmac('sha256',secret).update(probeBody).digest('hex')}}),cache:'no-store'});
    if (!probe.ok || !(await probe.json()).revisionReady) throw new Error('수정계약서 발송 서버 배포가 필요합니다. 기존 계약은 변경되지 않았습니다.');
    const imported=await importedSource(contractId);
    const store=referralStore(), revisionId=randomUUID(), at=new Date().toISOString();
    const makeEvent=(type:string,data:object):Event=>({id:revisionId+':'+type,requestId:revisionId,actor:user,at,type,data,reason:'관리자 수정 계약서 발송'});
    const claim=await store.transaction(history=>{
      const view=revisionView(history,contractId,imported);
      if (body.expectedRevision!==view.revision) throw new Error('다른 수정이 완료되었습니다. 다시 열어 주세요.');
      const next=validateRevision(view,body.updatedData);
      const revision=view.revision+1;
      return {events:[makeEvent('contract_revision_started',{contractId,revisionId,revision,finalData:next.data})],result:{...next,revision,number:view.contract.number,folderUrl:view.folderUrl,paid:view.contract.paid,deposit:view.contract.deposit,legacyPartnerDiscount:view.legacyPartnerDiscount}};
    });
    const payloadBody=JSON.stringify({operation:'send',timestamp:Date.now(),contractId,revisionId,revision:claim.revision,contractNumber:claim.number,folderUrl:claim.folderUrl,data:claim.data,paid:claim.paid,deposit:claim.deposit,balance:claim.balance,pdfBase64:body.pdfBase64,jpgBase64:body.jpgBase64});
    let result;
    try {
      const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revise_contract',payload:{body:payloadBody,signature:createHmac('sha256',secret).update(payloadBody).digest('hex')}}),cache:'no-store',signal:AbortSignal.timeout(50000)});
      result=await res.json();
      if (!res.ok || !result.success || !result.customerEmailSent) throw new Error('발송 결과 확인 필요');
    } catch { throw new Error('수정 계약서 발송 결과를 확인해야 합니다. 중복 발송하지 마세요.'); }
    try {
      await store.transaction(history=>{
        if (history.some(e=>e.type==='contract_revision_completed' && e.data.revisionId===revisionId)) return {events:[],result:true};
        const view=revisionView(history,contractId,imported), c=view.contract;
        return {events:[makeEvent('contract_updated',{id:contractId,patch:{total:claim.total,legacyPartnerDiscount:claim.legacyPartnerDiscount,sentAt:c.sentAt||at,crmData:{...c.crmData,productId:claim.data.productId,optionIds:claim.data.optionIds,groomPhone:claim.data.groomPhone,bridePhone:claim.data.bridePhone}}}),makeEvent('contract_revision_completed',{contractId,revisionId,revision:claim.revision,finalData:claim.data,result})],result:true};
      });
    } catch { return response({...result,contractNumber:claim.number,warning:'고객 메일은 발송되었습니다. 원장 반영 확인 필요. 재발송하지 마세요.'}); }
    return response({...result,contractNumber:claim.number,warning:result.representativeEmailSent ? undefined : '고객 메일은 발송되었습니다. 대표 메일 발송 여부를 확인해 주세요.'});
  } catch (e) { return response({success:false,error:e instanceof Error ? e.message : '발송 실패'},400); }
}