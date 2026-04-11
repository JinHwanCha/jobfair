'use client';

import { useState, useEffect, useMemo } from 'react';
import { Applicant, Assignment, Mentor } from '@/types';

type ChoiceKey = 'choice1' | 'choice2' | 'choice3' | 'choice4' | 'choice5' | 'choice6';
type MessageKey = 'message1' | 'message2' | 'message3' | 'message4' | 'message5' | 'message6';

export default function AdminPage() {

  const extractShortCategory = (category: string): string => {
    const known = [
      'Building', 'Leading', 'Operating', 'Teaching',
      'Connecting', 'Creating', 'Healing', 'Influencing',
      'Protecting Justice', 'Serving',
    ];
    const found = known.find(k => category.includes(k));
    return found || '기타';
  };

  const [activeTab, setActiveTab] = useState<'applicants' | 'assignments' | 'mentors'>('applicants');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorCounts, setMentorCounts] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorCategory, setMentorCategory] = useState('전체');
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);

  // 멘토별 신청자 목록 (이름과 메시지 포함)
  const mentorApplicantsMap = useMemo(() => {
    const map: Record<string, { name: string; choiceNum: number; message: string }[]> = {};
    mentors.forEach(m => { map[m.id] = []; });
    applicants.forEach(applicant => {
      for (let i = 1; i <= 6; i++) {
        const choiceId = applicant[`choice${i}` as ChoiceKey];
        if (choiceId && map[choiceId]) {
          map[choiceId].push({
            name: applicant.name,
            choiceNum: i,
            message: (applicant[`message${i}` as MessageKey] as string) || '',
          });
        }
      }
    });
    return map;
  }, [applicants, mentors]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin');
      const result = await response.json();
      if (result.success) {
        setApplicants(result.data.applicants || []);
        setAssignments(result.data.assignments || []);
        setMentors(result.data.mentors || []);
        setMentorCounts(result.data.mentorCounts || {});
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runAssignment = async () => {
    if (!confirm('자동 배정을 실행하시겠습니까? 기존 배정 결과가 덮어씌워집니다.')) return;
    setIsAssigning(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/assign', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setMessage(`배정 완료! ${result.data.count}명이 배정되었습니다.`);
        loadData();
      } else {
        setMessage(`오류: ${result.error}`);
      }
    } catch {
      setMessage('배정 실행 중 오류가 발생했습니다.');
    } finally {
      setIsAssigning(false);
    }
  };

  const deleteAllData = async () => {
    const code = prompt('관리자 코드를 입력하세요:');
    if (!code) return;
    if (!confirm('정말로 모든 신청자/배정 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    setIsDeleting(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage('모든 데이터가 삭제되었습니다.');
        loadData();
      } else {
        setMessage(`오류: ${result.error}`);
      }
    } catch {
      setMessage('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteApplicant = async (applicantId: string, applicantName: string) => {
    const code = prompt(`"${applicantName}" 신청자를 삭제합니다. 관리자 코드를 입력하세요:`);
    if (!code) return;
    setMessage('');
    try {
      const response = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, applicantId }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage(`"${applicantName}" 신청자가 삭제되었습니다.`);
        loadData();
      } else {
        setMessage(`오류: ${result.error}`);
      }
    } catch {
      setMessage('삭제 중 오류가 발생했습니다.');
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/export');
      const result = await response.json();
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobfair-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('내보내기 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">직업박람회 관리</h1>
              <p className="text-sm text-gray-500">
                총 신청자: {applicants.length}명 | 배정 완료: {assignments.length}명
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={deleteAllData} disabled={isDeleting || applicants.length === 0}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs sm:text-sm font-medium disabled:opacity-50">
                {isDeleting ? '삭제 중...' : '전체 삭제'}
              </button>
              <button onClick={exportData}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-medium">
                내보내기
              </button>
              <button onClick={runAssignment} disabled={isAssigning || applicants.length === 0}
                className="px-3 py-2 bg-primary-400 text-gray-900 rounded-lg hover:bg-primary-500 text-xs sm:text-sm font-medium disabled:opacity-50">
                {isAssigning ? '배정 중...' : '자동 배정'}
              </button>
            </div>
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sm:mt-6">
        <div className="flex gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
          {(['applicants', 'assignments', 'mentors'] as const).map((tab) => {
            const labels = { applicants: `신청자 (${applicants.length})`, assignments: `배정 (${assignments.length})`, mentors: `멘토 (${mentors.length})` };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-primary-400 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 신청자 목록 */}
        {activeTab === 'applicants' && (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {applicants.map((applicant) => (
                <div key={applicant.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{applicant.name}</span>
                    <button onClick={() => deleteApplicant(applicant.id, applicant.name)}
                      className="text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">삭제</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                    <span>생년월일: {applicant.birthDate}</span>
                    <span>전화: {applicant.phone4}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
                      const choiceId = applicant[`choice${num}` as ChoiceKey];
                      const mentor = mentors.find(m => m.id === choiceId);
                      const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
                      return (
                        <span key={num} className={`text-xs bg-${colors[num - 1]}-50 text-${colors[num - 1]}-700 px-2 py-0.5 rounded-full`}>
                          {num}지망: {mentor?.name || '-'}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    신청: {new Date(applicant.createdAt).toLocaleString('ko-KR')}
                    {applicant.updatedAt !== applicant.createdAt && (
                      <span className="ml-2 text-orange-500">수정: {new Date(applicant.updatedAt).toLocaleString('ko-KR')}</span>
                    )}
                  </p>
                </div>
              ))}
              {applicants.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 신청자가 없습니다.</div>
              )}
            </div>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화</th>
                      {Array.from({ length: 6 }, (_, i) => (
                        <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{i + 1}지망</th>
                      ))}
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">수정일</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applicants.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{applicant.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{applicant.birthDate}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{applicant.phone4}</td>
                        {Array.from({ length: 6 }, (_, i) => {
                          const choiceId = applicant[`choice${i + 1}` as ChoiceKey];
                          return (
                            <td key={i} className="px-3 py-3 text-sm text-gray-500">
                              {mentors.find(m => m.id === choiceId)?.name || '-'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(applicant.createdAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          {applicant.updatedAt !== applicant.createdAt ? (
                            <span className="text-orange-500">{new Date(applicant.updatedAt).toLocaleString('ko-KR')}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => deleteApplicant(applicant.id, applicant.name)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applicants.length === 0 && (
                  <div className="text-center py-12 text-gray-500">아직 신청자가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 배정 결과 */}
        {activeTab === 'assignments' && (
          <>
            <div className="sm:hidden space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.applicantId} className="bg-white rounded-xl shadow-sm p-4">
                  <h4 className="font-bold text-gray-900 mb-3">{assignment.applicantName}</h4>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }, (_, i) => {
                      const slot = (assignment as unknown as Record<string, unknown>)[`time${i + 1}`] as Assignment['time1'];
                      const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className={`text-xs bg-${colors[i]}-50 text-${colors[i]}-700 px-2 py-0.5 rounded-full font-medium`}>{i + 1}타임</span>
                          {slot ? (
                            <span className={slot.isOriginalChoice ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                              {slot.mentorName}
                              {!slot.isOriginalChoice && slot.originalChoice && (
                                <span className="text-xs text-gray-400 ml-1">(원래: {slot.originalChoice})</span>
                              )}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 배정 결과가 없습니다.</div>
              )}
            </div>
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                      {Array.from({ length: 6 }, (_, i) => (
                        <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase" colSpan={2}>{i + 1}타임 / 장소</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.applicantId} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{assignment.applicantName}</td>
                        {Array.from({ length: 6 }, (_, i) => {
                          const slot = (assignment as unknown as Record<string, unknown>)[`time${i + 1}`] as Assignment['time1'];
                          return [
                            <td key={`m${i}`} className="px-3 py-3 text-sm">
                              {slot ? (
                                <span className={slot.isOriginalChoice ? 'text-green-600' : 'text-orange-600'}>
                                  {slot.mentorName}
                                  {!slot.isOriginalChoice && slot.originalChoice && (
                                    <span className="text-xs text-gray-400 block">(원래: {slot.originalChoice})</span>
                                  )}
                                </span>
                              ) : '-'}
                            </td>,
                            <td key={`l${i}`} className="px-3 py-3 text-sm text-gray-500">{slot?.location || '-'}</td>
                          ];
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {assignments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">아직 배정 결과가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 멘토별 현황 */}
        {activeTab === 'mentors' && (
          <>
            <div className="mb-4 space-y-3">
              <input type="text" placeholder="멘토 이름 또는 직업으로 검색..."
                value={mentorSearch} onChange={(e) => setMentorSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              <div className="flex flex-wrap gap-2">
                {['전체', ...Array.from(new Set(mentors.map(m => extractShortCategory(m.category)))).sort()].map((cat) => (
                  <button key={cat} onClick={() => setMentorCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      mentorCategory === cat ? 'bg-primary-500 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors
                .filter((mentor) => {
                  const q = mentorSearch.toLowerCase();
                  const matchesSearch = !q || mentor.name.toLowerCase().includes(q) || mentor.job.toLowerCase().includes(q);
                  const matchesCategory = mentorCategory === '전체' || extractShortCategory(mentor.category) === mentorCategory;
                  return matchesSearch && matchesCategory;
                })
                .map((mentor) => {
                  const counts = mentorCounts[mentor.id] || {};
                  const total = (counts as Record<string, number>).total || 0;
                  const applicantsList = mentorApplicantsMap[mentor.id] || [];
                  const isExpanded = expandedMentor === mentor.id;

                  return (
                    <div key={mentor.id} className="bg-white rounded-xl shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{mentor.name}</h3>
                          <p className="text-sm text-gray-600">{mentor.jobPosition || mentor.job}</p>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                          {extractShortCategory(mentor.category)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500">{i + 1}지망</span>
                            <span className="font-medium">{(counts as Record<string, number>)[`choice${i + 1}`] || 0}명</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">총 신청</span>
                          <span className="font-bold text-gray-900">{total}명</span>
                        </div>
                      </div>

                      {/* 신청자 리스트 토글 */}
                      {applicantsList.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedMentor(isExpanded ? null : mentor.id)}
                            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                          >
                            {isExpanded ? '▲ 신청자 접기' : `▼ 신청자 보기 (${applicantsList.length}명)`}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                              {applicantsList.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      item.choiceNum <= 3 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {item.choiceNum}지망
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                  </div>
                                  {item.message && (
                                    <p className="text-xs text-gray-500 mt-1 ml-1 italic">&ldquo;{item.message}&rdquo;</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500">
                        장소: {mentor.location}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
