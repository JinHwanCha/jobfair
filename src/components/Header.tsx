'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, Lang } from '@/lib/i18n';

const LANG_LABELS: { value: Lang; label: string }[] = [
  { value: 'ko', label: 'KO' },
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中' },
];

export default function Header() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/mentors', label: t('nav.mentors') },
    { href: '/apply', label: t('nav.apply') },
    { href: '/my', label: t('nav.my') },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JF</span>
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">{t('nav.logo')}</span>
          </Link>

          {/* 네비게이션 + 언어 */}
          <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto">
            <nav className="flex items-center gap-0.5 sm:gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-warm-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 언어 선택 */}
            <div className="flex items-center border-l border-gray-200 ml-0.5 pl-0.5 sm:ml-2 sm:pl-2 shrink-0">
              {LANG_LABELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                    lang === l.value
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
