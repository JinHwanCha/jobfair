'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import MentorPreview from '@/components/MentorPreview';
import CountdownTimer, { useIsOpen } from '@/components/CountdownTimer';
import { Mentor } from '@/types';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();
  const isOpen = useIsOpen();
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    fetch('/api/mentors')
      .then(res => res.json())
      .then(result => { if (result.success) setMentors(result.data); })
      .catch(console.error);
  }, []);

  const previewMentors = mentors.slice(0, 4);

  return (
    <div className="page-container">
      <Header />

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-300 to-primary-400 text-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">📅</span>
              <span className="font-medium">{t('home.date')}</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">
              {t('home.title')}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-800 mb-2">
              {t('home.subtitle')}
            </p>
            
            <p className="text-gray-700 mb-8">
              {t('home.desc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="btn-primary bg-gray-900 text-primary-300 hover:bg-black shadow-xl"
              >
                {t('home.applyNow')}
              </Link>
              <Link
                href="/mentors"
                className="btn-secondary bg-white/40 text-gray-900 hover:bg-white/60 backdrop-blur-sm"
              >
                {t('home.browseMentors')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 카운트다운 띠 배너 */}
      {isOpen === false && (
        <section className="bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <span className="text-white font-semibold text-sm sm:text-base">{t('countdown.bannerLabel')}</span>
            <CountdownTimer compact />
          </div>
        </section>
      )}

      {/* 멘토 미리보기 섹션 */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">{t('home.mentorsSection')}</h2>
            <Link
              href="/mentors"
              className="text-gray-700 font-medium hover:text-gray-900"
            >
              {t('home.viewAll')}
            </Link>
          </div>
          
          <MentorPreview mentors={previewMentors} />

          {mentors.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/mentors" className="btn-secondary inline-block bg-primary-200">
                {mentors.length}{t('home.viewAllMentors')}
              </Link>
            </div>
          )}
        </div>
      </section>
      

      {/* 행사 정보 섹션 */}
      <section className="py-12 sm:py-16 bg-warm-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="section-title text-center">{t('home.eventInfo')}</h2>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{t('home.venue')}</h3>
              <p className="text-gray-600">{t('home.church')}</p>
            </div>
            
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🕐</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{t('home.time')}</h3>
              <p className="text-gray-600">{t('home.timeSlots')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('home.perSlot')}</p>
            </div>
            
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{t('home.target')}</h3>
              <p className="text-gray-600">{t('home.targetDesc1')}</p>
              <p className="text-gray-600">{t('home.targetDesc2')}</p>
            </div>
          </div>
        </div>
      </section>
      

      {/* 진행 방식 섹션 */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="section-title text-center">{t('home.howItWorks')}</h2>
          
          <div className="space-y-4">
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-400 text-gray-900 rounded-xl flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('home.step1Title')}</h3>
                <p className="text-gray-600">
                  {t('home.step1Desc')}
                </p>
              </div>
            </div>
            
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-400 text-gray-900 rounded-xl flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('home.step2Title')}</h3>
                <p className="text-gray-600">
                  {t('home.step2Desc')}
                </p>
              </div>
            </div>
            
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-400 text-gray-900 rounded-xl flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t('home.step3Title')}</h3>
                <p className="text-gray-600">
                  {t('home.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary-100 to-warm-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('home.ctaDesc')}
          </p>
          <Link href="/apply" className="btn-primary inline-block">
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">
            {t('home.footer')}
          </p>
          <p className="text-xs mt-2">
            {t('home.footerContact')}
          </p>
        </div>
      </footer>
    </div>
  );
}
