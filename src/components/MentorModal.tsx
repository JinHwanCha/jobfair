'use client';

import { useEffect } from 'react';
import { Mentor } from '@/types';
import { getCategoryColor, getCategoryIcon, getShortCategoryLabel } from '@/components/MentorCard';
import { useI18n } from '@/lib/i18n';

interface MentorModalProps {
  mentor: Mentor;
  onClose: () => void;
}

export default function MentorModal({ mentor, onClose }: MentorModalProps) {
  const { t } = useI18n();
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 모달 */}
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 바 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(mentor.category)}</span>
            <h2 className="text-xl font-bold text-gray-800">{mentor.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="px-6 py-5 space-y-5">
          {/* 직업 정보 */}
          <div className="bg-gradient-to-r from-primary-100 to-warm-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="text-lg font-bold text-gray-900">{mentor.jobPosition || mentor.jobTitle || mentor.job}</p>
              <span className={`category-badge ${getCategoryColor(mentor.category)}`}>
                {getShortCategoryLabel(mentor.category)}
              </span>
            </div>
            {mentor.field && mentor.jobTitle && mentor.field !== mentor.jobTitle && (
              <p className="text-sm text-gray-600">{mentor.field}{t('modal.field')}</p>
            )}
            {mentor.major && (
              <p className="text-sm text-gray-600">{t('modal.major')}{mentor.major}</p>
            )}
          </div>

          {/* 한줄 소개 */}
          {mentor.oneLiner && (
            <div className="bg-warm-100 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('modal.oneLiner')}</p>
              <p className="text-gray-700 leading-relaxed">{mentor.oneLiner}</p>
            </div>
          )}

          {/* 키워드 */}
          {mentor.keywords && (
            <div className="flex flex-wrap gap-2">
              {mentor.keywords.split(/[,#]/).filter(k => k.trim()).map((keyword, idx) => (
                <span key={idx} className="px-3 py-1 bg-primary-100 text-gray-800 rounded-full text-sm font-medium">
                  #{keyword.trim()}
                </span>
              ))}
            </div>
          )}

          {/* 경력 */}
          {mentor.experience && (
            <InfoRow icon="📋" label={t('modal.experience')} value={mentor.experience} />
          )}

          {/* 멘토링 주제 */}
          {mentor.topics && (
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('modal.topics')}</p>
              <p className="text-gray-700 leading-relaxed">{mentor.topics}</p>
            </div>
          )}

          {/* 커리어/Calling 여정 */}
          {mentor.careerCalling && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('modal.careerJourney')}</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{mentor.careerCalling}</p>
            </div>
          )}
        </div>

        {/* 하단 닫기 */}
        <div className="px-6 pb-6 pt-2">
          {mentor.name === '김지선' && (
            <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-800 leading-relaxed">
                {t('kimJiseon.modalNotice')}
              </p>
              <a
                href="https://open.kakao.com/o/gnKtJyri"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs font-semibold text-yellow-900 underline underline-offset-2"
              >
                {t('kimJiseon.openKakao')} →
              </a>
            </div>
          )}
          {mentor.name === '김교은' && (
            <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-800 leading-relaxed">
                {t('kimGyoeun.modalNotice')}
              </p>
              <a
                href="https://invite.kakao.com/tc/1aUucdNOpT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs font-semibold text-yellow-900 underline underline-offset-2"
              >
                {t('kimGyoeun.openKakao')} →
              </a>
            </div>
          )}
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-gray-800">{value}</p>
      </div>
    </div>
  );
}
