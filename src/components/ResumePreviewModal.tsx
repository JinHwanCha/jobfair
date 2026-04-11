'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

const STEPS = [
  {
    icon: '📝',
    titleKey: 'resumePreview.step1Title' as const,
    descKey: 'resumePreview.step1Desc' as const,
  },
  {
    icon: '🎓',
    titleKey: 'resumePreview.step2Title' as const,
    descKey: 'resumePreview.step2Desc' as const,
  },
  {
    icon: '✍️',
    titleKey: 'resumePreview.step3Title' as const,
    descKey: 'resumePreview.step3Desc' as const,
  },
  {
    icon: '✅',
    titleKey: 'resumePreview.step4Title' as const,
    descKey: 'resumePreview.step4Desc' as const,
  },
];

export default function ResumePreviewModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);

  const step = STEPS[current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 z-10 transition-colors"
        >
          ✕
        </button>

        {/* 상단 스테퍼 */}
        <div className="pt-5 pb-3 px-6">
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-primary-500' : 'w-4 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 슬라이드 콘텐츠 */}
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary-400 text-gray-900 text-xs font-bold flex items-center justify-center">
              {current + 1}
            </span>
            <span className="text-sm font-medium text-gray-700">STEP {current + 1} / 4</span>
          </div>

          <div className="bg-warm-100 rounded-2xl p-5 mb-5 min-h-[260px] flex flex-col">
            <div className="text-center mb-4">
              <span className="text-4xl">{step.icon}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-3">
              {t(step.titleKey)}
            </h3>
            <p className="text-sm text-gray-600 text-center leading-relaxed flex-1">
              {t(step.descKey)}
            </p>

            {current === 0 && <Step1Preview />}
            {current === 1 && <Step2Preview />}
            {current === 2 && <Step3Preview />}
            {current === 3 && <Step4Preview />}
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          {current < 3 ? (
            <button
              onClick={() => setCurrent(current + 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-400 text-gray-900 hover:bg-primary-500 transition-colors"
            >
              →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-400 text-gray-900 hover:bg-primary-500 transition-colors"
            >
              {t('preview.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1Preview() {
  return (
    <div className="mt-3 space-y-2">
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-12 shrink-0">이름</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-12 shrink-0">생년월일</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-12 shrink-0">전화번호</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function Step2Preview() {
  return (
    <div className="mt-3 space-y-2">
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">학과</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">출생년도</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">현재상황</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 shrink-0">희망직군</span>
        <div className="flex-1 h-5 bg-gray-100 rounded" />
      </div>
      <div className="bg-white rounded-lg px-3 py-2">
        <span className="text-xs text-gray-400 block mb-1.5">기업유형</span>
        <div className="flex gap-2">
          <div className="h-5 bg-primary-100 rounded-full w-14" />
          <div className="h-5 bg-gray-100 rounded-full w-14" />
          <div className="h-5 bg-gray-100 rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}

function Step3Preview() {
  return (
    <div className="mt-3 space-y-2">
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📄</span>
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 bg-gray-100 rounded w-full" />
          <div className="h-2.5 bg-gray-100 rounded w-5/6" />
          <div className="h-2.5 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎯</span>
          <div className="h-3 bg-purple-200 rounded w-24" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 bg-purple-50 rounded w-full" />
          <div className="h-2.5 bg-purple-50 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

function Step4Preview() {
  return (
    <div className="mt-3 space-y-2">
      <div className="bg-white rounded-lg p-2.5 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-2.5 bg-gray-200 rounded w-10" />
          <div className="h-2.5 bg-gray-300 rounded w-14" />
        </div>
        <div className="flex justify-between">
          <div className="h-2.5 bg-gray-200 rounded w-12" />
          <div className="h-2.5 bg-gray-300 rounded w-10" />
        </div>
      </div>
      <div className="bg-white rounded-lg p-2.5">
        <div className="h-2 bg-gray-200 rounded w-10 mb-1.5" />
        <div className="space-y-1">
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-white rounded-lg p-2">
        <div className="w-4 h-4 border-2 border-primary-500 rounded" />
        <div className="h-2.5 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
