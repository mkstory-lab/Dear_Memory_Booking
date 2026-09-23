import { OptionItem } from '@/types/config';

export const OPTIONS_CONFIG: OptionItem[] = [
  {
    id: 'second_shooter',
    name: '2인 촬영 (서브 작가 추가)',
    price: 250000,
    description: '메인 작가와 함께 다른 앵글(신랑측 로비, 신부대기실 동시 커버, 하객 표정)을 더욱 풍성하게 기록합니다.',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'pyebaek',
    name: '폐백 촬영',
    price: 100000,
    description: '연회장 인사 이후 진행되는 전통 폐백 예절 및 가족 기념사진을 정성껏 담아드립니다.',
    active: true,
    displayOrder: 2,
  },
];

export function getOptionById(id: string): OptionItem | undefined {
  return OPTIONS_CONFIG.find((o) => o.id === id);
}
