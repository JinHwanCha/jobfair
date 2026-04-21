'use client';

import { useState } from 'react';
import Header from '@/components/Header';

interface ApplicantInfo {
  name: string;
  birthDate: string;
  phone4: string;
  choice1: string;
  choice2: string;
  choice3: string;
}

export default function CancelPage() {
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [birthDates, setBirthDates] = useState<string[]>([]);
  const [needBirthDate, setNeedBirthDate] = useState(false);
  const [selectedBirthDate, setSelectedBirthDate] = useState('');
  const [cancelled, setCancelled] = useState(false);

  const handleSearch = async (birthDate?: string) => {
    if (!name || !phone4) {
      setError('이름과 전화번호 뒷자리를 모두 입력해주세요.');
      return;
    }
    if (phone4.length !== 4) {
      setError('전화번호 뒷자리는 4자리여야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      let url = `/api/cancel?name=${encodeURIComponent(name)}&phone4=${phone4}`;
      if (birthDate) url += `&birthDate=${birthDate}`;

      const res = await fetch(url);
      const result = await res.json();

      if (result.success && result.data) {
        setApplicant(result.data);
        setNeedBirthDate(false);
        setBirthDates([]);
        setSelectedBirthDate(birthDate || result.data.birthDate);
      } else if (result.needBirthDate) {
        setNeedBirthDate(true);
        setBirthDates(result.birthDates || []);
        setApplicant(null);
        setError('');
      } else {
        setApplicant(null);
        setNeedBirthDate(false);
        setError(result.error || '신청 정보를 찾을 수 없습니다.');
      }
    } catch {
      setError('조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirthDateSelect = (bd: string) => {
    setSelectedBirthDate(bd);
    handleSearch(bd);
  };

  const handleCancel = async () => {
    if (!applicant) return;
    if (!confirm(`정말로 "${applicant.name}"님의 신청을 취소하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    setIsCancelling(true);
    try {
      const res = await fetch('/api/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: applicant.name, phone4: applicant.phone4, birthDate: selectedBirthDate || applicant.birthDate }),
      });
      const result = await res.json();
      if (result.success) {
        setCancelled(true);
        setApplicant(null);
      } else {
        setError(result.error || '취소 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setError('취소 처리 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="page-container">
      <Header />

      <main className="content-container">
        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">신청 취소</h1>
          <p className="text-gray-600">
            배정 결과 공개 전에도 신청을 취소할 수 있습니다.
          </p>
        </div>

        {/* 취소 완료 */}
        {cancelled && (
          <div className="card max-w-md mx-auto text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">신청이 취소되었습니다</h2>
            <p className="text-gray-500 text-sm">다시 신청하려면 신청 페이지를 이용해주세요.</p>
          </div>
        )}

        {/* 조회 폼 */}
        {!cancelled && (
          <>
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
                    disabled={!!applicant}
                  />
                </div>
                <div>
                  <label className="label">전화번호 뒷 4자리</label>
                  <input
                    type="text"
                    value={phone4}
                    onChange={(e) => setPhone4(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="input-field"
                    disabled={!!applicant}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>
                )}

                {!applicant && (
                  <button
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    className="btn-primary w-full"
                  >
                    {isLoading ? '조회 중...' : '신청 내역 조회'}
                  </button>
                )}
              </div>
            </div>

            {/* 생년월일 선택 (동명이인) */}
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

            {/* 신청 정보 확인 + 취소 버튼 */}
            {searched && !isLoading && !needBirthDate && applicant && (
              <div className="card max-w-md mx-auto space-y-5">
                <div className="bg-primary-100 rounded-2xl p-5 text-center">
                  <p className="text-lg font-bold text-gray-900 mb-1">{applicant.name}님의 신청 내역</p>
                  <p className="text-sm text-gray-600">아래 내역을 확인하고 취소를 진행해주세요.</p>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">1지망</span>
                    <span className="font-medium">{applicant.choice1 || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">2지망</span>
                    <span className="font-medium">{applicant.choice2 || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">3지망</span>
                    <span className="font-medium">{applicant.choice3 || '-'}</span>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">
                  ⚠️ 신청을 취소하면 되돌릴 수 없습니다. 다시 신청하려면 신청 페이지에서 새로 접수해야 합니다.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setApplicant(null); setSearched(false); setName(''); setPhone4(''); setError(''); }}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isCancelling ? '취소 처리 중...' : '신청 취소하기'}
                  </button>
                </div>
              </div>
            )}

            {/* 아직 조회 전 */}
            {!searched && !cancelled && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>이름과 전화번호 뒷자리를 입력하고 신청 내역을 조회해주세요.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
