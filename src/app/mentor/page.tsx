'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { CompanyType, getResumeSections } from '@/types';

interface Mentee {
  name: string;
  message: string;
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  interestTopics: string[];
}

interface UnassignedMentee {
  name: string;
  choiceNum: number;
  message: string;
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  interestTopics: string[];
}

interface TimeSlotData {
  time: number;
  mentees: Mentee[];
}

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
  jobPostingUrls: string[];
  queueNumber: number;
  createdAt: string;
}

interface MentorData {
  mentorName: string;
  mentorJob: string;
  isResumeMentor?: boolean;
  timeSlots?: TimeSlotData[];
  resumeApplicants?: ResumeApplicantView[];
  unassignedApplicants?: UnassignedMentee[];
}

export default function MentorPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MentorData | null>(null);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [expandedUnassignedIdx, setExpandedUnassignedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone4.length !== 4) {
      setError(t('mentor.errorBoth'));
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone4 }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || t('mentor.errorGeneral'));
      } else {
        setData(json.data);
      }
    } catch {
      setError(t('mentor.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('mentor.title')}</h1>
      <p className="text-gray-500 mb-6">{t('mentor.subtitle')}</p>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('apply.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('apply.namePlaceholder')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mentor.phone4Label')}</label>
            <input
              type="text"
              value={phone4}
              onChange={(e) => setPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-primary-400 text-gray-900 py-2.5 rounded-lg font-medium hover:bg-primary-500 transition-colors disabled:opacity-50"
        >
          {loading ? t('mentor.loading') : t('mentor.login')}
        </button>
      </form>

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 결과 */}
      {data && (
        <div>
          <div className="bg-primary-100 rounded-xl p-4 mb-6">
            <p className="text-gray-900 font-semibold text-lg">
              {data.mentorName} {t('mentor.mentorSuffix')}
            </p>
            <p className="text-gray-700 text-sm">{data.mentorJob}</p>
            {data.isResumeMentor && (
              <p className="text-sm text-primary-800 mt-1 font-medium">
                {t('resume.totalApplicants')}: {data.resumeApplicants?.length || 0}{t('resume.personUnit')}
              </p>
            )}
          </div>

          {/* 자소서 첨삭 멘토: 신청자 목록 */}
          {data.isResumeMentor && data.resumeApplicants && (
            <div className="space-y-4">
              {data.resumeApplicants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t('resume.noApplicants')}</div>
              ) : (
                data.resumeApplicants.map((a, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div
                      className="flex items-center justify-between cursor-pointer px-4 py-3"
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          a.queueNumber <= 12 ? 'bg-primary-200 text-gray-900' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.queueNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {a.name}
                            {a.queueNumber > 12 && <span className="ml-2 text-xs text-amber-600 font-normal">{t('resume.waitlistBadge')}</span>}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {a.department} · {a.currentStatus} · {t('mentor.desired')}: {a.desiredField}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg">{expandedIdx === idx ? '▲' : '▼'}</span>
                    </div>

                    {expandedIdx === idx && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div><span className="text-gray-500">{t('apply.birthYear')}:</span> <span className="font-medium">{a.birthYear}{t('apply.birthYearSuffix')}</span></div>
                          <div><span className="text-gray-500">{t('apply.currentStatus')}:</span> <span className="font-medium">{a.currentStatus}</span></div>
                          <div><span className="text-gray-500">{t('apply.department')}:</span> <span className="font-medium">{a.department}</span></div>
                          <div><span className="text-gray-500">{t('apply.desiredField')}:</span> <span className="font-medium">{a.desiredField}</span></div>
                          <div className="col-span-2">
                            <span className="text-gray-500">{t('resume.companyType')}:</span>{' '}
                            <span className="font-medium">
                              {a.companyType && a.companyType.length > 0
                                ? a.companyType.map((ct: string) => ({large: t('resume.companyType.large'), public: t('resume.companyType.public'), private: t('resume.companyType.private')}[ct] || ct)).join(', ')
                                : '-'}
                            </span>
                          </div>
                        </div>

                        {a.reviewGoal && (
                          <div className="bg-purple-50 rounded-xl p-4 mb-3">
                            <h5 className="font-bold text-gray-800 text-sm mb-2">🎯 {t('resume.reviewGoal')}</h5>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.reviewGoal}</p>
                          </div>
                        )}

                        {a.jobPostingUrls && a.jobPostingUrls.filter((u: string) => u.trim()).length > 0 && (
                          <div className="bg-indigo-50 rounded-xl p-4 mb-3">
                            <h5 className="font-bold text-gray-800 text-sm mb-2">🔗 채용공고 URL</h5>
                            <ul className="space-y-1">
                              {a.jobPostingUrls.filter((u: string) => u.trim()).map((url: string, i: number) => (
                                <li key={i} className="text-sm text-indigo-700 truncate">
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{url}</a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

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
                                copyText(text);
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
                                const sectionCopyId = `${idx}-${key}`;
                                return (
                                  <div key={key}
                                    onClick={() => {
                                      copyText(content);
                                      setCopiedSection(sectionCopyId);
                                      setTimeout(() => setCopiedSection(null), 2000);
                                    }}
                                    className="cursor-pointer hover:bg-blue-50 rounded-lg p-2 -mx-2 transition-colors relative group"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-xs font-bold text-blue-700">{t(titleKey)}</p>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                                        copiedSection === sectionCopyId
                                          ? 'bg-green-100 text-green-600'
                                          : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100'
                                      }`}>
                                        {copiedSection === sectionCopyId ? '✓ 복사됨' : '클릭하여 복사'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-blue-50 rounded-lg p-2 -mx-2 transition-colors"
                              onClick={() => {
                                copyText(a.resumeText);
                                setCopiedIdx(idx);
                                setTimeout(() => setCopiedIdx(null), 2000);
                              }}
                            >{a.resumeText}</p>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          {t('resume.appliedAt')}: {new Date(a.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 일반 멘토링 멘토: 타임 슬롯 */}
          {!data.isResumeMentor && data.timeSlots && (
          <div className="space-y-4">
            {data.timeSlots.map((slot) => (
              <div key={slot.time} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700">
                    {t('my.timeSlot')}{slot.time}
                  </h3>
                </div>
                <div className="p-4">
                  {slot.mentees.length === 0 ? (
                    <p className="text-gray-400 text-sm">{t('mentor.noMentees')}</p>
                  ) : (
                    <div className="space-y-3">
                      {slot.mentees.map((mentee, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 bg-warm-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-200 text-gray-900 rounded-full text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-800">{mentee.name}</span>
                          </div>
                          {/* 멘티 프로필 정보 */}
                          <div className="ml-8 flex flex-wrap gap-1.5 mt-1">
                            {mentee.department && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                                {mentee.department}
                              </span>
                            )}
                            {mentee.birthYear && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
                                {mentee.birthYear}{t('mentor.yearBorn')}
                              </span>
                            )}
                            {mentee.currentStatus && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">
                                {mentee.currentStatus}
                              </span>
                            )}
                            {mentee.desiredField && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700">
                                {t('mentor.desired')}: {mentee.desiredField}
                              </span>
                            )}
                            {mentee.interestTopics && mentee.interestTopics.length > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pink-50 text-pink-700">
                                {mentee.interestTopics.map(topic => t(`apply.topic_${topic}` as Parameters<typeof t>[0])).join(', ')}
                              </span>
                            )}
                          </div>
                          {mentee.message && (
                            <div className="ml-8 text-sm text-gray-600 bg-white rounded-md px-3 py-2 border border-gray-100 mt-1">
                              💬 {mentee.message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}

          {/* 신청했지만 배정되지 않은 신청자 */}
          {!data.isResumeMentor && (
            <div className="mt-6">
              <div
                className="flex items-center justify-between cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedUnassignedIdx(expandedUnassignedIdx === -1 ? null : -1)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold text-sm">📋 나를 선택했지만 미배정된 신청자</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    {data.unassignedApplicants?.length ?? 0}명
                  </span>
                </div>
                <span className="text-gray-400 text-sm">{expandedUnassignedIdx === -1 ? '▲' : '▼'}</span>
              </div>

              {expandedUnassignedIdx === -1 && (
                <div className="mt-2 space-y-2">
                  {!data.unassignedApplicants || data.unassignedApplicants.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">미배정된 신청자가 없습니다.</p>
                  ) : (
                    data.unassignedApplicants.map((mentee, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            mentee.choiceNum === 1 ? 'bg-blue-100 text-blue-700' :
                            mentee.choiceNum === 2 ? 'bg-green-100 text-green-700' :
                            mentee.choiceNum === 3 ? 'bg-purple-100 text-purple-700' :
                            mentee.choiceNum === 4 ? 'bg-orange-100 text-orange-700' :
                            mentee.choiceNum === 5 ? 'bg-pink-100 text-pink-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {mentee.choiceNum}지
                          </span>
                          <span className="font-medium text-gray-800">{mentee.name}</span>
                        </div>
                        <div className="ml-9 flex flex-wrap gap-1.5 mt-1">
                          {mentee.department && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{mentee.department}</span>
                          )}
                          {mentee.birthYear && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">{mentee.birthYear}{t('mentor.yearBorn')}</span>
                          )}
                          {mentee.currentStatus && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">{mentee.currentStatus}</span>
                          )}
                          {mentee.desiredField && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700">{t('mentor.desired')}: {mentee.desiredField}</span>
                          )}
                          {mentee.interestTopics && mentee.interestTopics.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pink-50 text-pink-700">
                              {mentee.interestTopics.map(topic => t(`apply.topic_${topic}` as Parameters<typeof t>[0])).join(', ')}
                            </span>
                          )}
                        </div>
                        {mentee.message && (
                          <div className="ml-9 text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2 border border-gray-100 mt-1">
                            💬 {mentee.message}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">{t('my.notes')}</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>{t('mentor.note1')}</li>
              <li>{t('mentor.note2')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* 초기 상태 */}
      {!data && !error && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>{t('mentor.prompt')}</p>
        </div>
      )}
    </div>
  );
}
