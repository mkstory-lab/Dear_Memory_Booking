import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

interface CustomerInfoSectionProps {
  groomName: string;
  groomPhone: string;
  groomFamilyMembers?: string;
  brideName: string;
  bridePhone: string;
  brideFamilyMembers?: string;
  email: string;
  onChange: (fields: Partial<{
    groomName: string;
    groomPhone: string;
    groomFamilyMembers: string;
    brideName: string;
    bridePhone: string;
    brideFamilyMembers: string;
    email: string;
  }>) => void;
  errors?: Record<string, string>;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  groomName,
  groomPhone,
  groomFamilyMembers = '',
  brideName,
  bridePhone,
  brideFamilyMembers = '',
  email,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#F5F1EA] pb-3">
        <h3 className="text-base sm:text-lg font-semibold text-[#322A1B] flex items-center gap-2">
          <User className="w-5 h-5 text-[#8F7A56]" />
          <span>2. 고객 정보</span>
        </h3>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-1">
          신랑님과 신부님의 연락처 및 계약서를 받으실 이메일을 입력해 주세요.
        </p>
      </div>

      {/* 신랑 정보 */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-4">
        <span className="text-xs sm:text-sm font-bold text-[#8F7A56] tracking-wider uppercase flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#8F7A56]" />
          <span>신랑님 정보</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신랑 성명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 김민우"
              value={groomName}
              onChange={(e) => onChange({ groomName: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.groomName ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            {errors.groomName && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.groomName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신랑 연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={groomPhone}
              onChange={(e) => onChange({ groomPhone: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.groomPhone ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            {errors.groomPhone && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.groomPhone}</p>
            )}
          </div>

          {/* 신랑님 직계 가족구성 */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신랑님 직계 가족 구성원 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예시) 부모님, 형, 남동생"
              value={groomFamilyMembers}
              onChange={(e) => onChange({ groomFamilyMembers: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.groomFamilyMembers ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            <p className="text-xs sm:text-sm text-[#8F7A56] mt-2">
              * 본식 당일 원판(가족사진) 촬영 동선을 위해 정확히 기재해 주세요.
            </p>
            {errors.groomFamilyMembers && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.groomFamilyMembers}</p>
            )}
          </div>
        </div>
      </div>

      {/* 신부 정보 */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl space-y-4">
        <span className="text-xs sm:text-sm font-bold text-[#8F7A56] tracking-wider uppercase flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#8F7A56]" />
          <span>신부님 정보</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신부 성명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 이서연"
              value={brideName}
              onChange={(e) => onChange({ brideName: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.brideName ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            {errors.brideName && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.brideName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신부 연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={bridePhone}
              onChange={(e) => onChange({ bridePhone: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.bridePhone ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            {errors.bridePhone && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.bridePhone}</p>
            )}
          </div>

          {/* 신부님 직계 가족구성 */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
              신부님 직계 가족 구성원 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예시) 부모님, 언니, 여동생"
              value={brideFamilyMembers}
              onChange={(e) => onChange({ brideFamilyMembers: e.target.value })}
              className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
                errors.brideFamilyMembers ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
              } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
            />
            <p className="text-xs sm:text-sm text-[#8F7A56] mt-2">
              * 본식 당일 원판(가족사진) 촬영 동선을 위해 정확히 기재해 주세요.
            </p>
            {errors.brideFamilyMembers && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.brideFamilyMembers}</p>
            )}
          </div>
        </div>
      </div>

      {/* 수신 이메일 */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-[#322A1B] mb-2">
          계약서 수신 이메일 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="example@naver.com"
            value={email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={`w-full h-12 px-3.5 bg-[#FFFFFF] border ${
              errors.email ? 'border-red-400 focus:ring-red-400' : 'border-[#DDD1BD] focus:border-[#322A1B]'
            } rounded-xl text-sm sm:text-base text-[#322A1B] focus:outline-none focus:ring-2 focus:ring-[#322A1B]/10 transition-all placeholder:text-[#8F7A56]/70 font-medium`}
          />
        </div>
        <p className="text-xs sm:text-sm text-[#8F7A56] mt-2">
          * 작성하신 이메일로 최종 전자 계약서(PDF)가 발송됩니다.
        </p>
        {errors.email && (
          <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.email}</p>
        )}
      </div>
    </div>
  );
};
