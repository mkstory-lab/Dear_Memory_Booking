export type BookingBasis = 'booked' | 'wedding';
type BookingRow = {id:string;status:string;bookingDate?:string;weddingDate:string;total:number;deposit:number;paid:number;balance:number};
export function bookingEligible(c:BookingRow) {return c.status!=='cancelled' && c.id!=='64bf7b68-4d75-499b-a216-e074cc5f245c';}
export function bookingMonth(c:BookingRow,basis:BookingBasis) {
 const value=basis==='booked'?c.bookingDate:c.weddingDate;
 return value && /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)?value.slice(0,7):'';
}
export function monthlyBookings(contracts:BookingRow[],basis:BookingBasis,year:string) {
 const active=contracts.filter(bookingEligible);
 const months=Array.from({length:12},(_,i)=>year+'-'+String(i+1).padStart(2,'0'));
 return months.map(month=>{
  const rows=active.filter(c=>bookingMonth(c,basis)===month);
  return {month,count:rows.length,total:rows.reduce((s,c)=>s+c.total,0),paid:rows.reduce((s,c)=>s+c.paid,0),balance:rows.reduce((s,c)=>s+c.balance,0)};
 });
}
