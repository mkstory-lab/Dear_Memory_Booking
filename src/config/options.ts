import { OptionItem } from '@/types/config';

export const OPTIONS_CONFIG: OptionItem[] = [
  {
    id: 'second_shooter',
    name: '2인 촬영',
    subtitle: '서브 작가 추가',
    price: 250000,
    description: '메인 작가와 함께 다양한 앵글을 더욱 풍성하게 기록\n(신랑측 로비 · 신부대기실 동시 커버 및 하객 표정)',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'pyebaek',
    name: '폐백 촬영',
    subtitle: '전통 폐백 진행 시',
    price: 100000,
    description: '연회장 인사 이후 전통 폐백 예절 및 절차\n(가족 친지분들과의 소중한 기념사진 정성 촬영)',
    active: true,
    displayOrder: 2,
  },
];

export function getOptionById(id: string): OptionItem | undefined {
  return OPTIONS_CONFIG.find((o) => o.id === id);
}
