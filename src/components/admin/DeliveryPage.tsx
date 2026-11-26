'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {TASKS,taskRows,taskInfo,deliveryEligible,type TaskKey,type DeliveryKey} from '@/lib/admin/delivery';
import {useAdminCrm} from './useAdminCrm';
import {money,seoulToday,type AdminContract} from './types';

function DeliveryCell({contract,task,today,busy,save}:{contract:AdminContract;task:TaskKey;today:string;busy:boolean;save:(key:DeliveryKey,date:string|null)=>Promise<boolean>}) {
 const info=taskInfo(contract,task,today);
 const [editing,setEditing]=useState(false);
 const [date,setDate]=useState(today);
 const color=info.completed?(info.late?'orange':'green'):info.late?'red':info.soon?'orange':'';
 const label=info.completed?(info.late?'지연 완료':'완료'):!info.eligible?'예정':info.late?'기한 초과':info.soon?'기한 임박':'미확인';
 return <div className="delivery-cell"><span className={'admin-badge '+color}>{label}</span>
 {info.completed?<small>{info.completedOn||'완료일 미확인'}</small>:task==='balance'?<small>{money(contract.balance)}</small>:null}
 {info.due&&<small>{task==='edited'?info.start+' ~ ':''}{info.due}까지</small>}
 {task==='balance'?(!info.completed&&<Link href="/admin/payments">입금 관리</Link>):info.eligible&&(
 editing?<div className="delivery-edit"><input aria-label={contract.bride+' '+task+' 발송일'} type="date" min={contract.weddingDate} max={today} value={date} onChange={e=>setDate(e.target.value)}/><button className="admin-button primary" disabled={busy||!date} onClick={async()=>{if(await save(task,date))setEditing(false)}}>저장</button><button className="admin-button" disabled={busy} onClick={()=>setEditing(false)}>취소</button></div>:
 <button className="admin-button delivery-action" disabled={busy} onClick={()=>{setDate(info.completedOn||today);setEditing(true)}}>{info.completed?'날짜 수정':'발송 완료'}</button>
 )}
 {task!=='balance'&&info.completed&&!editing&&<button className="delivery-undo" disabled={busy} onClick={()=>{if(window.confirm('발송 완료 기록을 취소할까요?'))void save(task,null)}}>완료 취소</button>}
 </div>;
}
export default function DeliveryPage(){
 const {data,error,mutate}=useAdminCrm();
 const [filter,setFilter]=useState<TaskKey|'all'>('all');
 const [query,setQuery]=useState('');
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const today=seoulToday();
 useEffect(()=>{const f=new URLSearchParams(window.location.search).get('filter');if(TASKS.some(t=>t.key===f))setFilter(f as TaskKey);},[]);
 const contracts=(data?.contracts||[]).filter(deliveryEligible);
 const filtered=(filter==='all'?contracts:taskRows(contracts,filter,today)).filter(c=>[c.groom,c.bride,c.number,c.weddingDate,c.weddingVenue].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>a.weddingDate.localeCompare(b.weddingDate));
 async function save(id:string,key:DeliveryKey,date:string|null){setBusy(id);setMessage('');try{await mutate({type:'set_delivery_date',contractId:id,key,date});setMessage('저장 완료');return true;}catch(e){setMessage(e instanceof Error?e.message:'저장 실패');return false;}finally{setBusy('');}}
 return <main className="admin-page"><div className="admin-page-heading"><div><p className="admin-kicker">DELIVERY</p><h1>납품 관리</h1><p>잔금 · 원본 · 수정본 · 앨범을 한눈에 확인합니다.</p></div><a href="https://mail.kakao.com/" target="_blank" rel="noreferrer" className="admin-button">카카오메일 열기</a></div>
 <div className="delivery-summary">{TASKS.map(t=>{const rows=taskRows(contracts,t.key,today);const late=rows.filter(c=>taskInfo(c,t.key,today).late).length;return <button key={t.key} className={'admin-stat delivery-tile '+(filter===t.key?'selected':'')} onClick={()=>setFilter(t.key)}><span>{t.label}</span><strong>{rows.length}팀</strong><small>{t.rule}{late?' · 지연 '+late+'팀':''}</small></button>})}</div>
 <div className="admin-toolbar" style={{marginTop:18}}><button className={'admin-button '+(filter==='all'?'primary':'')} onClick={()=>setFilter('all')}>전체 고객</button>{TASKS.map(t=><button key={t.key} className={'admin-button '+(filter===t.key?'primary':'')} onClick={()=>setFilter(t.key)}>{t.label}</button>)}<input aria-label="납품 고객 검색" placeholder="이름 · 본식일 검색" value={query} onChange={e=>setQuery(e.target.value)}/><span className="admin-badge">{filtered.length}팀</span></div>
 <p className="delivery-note">잔금은 기존 입금 기록과 연동됩니다. 발송 여부는 카카오메일·택배 내역을 확인한 후 실제 발송일을 기록해 주세요. 미확인은 실제 미발송을 뜻하지 않습니다.</p>
 {error&&<p className="admin-error">{error}</p>}{message&&<p role="status" className="admin-badge">{message}</p>}
 <div className="admin-table-wrap"><table className="admin-table delivery-table"><thead><tr><th>고객 / 본식</th><th>잔금 입금</th><th>원본</th><th>수정본</th><th>앨범</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><Link href={'/admin/customers/'+c.id}><strong>{c.bride} · {c.groom}</strong></Link><small>{c.weddingDate} · {c.weddingTime}</small><small>{c.weddingVenue}</small></td>{TASKS.map(t=><td key={t.key}><DeliveryCell contract={c} task={t.key} today={today} busy={!!busy} save={(key,date)=>save(c.id,key,date)}/></td>)}</tr>)}</tbody></table>{!data?<p className="admin-empty">불러오는 중입니다.</p>:!filtered.length?<p className="admin-empty">현재 확인할 업무가 없습니다.</p>:null}</div></main>;
}
