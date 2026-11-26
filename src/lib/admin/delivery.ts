export const DELIVERY_KEYS = ['raw', 'edited', 'album'] as const;
export type DeliveryKey = typeof DELIVERY_KEYS[number];
export type DeliveryDates = Partial<Record<DeliveryKey, string>>;
export type TaskKey = 'balance' | DeliveryKey;
export const TASKS: {key:TaskKey; label:string; rule:string}[] = [
  {key:'balance',label:'잔금 미입금',rule:'본식 주 금요일까지'},
  {key:'raw',label:'원본 발송 확인',rule:'본식 후 14일 이내'},
  {key:'edited',label:'수정본 발송 확인',rule:'본식 후 3~5개월'},
  {key:'album',label:'앨범 발송 확인',rule:'별도 기한 없음'},
];
type Contract = {id:string;status:string;weddingDate:string;balance:number;balanceConfirmedAt?:string;deliveryDates?:DeliveryDates};
const toDate = (day:string) => new Date(day+'T00:00:00Z');
const format = (date:Date) => date.toISOString().slice(0,10);
export function validDay(day:string) {return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(toDate(day).getTime())&&format(toDate(day))===day;}
export function addDays(day:string,n:number) {const date=toDate(day);date.setUTCDate(date.getUTCDate()+n);return format(date);}
export function addMonths(day:string,n:number) {const date=toDate(day);const original=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+n);const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(original,last));return format(date);}
export function balanceDue(day:string) {const weekday=toDate(day).getUTCDay();return addDays(day,-((weekday+2)%7));}
export function seoulDay(iso:string) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(iso));}
export function deliveryEligible(c:Pick<Contract,'id'|'status'|'weddingDate'>) {return c.status!=='cancelled'&&c.id!=='64bf7b68-4d75-499b-a216-e074cc5f245c'&&validDay(c.weddingDate);}
export function taskInfo(c:Contract,key:TaskKey,today:string) {
 const day=c.weddingDate;
 const due=key==='balance'?balanceDue(day):key==='raw'?addDays(day,14):key==='edited'?addMonths(day,5):'';
 const start=key==='edited'?addMonths(day,3):day;
 const completed=key==='balance'?c.balance<=0:!!c.deliveryDates?.[key];
 const completedOn=key==='balance'?(c.balanceConfirmedAt?seoulDay(c.balanceConfirmedAt):''):c.deliveryDates?.[key]||'';
 const eligible=key==='balance'||day<=today;
 const late=!!due&&(completed?!!completedOn&&completedOn>due:eligible&&today>due);
 const soon=!!due&&!completed&&!late&&eligible&&(key==='edited'?today>=start:today>=addDays(due,key==='raw'?-4:-3));
 return {due,start,completed,completedOn,eligible,late,soon};
}
export function taskRows<T extends Contract>(contracts:T[],key:TaskKey,today:string) {
 return contracts.filter(deliveryEligible).filter(c=>{
  const t=taskInfo(c,key,today);
  return !t.completed&&t.eligible&&(key!=='balance'||t.due<=addDays(today,7));
 }).sort((a,b)=>a.weddingDate.localeCompare(b.weddingDate));
}
export function validateDeliveryDate(key:unknown,date:unknown,weddingDate:string,today:string): {key:DeliveryKey;date:string|null} {
 if(!DELIVERY_KEYS.includes(key as DeliveryKey))throw Error('납품 항목을 확인해 주세요.');
 if(date!==null&&(typeof date!=='string'||!validDay(date)||date<weddingDate||date>today))throw Error('발송일은 본식일 이후 오늘까지 입력해 주세요.');
 return {key:key as DeliveryKey,date:date as string|null};
}
