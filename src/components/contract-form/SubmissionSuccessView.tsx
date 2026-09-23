import React from 'react';
import { Mail, Check, Home } from 'lucide-react';

interface SubmissionSuccessViewProps {
  email: string;
  onHome?: () => void;
}

export const SubmissionSuccessView: React.FC<SubmissionSuccessViewProps> = ({
  email,
  onHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#EBE3D5] rounded-3xl p-7 sm:p-10 text-center shadow-sm max-w-lg mx-auto space-y-6 animate-fade-in my-8">
      {/* 체크 아이콘 */}
      <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#DDD1BD] flex items-center justify-center mx-auto text-[#8F7A56]">
        <Check className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest text-[#8F7A56] uppercase">
          DEAR MEMORY
        </p>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#322A1B]">
          계약 신청이 정상 접수되었습니다
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C3D] leading-relaxed max-w-md mx-auto pt-1">
          대표가 작성해 주신 내용을 확인한 후, 입력하신 이메일(<strong className="text-[#322A1B]">{email}</strong>)로 공식 계약서를 신속하게 발송해 드립니다.
        </p>
      </div>

      {/* 안내 박스 */}
      <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4 text-xs text-[#8F7A56] text-left space-y-2">
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-[#8F7A56] mt-0.5 shrink-0" />
          <span>
            대표 승인 및 계약서 발송 시 이메일로 알림 및 PDF 계약서가 함께 전달됩니다.
          </span>
        </div>
        <p className="text-[11px] text-[#A8987E] pl-6">
          * 계약금 입금 및 예식 스케줄 최종 확정은 발송된 공식 계약서 수령 후 진행됩니다.
        </p>
      </div>

      {/* 공식 홈으로 돌아가기 버튼 */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#322A1B] text-[#FAF8F5] rounded-xl text-xs font-semibold hover:bg-[#1E1910] transition-colors shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>홈으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
