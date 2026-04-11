'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import CountdownTimer, { useIsOpen } from '@/components/CountdownTimer';
import ApplyPreviewModal from '@/components/ApplyPreviewModal';
import { ApplyFormData, Mentor } from '@/types';
import { useI18n } from '@/lib/i18n';

const CHOICE_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
  { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-700' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700' },
];

type ChoiceKey = 'choice1' | 'choice2' | 'choice3' | 'choice4' | 'choice5' | 'choice6';
type MessageKey = 'message1' | 'message2' | 'message3' | 'message4' | 'message5' | 'message6';

export default function ApplyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const isOpen = useIsOpen();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [detailMentor, setDetailMentor] = useState<Mentor | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
    isForeigner: false,
    languageGroup: '',
    choice1: '', choice2: '', choice3: '',
    choice4: '', choice5: '', choice6: '',
    message1: '', message2: '', message3: '',
    message4: '', message5: '', message6: '',
    agreedToTerms: false,
  });

  // 선택된 멘토 ID 목록
  const selectedMentorIds = Array.from({ length: 6 }, (_, i) =>
    formData[`choice${i + 1}` as ChoiceKey]
  ).filter(Boolean);

  // 멘토 선택 핸들러
  const handleSelectMentor = (mentorId: string, choiceNum: number) => {
    const key = `choice${choiceNum}` as ChoiceKey;

    if (selectedMentorIds.includes(mentorId) && formData[key] !== mentorId) {
      alert(t('apply.alertDuplicate'));
      return;
    }

    if (formData[key] === mentorId) {
      setFormData({ ...formData, [key]: '', [`message${choiceNum}`]: '' });
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
      alert(t('apply.alertAllInfo'));
      return;
    }
    if (step === 1 && formData.phone4.length !== 4) {
      alert(t('apply.alertPhone4'));
      return;
    }
    if (step === 1 && formData.isForeigner && !formData.languageGroup) {
      alert(t('apply.languageGroup'));
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const allChoicesFilled = Array.from({ length: 6 }, (_, i) =>
    formData[`choice${i + 1}` as ChoiceKey]
  ).every(Boolean);

  // 폼 제출
  const handleSubmit = async () => {
    if (!allChoicesFilled) {
      alert(t('apply.alertAllChoices'));
      return;
    }
    if (!formData.agreedToTerms) {
      alert(t('apply.alertConsent'));
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
        setSubmitError(result.error || t('apply.errorDefault'));
      }
    } catch {
      setSubmitError(t('apply.errorNetwork'));
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
              {t('apply.successTitle')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('apply.successDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => router.push('/my')} className="btn-primary">
                {t('apply.checkResult')}
              </button>
              <button onClick={() => router.push('/')} className="btn-secondary">
                {t('apply.goHome')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 신청 오픈 전 안내 화면
  if (isOpen === false) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('apply.title')}</h1>
            <p className="text-gray-600">{t('apply.subtitle')}</p>
          </div>
          <div className="card max-w-lg mx-auto py-10 px-4 text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">{t('apply.notYetOpen')}</h2>
            <CountdownTimer />
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => setShowPreview(true)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span>📋</span>
                {t('preview.button')}
              </button>
              <button onClick={() => router.push('/')} className="btn-secondary flex-1">
                {t('apply.goHome')}
              </button>
            </div>
          </div>
          {showPreview && <ApplyPreviewModal onClose={() => setShowPreview(false)} />}
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('apply.title')}</h1>
          <p className="text-gray-600">{t('apply.subtitle')}</p>
        </div>

        {/* 진행 상태 표시 */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= num
                    ? 'bg-gray-900 text-primary-400'
                    : 'bg-warm-200 text-gray-500'
                }`}
              >
                {num}
              </div>
              {num < 4 && (
                <div className={`w-12 h-1 ${step > num ? 'bg-gray-900' : 'bg-warm-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 기본 정보 입력 */}
        {step === 1 && (
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('apply.step1Title')}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">{t('apply.name')}</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder={t('apply.namePlaceholder')} className="input-field" />
              </div>
              <div>
                <label className="label">{t('apply.birthDate')}</label>
                <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                  placeholder="991225" maxLength={6} className="input-field" />
                <p className="text-xs text-gray-500 mt-1">{t('apply.birthDateHint')}</p>
              </div>
              <div>
                <label className="label">{t('apply.phone4')}</label>
                <input type="text" name="phone4" value={formData.phone4} onChange={handleInputChange}
                  placeholder="1234" maxLength={4} className="input-field" />
              </div>

              {/* 외국인 여부 */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <label className="label">{t('apply.foreigner')}</label>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    name="isForeigner"
                    checked={formData.isForeigner}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        isForeigner: checked,
                        languageGroup: checked ? formData.languageGroup : '',
                      });
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{t('apply.isForeigner')}</span>
                </label>

                {formData.isForeigner && (
                  <div className="ml-8 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('apply.languageGroup')}</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="languageGroup"
                        value="english"
                        checked={formData.languageGroup === 'english'}
                        onChange={() => setFormData({ ...formData, languageGroup: 'english' })}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{t('apply.english')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="languageGroup"
                        value="chinese"
                        checked={formData.languageGroup === 'chinese'}
                        onChange={() => setFormData({ ...formData, languageGroup: 'chinese' })}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{t('apply.chinese')}</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            <button onClick={nextStep} className="btn-primary w-full mt-6">{t('apply.next')}</button>
          </div>
        )}

        {/* Step 2: 멘토 선택 */}
        {step === 2 && (
          <div>
            <div className="bg-primary-100 rounded-2xl p-4 mb-6">
              <p className="text-gray-800 text-sm font-medium mb-2">
                {t('apply.selectGuide')}
              </p>
              <p className="text-gray-700 text-xs">
                {t('apply.selectGuide2')}
              </p>
            </div>

            {/* 선택 현황 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
                const mentorId = formData[`choice${num}` as ChoiceKey];
                const mentor = mentors.find((m) => m.id === mentorId);
                const color = CHOICE_COLORS[num - 1];

                return (
                  <div key={num} className={`p-2 sm:p-3 rounded-xl text-center relative ${mentor ? 'bg-primary-100' : 'bg-warm-100'}`}>
                    {mentor && (
                      <button
                        onClick={() => handleSelectMentor(mentorId, num)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors z-10"
                        aria-label={`${num}지망 선택 취소`}
                      >✕</button>
                    )}
                    <p className="text-xs text-gray-500 mb-1">{num}{t('apply.choice')}</p>
                    <p className={`font-medium text-xs sm:text-sm truncate ${mentor ? color.text : 'text-gray-400'}`}>
                      {mentor ? mentor.name : t('apply.select')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 멘토 목록 */}
            {isLoadingMentors ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">{t('mentors.loading')}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {mentors.map((mentor) => {
                  const isSelected = selectedMentorIds.includes(mentor.id);
                  let selectedAs: number | null = null;
                  for (let i = 1; i <= 6; i++) {
                    if (formData[`choice${i}` as ChoiceKey] === mentor.id) {
                      selectedAs = i;
                      break;
                    }
                  }

                  return (
                    <div key={mentor.id} className="relative min-w-0">
                      {selectedAs && (
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${CHOICE_COLORS[selectedAs - 1].bg}`}>
                          {selectedAs}
                        </div>
                      )}
                      <MentorCard
                        mentor={mentor}
                        selected={isSelected}
                        showSelectButton
                        onClickDetail={() => setDetailMentor(mentor)}
                        onSelect={() => {
                          // 이미 선택된 멘토라면 해제
                          for (let i = 1; i <= 6; i++) {
                            if (formData[`choice${i}` as ChoiceKey] === mentor.id) {
                              handleSelectMentor(mentor.id, i);
                              return;
                            }
                          }
                          // 빈 슬롯에 배정
                          for (let i = 1; i <= 6; i++) {
                            if (!formData[`choice${i}` as ChoiceKey]) {
                              handleSelectMentor(mentor.id, i);
                              return;
                            }
                          }
                          alert(t('apply.alertAllFilled'));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-20"></div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-30">
              <div className="max-w-2xl mx-auto flex gap-4">
                <button onClick={prevStep} className="btn-secondary flex-1">{t('apply.prev')}</button>
                <button
                  onClick={nextStep}
                  disabled={!allChoicesFilled}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >{t('apply.next')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 멘토에게 메시지 */}
        {step === 3 && (
          <div className="max-w-lg mx-auto">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t('apply.step3Title')}</h2>
              <p className="text-sm text-gray-500 mb-6">{t('apply.step3Desc')}</p>

              <div className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
                  const mentorId = formData[`choice${num}` as ChoiceKey];
                  const mentor = mentors.find((m) => m.id === mentorId);
                  if (!mentor) return null;
                  const msgKey = `message${num}` as MessageKey;
                  const color = CHOICE_COLORS[num - 1];

                  return (
                    <div key={num} className={`${color.light} rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-2 min-w-0">
                        <span className={`w-6 h-6 rounded-full ${color.bg} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{num}</span>
                        <span className="font-medium text-gray-800 shrink-0">{mentor.name}</span>
                        <span className="text-sm text-gray-500 truncate">{mentor.jobPosition || mentor.jobTitle || mentor.job}</span>
                      </div>
                      <textarea
                        value={formData[msgKey]}
                        onChange={(e) => setFormData({ ...formData, [msgKey]: e.target.value })}
                        placeholder={`${mentor.name}${t('apply.messagePlaceholder')}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={prevStep} className="btn-secondary flex-1">{t('apply.prev')}</button>
              <button onClick={nextStep} className="btn-primary flex-1">{t('apply.next')}</button>
            </div>
          </div>
        )}

        {/* Step 4: 확인 및 동의 */}
        {step === 4 && (
          <div className="card max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('apply.step4Title')}</h2>

            <div className="bg-warm-100 rounded-xl p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('apply.name')}</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('apply.birthDate').split(' (')[0]}</span>
                  <span className="font-medium">{formData.birthDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('apply.phone4').split(' (')[0]}</span>
                  <span className="font-medium">{formData.phone4}</span>
                </div>
                {formData.isForeigner && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('apply.foreigner').split(' (')[0]}</span>
                    <span className="font-medium">
                      {formData.languageGroup === 'english' ? t('apply.english') : t('apply.chinese')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
                const mentorId = formData[`choice${num}` as ChoiceKey];
                const mentor = mentors.find((m) => m.id === mentorId);
                const message = formData[`message${num}` as MessageKey];
                const color = CHOICE_COLORS[num - 1];

                return (
                  <div key={num} className={`p-3 rounded-xl ${color.light}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${color.bg}`}>
                        {num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{mentor?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{mentor?.jobPosition || mentor?.jobTitle || mentor?.job}</p>
                      </div>
                    </div>
                    {message && (
                      <p className="text-xs text-gray-500 mt-2 ml-11 italic">&ldquo;{message}&rdquo;</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">{t('apply.consent')}</h3>
              <div className="text-xs text-gray-600 space-y-1 mb-4">
                <p>• {t('apply.consentItem1')}</p>
                <p>• {t('apply.consentItem2')}</p>
                <p>• {t('apply.consentItem3')}</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5" />
                <span className="text-sm text-gray-700">
                  {t('apply.consentAgree')}
                </span>
              </label>
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{submitError}</div>
            )}

            <div className="flex gap-4">
              <button onClick={prevStep} className="btn-secondary flex-1">{t('apply.prev')}</button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agreedToTerms}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >{isSubmitting ? t('apply.submitting') : t('apply.submit')}</button>
            </div>
          </div>
        )}
      </main>

      {detailMentor && (
        <MentorModal mentor={detailMentor} onClose={() => setDetailMentor(null)} />
      )}
    </div>
  );
}
