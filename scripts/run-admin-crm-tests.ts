import assert from 'node:assert/strict';
import test from 'node:test';
import { findBuddyOwners } from '../src/lib/admin/buddySearch';
import { recoveryEvents } from '../src/lib/admin/recoverMetadata';
import { projectAdminCrm } from '../src/lib/admin/crm';
import type { Event } from '../src/lib/referrals/ledger';

function event(id: string, type: string, data: unknown, at = '2026-11-20T00:00:00.000Z'): Event {
  return { id, requestId: id, actor: 'test', at, reason: 'test', type, data };
}

const formData = {
  groomName: '김신랑', groomPhone: '010-1111-2222', brideName: '이신부', bridePhone: '010-3333-4444',
  email: 'couple@example.com', weddingDate: '2027-05-01', weddingTime: '12:30', weddingVenue: '디어홀', weddingHall: '메모리룸',
  productId: 'album_plus', optionIds: [], referralCode: '', partnerDiscount: false, partnerName: '', sundayDiscount: false,
  portfolioConsent: false, reviewContractCashback: false, reviewMainCashback: false, requestNotes: '', termsAgreed: true,
};

test('projects full contract, storage links, and CRM metadata from the existing journal', () => {
  const events: Event[] = [
    event('register', 'contract_registered', { id: 'c1', coupleId: 'c1', number: 'DM-20270501-AAAA', groom: '김신랑', bride: '이신부', weddingDate: '2027-05-01', status: 'active', total: 1800000, deposit: 300000, paid: 0 }),
    event('delivery-start', 'contract_delivery_started', { contractId: 'c1', finalData: formData }),
    event('delivery-result', 'contract_delivery_result', { contractId: 'c1', result: { driveFolderUrl: 'https://drive.google.com/drive/folders/test', excelFileUrl: 'https://drive.google.com/file/test', calendarEventId: 'calendar-1', calendarSaved: true } }),
    event('crm', 'crm_customer_updated', { contractId: 'c1', stage: '보정', memo: '1차 보정 진행 중' }, '2026-11-21T01:00:00.000Z'),
  ];
  const snapshot = projectAdminCrm(events);
  assert.equal(snapshot.contracts.length, 1);
  assert.equal(snapshot.contracts[0].weddingTime, '12:30');
  assert.equal(snapshot.contracts[0].driveFolderUrl, 'https://drive.google.com/drive/folders/test');
  assert.equal(snapshot.contracts[0].calendarSaved, true);
  assert.equal(snapshot.contracts[0].stage, '보정');
  assert.equal(snapshot.contracts[0].memo, '1차 보정 진행 중');
});

test('keeps every contract on the same wedding date', () => {
  const base = { coupleId: '', weddingDate: '2027-05-01', status: 'active', total: 1500000, deposit: 300000, paid: 0 };
  const events = [
    event('a', 'contract_registered', { ...base, id: 'a', coupleId: 'a', number: 'DM-20270501-AAAA', groom: '가', bride: '나' }),
    event('b', 'contract_registered', { ...base, id: 'b', coupleId: 'b', number: 'DM-20270501-BBBB', groom: '다', bride: '라' }),
  ];
  const contracts = projectAdminCrm(events).contracts;
  assert.equal(contracts.length, 2);
  assert.equal(contracts.filter(contract => contract.weddingDate === '2027-05-01').length, 2);
});


test('registered buddy owner is searchable before any referrals exist', () => {
  const events = [
    event('owner', 'buddy_customer_created', { id: 'owner1', brideName: '테스트신부', weddingDate: '2027-11-13', memo: '예전 별명' }),
    event('code', 'buddy_code_issued', { value: '271113_테스트', customerId: 'owner1', active: true }),
  ];
  const snapshot = projectAdminCrm(events);
  assert.equal(snapshot.buddyUsages.length, 0);
  for (const query of ['테스트', '271113테스트', '테스트신부', '예전 별명']) {
    assert.equal(findBuddyOwners(snapshot.buddyOwners, query)[0]?.id, 'owner1');
  }
  assert.equal(findBuddyOwners(snapshot.buddyOwners, '존재하지않음').length, 0);
});

test('Drive metadata repair fills blanks without changing money or existing manual values', () => {
 const id='drive_DM_test', number='DM-test';
 const history:Event[]=[
  event('import','contract_registered',{id,coupleId:id,number,groom:'김신랑',bride:'이신부',weddingDate:'2027-05-01',status:'active',total:1200000,deposit:300000,paid:300000,driveFolderUrl:'https://drive.google.com/drive/folders/test',crmData:{weddingHall:'기존 홀'}}),
  event('edit','crm_customer_updated',{contractId:id,stage:'사전안내',memo:'보존',weddingVenue:''}),
 ];
 const rows={'계약번호':number,'신랑 성명':'김신랑','신부 성명':'이신부','예식일':'2027-05-01','예식장':'원본 웨딩홀','홀':'다른 홀','예식시간':'12:30','신랑 연락처':'010-0000-0000','고객 이메일':'test@example.com','선택상품':'화보형','추가옵션':'2인 촬영'};
 const ctx={requestId:'repair-test',actor:'test',at:'2026-11-26T00:00:00Z'};
 const events=recoveryEvents(history,id,rows,ctx);
 const result=projectAdminCrm([...history,...events]).contracts[0];
 assert.equal(result.weddingVenue,'원본 웨딩홀');
 assert.equal(result.weddingHall,'기존 홀');
 assert.equal(result.weddingTime,'12:30');
 assert.equal(result.productId,'album_plus');
 assert.deepEqual(result.optionIds,['second_shooter']);
 assert.equal(result.total,1200000);assert.equal(result.paid,300000);assert.equal(result.balance,900000);
 assert.equal(result.memo,'보존');assert.equal(result.stage,'사전안내');
 assert.equal(recoveryEvents([...history,...events],id,rows,ctx).length,0);
 assert.throws(()=>recoveryEvents(history,id,{...rows,'신부 성명':'다름'},ctx));
});
