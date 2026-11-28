'use client';
import {useEffect,useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {useAdminCrm} from './useAdminCrm';
import {seoulToday} from './types';
import {mergeWeddings,validDate,type Wedding} from '@/lib/admin/unifiedWeddingCalendar';
export default function UnifiedWeddingCalendar(){
 const {data,error:crmError}=useAdminCrm();
 const [legacy,setLegacy]=useState<Wedding[]|null>(null);
 const [error,setError]=useState('');
 const [month,setMonth]=useState(seoulToday().slice(0,7));
 const [query,setQuery]=useState('');
 const [onlyReview,setOnlyReview]=useState(false);
 const [selected,setSelected]=useState<Wedding|null>(null);
 useEffect(()=>{let active=true;fetch('/api/referrals/admin/legacy-weddings',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error);return j.rows as string[][];}).then(rows=>{if(active)setLegacy(rows.map(([date,time,groom,bride,venue,hall,note])=>({date,time,groom,bride,venue,hall,note,source:'기존 엑셀',cancelled:note.includes('취소 표시')})));}).catch(e=>{if(active)setError(String(e.message));});return()=>{active=false};},[]);
 const contracts=useMemo<Wedding[]>(()=> (data?.contracts||[]).filter(c=>validDate(c.weddingDate)).map(c=>({date:c.weddingDate,time:c.weddingTime||'',groom:c.groom||'',bride:c.bride||'',venue:c.weddingVenue||'',hall:c.weddingHall||'',source:'관리자 계약서',note:[c.status==='cancelled'?'관리자 계약 취소':'',!c.weddingTime||!c.groom||!c.bride||!c.weddingVenue?'계약 정보 누락':''].filter(Boolean).join(' / '),cancelled:c.status==='cancelled'})),[data]);
 const all=useMemo(()=>mergeWeddings([...(legacy||[]),...contracts]),[legacy,contracts]);
 const visible=all.filter(w=>w.date.startsWith(month)&&(!onlyReview||w.note||w.cancelled)&&[w.groom,w.bride,w.venue,w.hall,w.time].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const [year,m]=month.split('-').map(Number);
 const first=new Date(Date.UTC(year,m-1,1)).getUTCDay(), days=new Date(Date.UTC(year,m,0)).getUTCDate();
 function shift(delta:number){const d=new Date(Date.UTC(year,m-1+delta,1));const next=d.toISOString().slice(0,7);if(next>='2026-01')setMonth(next);}
 return <main className="admin-page">
 <div className="admin-page-heading"><div><p className="admin-kicker">UNIFIED WEDDING CALENDAR</p><h1>새로운 캘린더</h1><p>2026년 1월 이후 본식일 기준 · 원본 계약서 읽기 전용 · 기존 촬영 캘린더와 별도</p></div></div>
 {error||crmError?<div className="admin-error">{error||crmError} — 일부 데이터가 표시되지 않을 수 있습니다.</div>:null}
 {legacy===null||!data?<p>계약 일정을 불러오는 중입니다.</p>:null}
 <section className="admin-card calendar-card">
 <p>엑셀 {legacy===null?'조회 중':legacy.length+'건'} · 관리자 계약 {data?contracts.length+'건':'조회 중'} · 중복 통합 {legacy!==null&&data?all.length+'건':'집계 중'} · 이번 달 {visible.length}건</p>
 <div className="admin-toolbar" style={{margin:'12px 0',display:'flex',gap:12,flexWrap:'wrap'}}>
 <label className="admin-field">본식 월<input type="month" min="2026-01" value={month} onChange={e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)&&e.target.value>='2026-01')setMonth(e.target.value)}}/></label>
 <label className="admin-field">신랑·신부·웨딩홀 검색<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="검색"/></label>
 <label style={{alignSelf:'end',paddingBottom:8}}><input type="checkbox" checked={onlyReview} onChange={e=>setOnlyReview(e.target.checked)}/> 확인 필요만 보기</label>
 </div>
 <div className="admin-calendar-head"><button className="admin-button" disabled={month==='2026-01'} onClick={()=>shift(-1)} aria-label="이전 달"><ChevronLeft size={16}/></button><h2>{year}년 {m}월</h2><button className="admin-button" onClick={()=>shift(1)} aria-label="다음 달"><ChevronRight size={16}/></button></div>
 <div className="admin-calendar-grid">
 {['일','월','화','수','목','금','토'].map(d=><div className="admin-calendar-weekday" key={d}>{d}</div>)}
 {Array.from({length:first+days},(_,i)=>{const day=i-first+1;if(day<1)return <div key={'empty'+i} className="admin-calendar-day is-empty"/>;const date=month+'-'+String(day).padStart(2,'0');const entries=visible.filter(w=>w.date===date);return <div className={'admin-calendar-day'+(entries.length>1?' is-double':'')} key={date}><span className="admin-calendar-number">{day}{entries.length>1?' · '+entries.length+'건':''}</span>{entries.map((w,j)=><button type="button" className="admin-calendar-event" key={j} onClick={()=>setSelected(w)} style={{display:'block',width:'100%',textAlign:'left',border:w.note?'1px solid #b7791f':0,opacity:w.cancelled?.65:1,cursor:'pointer',whiteSpace:'normal'}}><strong>{w.groom||'신랑 확인'} · {w.bride||'신부 확인'}</strong><span>{w.time||'시간 확인'} · {w.venue||'장소 확인'} {w.hall}</span><small style={{display:'block'}}>{w.cancelled?'취소 표시 · ':''}{w.note?'확인 필요 · ':''}{w.source}</small></button>)}</div>})}
 </div></section>
 {selected?<div onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',padding:18,zIndex:80}}><section className="admin-card" onClick={e=>e.stopPropagation()} style={{width:'min(520px,100%)'}}><h2>{selected.groom} · {selected.bride}</h2><p>{selected.date} · {selected.time||'시간 확인'}</p><p>{selected.venue} {selected.hall}</p><p>출처: {selected.source}</p>{selected.note?<p className="admin-error">{selected.note}</p>:null}<button className="admin-button" onClick={()=>setSelected(null)}>닫기</button></section></div>:null}
 </main>;
}
