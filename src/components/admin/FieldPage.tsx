'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAdminCrm } from './useAdminCrm';
import { productName, seoulToday } from './types';

const tasks = ['장비 및 메모리카드 점검','신랑·신부 도착 확인','본식 전 연출 촬영','신부대기실 촬영','본식 및 행진 촬영','가족·친구 원판 촬영','연회장 촬영','촬영 종료 및 파일 백업'];
type Photo = { id: string; name: string };
type Field = { requests: string; memo: string; eta: string; staffArrival: string; checks: number[]; revision: string; photos: Photo[]; r2Ready: boolean };
type Shoot = { id: string; title: string; date: string; time: string; venue: string; bridePhone: string; groomPhone: string; staff: string[]; product: string; options: string[]; memo: string; manual: boolean };
const endpoint = '/api/referrals/admin/field';
const url = (id: string, photo?: string) => endpoint + '?' + new URLSearchParams({id, ...(photo ? {photo} : {})});
const dateLabel = (time: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim()); if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return '시간 확인 필요'; const min = Number(m[1])*60+Number(m[2])-120; const n=(min+1440)%1440; return (min<0?'전날 ':'')+String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'); };
async function json(response: Response) { const body=await response.json(); if(!response.ok) throw new Error(body.error || '요청을 처리하지 못했습니다.'); return body as Field; }

export default function FieldPage() {
  const {data,error,refresh}=useAdminCrm();
  const [date,setDate]=useState(seoulToday());
  const [selected,setSelected]=useState('');
  const shoots=useMemo<Shoot[]>(()=>[
    ...(data?.contracts||[]).filter(c=>c.status!=='cancelled').map(c=>({id:c.id,title:c.groom+' · '+c.bride,date:c.weddingDate,time:c.weddingTime,venue:[c.weddingVenue,c.weddingHall].filter(Boolean).join(' · '),bridePhone:c.bridePhone,groomPhone:c.groomPhone,staff:data?.staffAssignments[c.id]||[],product:productName(c.productId),options:c.optionIds||[],memo:c.memo,manual:false})),
    ...(data?.manualSchedules||[]).filter(m=>m.active).map(m=>({id:m.id,title:m.title,date:m.date,time:m.time,venue:m.venue,bridePhone:m.contact,groomPhone:'',staff:m.staffIds.map(id=>data?.staff.find(s=>s.id===id)?.displayName||'').filter(Boolean),product:'수동 일정',options:[],memo:m.details,manual:true}))
  ].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),[data]);
  const todays=shoots.filter(s=>s.date===date);
  const current=todays.find(s=>s.id===selected)||todays[0];
  const nextDates=[...new Set(shoots.filter(s=>s.date>=seoulToday()).map(s=>s.date))].slice(0,6);
  return <main className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-kicker">WEDDING DAY</p><h1>본식 현장 관리</h1><p>계약·캘린더와 연결된 현장 촬영 체크리스트 및 고객 요청사항입니다.</p></div></div>
    <section className="admin-card" style={{marginBottom:16}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}><label className="admin-field">촬영 날짜<input type="date" value={date} onChange={e=>{setDate(e.target.value);setSelected('');}}/></label><button className="admin-button" onClick={()=>{setDate(seoulToday());setSelected('');}}>오늘</button><button className="admin-button" onClick={()=>void refresh()}>일정 새로고침</button></div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:12}}>{nextDates.map(d=><button className={'admin-button '+(d===date?'primary':'')} key={d} onClick={()=>{setDate(d);setSelected('');}}>{d.slice(5).replace('-','월 ')}일</button>)}</div>
      {error&&<p className="admin-error">{error}</p>}
      {!data?<p className="admin-empty">일정을 불러오는 중입니다.</p>:!todays.length?<p className="admin-empty">이 날짜에 등록된 촬영 일정이 없습니다.</p>:<div className="admin-list" style={{marginTop:12}}>{todays.map(s=><button key={s.id} className="admin-list-item" onClick={()=>setSelected(s.id)} style={{width:'100%',textAlign:'left',border:'1px solid var(--admin-line)',borderRadius:10,marginBottom:6,background:current?.id===s.id?'var(--admin-accent-soft)':'white',cursor:'pointer'}}><div><strong>{s.time||'시간 미정'} · {s.title}</strong><span>{s.venue||'장소 미정'}</span></div><span>{current?.id===s.id?'선택됨':'보기'}</span></button>)}</div>}
    </section>
    {current&&<ShootDetail key={current.id} shoot={current}/>}
  </main>;
}

function ShootDetail({shoot:s}:{shoot:Shoot}) {
  const [state,setState]=useState<Field|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [dirty,setDirty]=useState(false);
  async function load(){setError('');try{setState(await json(await fetch(url(s.id),{cache:'no-store'})));setDirty(false);}catch(e){setError(e instanceof Error?e.message:'불러오기 실패');}}
  useEffect(()=>{void load();},[s.id]);
  function edit(p:Partial<Field>){setState(v=>v?{...v,...p}:v);setDirty(true);}
  async function save(next:Field){setBusy(true);setError('');setMessage('');try{const result=await json(await fetch(url(s.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:next.requests,memo:next.memo,eta:next.eta,staffArrival:next.staffArrival,checks:next.checks,revision:next.revision})}));setState(result);setDirty(false);setMessage('저장되었습니다.');}catch(e){setError(e instanceof Error?e.message:'저장 실패');}finally{setBusy(false);}}
  async function upload(files:FileList|null){if(!files?.length||!state)return;setBusy(true);setError('');setMessage('');try{for(const file of Array.from(files)){let image:Blob=file;if(file.size>3_000_000){const bitmap=await createImageBitmap(file);const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')?.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();image=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('사진 변환 실패')),'image/jpeg',.82));}if(image.size>3_000_000)throw new Error('사진은 3MB 이내로 줄여 주세요.');const form=new FormData();form.append('photo',image,image.type==='image/jpeg'?'request.jpg':file.name);const result=await json(await fetch(url(s.id),{method:'POST',body:form}));setState(v=>v?{...v,photos:result.photos,r2Ready:result.r2Ready}:result);}setMessage('요청 사진이 저장되었습니다.');}catch(e){setError(e instanceof Error?e.message:'사진 업로드 실패');}finally{setBusy(false);}}
  async function remove(id:string){if(!window.confirm('이 요청 사진을 삭제할까요?'))return;setBusy(true);setError('');try{const result=await json(await fetch(url(s.id,id),{method:'DELETE'}));setState(v=>v?{...v,photos:result.photos}:result);}catch(e){setError(e instanceof Error?e.message:'삭제 실패');}finally{setBusy(false);}}
  const inputStyle={width:'100%',marginTop:6,padding:'12px',border:'1px solid var(--admin-line)',borderRadius:10,background:'#fff',color:'var(--admin-ink)',fontSize:16} as const;
  return <div style={{display:'grid',gap:16}}>
    <section className="admin-card"><p className="admin-kicker">{s.date}</p><h2 style={{fontSize:28,margin:'4px 0'}}>{s.time||'시간 미정'} 본식</h2><h3>{s.title}</h3><p>{s.venue||'장소 미정'}</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginTop:16}}><div style={{background:'var(--admin-bg)',padding:14,borderRadius:12}}><small>권장 고객 도착</small><h2>{dateLabel(s.time)}</h2></div><div style={{background:'var(--admin-bg)',padding:14,borderRadius:12}}><small>배정 작가</small><p><strong>{s.staff.join(', ')||'미배정'}</strong></p></div></div><p style={{marginTop:12}}>촬영 상품: <strong>{s.product}</strong>{s.options.length?' · '+s.options.join(', '):''}</p><div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>{s.bridePhone&&<a className="admin-button" href={'tel:'+s.bridePhone}>{s.manual?'담당자':'신부'} 전화</a>}{s.groomPhone&&<a className="admin-button" href={'tel:'+s.groomPhone}>신랑 전화</a>}{!s.manual&&<Link className="admin-button" href={'/admin/customers/'+s.id}>고객·계약 상세</Link>}</div>{s.memo&&<p style={{marginTop:12,whiteSpace:'pre-wrap'}}>기존 고객 메모: {s.memo}</p>}</section>
    {error&&<div className="admin-error" role="alert">{error} <button className="admin-button" disabled={busy} onClick={()=>void load()}>다시 불러오기</button></div>}
    {message&&<p role="status" style={{color:'var(--admin-green)'}}>{message}</p>}
    {!state?<section className="admin-card"><p>현장 데이터를 불러오는 중입니다.</p></section>:<>
      <section className="admin-card"><h2>당일 도착 시간</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginTop:12}}><label>고객 도착 예정<input type="time" style={inputStyle} value={state.eta} disabled={busy} onChange={e=>edit({eta:e.target.value})}/></label><label>작가 도착 예정<input type="time" style={inputStyle} value={state.staffArrival} disabled={busy} onChange={e=>edit({staffArrival:e.target.value})}/></label></div></section>
      <section className="admin-card"><h2>신부 요청사항</h2><textarea aria-label="신부 요청사항" style={inputStyle} rows={5} maxLength={2000} value={state.requests} disabled={busy} onChange={e=>edit({requests:e.target.value})} placeholder="꼭 촬영할 사진, 가족 관계, 유의사항 등"/><h2 style={{marginTop:18}}>현장 특이사항</h2><textarea aria-label="현장 특이사항" style={inputStyle} rows={3} maxLength={2000} value={state.memo} disabled={busy} onChange={e=>edit({memo:e.target.value})} placeholder="홀 조명, 진행 변경, 촬영팀 협의사항 등"/></section>
      <section className="admin-card"><h2>요청 사진</h2><p style={{margin:'8px 0',fontSize:14,color:'var(--admin-muted)'}}>{state.r2Ready?'사진을 누르면 크게 볼 수 있습니다. 최대 20장, 사진당 3MB.':'Cloudflare R2 비공개 저장소 연결 후 사진 업로드를 사용할 수 있습니다.'}</p><label className="admin-field">사진 추가<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||!state.r2Ready||state.photos.length>=20} onChange={e=>{const files=e.target.files;if(files)void upload(files);e.target.value='';}}/></label><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10,marginTop:12}}>{state.photos.map(p=><div key={p.id}><a href={url(s.id,p.id)} target="_blank" rel="noopener noreferrer"><img src={url(s.id,p.id)} alt="요청 사진" loading="lazy" style={{width:'100%',aspectRatio:'3/4',objectFit:'cover',borderRadius:8}}/></a><button className="admin-button" disabled={busy} onClick={()=>void remove(p.id)} style={{width:'100%'}}>삭제</button></div>)}</div></section>
      <section className="admin-card"><h2>촬영 체크리스트 <small>{state.checks.length}/{tasks.length}</small></h2><progress max={tasks.length} value={state.checks.length} style={{width:'100%',height:12,margin:'12px 0'}}/>{tasks.map((task,i)=><label key={task} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--admin-line)',cursor:'pointer'}}><input type="checkbox" checked={state.checks.includes(i)} disabled={busy} style={{width:22,height:22}} onChange={e=>{const next={...state,checks:e.target.checked?[...state.checks,i]:state.checks.filter(n=>n!==i)};setState(next);setDirty(true);void save(next);}}/><span style={{textDecoration:state.checks.includes(i)?'line-through':'none'}}>{task}</span></label>)}</section>
      <div style={{position:'sticky',bottom:8,zIndex:10,display:'flex',gap:10,alignItems:'center',background:'var(--admin-bg)',padding:10,borderRadius:12}}><button className="admin-button primary" style={{flex:1,minHeight:44}} disabled={busy||!dirty} onClick={()=>void save(state)}>{busy?'저장 중…':dirty?'현장 내용 저장':'저장 완료'}</button>{dirty&&!busy&&<small>저장하지 않은 변경사항</small>}</div>
    </>}
  </div>;
}
