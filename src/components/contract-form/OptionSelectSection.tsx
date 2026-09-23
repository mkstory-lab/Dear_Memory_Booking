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
              className={`cursor-pointer rounded-2xl p-5 transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'border-[#322A1B] bg-[#FFFFFF] shadow-sm ring-1 ring-[#322A1B]/15'
                  : 'border-[#EBE3D5] bg-[#FFFFFF]/70 hover:border-[#C7B698] hover:bg-[#FFFFFF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm sm:text-base font-semibold text-[#322A1B]">
                    {option.name}
                  </h4>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-[#322A1B] border-[#322A1B] text-[#FAF8F5]'
                        : 'border-[#DDD1BD] bg-[#FFFFFF]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-[#8F7A56] leading-relaxed mb-4 min-h-[40px] flex items-center break-keep">
                  {option.description}
                </p>
              </div>

              <div className="text-base font-bold text-[#322A1B] pt-3 border-t border-[#F5F1EA] tabular-nums">
                +{formatKRW(option.price)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
