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


import { balanceDue, addMonths, taskRows, taskInfo, validateDeliveryDate } from '../src/lib/admin/delivery';
test('납품 기한은 금요일, 14일, 3~5개월이며 취소·미래 발송을 제외',()=>{
 assert.equal(balanceDue('2026-11-29'),'2026-11-27');
 assert.equal(balanceDue('2026-11-27'),'2026-11-27');
 assert.equal(balanceDue('2026-11-26'),'2026-11-20');
 assert.equal(addMonths('2027-01-31',3),'2027-04-30');
 const c={id:'live',status:'active',weddingDate:'2026-11-14',balance:1000000};
 assert.equal(taskInfo(c,'raw','2026-11-28').late,false);
 assert.equal(taskInfo(c,'raw','2026-11-29').late,true);
 assert.equal(taskInfo(c,'edited','2027-04-15').late,true);
 assert.equal(taskRows([{...c,weddingDate:'2027-01-01'}],'raw','2026-11-26').length,0);
 assert.equal(taskRows([{...c,status:'cancelled'}],'raw','2026-11-26').length,0);
 assert.throws(()=>validateDeliveryDate('raw','2026-11-31',c.weddingDate,'2026-12-01'));
 assert.throws(()=>validateDeliveryDate('raw','2026-11-27',c.weddingDate,'2026-11-26'));
 assert.deepEqual(validateDeliveryDate('raw','2026-11-26',c.weddingDate,'2026-11-26'),{key:'raw',date:'2026-11-26'});
});
test('납품 체크 기록과 취소는 입금 및 기존 계약 정보와 독립',()=>{
 const base=event('register','contract_registered',{id:'c',coupleId:'c',number:'DM-test',groom:'A',bride:'B',weddingDate:'2026-11-14',status:'active',total:1200000,deposit:300000,paid:300000});
 const sent=event('sent','crm_delivery_date_set',{contractId:'c',key:'raw',date:'2026-11-22'});
 const edit=event('edit','crm_delivery_date_set',{contractId:'c',key:'edited',date:'2026-11-23'});
 const undo=event('undo','crm_delivery_date_set',{contractId:'c',key:'raw',date:null});
 const c=projectAdminCrm([base,sent,edit,undo]).contracts[0];
 assert.deepEqual(c.deliveryDates,{edited:'2026-11-23'});assert.equal(c.balance,900000);assert.equal(c.paid,300000);
});

import { monthlyBookings, bookingMonth } from '../src/lib/admin/bookingStats';
test('월별 예약은 본식월과 최초 계약서 발송월을 구분하고 취소·테스트 제외',()=>{
 const base={id:'live',status:'active',weddingDate:'2027-06-01',bookingDate:'2026-10-31',total:1300000,paid:300000,deposit:300000,balance:1000000};
 const rows=[base,{...base,id:'other',bookingDate:'2026-11-01'},{...base,id:'cancelled',status:'cancelled'},{...base,id:'64bf7b68-4d75-499b-a216-e074cc5f245c'},{...base,id:'unknown',bookingDate:undefined}];
 assert.equal(monthlyBookings(rows,'booked','2026')[9].total,1300000);
 assert.equal(monthlyBookings(rows,'booked','2026')[10].count,1);
 assert.equal(monthlyBookings(rows,'wedding','2027')[5].count,3);
 assert.equal(bookingMonth(rows[4],'booked'),'');
 const c=projectAdminCrm([event('import','contract_registered',{id:'drive_DM_20261219_V29X',number:'DM-20261219-V29X',coupleId:'test',groom:'A',bride:'B',weddingDate:'2026-12-19',status:'active',total:1300000,deposit:300000,paid:300000})]).contracts[0];
 assert.equal(c.bookingDate,'2026-10-16');
});
