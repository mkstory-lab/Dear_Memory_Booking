import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DEAR MEMORY | 본식스냅 계약정보 작성',
  description: 'Dear Memory for Booking — 본식스냅 계약정보 작성 및 자동 발송 시스템',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-screen bg-[#FAF8F5] text-[#322A1B] flex flex-col font-sans selection:bg-[#EBE3D5]">
        {children}
      </body>
    </html>
  );
}
