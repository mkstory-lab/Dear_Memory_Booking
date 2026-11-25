import { createHash, createHmac } from 'node:crypto';

function config() {
  const account=process.env.FIELD_R2_ACCOUNT_ID, bucket=process.env.FIELD_R2_BUCKET, access=process.env.FIELD_R2_ACCESS_KEY_ID, secret=process.env.FIELD_R2_SECRET_ACCESS_KEY;
  if(!account||!bucket||!access||!secret||!/^[a-f0-9]{32}$/i.test(account)||!/^[a-z0-9][a-z0-9-]{1,62}$/.test(bucket)) return null;
  return {account,bucket,access,secret};
}
export const fieldR2Ready=()=>!!config();
const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const hmac=(key:string|Buffer,v:string)=>createHmac('sha256',key).update(v).digest();
export async function fieldR2(method:'GET'|'PUT'|'DELETE', id:string, bytes?:Buffer, type?:string) {
  const c=config(); if(!c)throw new Error('Cloudflare R2 비공개 저장소 연결이 필요합니다.');
  if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('사진 정보가 올바르지 않습니다.');
  const host=c.account+'.r2.cloudflarestorage.com';
  const path='/'+c.bucket+'/wedding-field/'+id;
  const time=new Date().toISOString().replace(/[:-]|\.\d{3}/g,'');
  const day=time.slice(0,8), scope=day+'/auto/s3/aws4_request';
  const digest=hash(bytes||Buffer.alloc(0));
  const headers:Record<string,string>={'host':host,'x-amz-content-sha256':digest,'x-amz-date':time};
  if(type)headers['content-type']=type;
  const keys=Object.keys(headers).sort();
  const signed=keys.join(';');
  const canonical=[method,path,'',keys.map(k=>k+':'+headers[k]+'\n').join(''),signed,digest].join('\n');
  const stringToSign=['AWS4-HMAC-SHA256',time,scope,hash(canonical)].join('\n');
  const key=hmac(hmac(hmac(hmac('AWS4'+c.secret,day),'auto'),'s3'),'aws4_request');
  headers.authorization='AWS4-HMAC-SHA256 Credential='+c.access+'/'+scope+', SignedHeaders='+signed+', Signature='+hmac(key,stringToSign).toString('hex');
  const response=await fetch('https://'+host+path,{method,headers,body:bytes?Uint8Array.from(bytes).buffer:undefined,cache:'no-store'});
  if(!response.ok)throw new Error('사진 저장소 요청 실패 ('+response.status+')');
  return response;
}
