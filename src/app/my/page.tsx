'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Assignment, AssignmentSlot } from '@/types';

export default function MyPage() {
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!name || !phone4) {
      setError('이름과 전화번호 뒷자리를 입력해주세요.');
      return;
    }
    if (phone4.length !== 4) {
      setError('전화번호 뒷자리 4자리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`/api/my?name=${encodeURIComponent(name)}&phone4=${phone4}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAssignment(result.data);
      } else {
        setAssignment(null);
        setError(result.error || '배정 정보를 찾을 수 없습니다.');
      }
    } catch {
      setError('조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
            {timeNum}타임
          </div>
          <p className="text-gray-400">배정되지 않음</p>
        </div>
      );
    }

    return (
      <div className={`rounded-2xl p-5 ${
        slot.isOriginalChoice ? 'bg-white border-2 border-green-200' : 'bg-white border-2 border-orange-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`time-badge ${colorClass}`}>
            {timeNum}타임
          </span>
          {slot.isOriginalChoice ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              희망 멘토
            </span>
          ) : (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              대체 배정
            </span>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{slot.mentorName}</h3>
          <p className="text-primary-600 font-medium mb-3">{slot.mentorJob}</p>
          
          <div className="flex items-center justify-center gap-1 text-gray-600 bg-warm-100 rounded-xl py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{slot.location}</span>
          </div>

          {!slot.isOriginalChoice && slot.originalChoice && (
            <p className="text-xs text-gray-500 mt-3">
              원래 선택: {slot.originalChoice}
            </p>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">내 배정 확인</h1>
          <p className="text-gray-600">
            신청 시 입력한 정보로 배정 결과를 확인하세요
          </p>
        </div>

        {/* 조회 폼 */}
        <div className="card max-w-md mx-auto mb-8">
          <div className="space-y-4">
            <div>
              <label className="label">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">휴대폰 번호 뒷자리 (4자리)</label>
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
              onClick={handleSearch}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? '조회 중...' : '조회하기'}
            </button>
          </div>
        </div>

        {/* 배정 결과 */}
        {searched && !isLoading && (
          <>
            {assignment ? (
              <div className="space-y-6">
                {/* 안내 메시지 */}
                <div className="bg-primary-50 rounded-2xl p-5 text-center">
                  <p className="text-lg font-medium text-primary-700 mb-1">
                    {assignment.applicantName}님의 배정 결과입니다
                  </p>
                  <p className="text-sm text-primary-600">
                    행사 당일 아래 장소로 이동해주세요!
                  </p>
                </div>

                {/* 타임별 배정 */}
                <div className="grid gap-4">
                  <TimeSlotCard
                    timeNum={1}
                    slot={assignment.time1}
                    colorClass="time-badge-1"
                  />
                  <TimeSlotCard
                    timeNum={2}
                    slot={assignment.time2}
                    colorClass="time-badge-2"
                  />
                  <TimeSlotCard
                    timeNum={3}
                    slot={assignment.time3}
                    colorClass="time-badge-3"
                  />
                </div>

                {/* 안내 사항 */}
                <div className="bg-warm-100 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-800 mb-3">유의사항</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>각 타임 시작 5분 전까지 배정된 장소로 이동해주세요.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>대체 배정된 경우 원래 선택한 멘토와 다를 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>문의사항은 안내 데스크로 연락해주세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">😢</span>
                </div>
                <p className="text-gray-600 mb-2">배정 정보를 찾을 수 없습니다.</p>
                <p className="text-sm text-gray-500">
                  신청 시 입력한 이름과 전화번호를 다시 확인해주세요.
                </p>
              </div>
            )}
          </>
        )}

        {/* 아직 조회하지 않은 경우 */}
        {!searched && (
          <div className="text-center py-8 text-gray-500">
            <p>위 정보를 입력하고 조회 버튼을 눌러주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
