import React from 'react';
import { Mail, Check, ArrowRight } from 'lucide-react';

interface SubmissionSuccessViewProps {
  email: string;
  reviewUrl?: string; // 데모 모드 편의용
  onReset?: () => void;
}

export const SubmissionSuccessView: React.FC<SubmissionSuccessViewProps> = ({
  email,
  reviewUrl,
  onReset,
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
          계약정보가 정상 전달되었습니다
        </h2>
        <p className="text-xs sm:text-sm text-[#6E5C3D] leading-relaxed max-w-md mx-auto pt-1">
          대표가 작성해 주신 내용을 확인한 후, 입력하신 이메일(<strong className="text-[#322A1B]">{email}</strong>)로 정식 계약서를 신속하게 발송해 드립니다.
        </p>
      </div>

      {/* 안내 박스 */}
      <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4 text-xs text-[#8F7A56] text-left space-y-2">
        <div className="flex items-start gap-2">
          <Mail className="w-4 h-4 text-[#8F7A56] mt-0.5 shrink-0" />
          <span>
            대표 승인 및 계약서 발송 시 이메일로 알림 및 PDF 파일이 함께 전달됩니다.
          </span>
        </div>
        <p className="text-[11px] text-[#A8987E] pl-6">
          * 계약금 입금 및 스케줄 최종 확정은 발송된 공식 계약서 수령 후 진행됩니다.
        </p>
      </div>

      {/* 데모 모드 전용 편의 버튼 (실제 운영 시에는 이메일로 가므로 불필요하지만 데모 시 테스트용) */}
      {reviewUrl && (
        <div className="pt-4 border-t border-[#F5F1EA] space-y-3">
          <p className="text-[11px] text-[#B09A74] font-medium">
            [데모 테스트 안내] 대표 이메일로 전송된 승인 링크입니다:
          </p>
          <a
            href={reviewUrl}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#FAF8F5] border border-[#DDD1BD] rounded-xl text-xs font-semibold text-[#322A1B] hover:bg-[#F5F1EA] transition-colors"
          >
            <span>대표 확인 페이지 바로가기 (테스트)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {onReset && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#8F7A56] hover:text-[#322A1B] underline transition-colors"
          >
            새로운 계약정보 작성하기
          </button>
        </div>
      )}
    </div>
  );
};
