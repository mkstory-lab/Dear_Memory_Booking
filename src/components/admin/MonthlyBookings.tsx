'use client';
import {useMemo,useState} from 'react';
import {bookingEligible,bookingMonth,monthlyBookings,type BookingBasis} from '@/lib/admin/bookingStats';
import {money,seoulToday,type AdminContract} from './types';
export default function MonthlyBookings({contracts,onSelect}:{contracts:AdminContract[];onSelect:(basis:BookingBasis,month:string)=>void}) {
 const [basis,setBasis]=useState<BookingBasis>('booked');
 const [year,setYear]=useState(seoulToday().slice(0,4));
 const [selected,setSelected]=useState('');
 const eligible=useMemo(()=>contracts.filter(bookingEligible),[contracts]);
 const years=[...new Set([seoulToday().slice(0,4),year,...eligible.map(c=>bookingMonth(c,basis).slice(0,4)).filter(Boolean)])].sort();
 const months=monthlyBookings(eligible,basis,year);
 const max=Math.max(1,...months.map(m=>m.count));
 const totals=months.reduce((s,m)=>({count:s.count+m.count,total:s.total+m.total,paid:s.paid+m.paid,balance:s.balance+m.balance}),{count:0,total:0,paid:0,balance:0});
 const unknown=eligible.filter(c=>!bookingMonth(c,basis)).length;
 function changeBasis(next:BookingBasis){setBasis(next);setSelected('');onSelect(next,'');}
 function choose(month:string){const next=selected===month?'':month;setSelected(next);onSelect(basis,next);}
 return <section className="admin-card booking-section">
 <div className="admin-card-header"><h2>월별 예약 현황</h2><select className="booking-year" aria-label="예약 현황 연도" value={year} onChange={e=>{setYear(e.target.value);setSelected('');onSelect(basis,'')}}>{years.map(y=><option key={y} value={y}>{y}년</option>)}</select></div>
 <div className="admin-toolbar"><button className={'admin-button '+(basis==='booked'?'primary':'')} onClick={()=>changeBasis('booked')}>예약받은 달</button><button className={'admin-button '+(basis==='wedding'?'primary':'')} onClick={()=>changeBasis('wedding')}>본식 예정 달</button></div>
 <p className="booking-help">{basis==='booked'?'계약서 최초 발송일 기준 (과거 계약은 발송 메일 대조)':'본식일 기준 · 해당 달 촬영 예약'} · 취소 및 테스트 계약 제외{unknown?' · 날짜 미확인 '+unknown+'팀':''}</p>
 <div className="booking-total"><div><span>{year}년 예약</span><strong>{totals.count}팀</strong></div><div><span>총 계약금액</span><strong>{money(totals.total)}</strong></div><div><span>기록된 입금액</span><strong>{money(totals.paid)}</strong></div><div><span>남은 잔금</span><strong>{money(totals.balance)}</strong></div></div>
 <div className="admin-table-wrap booking-table-wrap"><table className="admin-table booking-table"><thead><tr><th>월</th><th>예약 팀 수</th><th>계약금액</th><th>남은 잔금</th></tr></thead><tbody>{months.map(m=><tr key={m.month} className={selected===m.month?'booking-selected':undefined}><td><button className="booking-month-button" onClick={()=>choose(m.month)} aria-pressed={selected===m.month}>{Number(m.month.slice(5))}월</button></td><td><div className="booking-count"><strong>{m.count}팀</strong><div className="admin-monthly-track"><div className="admin-monthly-fill" style={{width:m.count/max*100+'%'}}/></div></div></td><td>{money(m.total)}</td><td>{money(m.balance)}</td></tr>)}</tbody></table></div>
 <p className="booking-help">월을 누르면 아래 고객 목록이 해당 월로 필터링됩니다. 다시 누르면 전체로 돌아갑니다. {selected&&<button className="admin-button" onClick={()=>{setSelected('');onSelect(basis,'')}}>월 필터 해제</button>}</p>
 </section>;
}
