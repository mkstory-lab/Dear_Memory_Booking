import { ProductItem } from '@/types/config';

export const PRODUCTS_CONFIG: ProductItem[] = [
  {
    id: 'standard',
    name: '실속형',
    subtitle: '앨범 1권 상품',
    basePrice: 1250000,
    description: '신부대기실부터 본식, 원판, 연회장까지 하루의 소중한 순간을 부부 앨범 1권에 알차게 담아내는 기본 상품',
    includedItems: [
      '스냅 촬영 + 원판 촬영 포함',
      '신부대기실 ~ 본식 ~ 원판 ~ 연회장',
      '부부앨범 15x12 70p 1권',
      '정밀 세부 보정본 70장',
      '고화질 원본 2,000장 이상',
    ],
    originalCount: '2,000장 이상',
    retouchedCount: 70,
    albumSpec: '부부앨범 15x12 70p 1권 (양가 부모님 앨범 미포함)',
    active: true,
    displayOrder: 1,
    badge: '기본 상품',
  },
  {
    id: 'album_plus',
    name: '화보형',
    subtitle: '앨범 3권 상품',
    basePrice: 1450000,
    description: '실속형 전 구성에 양가 부모님께 선물할 원판·스냅 합본 앨범 2권이 기본 포함된 인기 상품',
    includedItems: [
      '스냅 촬영 + 원판 촬영 포함',
      '신부대기실 ~ 본식 ~ 원판 ~ 연회장',
      '부부앨범 15x12 70p 1권',
      '부모님 앨범 12x8 40p 2권 제공',
      '정밀 세부 보정본 70장 / 원본 2,000장 이상',
    ],
    originalCount: '2,000장 이상',
    retouchedCount: 70,
    albumSpec: '부부앨범 15x12 70p 1권\n부모님앨범 12x8 40p 2권 [원판·스냅 합본]',
    active: true,
    displayOrder: 2,
    badge: '대표 추천',
    isPlusPackage: true,
    baseIncludedNotice: '실속형 전 촬영 구성 100% 기본 포함',
    plusBenefits: [
      {
        title: '부모님 앨범 12x8 40p 2권 제공',
        detail: '부모님 앨범 12x8 40p 2권 [원판·스냅 합본, 양가 부모님 선물용]',
        badge: '2권 추가',
      },
    ],
  },
];

export function getProductById(id: string): ProductItem | undefined {
  return PRODUCTS_CONFIG.find((p) => p.id === id);
}
