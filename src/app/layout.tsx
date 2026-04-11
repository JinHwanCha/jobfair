import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: '2026 직업박람회 | 내수동교회',
  description: '5월 9일 내수동교회에서 진행하는 직업박람회에 참여하세요! 다양한 분야의 멘토를 만나보세요.',
  keywords: '직업박람회, 멘토링, 진로상담, 내수동교회',
  openGraph: {
    title: '2026 직업박람회 | 내수동교회',
    description: '5월 9일 내수동교회에서 진행하는 직업박람회',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '2026 직업박람회 - What am I Called for?',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
