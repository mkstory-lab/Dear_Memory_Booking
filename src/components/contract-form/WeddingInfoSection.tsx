import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { checkIsSunday } from '@/lib/pricing';

interface WeddingInfoSectionProps {
  weddingDate: string;
  weddingTime: string;
  weddingVenue: string;
  weddingHall: string;
  makeupLocation?: string;
  onChange: (fields: Partial<{
    weddingDate: string;
    weddingTime: string;
    weddingVenue: string;
    weddingHall: string;
    makeupLocation: string;
  }>) => void;
  errors?: Record<string, string>;
}

export const WeddingInfoSection: React.FC<WeddingInfoSectionProps> = ({
  weddingDate,
  weddingTime,
  weddingVenue,
  weddingHall,
  makeupLocation = '',
  onChange,
  errors = {},
}) => {
  const isSunday = checkIsSunday(weddingDate);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#8F7A56]" />
          <span>1. 예식 정보</span>
        </h3>
        <p className="text-xs text-[#8F7A56] mt-1">
          예식이 진행되는 소중한 날짜와 시간, 장소를 입력해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* 예식일 */}
        <div>
          <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
            예식일 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={weddingDate}
              onChange={(e) => onChange({ weddingDate: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.weddingDate ? 'border-red-400 focus:ring-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
              } rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all`}
            />
          </div>
          {errors.weddingDate && (
            <p className="text-[11px] text-red-500 mt-1">{errors.weddingDate}</p>
          )}

          {/* 일요일 할인 자동 감지 배너 */}
          {weddingDate && isSunday && (
            <div className="mt-2 p-2.5 bg-[#F5F1EA] border border-[#DDD1BD] rounded-lg flex items-center gap-2 text-xs text-[#6E5C3D] animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[#B09A74] inline-block animate-pulse" />
              <span>
                <strong>일요일 예식</strong> 확인 — <span className="text-[#322A1B] font-semibold">100,000원 즉시 할인</span>이 자동 적용됩니다.
              </span>
            </div>
          )}
        </div>

        {/* 예식시간 */}
        <div>
          <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
            예식 시간 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="time"
              value={weddingTime}
              onChange={(e) => onChange({ weddingTime: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.weddingTime ? 'border-red-400 focus:ring-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
              } rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all`}
            />
          </div>
          {errors.weddingTime && (
            <p className="text-[11px] text-red-500 mt-1">{errors.weddingTime}</p>
          )}
        </div>

        {/* 웨딩홀 */}
        <div>
          <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
            웨딩홀 명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 더채플앳청담, 엘타워"
            value={weddingVenue}
            onChange={(e) => onChange({ weddingVenue: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.weddingVenue ? 'border-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
            } rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all placeholder:text-[#C7B698]`}
          />
          {errors.weddingVenue && (
            <p className="text-[11px] text-red-500 mt-1">{errors.weddingVenue}</p>
          )}
        </div>

        {/* 홀명 */}
        <div>
          <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
            홀 명칭 / 층수 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 6층 커스티홀, 그랜드볼룸"
            value={weddingHall}
            onChange={(e) => onChange({ weddingHall: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.weddingHall ? 'border-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
            } rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all placeholder:text-[#C7B698]`}
          />
          {errors.weddingHall && (
            <p className="text-[11px] text-red-500 mt-1">{errors.weddingHall}</p>
          )}
        </div>

        {/* 메이크업 장소 / in, out 시간 (필수, 미정이면 미정 입력) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#6E5C3D] mb-1.5">
            메이크업 장소 / in, out 시간 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 정샘물 웨스트 / in 07:00, out 10:00 (미정이면 '미정' 입력)"
            value={makeupLocation}
            onChange={(e) => onChange({ makeupLocation: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.makeupLocation ? 'border-red-400' : 'border-[#EBE3D5] focus:border-[#322A1B]'
            } rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-1 focus:ring-[#322A1B] transition-all placeholder:text-[#C7B698]`}
          />
          <p className="text-[11px] text-[#8F7A56] mt-1">
            * 아직 메이크업 샵이나 시간이 정해지지 않으셨다면 <strong>'미정'</strong>으로 적어주세요.
          </p>
          {errors.makeupLocation && (
            <p className="text-[11px] text-red-500 mt-1">{errors.makeupLocation}</p>
          )}
        </div>
      </div>
    </div>
  );
};
