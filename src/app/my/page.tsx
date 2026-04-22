'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useIsAssignmentOpen } from '@/components/CountdownTimer';
import { Assignment, AssignmentSlot } from '@/types';
import { useI18n } from '@/lib/i18n';

export default function MyPage() {
  const { t } = useI18n();
  const isAssignmentOpen = useIsAssignmentOpen();
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [searched, setSearched] = useState(false);
  const [birthDates, setBirthDates] = useState<string[]>([]);
  const [needBirthDate, setNeedBirthDate] = useState(false);
  const [selectedBirthDate, setSelectedBirthDate] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSearch = async (selectedBirthDate2?: string) => {
    if (!name || !phone4) {
      setError(t('my.errorBoth'));
      return;
    }
    if (phone4.length !== 4) {
      setError(t('my.errorPhone'));
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      let url = `/api/my?name=${encodeURIComponent(name)}&phone4=${phone4}`;
      if (selectedBirthDate2) {
        url += `&birthDate=${selectedBirthDate2}`;
      }
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setAssignment(result.data);
        setNeedBirthDate(false);
        setBirthDates([]);
        setSelectedBirthDate(selectedBirthDate2 || result.birthDate || '');
      } else if (result.needBirthDate) {
        setNeedBirthDate(true);
        setBirthDates(result.birthDates || []);
        setAssignment(null);
        setError('');
      } else {
        setAssignment(null);
        setNeedBirthDate(false);
        setError(result.error || t('my.errorNoData'));
      }
    } catch {
      setError(t('my.errorGeneral'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirthDateSelect = (bd: string) => {
    setSelectedBirthDate(bd);
    handleSearch(bd);
  };

  const handleCancel = async () => {
    if (!confirm('정말로 신청을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsCancelling(true);
    try {
      const response = await fetch('/api/my', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone4, birthDate: selectedBirthDate }),
      });
      const result = await response.json();

      if (result.success) {
        alert('신청이 취소되었습니다.');
        setAssignment(null);
        setSearched(false);
        setSelectedBirthDate('');
      } else {
        alert(result.error || '취소 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('취소 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  // 타임 슬롯 카드 컴포넌트
  const TimeSlotCard = ({
    timeNum,
    slot,
    colorClass,
  }: {
    timeNum: number;
    slot: AssignmentSlot | null;
    colorClass: string;
  }) => {
    if (!slot) {
      return (
        <div className="bg-gray-100 rounded-2xl p-5 text-center">
          <div className={`time-badge ${colorClass} mb-3 mx-auto`}>
            {timeNum}{t('my.timeSlot')}
          </div>
          <p className="text-gray-400">{t('my.notAssigned')}</p>
        </div>
      );
    }

    return (
      <div className={`rounded-2xl p-5 ${
        slot.isOriginalChoice ? 'bg-white border-2 border-green-200' : 'bg-white border-2 border-orange-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`time-badge ${colorClass}`}>
            {timeNum}{t('my.timeSlot')}
          </span>
          {slot.isOriginalChoice ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {t('my.preferred')}
            </span>
          ) : (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {t('my.alternative')}
            </span>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{slot.mentorName}</h3>
          <p className="text-gray-600 font-medium mb-3">{slot.mentorJob}</p>
          
          <div className="flex items-center justify-center gap-1 text-gray-600 bg-primary-100 rounded-xl py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{slot.location}</span>
          </div>

          {!slot.isOriginalChoice && slot.originalChoice && (
            <p className="text-xs text-gray-500 mt-3">
              {t('my.originalChoice')}{slot.originalChoice}
            </p>
          )}
          {!slot.isOriginalChoice && slot.originalMessage && (
            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-left">
              <p className="text-[10px] text-gray-400 mb-0.5">{t('my.originalMessage')}</p>
              <p className="text-xs text-gray-600 italic">&ldquo;{slot.originalMessage}&rdquo;</p>
            </div>
          )}
          {slot.isOriginalChoice && slot.message && (
            <div className="mt-3 bg-primary-100 rounded-lg px-3 py-2 text-left">
              <p className="text-[10px] text-gray-500 mb-0.5">{t('my.myMessage')}</p>
              <p className="text-xs text-gray-800 italic">&ldquo;{slot.message}&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <Header />

      <main className="content-container">
        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('my.title')}</h1>
          <p className="text-gray-600">
            {t('my.subtitle')}
          </p>
        </div>

        {/* 배정 공개 전 안내 */}
        {isAssignmentOpen === false && (
          <div className="card max-w-md mx-auto mb-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('my.notYetOpen')}</h2>
            <p className="text-gray-500">{t('my.notYetOpenDesc')}</p>
          </div>
        )}

        {/* 조회 폼 */}
        {isAssignmentOpen !== false && (
        <>
        <div className="card max-w-md mx-auto mb-8">
          <div className="space-y-4">
            <div>
              <label className="label">{t('apply.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">{t('apply.phone4')}</label>
              <input
                type="text"
                value={phone4}
                onChange={(e) => setPhone4(e.target.value)}
                placeholder="1234"
                maxLength={4}
                className="input-field"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? t('my.searching') : t('my.search')}
            </button>
          </div>
        </div>

        {/* 생년월일 선택 */}
        {needBirthDate && !isLoading && (
          <div className="card max-w-md mx-auto mb-8">
            <h3 className="font-bold text-gray-800 mb-2">생년월일을 선택해주세요</h3>
            <p className="text-sm text-gray-500 mb-4">동일한 이름과 전화번호로 여러 건의 신청이 있습니다.</p>
            <div className="space-y-2">
              {birthDates.map((bd) => (
                <button
                  key={bd}
                  onClick={() => handleBirthDateSelect(bd)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left font-medium text-gray-700 transition-colors"
                >
                  {bd.slice(0, 2)}년 {bd.slice(2, 4)}월 {bd.slice(4, 6)}일생
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 배정 결과 */}
        {searched && !isLoading && !needBirthDate && (
          <>
            {assignment ? (
              <div className="space-y-6">
                {/* 안내 메시지 */}
                <div className="bg-primary-100 rounded-2xl p-5 text-center">
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {assignment.applicantName}{t('my.resultFor')}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t('my.goToVenue')}
                  </p>
                </div>

                {/* 타임별 배정 */}
                <div className="grid gap-4">
                  {Array.from({ length: 4 }, (_, i) => {
                    const timeNum = i + 1;
                    const slot = (assignment as unknown as Record<string, unknown>)[`time${timeNum}`] as AssignmentSlot | null;
                    const badgeColors = [
                      'time-badge-1', 'time-badge-2', 'time-badge-3', 'time-badge-1',
                    ];
                    return (
                      <TimeSlotCard
                        key={timeNum}
                        timeNum={timeNum}
                        slot={slot}
                        colorClass={badgeColors[i]}
                      />
                    );
                  })}
                </div>

                {/* 안내 사항 */}
                <div className="bg-warm-100 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-3">{t('my.notes')}</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>{t('my.note1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>{t('my.note2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>{t('my.note3')}</span>
                    </li>
                  </ul>
                </div>

                {/* 신청 취소 */}
                <div className="text-center">
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="text-sm text-red-500 hover:text-red-700 underline underline-offset-2 disabled:opacity-50"
                  >
                    {isCancelling ? '취소 처리 중...' : '신청 취소하기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">😢</span>
                </div>
                <p className="text-gray-600 mb-2">{t('my.notFound')}</p>
                <p className="text-sm text-gray-500">
                  {t('my.notFoundDesc')}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  {t('my.contactKakao')} <span className="font-semibold text-yellow-600">atom103</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* 아직 조회하지 않은 경우 */}
        {!searched && (
          <div className="text-center py-8 text-gray-500">
            <p>{t('my.promptSearch')}</p>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
