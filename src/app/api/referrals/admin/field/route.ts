import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sameOrigin, verifySession } from '@/lib/referrals/adminAuth';
import { referralSettings, referralStore } from '@/lib/referrals/server';
import { project, type Event } from '@/lib/referrals/ledger';
import { projectStaff } from '@/lib/admin/staff';
import { fieldR2, fieldR2Ready } from '@/lib/admin/fieldR2';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Photo={id:string;name:string;type:string};
type Field={requests:string;memo:string;eta:string;staffArrival:string;checks:number[];revision:string;photos:Photo[];r2Ready:boolean};
const headers={'Cache-Control':'private, no-store'};
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers});
function actor(req:NextRequest){return verifySession(req.cookies.get(SESSION_COOKIE)?.value,referralSettings().sessionSecret)?.actor;}
function target(req:NextRequest){const id=req.nextUrl.searchParams.get('id')||'';if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))throw new Error('촬영 일정을 확인해 주세요.');return id;}
function field(history:Event[],id:string):Field{
  const contract=project(history).contracts[id];
  const manual=projectStaff(history).manualSchedules[id];
  if((!contract||contract.status==='cancelled')&&!manual?.active)throw new Error('촬영 일정을 찾을 수 없습니다.');
  const result:Field={requests:'',memo:'',eta:'',staffArrival:'',checks:[],revision:'',photos:[],r2Ready:fieldR2Ready()};
  for(const e of history){if(e.data?.scheduleId!==id)continue;
    if(e.type==='crm_field_updated'){const d=e.data;result.requests=d.requests;result.memo=d.memo;result.eta=d.eta;result.staffArrival=d.staffArrival;result.checks=d.checks;result.revision=e.id;}
    if(e.type==='crm_field_photo_added')result.photos.push(e.data.photo);
    if(e.type==='crm_field_photo_deleted')result.photos=result.photos.filter(p=>p.id!==e.data.photoId);
  }
  return result;
}
function event(user:string,type:string,data:object):Event{const id=randomUUID();return {id,requestId:id,actor:user,at:new Date().toISOString(),reason:'본식 현장 관리',type,data};}
async function read(id:string){return referralStore().transaction(history=>({events:[],result:field(history,id)}));}
function time(v:unknown){const s=String(v||'');if(s&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw new Error('도착 시간을 확인해 주세요.');return s;}
function errorResponse(e:unknown){console.error('Field admin request failed',e instanceof Error?e.message:'unknown');return json({error:e instanceof Error?e.message:'현장 관리 요청을 처리하지 못했습니다.'},400);}
export async function GET(req:NextRequest){
  try{if(!actor(req))return json({error:'관리자 로그인이 필요합니다.'},401);
    const id=target(req);const state=await read(id);const photoId=req.nextUrl.searchParams.get('photo');
    if(!photoId)return json(state);
    const photo=state.photos.find(p=>p.id===photoId);if(!photo)return json({error:'사진을 찾을 수 없습니다.'},404);
    const response=await fieldR2('GET',photo.id);
    return new Response(response.body,{headers:{...headers,'Content-Type':photo.type,'Content-Disposition':'inline','X-Content-Type-Options':'nosniff'}});
  }catch(e){return errorResponse(e);}
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return json({error:'허용되지 않은 요청입니다.'},403);
  try{const user=actor(req);if(!user)return json({error:'관리자 로그인이 필요합니다.'},401);const id=target(req);
    if(req.headers.get('content-type')?.startsWith('multipart/form-data')){
      const initial=await read(id);if(!initial.r2Ready)throw new Error('Cloudflare R2 비공개 저장소 연결이 필요합니다.');if(initial.photos.length>=20)throw new Error('요청 사진은 최대 20장입니다.');
      if(Number(req.headers.get('content-length')||0)>3_100_000)throw new Error('사진은 3MB 이내로 업로드해 주세요.');
      const form=await req.formData();const file=form.get('photo');if(!(file instanceof File)||file.size<12||file.size>3_000_000)throw new Error('사진은 3MB 이내로 업로드해 주세요.');
      const bytes=Buffer.from(await file.arrayBuffer());
      const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
      const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
      const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
      const type=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':'';
      if(!type)throw new Error('JPG, PNG, WebP 사진만 업로드해 주세요.');
      const photo={id:randomUUID(),name:'요청 사진',type};
      await fieldR2('PUT',photo.id,bytes,type);
      try{await referralStore().transaction(history=>{const current=field(history,id);if(current.photos.length>=20)throw new Error('요청 사진은 최대 20장입니다.');return {events:[event(user,'crm_field_photo_added',{scheduleId:id,photo})],result:true};});}catch(e){try{await fieldR2('DELETE',photo.id);}catch{}throw e;}
      return json(await read(id));
    }
    const text=await req.text();if(text.length>12000)throw new Error('입력 내용이 너무 깁니다.');
    const body=JSON.parse(text);const requests=String(body.requests||'');const memo=String(body.memo||'');
    if(requests.length>2000||memo.length>2000)throw new Error('메모는 각각 2,000자 이내로 입력해 주세요.');
    if(!Array.isArray(body.checks)||body.checks.some((n:unknown)=>typeof n!=='number'||!Number.isInteger(n)||n<0||n>7))throw new Error('체크리스트를 확인해 주세요.');
    const data={scheduleId:id,requests,memo,eta:time(body.eta),staffArrival:time(body.staffArrival),checks:[...new Set<number>(body.checks)].sort((a,b)=>a-b)};
    await referralStore().transaction(history=>{const current=field(history,id);if(current.revision!==String(body.revision||''))throw new Error('다른 기기에서 내용이 수정되었습니다. 다시 불러온 후 저장해 주세요.');return {events:[event(user,'crm_field_updated',data)],result:true};});
    return json(await read(id));
  }catch(e){return errorResponse(e);}
}
export async function DELETE(req:NextRequest){
  if(!sameOrigin(req))return json({error:'허용되지 않은 요청입니다.'},403);
  try{const user=actor(req);if(!user)return json({error:'관리자 로그인이 필요합니다.'},401);const id=target(req);const photoId=req.nextUrl.searchParams.get('photo')||'';
    const current=await read(id);if(!current.photos.some(p=>p.id===photoId))return json({error:'사진을 찾을 수 없습니다.'},404);
    await fieldR2('DELETE',photoId);
    await referralStore().transaction(history=>{const current=field(history,id);return {events:current.photos.some(p=>p.id===photoId)?[event(user,'crm_field_photo_deleted',{scheduleId:id,photoId})]:[],result:true};});
    return json(await read(id));
  }catch(e){return errorResponse(e);}
}
