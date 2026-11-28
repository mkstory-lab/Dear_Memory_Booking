export type Wedding = {date:string; time:string; groom:string; bride:string; venue:string; hall:string; note:string; source:string; cancelled?:boolean};
const clean=(x:string)=>(x||'').normalize('NFKC').toLowerCase().replace(/[\s()\/·,.-]/g,'');
export function venueKey(v:string,h:string){
  const a=clean(v), b=clean(h);
  if (/^(구로)?지타(워|원)(컨벤션|웨딩홀)?$/.test(a) && (!b||/^(그랜드볼룸(홀)?(2층)?|2층(단독홀)?|단독홀(2층)?)$/.test(b))) return '지타워컨벤션';
  return a+b;
}
export function normalizedTime(t:string){
 const m=t.trim().match(/^(\d{1,2}):(\d{2})$/);
 if(!m) return t.trim();
 const h=Number(m[1]),min=Number(m[2]);
 return h<24&&min<60?String(h).padStart(2,'0')+':'+m[2]:t.trim();
}
export function validDate(s:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'2026-01-01')return false;
 const d=new Date(s+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;
}
export function mergeWeddings(rows:Wedding[]){
 const map=new Map<string,Wedding>();
 for(const w of rows){
  if(!validDate(w.date))continue;
  const time=normalizedTime(w.time);
  const venue=venueKey(w.venue,w.hall);
  const full=!!(w.groom.trim()&&w.bride.trim()&&venue&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time));
  const key=full?JSON.stringify([w.date,time,clean(w.groom),clean(w.bride),venue]):'incomplete:'+map.size;
  const prev=map.get(key);
  if(!prev){map.set(key,{...w,time});continue;}
  const preferred=w.source==='관리자 계약서'?w:prev;
  const notes=[...new Set([prev.note,w.note].filter(Boolean))].join(' / ');
  map.set(key,{...preferred,time,venue:preferred.venue||prev.venue,hall:preferred.hall||prev.hall||w.hall,note:notes,source:prev.source===w.source?prev.source:'엑셀 + 관리자 계약서',cancelled:!!(prev.cancelled||w.cancelled)});
 }
 const results=[...map.values()];
 const byCouple=new Map<string,Wedding[]>();
 for(const w of results){if(!w.groom||!w.bride)continue;const k=clean(w.groom)+'|'+clean(w.bride);byCouple.set(k,[...(byCouple.get(k)||[]),w]);}
 for(const group of byCouple.values())if(group.length>1)for(const w of group)w.note=[w.note,'동일 신랑신부의 다른 일정 또는 장소 확인'].filter(Boolean).join(' / ');
 return results.sort((a,b)=>(a.date+a.time+a.bride).localeCompare(b.date+b.time+b.bride));
}
