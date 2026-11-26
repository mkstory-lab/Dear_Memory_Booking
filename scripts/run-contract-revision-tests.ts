import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {revisionView,validateRevision} from '../src/lib/admin/contractRevision';
import {projectAdminCrm} from '../src/lib/admin/crm';
import {createApprovalToken} from '../src/lib/token';
import type {Event} from '../src/lib/referrals/ledger';
import type {ContractFormData} from '../src/types/contract';

const data:ContractFormData={groomName:'테스트신랑',brideName:'테스트신부',groomPhone:'010-0000-0000',bridePhone:'010-0000-0001',email:'test@example.invalid',weddingDate:'2027-05-01',weddingTime:'13:00',weddingVenue:'테스트홀',weddingHall:'A홀',productId:'standard',optionIds:[],partnerDiscount:false,partnerName:'',sundayDiscount:false,portfolioConsent:false,reviewContractCashback:false,reviewMainCashback:false,requestNotes:'',termsAgreed:true};
function event(type:string,data:any,n=0):Event{return {id:type+n,requestId:type+n,actor:'test',at:'2026-11-20T00:00:00Z',reason:'test',type,data};}
const number='DM-20270501-AAAA';
const folder='https://drive.google.com/drive/folders/original';
const base=()=>[event('contract_registered',{id:'c1',coupleId:'c1',number,groom:data.groomName,bride:data.brideName,weddingDate:data.weddingDate,status:'active',total:1250000,deposit:300000,paid:300000,sentAt:'2026-11-20',reviewUrl:'https://example.invalid/review?token='+createApprovalToken('c1',data,-1000)}),event('contract_delivery_result',{contractId:'c1',result:{customerEmailSent:true,driveFolderUrl:folder,calendarEventId:'existing',calendarSaved:true}})];
test('admin can retrieve expired original and change product without changing deposit or ID',()=>{
  const v=revisionView(base(),'c1');assert.equal(v.data.productId,'standard');assert.equal(v.contract.paid,300000);
  const changed=validateRevision(v,{...v.data,productId:'album_plus'});assert.equal(changed.total,1450000);assert.equal(changed.pricing.balanceAmount,1150000);assert.equal(v.contract.number,number);
});
test('invalid options, changed calendar identity, unchanged input and referral mutations are rejected',()=>{
  const v=revisionView(base(),'c1');
  for(const change of [{optionIds:['invalid']},{optionIds:['second_shooter','second_shooter']},{weddingDate:'2027-05-02'},{partnerDiscount:true},{email:'other@example.invalid'},{manualAdjustment:{amount:-1200000,reason:'test'}},{}]) assert.throws(()=>validateRevision(v,{...v.data,...change}));
});
test('revision history and CRM keep original calendar, one contract and payment',()=>{
  const events=base();const changed={...data,productId:'album_plus'};
  events.push(event('contract_revision_started',{contractId:'c1',revisionId:'r1',revision:1,finalData:changed}));
  assert.throws(()=>validateRevision(revisionView(events,'c1'),changed),/이전/);
  events.push(event('contract_updated',{id:'c1',patch:{total:1450000}}),event('contract_revision_completed',{contractId:'c1',revisionId:'r1',revision:1,finalData:changed,result:{revisionFolderUrl:'https://example.invalid/revision'}}));
  const view=revisionView(events,'c1');assert.equal(view.revision,1);assert.equal(view.data.productId,'album_plus');assert.equal(view.pending,false);
  const crm=projectAdminCrm(events);assert.equal(crm.contracts.length,1);assert.equal(crm.contracts[0].productId,'album_plus');assert.equal(crm.contracts[0].balance,1150000);assert.equal(crm.contracts[0].calendarEventId,'existing');
});
test('GAS revision authentication, versioned files, and idempotent delivery with no calendar writes',()=>{
  const secret='test-secret-'.repeat(4), props=new Map<string,string>([['DM_REFERRAL_SECRET',secret]]), files:string[]=[], mails:string[]=[];
  let folderCount=0;
  const ctx=vm.createContext({
    ContentService:{MimeType:{JSON:'json'},createTextOutput:(s:string)=>({setMimeType:()=>JSON.parse(s)})},
    PropertiesService:{getScriptProperties:()=>({getProperty:(k:string)=>props.get(k),setProperty:(k:string,v:string)=>props.set(k,v)})},
    Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(body:string,key:string)=>[...createHmac('sha256',key).update(body).digest()],base64Decode:(v:string)=>[...Buffer.from(v,'base64')],newBlob:(_b:any,_m:any,name:string)=>({name})},
    LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
    DriveApp:{getFolderById:(id:string)=>{assert.equal(id,'original');return {isTrashed:()=>false,getFiles:()=>({hasNext:()=>true,next:()=>({isTrashed:()=>false,getName:()=>number+'_original.pdf'})}),createFolder:()=>{folderCount++;return {createFile:(b:any)=>{files.push(b.name);return {getUrl:()=>folder+'/file'}},getUrl:()=>folder+'/revision'}}}}},
    GmailApp:{sendEmail:(email:string)=>mails.push(email)},CalendarApp:{getCalendarById:()=>assert.fail('Calendar must not be touched')},Logger:{log(){}}
  });
  new vm.Script(readFileSync('google-apps-script/Code.gs','utf8')).runInContext(ctx);
  ctx.createContractExcelFromRows=(_r:any,name:string)=>({name});
  const wrap=(p:any)=>{const body=JSON.stringify({...p,timestamp:Date.now()});return {body,signature:createHmac('sha256',secret).update(body).digest('hex')}};
  assert.throws(()=>ctx.dmReviseContract_({body:'{}',signature:'0'.repeat(64)}),/인증/);
  assert.equal(ctx.dmReviseContract_(wrap({operation:'probe'})).revisionReady,true);
  const request=wrap({operation:'send',contractId:'c1',revisionId:'11111111-1111-1111-1111-111111111111',revision:1,contractNumber:number,folderUrl:folder,data,paid:300000,deposit:300000,balance:950000,pdfBase64:Buffer.from('%PDF-test').toString('base64'),jpgBase64:Buffer.from([255,216,255]).toString('base64')});
  const result=ctx.dmReviseContract_(request);assert.equal(result.customerEmailSent,true);assert.equal(result.representativeEmailSent,true);assert.equal(files.length,3);assert.ok(files.every(n=>n.startsWith('수정1차_')));assert.equal(mails.length,2);
  assert.equal(ctx.dmReviseContract_(request).customerEmailSent,true);assert.equal(folderCount,1);assert.equal(mails.length,2);
});
test('Drive-imported contract can be edited from structured original with existing discount and payment',async()=>{
  const {dataFromContractRows}=await import('../src/lib/admin/importedContractRows');
  const rows={'계약번호':number,'신랑 성명':data.groomName,'신부 성명':data.brideName,'신랑 연락처':data.groomPhone,'신부 연락처':data.bridePhone,'고객 이메일':data.email,'예식일':'2027-09-05','예식시간':'15:30','예식장':'테스트홀','홀':'A홀','선택상품':'실속형','추가옵션':'선택 없음','짝꿍 할인':'예','짝꿍 정보':'test','일요일 예식 할인':'예','사진 공개 동의':'예','약관 동의':'예','대표 조정금액':'0','최종 계약금액':'1000000'};
  const original=dataFromContractRows(rows,number);
  const events=[event('contract_registered',{id:'drive_c1',coupleId:'drive_c1',number,groom:data.groomName,bride:data.brideName,weddingDate:original.weddingDate,status:'active',total:1000000,deposit:300000,paid:300000,driveFolderUrl:folder})];
  const v=revisionView(events,'drive_c1',original);
  assert.equal(v.legacyPartnerDiscount,true);
  assert.equal(v.balance,700000);
  const next=validateRevision(v,{...v.data,productId:'album_plus'});
  assert.equal(next.total,1200000);assert.equal(next.balance,900000);
  assert.throws(()=>revisionView(events,'drive_c1',{...original,brideName:'wrong'}));
});