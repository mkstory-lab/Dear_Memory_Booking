import React, { useState } from 'react';
import { MessageSquare, ExternalLink, Check, Compass, Share2 } from 'lucide-react';

interface RequestNotesSectionProps {
  shootRequestNotes?: string;
  retouchRequestNotes?: string;
  requestNotes: string;
  referralSource?: string;
  instagramId?: string;
  blogUrl?: string;
  termsAgreed: boolean;
  onOpenTermsModal: () => void;
  onChange: (fields: Partial<{
    shootRequestNotes: string;
    retouchRequestNotes: string;
    requestNotes: string;
    referralSource: string;
    instagramId: string;
    blogUrl: string;
    termsAgreed: boolean;
  }>) => void;
  errors?: Record<string, string>;
}

const REFERRAL_BASE_OPTIONS = [
  '블로그 후기',
  '카페 후기',
  '인스타그램',
  '지인소개',
  '기타 경로',
];

export const RequestNotesSection: React.FC<RequestNotesSectionProps> = ({
  shootRequestNotes = '',
  retouchRequestNotes = '',
  requestNotes = '',
  referralSource = '',
  instagramId = '',
  blogUrl = '',
  termsAgreed,
  onOpenTermsModal,
  onChange,
  errors = {},
}) => {
  // 기타 경로 직접 입력 여부 및 텍스트 상태
  const isCustomReferral =
    referralSource === '기타 경로' ||
    (referralSource.startsWith('기타: ') && !REFERRAL_BASE_OPTIONS.slice(0, 4).includes(referralSource));
  
  const [customText, setCustomText] = useState(
    referralSource.startsWith('기타: ') ? referralSource.replace('기타: ', '') : ''
  );

  const handleSelectOption = (opt: string) => {
    if (opt === '기타 경로') {
      onChange({ referralSource: customText.trim() ? `기타: ${customText.trim()}` : '기타 경로' });
    } else {
      onChange({ referralSource: opt });
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomText(val);
    onChange({ referralSource: val.trim() ? `기타: ${val.trim()}` : '기타 경로' });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#8F7A56]" />
          <span>6. 상세 요청사항 및 안내</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1">
          만족스러운 결과물을 위해 촬영 및 보정 스타일, 전달 사항을 작성해 주세요.
        </p>
      </div>

      {/* 1. 촬영 시 요청사항 */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
          본식스냅 촬영 시 요청사항 (자세히) <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="예시) 신랑신부 위주로 담아주세요 / 양가 부모님 사진도 자연스럽게 많이 담아주세요 / 어두운 홀 분위기를 살려주세요 등"
          value={shootRequestNotes}
          onChange={(e) => onChange({ shootRequestNotes: e.target.value })}
          className={`w-full p-4 bg-[#FFFFFF] border ${
            errors.shootRequestNotes ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
          } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 leading-relaxed font-medium resize-none`}
        />
        {errors.shootRequestNotes && (
          <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.shootRequestNotes}</p>
        )}
      </div>

      {/* 2. 후보정 시 요청사항 */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
          후보정 시 요청사항 (자세히) <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="예시) 피부톤을 화사하고 깨끗하게 정돈해 주세요 / 턱선 및 승모근 라인을 자연스럽게 보정해 주세요 등"
          value={retouchRequestNotes}
          onChange={(e) => onChange({ retouchRequestNotes: e.target.value })}
          className={`w-full p-4 bg-[#FFFFFF] border ${
            errors.retouchRequestNotes ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
          } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 leading-relaxed font-medium resize-none`}
        />
        {errors.retouchRequestNotes && (
          <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.retouchRequestNotes}</p>
        )}
      </div>

      {/* 3. 기타 요청사항 */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
          기타 요청사항 <span className="text-[#8F7A56] font-normal text-xs">(선택)</span>
        </label>
        <textarea
          rows={2}
          placeholder="식순 특이사항(축가, 깜짝 이벤트, 행진 순서 등)이나 대표 작가님께 미리 전달하고 싶은 메모가 있다면 자유롭게 적어주세요."
          value={requestNotes}
          onChange={(e) => onChange({ requestNotes: e.target.value })}
          className="w-full p-4 bg-[#FFFFFF] border border-[#DDD1BD] rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 focus:border-[#322A1B] transition-all placeholder:text-[#8F7A56]/70 leading-relaxed font-medium resize-none"
        />
      </div>

      {/* 4. 알게 된 경로 (기타 선택 시 입력칸 활성화) */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-3.5 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 font-semibold text-[#322A1B]">
          <Compass className="w-4 h-4 text-[#8F7A56]" />
          <span>알게 된 경로 <span className="text-red-500">*</span></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {REFERRAL_BASE_OPTIONS.map((opt) => {
            const isSelected = opt === '기타 경로' ? isCustomReferral : referralSource === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all text-xs sm:text-sm ${
                  isSelected
                    ? 'bg-[#322A1B] text-[#FAF8F5] border-[#322A1B] font-bold shadow-sm'
                    : 'bg-white text-[#6E5C3D] border-[#DDD1BD] hover:border-[#8F7A56] font-medium'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* 기타 경로 선택 시 빈칸 입력 활성화 */}
        {isCustomReferral && (
          <div className="pt-2 animate-fade-in space-y-1.5">
            <label className="block text-xs font-semibold text-[#6E5C3D]">
              어떤 경로로 알게 되셨나요? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 웨딩북, 플래너 추천, 유튜브 등"
              value={customText}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full h-11 px-3.5 bg-white border border-[#DDD1BD] focus:border-[#322A1B] rounded-xl text-sm text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium"
            />
          </div>
        )}

        {errors.referralSource && (
          <p className="text-xs text-red-500 mt-1 font-medium">{errors.referralSource}</p>
        )}
      </div>

      {/* 5. SNS 계정 (후기 페이백 등 확인용) */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-3.5 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-[#322A1B]">
            <Share2 className="w-4 h-4 text-[#8F7A56]" />
            <span>SNS 계정 <span className="text-[#8F7A56] font-normal text-xs">(후기 할인 및 페이백 확인용)</span></span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#6E5C3D] mb-1.5">인스타그램 아이디</label>
            <input
              type="text"
              placeholder="@instagram_id"
              value={instagramId}
              onChange={(e) => onChange({ instagramId: e.target.value })}
              className="w-full h-11 px-3.5 bg-white border border-[#DDD1BD] rounded-xl text-sm text-[#322A1B] focus:outline-none focus:border-[#322A1B] placeholder:text-[#8F7A56]/70 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5C3D] mb-1.5">블로그 주소</label>
            <input
              type="text"
              placeholder="blog.naver.com/id"
              value={blogUrl}
              onChange={(e) => onChange({ blogUrl: e.target.value })}
              className="w-full h-11 px-3.5 bg-white border border-[#DDD1BD] rounded-xl text-sm text-[#322A1B] focus:outline-none focus:border-[#322A1B] placeholder:text-[#8F7A56]/70 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 약관 동의 확인 뱃지 카드 */}
      <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-[#322A1B] text-[#FAF8F5] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <span className="font-semibold text-[#322A1B] block">계약 약관 및 개인정보 수집·이용 동의 완료</span>
            <span className="text-xs text-[#8F7A56]">작성 시작 전 필수 약관(제1조~제13조)에 사전 동의하셨습니다.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTermsModal}
          className="text-[#8F7A56] hover:text-[#322A1B] font-medium flex items-center gap-1 underline underline-offset-4 transition-colors ml-2 shrink-0 text-xs"
        >
          <span>약관 다시보기</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
