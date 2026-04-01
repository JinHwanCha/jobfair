'use client';

import { useEffect } from 'react';
import { Mentor } from '@/types';
import { getCategoryColor, getCategoryIcon, getShortCategoryLabel } from '@/components/MentorCard';

interface MentorModalProps {
  mentor: Mentor;
  onClose: () => void;
}

export default function MentorModal({ mentor, onClose }: MentorModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
          <div className="bg-gradient-to-r from-primary-50 to-warm-100 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="text-lg font-bold text-primary-700">{mentor.jobTitle || mentor.job}</p>
              <span className={`category-badge ${getCategoryColor(mentor.category)}`}>
                {getShortCategoryLabel(mentor.category)}
              </span>
            </div>
            {mentor.field && mentor.jobTitle && mentor.field !== mentor.jobTitle && (
              <p className="text-sm text-gray-600">{mentor.field} 분야</p>
            )}
          </div>

          {/* 경력 */}
          {mentor.experience && (
            <InfoRow icon="📋" label="경력" value={mentor.experience} />
          )}

          {/* 부르심의 영역 */}
          {mentor.category && (
            <InfoRow icon="🌟" label="부르심의 영역" value={mentor.category} />
          )}

          {/* 멘토링 방식 */}
          {mentor.mentoringType && (
            <InfoRow icon="🤝" label="멘토링 방식" value={mentor.mentoringType} />
          )}

          {/* 성경 구절 / 하나님 말씀 */}
          {mentor.bibleVerse && (
            <div className="bg-warm-100 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">📖 직업과 관련된 말씀</p>
              <p className="text-gray-700 leading-relaxed italic">
                &ldquo;{mentor.bibleVerse}&rdquo;
              </p>
            </div>
          )}

          {/* 학생들에게 한마디 */}
          {mentor.advice && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">💬 학생들에게 한마디</p>
              <p className="text-gray-700 leading-relaxed">
                {mentor.advice}
              </p>
            </div>
          )}
        </div>

        {/* 하단 닫기 */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            닫기
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
