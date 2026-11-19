import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execute, project, amounts, remainingBalance, validCode, type Event, type Command, type Context } from '../src/lib/referrals/ledger';
function fixture(total = 1000000) {
  let history: Event[] = [], sequence = 0;
  const run = (command: Command, extra: Partial<Context> = {}) => {
    const events = execute(history, command, { requestId: `request-${++sequence}`, actor: 'admin-test', role: 'admin', at: '2026-11-19T00:00:00Z', reason: '테스트', ...extra });
    history = [...history, ...events]; return events;
  };
  const register = (id: string, price = total) => run({ type: 'register', contract: { id, coupleId: `couple-${id}`, number: `TEST-${id}`, groom: '테스트신랑', bride: '테스트신부', weddingDate: '2027-01-01', status: 'active', total: price, deposit: 300000, paid: 0 } });
  register('A');
  const activate = () => { run({type:'deposit',contractId:'A'}); run({type:'issue',contractId:'A',candidate:'DM-A7K9M2Q8'}); };
  const refer = (id: string) => { register(id); run({type:'refer',contractId:id,code:' dm-a7k9m2q8 '}); };
  return {run,register,activate,refer,state:()=>project(history),history:()=>history};
}
test('deposit is manual, issue is idempotent, resend and changes retain ownership',()=>{
 const f=fixture();
 f.run({type:'sent',contractId:'A'});
 assert.throws(()=>f.run({type:'issue',contractId:'A',candidate:'DM-A7K9M2Q8'}));
 f.activate();
 f.run({type:'update',contractId:'A',number:'TEST-RENAMED',weddingDate:'2028-01-01'});
 f.run({type:'sent',contractId:'A'});
 f.run({type:'issue',contractId:'A',candidate:'DM-Z7K9M2Q8'});
 assert.deepEqual(Object.keys(f.state().codes),['DM-A7K9M2Q8']);
 assert.equal(f.state().codes['DM-A7K9M2Q8'].coupleId,'couple-A');
});
test('invalid, inactive, self referral, duplicate and customer admin actions are rejected',()=>{
 const f=fixture(); f.activate(); f.register('B');
 assert.throws(()=>f.run({type:'refer',contractId:'A',code:'DM-A7K9M2Q8'}));
 assert.throws(()=>f.run({type:'refer',contractId:'B',code:'BAD'}));
 f.run({type:'code_status',code:'DM-A7K9M2Q8',active:false});
 assert.equal(validCode(f.state(),'DM-A7K9M2Q8'),false);
 assert.throws(()=>f.run({type:'refer',contractId:'B',code:'DM-A7K9M2Q8'}));
 assert.throws(()=>f.run({type:'deposit',contractId:'B'},{role:'customer',customerContractId:'B'}));
});
test('benefits only on deposit, multiple referrals accumulate, repeated confirmation does not duplicate',()=>{
 const f=fixture(); f.activate();
 for(const id of ['B','C','D']) { f.refer(id); f.run({type:'sent',contractId:id}); }
 assert.equal(Object.keys(f.state().benefits).length,0);
 for(const id of ['B','C','D']) { f.run({type:'deposit',contractId:id}); f.run({type:'deposit',contractId:id}); }
 const state=f.state(); const own=Object.values(state.benefits).filter(b=>b.contractId==='A');
 assert.equal(own.reduce((n,b)=>n+b.amount,0),150000);
 assert.equal(remainingBalance(state,'A'),550000);
 assert.equal(remainingBalance(state,'B'),650000);
});
test('excess balance becomes payable, partial payout and cancellation preserve only used amount',()=>{
 const f=fixture(320000); f.activate(); f.refer('B'); f.run({type:'deposit',contractId:'B'});
 const owner=Object.values(f.state().benefits).find(b=>b.contractId==='A')!;
 assert.equal(amounts(f.state(),owner).balance,20000);
 assert.equal(amounts(f.state(),owner).available,30000);
 const payout:Command={type:'payout',contractId:'A',amount:10000,paidAt:'2026-11-19',paymentId:'payout-1'};
 f.run(payout,{requestId:'same-request'});
 assert.deepEqual(f.run(payout,{requestId:'same-request'}),[]);
 assert.throws(()=>f.run(payout));
 f.run({type:'cancel',contractId:'B'});
 assert.deepEqual(amounts(f.state(),owner),{granted:50000,balance:20000,paid:10000,cancelled:20000,waived:30000,available:0});
});
test('full payment routes new referrals to payout; cancellation does not affect other referrals',()=>{
 const f=fixture(); f.activate(); f.run({type:'payment',contractId:'A',amount:700000});
 for(const id of ['B','C']) { f.refer(id); f.run({type:'deposit',contractId:id}); }
 f.run({type:'cancel',contractId:'B'});
 const own=Object.values(f.state().benefits).filter(b=>b.contractId==='A');
 assert.equal(own.reduce((n,b)=>n+amounts(f.state(),b).available,0),50000);
 assert.equal(own.reduce((n,b)=>n+amounts(f.state(),b).cancelled,0),50000);
 f.run({type:'payout',contractId:'A',amount:50000,paidAt:'2026-11-19',paymentId:'payment'});
 f.run({type:'correct_payout',paymentId:'payment',amount:20000});
 assert.equal(own.reduce((n,b)=>n+amounts(f.state(),b).paid,0),30000);
 assert.equal(own.reduce((n,b)=>n+amounts(f.state(),b).available,0),20000);
 assert.equal(f.state().entries.filter(e=>e.kind==='payout').length,1);
});
test('sent contract relationship requires administrator with a reason',()=>{
 const f=fixture();f.activate();f.register('B');f.run({type:'sent',contractId:'B'});
 assert.throws(()=>f.run({type:'refer',contractId:'B',code:'DM-A7K9M2Q8'},{role:'customer',customerContractId:'B'}));
 assert.throws(()=>f.run({type:'refer',contractId:'B',code:'DM-A7K9M2Q8'},{reason:''}));
 f.run({type:'refer',contractId:'B',code:'DM-A7K9M2Q8'});
});

test('server generates one permanent code across serialized repeated requests',async()=>{
 const { issueCode } = await import('../src/lib/referrals/issuance');
 const f=fixture(); f.run({type:'deposit',contractId:'A'});
 let stored=f.history();
 const store={transaction:async <T>(operation:(events:Event[])=>{events:Event[];result:T})=>{
   const result=operation(stored); stored=[...stored,...result.events]; return result.result;
 }};
 const context:Context={requestId:'issue-1',actor:'admin',role:'admin',at:'2026-11-19T00:00:00Z'};
 const first=await issueCode(store,'A',context);
 const second=await issueCode(store,'A',{...context,requestId:'issue-2'});
 assert.match(first.value,/^DM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
 assert.equal(first.value,second.value);
 assert.equal(Object.keys(project(stored).codes).length,1);
 await assert.rejects(()=>issueCode(store,'A',{...context,role:'customer'}));
});
