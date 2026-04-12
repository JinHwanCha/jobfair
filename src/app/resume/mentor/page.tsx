'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { useI18n } from '@/lib/i18n';
import { CompanyType, getResumeSections, ResumeSectionKey } from '@/types';

interface ResumeApplicantView {
  name: string;
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  companyType: CompanyType[];
  reviewGoal: string;
  resumeText: string;
  resumeSections: Record<string, string>;
  queueNumber: number;
  createdAt: string;
}

export default function ResumeMentorPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [applicants, setApplicants] = useState<ResumeApplicantView[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleLogin = async () => {
    if (!name || !phone4 || phone4.length !== 4) {
      setError(t('mentor.errorBoth'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/resume/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone4 }),
      });
      const result = await response.json();

      if (result.success) {
        setMentorName(result.data.mentorName);
        setApplicants(result.data.applicants);
        setLoggedIn(true);
      } else {
        setError(result.error || t('mentor.errorGeneral'));
      }
    } catch {
      setError(t('mentor.errorGeneral'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="content-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('resume.mentorTitle')}</h1>
          <p className="text-gray-600">{t('resume.mentorSubtitle')}</p>
        </div>

        {!loggedIn ? (
          <div className="card max-w-md mx-auto">
            <div className="space-y-4">
              <div>
                <label className="label">{t('apply.name')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동" className="input-field" />
              </div>
              <div>
                <label className="label">{t('mentor.phone4Label')}</label>
                <input type="text" value={phone4} onChange={(e) => setPhone4(e.target.value)}
                  placeholder="1234" maxLength={4} className="input-field" />
              </div>
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
              <button onClick={handleLogin} disabled={isLoading} className="btn-primary w-full bg-blue-500 hover:bg-blue-600 text-white">
                {isLoading ? t('mentor.loading') : t('mentor.login')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 멘토 정보 */}
            <div className="bg-blue-50 rounded-2xl p-5 text-center">
              <p className="text-lg font-medium text-gray-900">{mentorName} {t('resume.mentorWelcome')}</p>
              <p className="text-sm text-gray-700 mt-1">
                {t('resume.totalApplicants')}: <span className="font-bold">{applicants.length}{t('resume.personUnit')}</span>
              </p>
            </div>

            {/* 신청자 목록 */}
            {applicants.length === 0 ? (
              <div className="text-center py-12 text-gray-500">{t('resume.noApplicants')}</div>
            ) : (
              <div className="space-y-4">
                {applicants.map((a, idx) => (
                  <div key={idx} className="card">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{a.name}</h4>
                          <p className="text-xs text-gray-500">
                            {a.department} · {a.currentStatus} · {t('mentor.desired')}: {a.desiredField}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg">{expandedIdx === idx ? '▲' : '▼'}</span>
                    </div>

                    {expandedIdx === idx && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div><span className="text-gray-500">{t('apply.birthYear')}:</span> <span className="font-medium">{a.birthYear}{t('apply.birthYearSuffix')}</span></div>
                          <div><span className="text-gray-500">{t('apply.currentStatus')}:</span> <span className="font-medium">{a.currentStatus}</span></div>
                          <div><span className="text-gray-500">{t('apply.department')}:</span> <span className="font-medium">{a.department}</span></div>
                          <div><span className="text-gray-500">{t('apply.desiredField')}:</span> <span className="font-medium">{a.desiredField}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">{t('resume.companyType')}:</span> <span className="font-medium">{a.companyType && a.companyType.length > 0 ? a.companyType.map((ct: string) => ({large: t('resume.companyType.large'), public: t('resume.companyType.public'), private: t('resume.companyType.private')}[ct] || ct)).join(', ') : '-'}</span></div>
                          {a.queueNumber > 0 && (
                            <div className="col-span-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                a.queueNumber <= 12 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {a.queueNumber <= 12 ? `${t('resume.queueConfirmed')} #${a.queueNumber}` : `${t('resume.queueWaitlist')} #${a.queueNumber}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {a.reviewGoal && (
                          <div className="bg-purple-50 rounded-xl p-3 mb-3">
                            <h5 className="font-bold text-purple-800 text-sm mb-1">🎯 {t('resume.reviewGoal')}</h5>
                            <p className="text-sm text-purple-700 whitespace-pre-wrap">{a.reviewGoal}</p>
                          </div>
                        )}

                        {/* 자소서 섹션별 표시 */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-gray-800 text-sm">📄 {t('resume.resumeContent')}</h5>
                            <button
                              onClick={() => {
                                const sectionKeys = a.resumeSections && Object.keys(a.resumeSections).length > 0
                                  ? getResumeSections(a.companyType || [])
                                  : [];
                                let text = '';
                                if (sectionKeys.length > 0) {
                                  text = sectionKeys.map(key => {
                                    const titleKey = `resume.section.${key}` as Parameters<typeof t>[0];
                                    return `[${t(titleKey)}]\n${a.resumeSections[key] || ''}`;
                                  }).join('\n\n');
                                } else {
                                  text = a.resumeText;
                                }
                                if (navigator.clipboard && window.isSecureContext) {
                                  navigator.clipboard.writeText(text);
                                } else {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = text;
                                  textarea.style.position = 'fixed';
                                  textarea.style.left = '-9999px';
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                }
                                setCopiedIdx(idx);
                                setTimeout(() => setCopiedIdx(null), 2000);
                              }}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              {copiedIdx === idx ? `✓ ${t('resume.section.copied')}` : `📋 ${t('resume.section.copyAll')}`}
                            </button>
                          </div>
                          {a.resumeSections && Object.keys(a.resumeSections).length > 0 ? (
                            <div className="space-y-4">
                              {getResumeSections(a.companyType || []).map(key => {
                                const titleKey = `resume.section.${key}` as Parameters<typeof t>[0];
                                const content = a.resumeSections[key];
                                if (!content) return null;
                                return (
                                  <div key={key}>
                                    <p className="text-xs font-bold text-blue-700 mb-1">{t(titleKey)}</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.resumeText}</p>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          {t('resume.appliedAt')}: {new Date(a.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
