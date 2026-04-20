'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import CountdownTimer, { useIsOpen } from '@/components/CountdownTimer';
import { Mentor } from '@/types';
import { useI18n } from '@/lib/i18n';

function extractShortCategories(category: string): string[] {
  const knownCategories = [
    'Building', 'Leading', 'Operating', 'Teaching',
    'Connecting', 'Creating', 'Healing', 'Influencing',
    'Protecting Justice', 'Serving', 'Resume Editing',
  ];
  const found = knownCategories.filter(cat => category.includes(cat));
  return found.length > 0 ? found : ['기타'];
}

export default function HomePage() {
  const { t } = useI18n();
  const isOpen = useIsOpen();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [resumeMentors, setResumeMentors] = useState<Mentor[]>([]);
  const [selectedResumeMentor, setSelectedResumeMentor] = useState<Mentor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHomeMentor, setSelectedHomeMentor] = useState<Mentor | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('notice_dismissed');
    if (!dismissed || dismissed !== new Date().toISOString().slice(0, 10)) {
      setShowNotice(true);
    }
  }, []);

  const dismissNotice = (today?: boolean) => {
    if (today) {
      localStorage.setItem('notice_dismissed', new Date().toISOString().slice(0, 10));
    }
    setShowNotice(false);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/mentors').then(res => res.json()),
      fetch('/api/resume/mentors').then(res => res.json()),
    ]).then(([mentorResult, resumeResult]) => {
      const regularMentors: Mentor[] = mentorResult.success ? mentorResult.data : [];
      const rMentors: Mentor[] = resumeResult.success ? resumeResult.data : [];
      setMentors(regularMentors);
      setResumeMentors(rMentors);
      const taggedResume = rMentors.map(m => ({ ...m, category: 'Resume Editing – 자소서 첨삭' }));
      setAllMentors([...regularMentors, ...taggedResume]);
    }).catch(console.error);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allMentors.forEach(m => extractShortCategories(m.category).forEach(c => cats.add(c)));
    return ['all', ...Array.from(cats).sort()];
  }, [allMentors]);

  const filteredMentors = useMemo(() => {
    if (selectedCategory === 'all') return allMentors.slice(0, 4);
    return allMentors.filter(m => extractShortCategories(m.category).includes(selectedCategory));
  }, [allMentors, selectedCategory]);

  return (
    <div className="page-container">
      <Header />

      {/* 공지 팝업 */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('resume.noticeTitle')}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex gap-3 bg-blue-50 rounded-xl p-3">
                <span className="text-xl shrink-0">👤</span>
                <p className="text-sm text-blue-800">{t('resume.noticeItem1')}</p>
              </div>
              <div className="flex gap-3 bg-amber-50 rounded-xl p-3">
                <span className="text-xl shrink-0">✍️</span>
                <p className="text-sm text-amber-800">{t('resume.noticeItem2')}</p>
              </div>
            </div>
            <button onClick={() => dismissNotice()} className="btn-primary w-full">{t('resume.noticeConfirm')}</button>
            <button onClick={() => dismissNotice(true)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center mt-2 py-1">{t('resume.noticeDismissToday')}</button>
          </div>
        </div>
      )}

      {/* 히어로 섹션 – KV 이미지 */}
      <section className="relative w-896 overflow-hidden bg-white">
        {/* PC KV */}
        <img
          src="/kv_pc_txt.jpg"
          alt="2026 직업박람회 – What am I Called for?"
          className="hidden sm:block w-full h-auto"
          draggable={false}
        />
        {/* Mobile KV */}
        <img
          src="/kv_mo_txt.jpg"
          alt="2026 직업박람회 – What am I Called for?"
          className="block sm:hidden w-full h-auto"
          draggable={false}
        />
        {/* CTA 버튼 오버레이 */}
        <div className="absolute bottom-5 left-0 right-0 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pointer-events-none opacity-90">
          <Link
            href="/apply"
            className="pointer-events-auto btn-primary bg-gray-900 text-primary-300 hover:bg-black shadow-xl text-base sm:text-lg px-8 py-3"
          >
            {t('home.applyNow')}
          </Link>
          <Link
            href="/mentors"
            className="pointer-events-auto btn-secondary bg-white/80 text-gray-900 hover:bg-white backdrop-blur-sm shadow-lg text-base sm:text-lg px-8 py-3"
          >
            {t('home.browseMentors')}
          </Link>
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

      {/* 배정 확인 안내 배너 */}
      <section className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center space-y-1">
          <p className="text-sm sm:text-base font-semibold text-blue-800">
            {t('home.assignNotice')}
          </p>
          <p className="text-xs sm:text-sm text-blue-600">
            {t('home.assignNoticeChange')}
          </p>
        </div>
      </section>

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

          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 -mx-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary-400 text-gray-900'
                    : 'bg-primary-100 text-gray-700 hover:bg-primary-200'
                }`}
              >
                {cat === 'all' ? t('mentors.all') : cat}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onClickDetail={() => setSelectedHomeMentor(mentor)}
              />
            ))}
          </div>

          {selectedHomeMentor && (
            <MentorModal
              mentor={selectedHomeMentor}
              onClose={() => setSelectedHomeMentor(null)}
            />
          )}

          {allMentors.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/mentors" className="btn-secondary inline-block bg-primary-200">
                {allMentors.length}{t('home.viewAllMentors')}
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

      {/* 자소서 첨삭 프로그램 섹션 */}
      <section className="py-12 sm:py-16 bg-warm-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <span className="text-3xl mb-4 block">📝</span>
            <h2 className="section-title">{t('home.resumeSection')}</h2>
            <p className="text-gray-600 mb-2">{t('home.resumeDesc')}</p>
            <span className="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
              {t('home.resumeLimit')}
            </span>
          </div>

          {resumeMentors.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {resumeMentors.map(m => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  onClickDetail={() => setSelectedResumeMentor(m)}
                />
              ))}
            </div>
          )}

          {selectedResumeMentor && (
            <MentorModal
              mentor={selectedResumeMentor}
              onClose={() => setSelectedResumeMentor(null)}
            />
          )}

          <div className="text-center">
            <Link href="/resume/apply" className="btn-primary inline-block">
              {t('home.resumeApply')}
            </Link>
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
