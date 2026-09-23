import React from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = '본식스냅 계약정보 작성',
  subtitle = '상담이 완료된 고객님께 전달드리는 페이지입니다.',
}) => {
  return (
    <header className="border-b border-[#EBE3D5] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-center text-center">
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-[#8F7A56] uppercase mb-1 font-sans">
          WEDDING PHOTOGRAPHY
        </p>
        <h1 className="text-2xl sm:text-3xl font-serif tracking-[0.2em] text-[#322A1B] font-bold">
          DEAR MEMORY
        </h1>
        {title && (
          <div className="mt-2 text-center">
            <h2 className="text-sm sm:text-base font-semibold text-[#322A1B] tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs text-[#8F7A56] mt-0.5 max-w-sm break-keep leading-relaxed">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
