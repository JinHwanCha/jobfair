'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import CountdownTimer, { useIsOpen } from '@/components/CountdownTimer';
import ResumePreviewModal from '@/components/ResumePreviewModal';
import { Mentor, ResumeApplyFormData, getResumeSections, ResumeSectionKey } from '@/types';
import { useI18n } from '@/lib/i18n';

export default function ResumeApplyPage() {
  const { t } = useI18n();
  const isOpen = useIsOpen();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [birthYearConfirmed, setBirthYearConfirmed] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [step2Attempted, setStep2Attempted] = useState(false);

  const [formData, setFormData] = useState<ResumeApplyFormData>({
    name: '',
    birthDate: '',
    phone4: '',
    department: '',
    birthYear: '',
    currentStatus: '',
    desiredField: '',
    companyType: [],
    reviewGoal: '',
    resumeText: '',
    resumeSections: {},
    jobPostingUrls: [],
    agreedToTerms: false,
  });

  useEffect(() => {
    fetch('/api/resume/mentors')
      .then(res => res.json())
      .then(result => { if (result.success) setMentors(result.data); })
      .catch(console.error);
  }, []);

  const derivedBirthYear = (() => {
    const yy = formData.birthDate.slice(0, 2);
    if (!yy || yy.length < 2) return '';
    const num = parseInt(yy, 10);
    return num <= 30 ? `20${yy}` : `19${yy}`;
  })();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'birthDate') {
      setBirthYearConfirmed(false);
      setFormData(prev => ({ ...prev, birthDate: value, birthYear: '' }));
      return;
    }
    const checked = (e.target as HTMLInputElement).checked;
    const type = (e.target as HTMLInputElement).type;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.agreedToTerms) {
      alert(t('resume.alertConsent'));
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // resumeText 자동 생성
      const sectionKeys = getResumeSections(formData.companyType);
      const combinedText = sectionKeys.map(key => `[${key}]\n${formData.resumeSections[key] || ''}`).join('\n\n');

      const response = await fetch('/api/resume/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, resumeText: combinedText, jobPostingUrls: formData.jobPostingUrls.filter(u => u.trim()) }),
      });
      const result = await response.json();

      if (result.success) {
        setQueueNumber(result.data.queueNumber);
        setSubmitSuccess(true);
      } else if (result.error === 'CROSS_BLOCK_MENTORING') {
        setSubmitError(t('resume.crossBlockMentoringError'));
      } else {
        setSubmitError(result.error || '신청 중 오류가 발생했습니다.');
      }
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoStep2 = formData.name && formData.birthDate.length === 6 && formData.phone4.length === 4;
  const canGoStep3 = formData.department && birthYearConfirmed && formData.currentStatus && formData.desiredField && formData.companyType.length > 0;
  const activeSections = getResumeSections(formData.companyType);
  const canGoStep4 = activeSections.length > 0 && activeSections.every(key => (formData.resumeSections[key] || '').trim().length >= 10);

  // 신청 오픈 전 안내 화면
  if (isOpen === false) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('resume.title')}</h1>
            <p className="text-gray-600">{t('resume.subtitle')}</p>
            <div className="flex flex-col items-center gap-2 mt-3 max-w-lg mx-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
                {t('resume.waitlistNotice')}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
                {t('resume.crossBlockMentoring')}
              </div>
            </div>
          </div>
          <div className="card max-w-lg mx-auto py-10 px-4 text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">{t('apply.notYetOpen')}</h2>
            <CountdownTimer />
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 mt-6 text-left whitespace-pre-wrap">
              {t('resumePreview.prepareNotice')}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={() => setShowPreview(true)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <span>📋</span>
                {t('resumePreview.button')}
              </button>
              <Link href="/" className="btn-secondary flex-1 inline-flex items-center justify-center">
                {t('apply.goHome')}
              </Link>
            </div>
          </div>
          {showPreview && <ResumePreviewModal onClose={() => setShowPreview(false)} />}
        </main>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-container">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('resume.successTitle')}</h2>
            <p className="text-gray-600 mb-4">{t('resume.successDesc')}</p>
            {queueNumber && (
              <div className={`inline-flex items-center gap-2 mb-6 px-5 py-3 rounded-full text-sm font-bold ${
                queueNumber <= 12 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {queueNumber <= 12
                  ? `${t('resume.queueConfirmed')} #${queueNumber}`
                  : `${t('resume.queueWaitlist')} #${queueNumber} (${t('resume.queueWaitlistHint')})`
                }
              </div>
            )}
            <Link href="/" className="btn-primary inline-block">{t('apply.goHome')}</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main className="content-container">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('resume.title')}</h1>
          <p className="text-gray-600">{t('resume.subtitle')}</p>
        </div>

        {/* 자소서 멘토 소개 */}
        {mentors.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">{t('resume.mentorsTitle')}</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {mentors.map(m => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  onClickDetail={() => setSelectedMentor(m)}
                />
              ))}
            </div>
          </div>
        )}

        {selectedMentor && (
          <MentorModal
            mentor={selectedMentor}
            onClose={() => setSelectedMentor(null)}
          />
        )}

        {/* 교차 신청 안내 */}
        <div className="max-w-lg mx-auto mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            {t('resume.crossBlockMentoring')}
          </div>
        </div>

        {/* 예비번호 안내 */}
        <div className="max-w-lg mx-auto mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            {t('resume.waitlistInfo')}
          </div>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                step >= s ? 'bg-primary-400 text-gray-900' : 'bg-gray-200 text-gray-400'
              }`}>{s}</div>
              {s < 4 && <div className={`w-6 sm:w-12 h-1 rounded ${step > s ? 'bg-primary-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

          <>
            {/* Step 1: 기본 정보 */}
            {step === 1 && (
              <div className="card max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('apply.step1Title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">{t('apply.name')}</label>
                    <input type="text" name="name" value={formData.name}
                      onChange={handleInputChange} placeholder={t('apply.namePlaceholder')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">{t('apply.birthDate')}</label>
                    <input type="text" name="birthDate" value={formData.birthDate}
                      onChange={handleInputChange} placeholder="010101" maxLength={6} className="input-field" />
                    <p className="text-xs text-gray-500 mt-1">{t('apply.birthDateHint')}</p>
                  </div>
                  <div>
                    <label className="label">{t('apply.phone4')}</label>
                    <input type="text" name="phone4" value={formData.phone4}
                      onChange={handleInputChange} placeholder="1234" maxLength={4} className="input-field" />
                  </div>
                </div>
                <button onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2}
                  className="btn-primary w-full mt-6">{t('apply.next')}</button>
              </div>
            )}

            {/* Step 2: 프로필 */}
            {step === 2 && (
              <div className="card max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('apply.step2Title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">{t('apply.department')}</label>
                    <input type="text" name="department" value={formData.department}
                      onChange={handleInputChange} placeholder={t('apply.departmentPlaceholder')} className={`input-field ${step2Attempted && !formData.department ? 'border-red-400 bg-red-50' : ''}`} />
                    {step2Attempted && !formData.department && <p className="text-xs text-red-500 mt-1">{t('resume.fieldRequired')}</p>}
                  </div>
                  <div>
                    <label className="label">{t('apply.birthYear')}</label>
                    {derivedBirthYear && !birthYearConfirmed ? (
                      <div className="bg-warm-100 rounded-xl p-4">
                        <p className="text-gray-800 font-medium mb-3">
                          <span className="text-xl font-bold text-primary-800">{derivedBirthYear}</span>
                          {t('apply.birthYearSuffix')} {t('apply.birthYearConfirmQ')}
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => {
                            setBirthYearConfirmed(true);
                            setFormData(prev => ({ ...prev, birthYear: derivedBirthYear }));
                          }} className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors text-sm">
                            {t('apply.birthYearYes')}
                          </button>
                          <button onClick={() => {
                            setBirthYearConfirmed(true);
                            setFormData(prev => ({ ...prev, birthYear: '' }));
                          }} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors text-sm">
                            {t('apply.birthYearNo')}
                          </button>
                        </div>
                      </div>
                    ) : birthYearConfirmed && !formData.birthYear ? (
                      <input type="text" name="birthYear" value={formData.birthYear}
                        onChange={handleInputChange} placeholder={t('apply.birthYearManualPlaceholder')} maxLength={4} className="input-field" />
                    ) : (
                      <div className="bg-green-50 rounded-xl p-3 text-green-700 font-medium">
                        ✓ {formData.birthYear}{t('apply.birthYearSuffix')}
                      </div>
                    )}
                    {step2Attempted && !birthYearConfirmed && <p className="text-xs text-red-500 mt-1">{t('resume.birthYearRequired')}</p>}
                  </div>
                  <div>
                    <label className="label">{t('apply.currentStatus')}</label>
                    <select name="currentStatus" value={formData.currentStatus}
                      onChange={handleInputChange} className={`input-field ${step2Attempted && !formData.currentStatus ? 'border-red-400 bg-red-50' : ''}`}>
                      <option value="">{t('apply.currentStatusPlaceholder')}</option>
                      <option value="1학년">{t('apply.status1')}</option>
                      <option value="2학년">{t('apply.status2')}</option>
                      <option value="3학년">{t('apply.status3')}</option>
                      <option value="4학년">{t('apply.status4')}</option>
                      <option value="취준생">{t('apply.statusJobSeeker')}</option>
                      <option value="기타">{t('apply.statusOther')}</option>
                    </select>
                    {step2Attempted && !formData.currentStatus && <p className="text-xs text-red-500 mt-1">{t('resume.fieldRequired')}</p>}
                  </div>
                  <div>
                    <label className="label">{t('apply.desiredField')}</label>
                    <input type="text" name="desiredField" value={formData.desiredField}
                      onChange={handleInputChange} placeholder={t('apply.desiredFieldPlaceholder')} className={`input-field ${step2Attempted && !formData.desiredField ? 'border-red-400 bg-red-50' : ''}`} />
                    {step2Attempted && !formData.desiredField && <p className="text-xs text-red-500 mt-1">{t('resume.fieldRequired')}</p>}
                  </div>
                  <div>
                    <label className="label">{t('resume.companyType')}</label>
                    <p className="text-xs text-gray-500 mb-2">{t('resume.companyTypeHint')}</p>
                    <div className="flex flex-wrap gap-3">
                      {(['large', 'public', 'private'] as const).map((ct) => (
                        <label key={ct} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                          formData.companyType.includes(ct)
                            ? 'border-primary-400 bg-primary-50 text-primary-800'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={formData.companyType.includes(ct)}
                            onChange={() => {
                              setFormData(prev => {
                                const newCompanyType = prev.companyType.includes(ct)
                                  ? prev.companyType.filter(c => c !== ct)
                                  : [...prev.companyType, ct];
                                const wasPublic = prev.companyType.includes('public');
                                const isPublic = newCompanyType.includes('public');
                                let newSections = { ...prev.resumeSections };
                                if (wasPublic && !isPublic && newSections.motivationPublic && !newSections.motivation) {
                                  newSections.motivation = newSections.motivationPublic;
                                } else if (!wasPublic && isPublic && newSections.motivation && !newSections.motivationPublic) {
                                  newSections.motivationPublic = newSections.motivation;
                                }
                                return { ...prev, companyType: newCompanyType, resumeSections: newSections };
                              });
                            }}
                            className="w-4 h-4 accent-primary-500"
                          />
                          <span className="text-sm font-medium">{{large: t('resume.companyType.large'), public: t('resume.companyType.public'), private: t('resume.companyType.private')}[ct]}</span>
                        </label>
                      ))}
                    </div>
                    {step2Attempted && formData.companyType.length === 0 && <p className="text-xs text-red-500 mt-2">{t('resume.companyTypeRequired')}</p>}
                  </div>
                  {/* 채용공고 URL (선택사항) */}
                  <div>
                    <label className="label">채용공고 URL <span className="text-gray-400 font-normal text-xs">(선택사항)</span></label>
                    <p className="text-xs text-gray-500 mb-2">가장 최근에 지원했거나, 지원하고 싶은 실제 채용공고 URL을 입력해주세요.</p>
                    <div className="space-y-2">
                      {formData.jobPostingUrls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.jobPostingUrls];
                              newUrls[i] = e.target.value;
                              setFormData(prev => ({ ...prev, jobPostingUrls: newUrls }));
                            }}
                            placeholder="https://..."
                            className="input-field flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                jobPostingUrls: prev.jobPostingUrls.filter((_, idx) => idx !== i),
                              }));
                            }}
                            className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {formData.jobPostingUrls.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, jobPostingUrls: [...prev.jobPostingUrls, ''] }))}
                          className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <span>+</span> URL 추가
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">{t('apply.prev')}</button>
                  <button onClick={() => { setStep2Attempted(true); if (canGoStep3) setStep(3); }}
                    className={`btn-primary flex-1 ${!canGoStep3 && step2Attempted ? 'opacity-60' : ''}`}>{t('apply.next')}</button>
                </div>
              </div>
            )}

            {/* Step 3: 자소서 작성 (섹션별) */}
            {step === 3 && (
              <div className="card max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{t('resume.writeTitle')}</h3>
                <p className="text-sm text-gray-600 mb-2">{t('resume.writeDesc')}</p>
                <div className="inline-block bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-800 mb-4">
                  {formData.companyType.includes('public') ? t('resume.writeTemplatePublic') : t('resume.writeTemplatePrivate')}
                </div>

                <div className="space-y-6">
                  {activeSections.map((sectionKey) => {
                    const titleKey = `resume.section.${sectionKey}` as Parameters<typeof t>[0];
                    const promptKey = `resume.section.${sectionKey}.prompt` as Parameters<typeof t>[0];
                    const content = formData.resumeSections[sectionKey] || '';
                    return (
                      <div key={sectionKey}>
                        <label className="label">{t(titleKey)}</label>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap mb-2">{t(promptKey)}</p>
                        <textarea
                          value={content}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            resumeSections: { ...prev.resumeSections, [sectionKey]: e.target.value },
                          }))}
                          rows={8}
                          className="input-field resize-y min-h-[160px]"
                          maxLength={1500}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {content.length > 0 && content.trim().length < 10 && (
                            <p className="text-xs text-red-500 font-medium">{t('resume.section.minChar')}</p>
                          )}
                          <p className={`text-xs text-right ml-auto ${content.length < 600 ? 'text-amber-600' : content.length > 1000 ? 'text-amber-600' : 'text-green-600'}`}>
                            {content.length}{t('resume.section.charCount')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <label className="label">{t('resume.reviewGoal')}</label>
                  <p className="text-xs text-gray-500 mb-2">{t('resume.reviewGoalHint')}</p>
                  <textarea
                    name="reviewGoal"
                    value={formData.reviewGoal}
                    onChange={handleInputChange}
                    placeholder={t('resume.reviewGoalPlaceholder')}
                    rows={3}
                    className="input-field resize-y min-h-[80px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formData.reviewGoal.length} / 500
                  </p>
                </div>
                {!canGoStep4 && activeSections.some(key => (formData.resumeSections[key] || '').trim().length > 0) && (
                  <p className="text-xs text-red-500 text-center mt-4">{t('resume.section.fillAll')}</p>
                )}
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">{t('apply.prev')}</button>
                  <button onClick={() => canGoStep4 && setStep(4)} disabled={!canGoStep4}
                    className="btn-primary flex-1">{t('apply.next')}</button>
                </div>
              </div>
            )}

            {/* Step 4: 확인 & 제출 */}
            {step === 4 && (
              <div className="card max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('resume.confirmTitle')}</h3>

                <div className="space-y-3 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">{t('apply.name')}:</span> <span className="font-medium">{formData.name}</span></div>
                      <div><span className="text-gray-500">{t('apply.birthDate')}:</span> <span className="font-medium">{formData.birthDate}</span></div>
                      <div><span className="text-gray-500">{t('apply.department')}:</span> <span className="font-medium">{formData.department}</span></div>
                      <div><span className="text-gray-500">{t('apply.currentStatus')}:</span> <span className="font-medium">{formData.currentStatus}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">{t('apply.desiredField')}:</span> <span className="font-medium">{formData.desiredField}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">{t('resume.companyType')}:</span> <span className="font-medium">{formData.companyType.map(ct => ({large: t('resume.companyType.large'), public: t('resume.companyType.public'), private: t('resume.companyType.private')}[ct])).join(', ')}</span></div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">{t('resume.writeTitle')}</h4>
                    <div className="space-y-3">
                      {activeSections.map(sectionKey => {
                        const titleKey = `resume.section.${sectionKey}` as Parameters<typeof t>[0];
                        return (
                          <div key={sectionKey}>
                            <p className="text-xs font-bold text-blue-700 mb-1">{t(titleKey)}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{formData.resumeSections[sectionKey] || ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {formData.reviewGoal && (
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">{t('resume.reviewGoal')}</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.reviewGoal}</p>
                    </div>
                  )}

                  {formData.jobPostingUrls.filter(u => u.trim()).length > 0 && (
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm">🔗 채용공고 URL</h4>
                      <ul className="space-y-1">
                        {formData.jobPostingUrls.filter(u => u.trim()).map((url, i) => (
                          <li key={i} className="text-sm text-indigo-700 truncate">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{url}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 동의 */}
                <div className="border border-gray-200 rounded-xl p-4 mb-4">
                  <h4 className="font-bold text-gray-800 mb-2 text-sm">{t('apply.consent')}</h4>
                  <ul className="text-xs text-gray-600 space-y-1 mb-3">
                    <li>• {t('resume.consentItem1')}</li>
                    <li>• {t('apply.consentItem2')}</li>
                    <li>• {t('apply.consentItem3')}</li>
                    <li>• {t('resume.consentItem4')}</li>
                  </ul>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms}
                      onChange={handleInputChange} className="mt-1 w-4 h-4 accent-blue-500" />
                    <span className="text-sm text-gray-700">{t('apply.consentAgree')}</span>
                  </label>
                </div>

                {submitError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{submitError}</div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="btn-secondary flex-1">{t('apply.prev')}</button>
                  <button onClick={handleSubmit} disabled={isSubmitting || !formData.agreedToTerms}
                    className="btn-primary flex-1">
                    {isSubmitting ? t('apply.submitting') : t('resume.submit')}
                  </button>
                </div>
              </div>
            )}
          </>
      </main>
    </div>
  );
}
