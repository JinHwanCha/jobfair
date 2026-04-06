'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

const STEPS = [
  {
    icon: '📝',
    titleKey: 'preview.step1Title' as const,
    descKey: 'preview.step1Desc' as const,
  },
  {
    icon: '👥',
    titleKey: 'preview.step2Title' as const,
    descKey: 'preview.step2Desc' as const,
  },
  {
    icon: '💬',
    titleKey: 'preview.step3Title' as const,
    descKey: 'preview.step3Desc' as const,
  },
  {
    icon: '✅',
    titleKey: 'preview.step4Title' as const,
    descKey: 'preview.step4Desc' as const,
  },
];

export default function ApplyPreviewModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);

  const step = STEPS[current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* 닫기 버튼 */}
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
          {/* 스텝 번호 배지 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
              {current + 1}
            </span>
            <span className="text-sm font-medium text-primary-600">STEP {current + 1} / 4</span>
          </div>

          {/* 프리뷰 카드 */}
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

            {/* 스텝별 미니 미리보기 */}
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
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              {t('preview.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 각 스텝 미니 미리보기 ── */

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
      {/* 외국인 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
        <div className="flex items-start gap-1.5">
          <span className="text-sm">🌏</span>
          <div>
            <p className="text-[11px] font-bold text-amber-700">외국인 필수 체크!</p>
            <p className="text-[10px] text-amber-600 leading-relaxed">외국인은 반드시 외국인 체크 후<br/>영어권 / 중화권을 선택해주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Preview() {
  const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400', 'bg-teal-400'];
  return (
    <div className="mt-3">
      <div className="grid grid-cols-6 gap-1 mb-2">
        {colors.map((c, i) => (
          <div key={i} className="text-center">
            <div className={`w-full aspect-square rounded-lg ${c} opacity-60 flex items-center justify-center`}>
              <span className="text-white text-[10px] font-bold">{i + 1}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg p-2 flex items-center gap-1.5">
            <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3Preview() {
  return (
    <div className="mt-3 space-y-2">
      {[
        { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-400' },
        { color: 'bg-green-50 border-green-200', badge: 'bg-green-400' },
        { color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-400' },
      ].map((s, i) => (
        <div key={i} className={`${s.color} border rounded-lg p-2`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`w-4 h-4 ${s.badge} rounded-full text-white text-[9px] font-bold flex items-center justify-center`}>{i + 1}</span>
            <div className="h-2.5 bg-gray-300 rounded w-16" />
          </div>
          <div className="h-6 bg-white rounded border border-gray-100" />
        </div>
      ))}
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
      <div className="bg-white rounded-lg p-2.5 space-y-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-primary-300 rounded-full shrink-0" />
            <div className="h-2.5 bg-gray-200 rounded flex-1" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 bg-white rounded-lg p-2">
        <div className="w-4 h-4 border-2 border-primary-400 rounded" />
        <div className="h-2.5 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
