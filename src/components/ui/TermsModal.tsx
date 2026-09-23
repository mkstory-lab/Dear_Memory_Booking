import React from 'react';
import { CONTRACT_POLICY_CONFIG } from '@/config/contractPolicy';
import { X, FileText } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFFFF] border border-[#EBE3D5] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 모달 헤더 */}
        <div className="px-6 py-5 border-b border-[#F5F1EA] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-[#8F7A56]" />
            <div>
              <h3 className="text-base font-semibold text-[#322A1B]">본식스냅 촬영 계약 약관</h3>
              <p className="text-xs text-[#8F7A56]">버전: {CONTRACT_POLICY_CONFIG.version}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8F7A56] hover:bg-[#EBE3D5] transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="px-6 py-6 overflow-y-auto space-y-6 text-sm text-[#4E412A] leading-relaxed">
          {/* 핵심 요약 배너 */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl space-y-2 text-xs text-[#6E5C3D]">
            <p className="font-semibold text-[#322A1B] text-sm mb-1">핵심 안내사항</p>
            <p>&bull; <strong>계약금:</strong> 300,000원 (신청서 제출 후 24시간 이내 입금, 72시간 이내 취소 시 전액 환불)</p>
            <p>&bull; <strong>잔금:</strong> 예식 1주일 전까지 완납 원칙</p>
            <p>&bull; <strong>제공 규격:</strong> {CONTRACT_POLICY_CONFIG.imageSpec}</p>
            <p>&bull; <strong>원본 보관:</strong> {CONTRACT_POLICY_CONFIG.backupRetention}</p>
          </div>

          {/* 12개 조항 전문 */}
          <div className="space-y-5">
            {CONTRACT_POLICY_CONFIG.sections.map((section) => (
              <div key={section.id} className="border-b border-[#F5F1EA] pb-4 last:border-none">
                <h4 className="font-semibold text-[#322A1B] mb-1.5 text-[13px]">
                  {section.title}
                </h4>
                <p className="text-xs text-[#6E5C3D] whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-[#F5F1EA] bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#322A1B] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#1E1910] transition-colors"
          >
            약관 확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
