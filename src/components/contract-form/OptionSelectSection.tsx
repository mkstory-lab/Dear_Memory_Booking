import React from 'react';
import { OPTIONS_CONFIG } from '@/config/options';
import { formatKRW } from '@/lib/pricing';
import { PlusCircle, Check } from 'lucide-react';

interface OptionSelectSectionProps {
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
}

export const OptionSelectSection: React.FC<OptionSelectSectionProps> = ({
  selectedOptionIds,
  onToggleOption,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#8F7A56]" />
          <span>4. 추가 옵션</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1 break-keep leading-relaxed">
          사전 상담 시 요청하신 추가 촬영 옵션이 있다면 <span className="whitespace-nowrap">선택해 주세요.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {OPTIONS_CONFIG.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => onToggleOption(option.id)}
              className={`cursor-pointer rounded-2xl p-5 sm:p-6 transition-all border-2 flex flex-col justify-between select-none ${
                isSelected
                  ? 'border-[#322A1B] bg-[#FFFFFF] shadow-md ring-2 ring-[#322A1B]/10'
                  : 'border-[#EBE3D5] bg-[#FFFFFF] hover:border-[#8F7A56] shadow-sm'
              }`}
            >
              <div>
                {/* 상단 옵션명, 부제 및 체크박스 */}
                <div className="flex items-start justify-between mb-3 min-h-[44px]">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-[#322A1B] leading-tight">
                      {option.name}
                    </h4>
                    {option.subtitle && (
                      <p className="text-xs sm:text-sm font-semibold text-[#8F7A56] mt-1">
                        {option.subtitle}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                        : 'border-[#DDD1BD] bg-[#FFFFFF]'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>

                {/* 옵션 설명 박스 (일정한 높이와 여백으로 클릭 시 글자 흔들림 방지) */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE3D5] text-center my-3 min-h-[58px] flex flex-col justify-center space-y-1">
                  {option.description.split('\n').map((line, idx) => (
                    <p
                      key={idx}
                      className={`break-keep leading-tight ${
                        idx === 0
                          ? 'text-xs sm:text-sm font-semibold text-[#322A1B]'
                          : 'text-[11px] sm:text-xs font-medium text-[#8F7A56]'
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* 하단 가격 */}
              <div className="text-lg sm:text-xl font-bold text-[#322A1B] pt-3 border-t border-[#F5F1EA] tabular-nums">
                +{formatKRW(option.price)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
