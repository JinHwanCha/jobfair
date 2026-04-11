'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n, Lang } from '@/lib/i18n';

const LANG_LABELS: { value: Lang; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

export default function Header() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/mentors', label: t('nav.mentors') },
    { href: '/apply', label: t('nav.apply') },
    { href: '/resume/apply', label: t('nav.resume') },
    { href: '/my', label: t('nav.my') },
  ];

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      {/* 헤더 바 - 오버레이 위에 표시 */}
      <div className="relative z-10 bg-white max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">JF</span>
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">{t('nav.logo')}</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden sm:flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === item.href
                      ? 'bg-primary-200 text-gray-900'
                      : 'text-gray-600 hover:bg-warm-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 언어 선택 */}
            <div className="flex items-center border-l border-gray-200 ml-2 pl-2 shrink-0">
              {LANG_LABELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    lang === l.value
                      ? 'bg-primary-400 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="메뉴"
          >
            <div className="w-5 h-4 relative flex flex-col justify-between">
              <span className={`block w-full h-0.5 bg-gray-600 transition-all duration-200 origin-center ${open ? 'absolute top-1/2 -translate-y-1/2 rotate-45' : ''}`} />
              <span className={`block w-full h-0.5 bg-gray-600 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block w-full h-0.5 bg-gray-600 transition-all duration-200 origin-center ${open ? 'absolute top-1/2 -translate-y-1/2 -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {open && (
        <div className="sm:hidden fixed inset-0 bg-black/20 z-0" onClick={() => setOpen(false)} />
      )}
      <div
        className={`sm:hidden absolute left-0 right-0 top-full bg-white shadow-lg z-10 overflow-hidden transition-all duration-200 ease-in-out ${
          open ? 'max-h-80 border-t border-gray-100' : 'max-h-0'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-primary-200 text-gray-900'
                  : 'text-gray-600 hover:bg-warm-50'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* 모바일 언어 선택 */}
          <div className="flex items-center gap-1 px-4 pt-2 border-t border-gray-100 mt-2">
            {LANG_LABELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLang(l.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  lang === l.value
                    ? 'bg-primary-400 text-gray-900'
                    : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
