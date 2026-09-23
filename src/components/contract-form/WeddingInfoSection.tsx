import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { checkIsSunday } from '@/lib/pricing';
import { CalendarModal } from '@/components/common/CalendarModal';

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
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const isSunday = checkIsSunday(weddingDate);

  // 날짜 한글 포맷 변환 (예: 2026년 10월 25일 (일요일))
  const formatKoreanDate = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[dateObj.getDay()];
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일 (${dayName}요일)`;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#8F7A56]" />
          <span>1. 예식 정보</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1">
          예식이 진행되는 소중한 날짜와 시간, 장소를 입력해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* 예식일 (터치/클릭 시 전용 달력 팝업 오픈) */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
            예식일 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.weddingDate
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-[#DDD1BD] hover:border-[#322A1B] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-left flex items-center justify-between transition-all font-medium group cursor-pointer shadow-sm`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Calendar className="w-5 h-5 text-[#8F7A56] group-hover:text-[#322A1B] transition-colors shrink-0" />
                {weddingDate ? (
                  <span className="text-[#322A1B] font-bold">
                    {formatKoreanDate(weddingDate)}
                  </span>
                ) : (
                  <span className="text-[#8F7A56]/70">
                    날짜를 눌러 달력에서 선택해 주세요
                  </span>
                )}
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD1BD] rounded-lg text-[#6E5C3D] group-hover:bg-[#322A1B] group-hover:text-[#FAF8F5] transition-all font-semibold shrink-0">
                {weddingDate ? '변경' : '달력 선택'}
              </span>
            </button>
          </div>
          {errors.weddingDate && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.weddingDate}</p>
          )}

          {/* 달력 모달 컴포넌트 */}
          <CalendarModal
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            selectedDate={weddingDate}
            onSelectDate={(date) => onChange({ weddingDate: date })}
          />

          {/* 일요일 할인 자동 감지 배너 */}
          {weddingDate && isSunday && (
            <div className="mt-2.5 p-3 bg-[#FAF8F5] border border-[#B09A74]/50 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-[#6E5C3D] animate-fade-in shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B09A74] inline-block animate-pulse shrink-0" />
              <span>
                <strong>일요일 예식</strong> 확인 — <span className="text-[#322A1B] font-bold">100,000원 즉시 할인</span>이 자동 적용됩니다.
              </span>
            </div>
          )}
        </div>

        {/* 예식시간 (자유 텍스트 입력창) */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
            예식 시간 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="예: 13:00, 13시 30분, 오후 2시"
              value={weddingTime}
              onChange={(e) => onChange({ weddingTime: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.weddingTime ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
          </div>
          {errors.weddingTime && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.weddingTime}</p>
          )}
        </div>

        {/* 웨딩홀 명 */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
            웨딩홀 명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 더채플앳청담, 엘타워, 빌라드지디"
            value={weddingVenue}
            onChange={(e) => onChange({ weddingVenue: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.weddingVenue ? 'border-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
            } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
          />
          {errors.weddingVenue && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.weddingVenue}</p>
          )}
        </div>

        {/* 홀명 / 층수 */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
            홀 명칭 / 층수 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 6층 커스티홀, 그랜드볼룸"
            value={weddingHall}
            onChange={(e) => onChange({ weddingHall: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.weddingHall ? 'border-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
            } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
          />
          {errors.weddingHall && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.weddingHall}</p>
          )}
        </div>

        {/* 메이크업 장소 / in, out 시간 (필수, 미정이면 미정 입력) */}
        <div className="sm:col-span-2">
          <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
            메이크업 장소 / in, out 시간 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 정샘물 웨스트 / in 07:00, out 10:00 (미정이면 '미정' 입력)"
            value={makeupLocation}
            onChange={(e) => onChange({ makeupLocation: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.makeupLocation ? 'border-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
            } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
          />
          <p className="text-xs sm:text-sm text-[#8F7A56] mt-2">
            * 아직 메이크업 샵이나 시간이 정해지지 않으셨다면 <strong>'미정'</strong>으로 편하게 적어주세요.
          </p>
          {errors.makeupLocation && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.makeupLocation}</p>
          )}
        </div>
      </div>
    </div>
  );
};
