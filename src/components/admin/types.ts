export const CUSTOMER_STAGES = [
  '계약', '사전안내', '촬영', '촬영완료', '사진 셀렉', '보정', '수정요청', '앨범제작', '출고완료',
] as const;

export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

export type AdminContract = {
  id: string; number: string; groom: string; bride: string; groomPhone: string; bridePhone: string;
  email: string; weddingDate: string; weddingTime: string; weddingVenue: string; weddingHall: string;
  productId: string; optionIds: string[]; total: number; deposit: number; paid: number; balance: number;
  depositConfirmedAt?: string; balanceConfirmedAt?: string; sentAt?: string; createdAt: string; updatedAt: string;
  status: 'active' | 'completed' | 'cancelled'; stage: CustomerStage; memo: string; reviewUrl?: string;
  driveFolderUrl?: string; excelFileUrl?: string; calendarEventId?: string; calendarSaved: boolean;
  referralCode?: string; buddyCode?: string; benefitGranted: number; benefitPaid: number; benefitOutstanding: number;
};

export type AdminBuddyUsage = {
  id: string; code: string; ownerName: string; referredBrideName: string; referredWeddingDate: string;
  status: string; createdAt: string;
};

export type AdminCrmSnapshot = { contracts: AdminContract[]; buddyUsages: AdminBuddyUsage[]; staffAssignments: Record<string, string[]>; generatedAt: string };

export const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
export const productName = (id: string) => id === 'album_plus' ? '화보형' : id === 'standard' ? '실속형' : '확인 필요';
export const seoulToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

