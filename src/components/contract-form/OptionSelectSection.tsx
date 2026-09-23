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
        <p className="text-xs text-[#8F7A56] mt-1">
          사전 상담 시 요청하신 추가 촬영 옵션이 있다면 선택해 주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {OPTIONS_CONFIG.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => onToggleOption(option.id)}
              className={`cursor-pointer rounded-2xl p-5 sm:p-6 transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'border-2 border-[#322A1B] bg-[#FFFFFF] shadow-sm ring-2 ring-[#322A1B]/10'
                  : 'border border-[#EBE3D5] bg-[#FFFFFF] hover:border-[#8F7A56]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base sm:text-lg font-bold text-[#322A1B]">
                    {option.name}
                  </h4>
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                        : 'border-[#DDD1BD] bg-[#FFFFFF]'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
                <div className="text-center text-xs sm:text-sm text-[#6E5C3D] leading-relaxed mb-4 min-h-[44px] flex flex-col justify-center space-y-0.5 py-1">
                  {option.description.split('\n').map((line, idx) => (
                    <p key={idx} className={idx === 1 ? "text-xs text-[#8F7A56] font-medium" : "text-[#322A1B] font-semibold"}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

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
