'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

// KST 2026-04-07 09:50:00 (테스트용)
const OPEN_TIME = new Date('2026-04-07T09:50:00+09:00').getTime();

export function useIsOpen() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsOpen(Date.now() >= OPEN_TIME);
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  return isOpen;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, OPEN_TIME - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return <div className="h-16 sm:h-20" />;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm sm:text-base font-mono font-bold text-white">
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.days)}{t('countdown.d')}</span>
        <span>:</span>
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}{t('countdown.h')}</span>
        <span>:</span>
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}{t('countdown.m')}</span>
        <span>:</span>
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}{t('countdown.s')}</span>
      </div>
    );
  }

  const blocks = [
    { value: pad(timeLeft.days), label: t('countdown.days') },
    { value: pad(timeLeft.hours), label: t('countdown.hours') },
    { value: pad(timeLeft.minutes), label: t('countdown.minutes') },
    { value: pad(timeLeft.seconds), label: t('countdown.seconds') },
  ];

  return (
    <div className="flex flex-col items-center">
      <p className="text-base sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6">{t('countdown.until')}</p>
      <div className="flex items-center justify-center gap-1.5 sm:gap-4">
        {blocks.map((b, i) => (
          <div key={b.label} className="flex items-center gap-1.5 sm:gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-18 sm:h-18 bg-primary-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl font-bold font-mono shadow-lg">
                {b.value}
              </div>
              <span className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">{b.label}</span>
            </div>
            {i < blocks.length - 1 && (
              <span className="text-lg sm:text-3xl font-bold text-primary-400 -mt-4 sm:-mt-5">:</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">{t('countdown.openDate')}</p>
    </div>
  );
}
