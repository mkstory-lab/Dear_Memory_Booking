import type { ContractFormData } from '@/types/contract';
import { calculateContractPrice } from '@/lib/pricing';
export function dataFromContractRows(rows:Record<string,string>,number:string):ContractFormData {
  const get=(key:string)=>String(rows[key]??'').trim();
  const yes=(key:string)=>{const v=get(key);if(v!=='예'&&v!=='아니오')throw new Error('원본 할인 또는 동의 항목 확인 필요: '+key);return v==='예';};
  if(get('계약번호')!==number)throw new Error('원본 계약번호 불일치');
  const product=get('선택상품');if(!['실속형','화보형'].includes(product))throw new Error('원본 상품 확인 필요');
  const optionMap:Record<string,string>={'2인 촬영':'second_shooter','폐백 촬영':'pyebaek','second_shooter':'second_shooter','pyebaek':'pyebaek'};
  const opts=get('추가옵션');const optionIds=opts==='선택 없음'||!opts?[]:opts.split(',').map(x=>{const id=optionMap[x.trim()];if(!id)throw new Error('원본 옵션 확인 필요');return id;});
  const amount=Number(get('대표 조정금액').replace(/,/g,''));if(!Number.isSafeInteger(amount))throw new Error('원본 조정 금액 확인 필요');
  const d:ContractFormData={groomName:get('신랑 성명'),groomPhone:get('신랑 연락처'),brideName:get('신부 성명'),bridePhone:get('신부 연락처'),email:get('고객 이메일'),weddingDate:get('예식일'),weddingTime:get('예식시간'),weddingVenue:get('예식장'),weddingHall:get('홀'),makeupLocation:get('메이크업 장소 및 시간'),groomFamilyMembers:get('신랑 직계가족'),brideFamilyMembers:get('신부 직계가족'),productId:product==='화보형'?'album_plus':'standard',optionIds,partnerDiscount:yes('짝꿍 할인'),partnerName:get('짝꿍 정보'),sundayDiscount:yes('일요일 예식 할인'),portfolioConsent:yes('사진 공개 동의'),reviewContractCashback:Number(get('계약 후기 페이백 (추후)'))>0,reviewMainCashback:Number(get('본식 후기 페이백 (추후)'))>0,shootRequestNotes:get('촬영 요청사항'),retouchRequestNotes:get('후보정 요청사항'),requestNotes:get('기타 요청사항 및 특약'),referralSource:get('유입경로'),instagramId:get('인스타그램'),blogUrl:get('블로그'),termsAgreed:yes('약관 동의'),manualAdjustment:amount?{amount,reason:get('조정 사유')||'기존 계약 금액 조정'}:undefined};
  if(!d.groomName||!d.brideName||!/^\d{4}-\d{2}-\d{2}$/.test(d.weddingDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.weddingTime)||!d.weddingVenue||!/^\S+@\S+\.\S+$/.test(d.email)||!d.termsAgreed)throw new Error('원본 계약의 필수 항목을 확인해 주세요.');
  if(calculateContractPrice(d).contractTotal!==Number(get('최종 계약금액').replace(/,/g,'')))throw new Error('원본 금액과 계산 결과가 다릅니다.');
  return d;
}