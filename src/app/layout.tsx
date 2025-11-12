import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Firebase Analytics Dashboard',
  description: 'Firebase Analytics 자동 리포트 및 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

