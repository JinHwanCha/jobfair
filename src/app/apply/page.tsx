'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import { ApplyFormData, Mentor } from '@/types';

export default function ApplyPage() {
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [detailMentor, setDetailMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetch('/api/mentors')
      .then(res => res.json())
      .then(result => {
        if (result.success) setMentors(result.data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingMentors(false));
  }, []);

  const [formData, setFormData] = useState<ApplyFormData>({
    name: '',
    birthDate: '',
    phone4: '',
    choice1: '',
    choice2: '',
    choice3: '',
    agreedToTerms: false,
  });

  // 선택된 멘토 ID 목록
  const selectedMentorIds = [formData.choice1, formData.choice2, formData.choice3].filter(Boolean);

  // 멘토 선택 핸들러
  const handleSelectMentor = (mentorId: string, choiceNum: 1 | 2 | 3) => {
    const key = `choice${choiceNum}` as 'choice1' | 'choice2' | 'choice3';
    
    // 이미 다른 지망에서 선택된 멘토인지 확인
    if (selectedMentorIds.includes(mentorId) && formData[key] !== mentorId) {
      alert('이미 선택한 멘토입니다. 다른 멘토를 선택해주세요.');
      return;
    }

    // 토글 (선택 해제)
    if (formData[key] === mentorId) {
      setFormData({ ...formData, [key]: '' });
    } else {
      setFormData({ ...formData, [key]: mentorId });
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 다음 단계로 이동
  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.birthDate || !formData.phone4)) {
      alert('모든 정보를 입력해주세요.');
      return;
    }
    if (step === 1 && formData.phone4.length !== 4) {
      alert('전화번호 뒷자리 4자리를 입력해주세요.');
      return;
    }
    setStep(step + 1);
  };

  // 이전 단계로 이동
  const prevStep = () => {
    setStep(step - 1);
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!formData.choice1 || !formData.choice2 || !formData.choice3) {
      alert('1지망, 2지망, 3지망 모두 선택해주세요.');
      return;
    }
    if (!formData.agreedToTerms) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(result.error || '신청 중 오류가 발생했습니다.');
      }
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 신청 완료 화면
  if (submitSuccess) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-container">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              신청이 완료되었습니다!
            </h1>
            <p className="text-gray-600 mb-8">
              배정 결과는 행사 전 &quot;내 배정 확인&quot; 페이지에서 확인하실 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/my')}
                className="btn-primary"
              >
                배정 결과 확인하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-secondary"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <main className="content-container">
        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">멘토 신청</h1>
          <p className="text-gray-600">희망하는 멘토를 선택해 신청하세요</p>
        </div>

        {/* 진행 상태 표시 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= num
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-200 text-gray-500'
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > num ? 'bg-primary-500' : 'bg-warm-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 기본 정보 입력 */}
        {step === 1 && (
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">기본 정보 입력</h2>

            <div className="space-y-4">
              <div>
                <label className="label">이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="홍길동"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">생년월일 (6자리)</label>
                <input
                  type="text"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  placeholder="991225"
                  maxLength={6}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">예: 2008년 3월 15일 → 080315</p>
              </div>

              <div>
                <label className="label">휴대폰 번호 뒷자리 (4자리)</label>
                <input
                  type="text"
                  name="phone4"
                  value={formData.phone4}
                  onChange={handleInputChange}
                  placeholder="1234"
                  maxLength={4}
                  className="input-field"
                />
              </div>
            </div>

            <button onClick={nextStep} className="btn-primary w-full mt-6">
              다음
            </button>
          </div>
        )}

        {/* Step 2: 멘토 선택 */}
        {step === 2 && (
          <div>
            {/* 선택 가이드 */}
            <div className="bg-primary-50 rounded-2xl p-4 mb-6">
              <p className="text-primary-700 text-sm font-medium mb-2">
                희망하는 멘토를 1지망, 2지망, 3지망 순서로 선택해주세요.
              </p>
              <p className="text-primary-600 text-xs">
                인기 멘토의 경우 신청 순서에 따라 다른 타임 또는 유사 분야 멘토로 배정될 수 있습니다.
              </p>
            </div>

            {/* 선택 현황 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 3].map((num) => {
                const key = `choice${num}` as keyof typeof formData;
                const mentorId = formData[key] as string;
                const mentor = mentors.find((m) => m.id === mentorId);
                
                return (
                  <div
                    key={num}
                    className={`p-3 rounded-xl text-center relative ${
                      mentor ? 'bg-primary-100' : 'bg-warm-100'
                    }`}
                  >
                    {mentor && (
                      <button
                        onClick={() => handleSelectMentor(mentorId, num as 1 | 2 | 3)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10"
                        aria-label={`${num}지망 선택 취소`}
                      >
                        ✕
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mb-1">{num}지망</p>
                    <p className={`font-medium text-sm truncate ${
                      mentor ? 'text-primary-700' : 'text-gray-400'
                    }`}>
                      {mentor ? mentor.name : '선택해주세요'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 지망 선택 탭 */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    num === 1
                      ? 'bg-blue-500 text-white'
                      : num === 2
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  {num}지망 선택
                </button>
              ))}
            </div>

            {/* 멘토 목록 */}
            {isLoadingMentors ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">멘토 정보를 불러오는 중...</p>
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {mentors.map((mentor) => {
                const isSelected = selectedMentorIds.includes(mentor.id);
                const selectedAs = formData.choice1 === mentor.id
                  ? 1
                  : formData.choice2 === mentor.id
                  ? 2
                  : formData.choice3 === mentor.id
                  ? 3
                  : null;

                return (
                  <div key={mentor.id} className="relative">
                    {selectedAs && (
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${
                        selectedAs === 1
                          ? 'bg-blue-500'
                          : selectedAs === 2
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }`}>
                        {selectedAs}
                      </div>
                    )}
                    <MentorCard
                      mentor={mentor}
                      selected={isSelected}
                      showSelectButton
                      onClickDetail={() => setDetailMentor(mentor)}
                      onSelect={() => {
                        // 이미 선택된 멘토라면 해제 (먼저 체크)
                        if (formData.choice1 === mentor.id) {
                          handleSelectMentor(mentor.id, 1);
                        } else if (formData.choice2 === mentor.id) {
                          handleSelectMentor(mentor.id, 2);
                        } else if (formData.choice3 === mentor.id) {
                          handleSelectMentor(mentor.id, 3);
                        } else if (!formData.choice1) {
                          handleSelectMentor(mentor.id, 1);
                        } else if (!formData.choice2) {
                          handleSelectMentor(mentor.id, 2);
                        } else if (!formData.choice3) {
                          handleSelectMentor(mentor.id, 3);
                        } else {
                          alert('3개 모두 선택되었습니다. 기존 선택을 해제하고 다시 선택해주세요.');
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
            )}

            {/* 하단 여백 (플로팅 버튼 공간 확보) */}
            <div className="h-20"></div>

            {/* 플로팅 네비게이션 버튼 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-30">
              <div className="max-w-2xl mx-auto flex gap-4">
                <button onClick={prevStep} className="btn-secondary flex-1">
                  이전
                </button>
                <button
                  onClick={nextStep}
                  disabled={!formData.choice1 || !formData.choice2 || !formData.choice3}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 확인 및 동의 */}
        {step === 3 && (
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">신청 정보 확인</h2>

            {/* 입력 정보 요약 */}
            <div className="bg-warm-100 rounded-xl p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">이름</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">생년월일</span>
                  <span className="font-medium">{formData.birthDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">전화번호 뒷자리</span>
                  <span className="font-medium">{formData.phone4}</span>
                </div>
              </div>
            </div>

            {/* 선택 멘토 요약 */}
            <div className="space-y-3 mb-6">
              {[1, 2, 3].map((num) => {
                const key = `choice${num}` as keyof typeof formData;
                const mentorId = formData[key] as string;
                const mentor = mentors.find((m) => m.id === mentorId);
                
                return (
                  <div
                    key={num}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      num === 1
                        ? 'bg-blue-50'
                        : num === 2
                        ? 'bg-green-50'
                        : 'bg-purple-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        num === 1
                          ? 'bg-blue-500'
                          : num === 2
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }`}
                    >
                      {num}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{mentor?.name}</p>
                      <p className="text-sm text-gray-500">{mentor?.job}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">개인정보 수집 및 이용 동의</h3>
              <div className="text-xs text-gray-600 space-y-1 mb-4">
                <p>• 수집 항목: 이름, 생년월일, 휴대폰 번호 뒷자리</p>
                <p>• 수집 목적: 직업박람회 멘토 배정 및 행사 안내</p>
                <p>• 보유 기간: 행사 종료 후 1개월 이내 파기</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  위 내용을 확인했으며, 개인정보 수집 및 이용에 동의합니다. (필수)
                </span>
              </label>
            </div>

            {/* 에러 메시지 */}
            {submitError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
                {submitError}
              </div>
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex gap-4">
              <button onClick={prevStep} className="btn-secondary flex-1">
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agreedToTerms}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '신청 중...' : '신청하기'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 멘토 상세 모달 */}
      {detailMentor && (
        <MentorModal
          mentor={detailMentor}
          onClose={() => setDetailMentor(null)}
        />
      )}
    </div>
  );
}
