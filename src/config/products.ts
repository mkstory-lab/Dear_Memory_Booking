import { ProductItem } from '@/types/config';

export const PRODUCTS_CONFIG: ProductItem[] = [
  {
    id: 'standard',
    name: '실속형',
    subtitle: '알찬 구성으로 본식의 감동을 온전히 담아내는 기본 상품',
    basePrice: 1250000,
    description: '신부대기실부터 예식 본식, 원판 사진, 연회장 인사까지 하루의 핵심 순간을 꼼꼼하게 기록합니다.',
    includedItems: [
      '스냅 촬영 + 원판 촬영 포함',
      '신부대기실 ~ 본식 ~ 원판 ~ 연회장',
      '부부앨범 15x12 70p 1권',
      '정밀 세부 보정본 70장',
      '고화질 원본 2,000장 이상',
    ],
    originalCount: '2,000장 이상',
    retouchedCount: 70,
    albumSpec: '부부앨범 15x12 70p 1권',
    active: true,
    displayOrder: 1,
    badge: '실속 추천',
  },
  {
    id: 'album_plus',
    name: '화보형',
    subtitle: '양가 부모님 앨범까지 함께 구성된 디어메모리 시그니처 패키지',
    basePrice: 1450000,
    description: '더 풍부한 보정 컷과 함께 양가 부모님께 선물할 원판·스냅 합본 앨범이 기본 포함된 인기 구성입니다.',
    includedItems: [
      '실속형 전 구성 100% 기본 포함',
      '부모님 앨범 2권 추가 제공 (40p)',
      '부부앨범 80p (+10p 증면)',
      '정밀 세부 보정본 (+10장 추가)',
      '고화질 원본 (+500장 추가)',
    ],
    originalCount: '2,500장 이상',
    retouchedCount: 80,
    albumSpec: '부부앨범 15x12 80p 1권\n부모님앨범 12x8 40p 2권',
    active: true,
    displayOrder: 2,
    badge: '대표 추천 · 시그니처',
    isPlusPackage: true,
    baseIncludedNotice: '실속형의 모든 촬영 및 원본 제공 혜택 100% 기본 포함',
    plusBenefits: [
      {
        title: '양가 부모님 앨범 2권 추가 제공',
        detail: '부모님앨범 12x8 40p 2권 [원판 + 스냅 합본, 양가 부모님 선물용]',
        badge: '2권 추가 제공',
      },
      {
        title: '화보형 부부앨범 10p 증면',
        detail: '부부앨범 15x12 [기본 70p → 80p 대용량 화보 업그레이드]',
        badge: '+10p 증면',
      },
      {
        title: '웹용 고화질 원본 (+500장 추가)',
        detail: '웹용 고화질 원본 [기본 2,000장 → 2,500장 이상 전체 원본]',
        badge: '+500장 추가',
      },
      {
        title: '정밀 세부 보정본 (+10장 확대)',
        detail: '정밀 리터칭 보정본 [기본 70장 → 총 80장 확대 제공]',
        badge: '+10장 추가',
      },
    ],
  },
];

export function getProductById(id: string): ProductItem | undefined {
  return PRODUCTS_CONFIG.find((p) => p.id === id);
}
