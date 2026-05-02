'use client';

import { useState, useEffect, useMemo } from 'react';
import { Applicant, Assignment, Mentor, ResumeApplicant, CancelledApplicant, getResumeSections } from '@/types';

type ChoiceKey = 'choice1' | 'choice2' | 'choice3' | 'choice4' | 'choice5' | 'choice6';
type MessageKey = 'message1' | 'message2' | 'message3' | 'message4' | 'message5' | 'message6';

type LangFilter = 'all' | 'korean' | 'english' | 'chinese';
function LangFilterBar({ value, onChange }: { value: LangFilter; onChange: (v: LangFilter) => void }) {
  const options: { key: LangFilter; label: string; active: string }[] = [
    { key: 'all', label: '전체', active: 'bg-gray-700 text-white' },
    { key: 'korean', label: '한국인', active: 'bg-blue-600 text-white' },
    { key: 'english', label: '영어권', active: 'bg-green-600 text-white' },
    { key: 'chinese', label: '중화권', active: 'bg-red-600 text-white' },
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === o.key ? o.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState<'applicants' | 'assignments' | 'mentors' | 'resume' | 'cancelled' | 'table'>('applicants');
  const [tableLangFilter, setTableLangFilter] = useState<'all' | 'korean' | 'english' | 'chinese'>('all');
  const [applicantsLangFilter, setApplicantsLangFilter] = useState<'all' | 'korean' | 'english' | 'chinese'>('all');
  const [assignmentsLangFilter, setAssignmentsLangFilter] = useState<'all' | 'korean' | 'english' | 'chinese'>('all');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [resumeApplicants, setResumeApplicants] = useState<ResumeApplicant[]>([]);
  const [cancelledApplicants, setCancelledApplicants] = useState<CancelledApplicant[]>([]);
  const [mentorCounts, setMentorCounts] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [excludePairsText, setExcludePairsText] = useState(''); // "멘티이름,멘토이름" 한 줄씩
  const [showExclude, setShowExclude] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorCategory, setMentorCategory] = useState('전체');
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);
  const [expandedResume, setExpandedResume] = useState<string | null>(null);

  // 신청자 ID → 언어 그룹 맵
  const applicantLangMap = useMemo(() => {
    const map = new Map<string, 'korean' | 'english' | 'chinese'>();
    applicants.forEach(a => {
      if (!a.isForeigner) map.set(a.id, 'korean');
      else if (a.languageGroup === 'english') map.set(a.id, 'english');
      else if (a.languageGroup === 'chinese') map.set(a.id, 'chinese');
      else map.set(a.id, 'korean');
    });
    return map;
  }, [applicants]);

  // 멘토 중심 배정표 데이터 (mentorId → time1~4 배정자 목록)
  type SlotEntry = { applicantId: string; applicantName: string; isOriginalChoice: boolean };
  const mentorTableData = useMemo(() => {
    const data: Record<string, { time1: SlotEntry[]; time2: SlotEntry[]; time3: SlotEntry[]; time4: SlotEntry[] }> = {};
    mentors.forEach(m => { data[m.id] = { time1: [], time2: [], time3: [], time4: [] }; });
    assignments.forEach(a => {
      for (let t = 1; t <= 4; t++) {
        const slot = (a as unknown as Record<string, unknown>)[`time${t}`] as Assignment['time1'];
        if (slot && data[slot.mentorId]) {
          data[slot.mentorId][`time${t}` as 'time1' | 'time2' | 'time3' | 'time4'].push({
            applicantId: a.applicantId,
            applicantName: a.applicantName,
            isOriginalChoice: slot.isOriginalChoice,
          });
        }
      }
    });
    return data;
  }, [assignments, mentors]);

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
        setResumeApplicants(result.data.resumeApplicants || []);
        setCancelledApplicants(result.data.cancelledApplicants || []);
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
      // excludePairsText: "멘티이름,멘토이름" 한 줄씩 파싱 → applicantId/mentorId로 변환
      const excludePairs: { applicantId: string; mentorId: string }[] = [];
      for (const line of excludePairsText.split('\n')) {
        const parts = line.trim().split(',');
        if (parts.length < 2) continue;
        const [applicantName, mentorName] = parts.map(s => s.trim());
        const applicant = applicants.find(a => a.name === applicantName);
        const mentor = mentors.find(m => m.name === mentorName);
        if (applicant && mentor) excludePairs.push({ applicantId: applicant.id, mentorId: mentor.id });
      }
      const response = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludePairs }),
      });
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

  const deleteResume = async (resumeApplicantId: string, name: string) => {
    const code = prompt(`"${name}" 자소서 신청자를 삭제합니다. 관리자 코드를 입력하세요:`);
    if (!code) return;
    setMessage('');
    try {
      const response = await fetch('/api/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, resumeApplicantId }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage(`"${name}" 자소서 신청자가 삭제되었습니다.`);
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
                총 신청자: {applicants.length}명 | 배정 완료: {assignments.length}명 | 자소서: {resumeApplicants.length}명 | 취소: {cancelledApplicants.length}명
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
              <button onClick={() => setShowExclude(v => !v)}
                className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-xs sm:text-sm font-medium">
                제외 설정
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
          {showExclude && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs font-medium text-yellow-800 mb-1">배정 제외 쌍 (멘티이름,멘토이름 — 한 줄에 하나)</p>
              <textarea
                value={excludePairsText}
                onChange={e => setExcludePairsText(e.target.value)}
                placeholder={'두나린,장한솔\n홍길동,김철수'}
                rows={3}
                className="w-full text-xs border border-yellow-300 rounded p-2 font-mono resize-y bg-white"
              />
              <p className="text-xs text-yellow-600 mt-1">자동 배정 실행 시 해당 쌍은 제외되고 다른 멘토로 재배정됩니다.</p>
            </div>
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sm:mt-6">
        <div className="flex gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm">
          {(['applicants', 'assignments', 'table', 'mentors', 'resume', 'cancelled'] as const).map((tab) => {
            const labels = { applicants: `신청자 (${applicants.length})`, assignments: `배정 (${assignments.length})`, table: '배정표', mentors: `멘토 (${mentors.length})`, resume: `자소서 (${resumeApplicants.length})`, cancelled: `취소 (${cancelledApplicants.length})` };
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
            <LangFilterBar value={applicantsLangFilter} onChange={setApplicantsLangFilter} />
            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {applicants.filter(a => applicantsLangFilter === 'all' || applicantLangMap.get(a.id) === applicantsLangFilter).map((applicant) => (
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
              {applicants.filter(a => applicantsLangFilter === 'all' || applicantLangMap.get(a.id) === applicantsLangFilter).length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 신청자가 없습니다.</div>
              )}
            </div>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">이름</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">생년월일</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">전화</th>
                      {Array.from({ length: 6 }, (_, i) => (
                        <th key={i} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">{i + 1}지망</th>
                      ))}
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">신청일</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">수정일</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applicants.filter(a => applicantsLangFilter === 'all' || applicantLangMap.get(a.id) === applicantsLangFilter).map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-xs font-medium text-gray-900 whitespace-nowrap">{applicant.name}</td>
                        <td className="px-2 py-2 text-xs text-gray-500">{applicant.birthDate}</td>
                        <td className="px-2 py-2 text-xs text-gray-500">{applicant.phone4}</td>
                        {Array.from({ length: 6 }, (_, i) => {
                          const choiceId = applicant[`choice${i + 1}` as ChoiceKey];
                          const mname = mentors.find(m => m.id === choiceId)?.name;
                          return (
                            <td key={i} className="px-2 py-2 text-xs text-gray-600 max-w-[80px]">
                              <span className="block truncate" title={mname}>{mname || <span className="text-gray-300">-</span>}</span>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(applicant.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-2 py-2 text-xs whitespace-nowrap">
                          {applicant.updatedAt !== applicant.createdAt ? (
                            <span className="text-orange-500">{new Date(applicant.updatedAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => deleteApplicant(applicant.id, applicant.name)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-red-50">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {applicants.filter(a => applicantsLangFilter === 'all' || applicantLangMap.get(a.id) === applicantsLangFilter).length === 0 && (
                  <div className="text-center py-12 text-gray-500">아직 신청자가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 배정 결과 */}
        {activeTab === 'assignments' && (
          <>
            <LangFilterBar value={assignmentsLangFilter} onChange={setAssignmentsLangFilter} />
            <div className="sm:hidden space-y-3">
              {assignments.filter(a => assignmentsLangFilter === 'all' || applicantLangMap.get(a.applicantId) === assignmentsLangFilter).map((assignment) => (
                <div key={assignment.applicantId} className="bg-white rounded-xl shadow-sm p-4">
                  <h4 className="font-bold text-gray-900 mb-1">{assignment.applicantName}
                    <span className="text-xs text-gray-400 font-normal ml-2">({assignment.phone4})</span>
                  </h4>
                  <div className="space-y-2">
                    {Array.from({ length: 4 }, (_, i) => {
                      const slot = (assignment as unknown as Record<string, unknown>)[`time${i + 1}`] as Assignment['time1'];
                      const colors = ['blue', 'green', 'purple', 'orange'];
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
              {assignments.filter(a => assignmentsLangFilter === 'all' || applicantLangMap.get(a.applicantId) === assignmentsLangFilter).length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 배정 결과가 없습니다.</div>
              )}
            </div>
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                      {Array.from({ length: 4 }, (_, i) => (
                        <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{i + 1}타임</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.filter(a => assignmentsLangFilter === 'all' || applicantLangMap.get(a.applicantId) === assignmentsLangFilter).map((assignment) => (
                      <tr key={assignment.applicantId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {assignment.applicantName}
                          <span className="text-xs text-gray-400 font-normal ml-1">({assignment.phone4})</span>
                        </td>
                        {Array.from({ length: 4 }, (_, i) => {
                          const slot = (assignment as unknown as Record<string, unknown>)[`time${i + 1}`] as Assignment['time1'];
                          return (
                            <td key={i} className="px-3 py-2 text-xs">
                              {slot ? (
                                <>
                                  <span className={slot.isOriginalChoice ? 'font-medium text-green-700' : 'font-medium text-orange-600'}>
                                    {slot.mentorName}
                                  </span>
                                  {!slot.isOriginalChoice && slot.originalChoice && (
                                    <span className="text-gray-400 block">원래: {slot.originalChoice}</span>
                                  )}
                                  <span className="text-gray-400 block">{slot.location}</span>
                                </>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {assignments.filter(a => assignmentsLangFilter === 'all' || applicantLangMap.get(a.applicantId) === assignmentsLangFilter).length === 0 && (
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

        {/* 자소서 신청자 목록 */}
        {activeTab === 'resume' && (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {resumeApplicants.map((ra) => (
                <div key={ra.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        ra.queueNumber <= 12 ? 'bg-primary-200 text-gray-900' : 'bg-amber-100 text-amber-700'
                      }`}>{ra.queueNumber}</span>
                      <span className="font-bold text-gray-900">{ra.name}</span>
                      {ra.queueNumber > 12 && <span className="text-xs text-amber-600">예비</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(ra.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                    <span>생년월일: {ra.birthDate}</span>
                    <span>전화: {ra.phone4}</span>
                    <span>학과: {ra.department}</span>
                    <span>상황: {ra.currentStatus}</span>
                    <span className="col-span-2">희망직군: {ra.desiredField}</span>
                    <span className="col-span-2">기업유형: {ra.companyType && ra.companyType.length > 0 ? ra.companyType.map((ct: string) => ({large: '대기업', public: '공기업', private: '사기업'}[ct] || ct)).join(', ') : '-'}</span>
                  </div>
                  {ra.reviewGoal && (
                    <div className="bg-purple-50 rounded-lg p-2 text-xs text-purple-800 mb-2">
                      🎯 첨삭목표: {ra.reviewGoal}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedResume(expandedResume === ra.id ? null : ra.id)}
                      className="text-sm text-primary-700 hover:text-primary-900 font-medium"
                    >
                      {expandedResume === ra.id ? '▲ 자소서 접기' : '▼ 자소서 보기'}
                    </button>
                    <button
                      onClick={() => deleteResume(ra.id, ra.name)}
                      className="text-red-500 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                    >삭제</button>
                  </div>
                  {expandedResume === ra.id && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {ra.resumeSections && Object.keys(ra.resumeSections).length > 0 ? (
                        <div className="space-y-3">
                          {getResumeSections(ra.companyType || []).map(key => {
                            const label: Record<string, string> = { motivation: '지원동기', motivationPublic: '지원동기+공공성', competency: '직무역량', problemSolving: '문제해결', teamwork: '협업', ethics: '윤리/가치관' };
                            const content = ra.resumeSections[key];
                            if (!content) return null;
                            return (
                              <div key={key}>
                                <p className="text-xs font-bold text-blue-700 mb-0.5">[{label[key] || key}]</p>
                                <p className="text-sm">{content}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : ra.resumeText}
                    </div>
                  )}
                </div>
              ))}
              {resumeApplicants.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 자소서 신청자가 없습니다.</div>
              )}
            </div>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">순번</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">학과</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">상황</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">희망직군</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">기업유형</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">첨삭목표</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">자소서</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resumeApplicants.map((ra) => (
                      <tr key={ra.id} className={`hover:bg-gray-50 ${ra.queueNumber > 12 ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-3 py-3 text-sm">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            ra.queueNumber <= 12 ? 'bg-primary-200 text-gray-900' : 'bg-amber-100 text-amber-700'
                          }`}>{ra.queueNumber}</span>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{ra.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{ra.department}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{ra.currentStatus}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{ra.desiredField}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">
                          {ra.companyType && ra.companyType.length > 0
                            ? ra.companyType.map((ct: string) => ({large: '대', public: '공', private: '사'}[ct] || ct)).join('/')
                            : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={ra.reviewGoal}>
                          {ra.reviewGoal || '-'}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <button
                            onClick={() => setExpandedResume(expandedResume === ra.id ? null : ra.id)}
                            className="text-primary-700 hover:text-primary-900 font-medium text-xs"
                          >
                            {expandedResume === ra.id ? '접기' : '보기'}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(ra.createdAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <button onClick={() => deleteResume(ra.id, ra.name)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {resumeApplicants.length === 0 && (
                  <div className="text-center py-12 text-gray-500">아직 자소서 신청자가 없습니다.</div>
                )}
              </div>
              {/* 자소서 내용 팝업 (테이블 아래 표시) */}
              {expandedResume && (() => {
                const ra = resumeApplicants.find(r => r.id === expandedResume);
                if (!ra) return null;
                return (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-800">📄 {ra.name}의 자소서 (순번 #{ra.queueNumber})</h4>
                      <button onClick={() => setExpandedResume(null)} className="text-sm text-gray-500 hover:text-gray-700">닫기 ✕</button>
                    </div>
                    {ra.reviewGoal && (
                      <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-800 mb-3">
                        🎯 <span className="font-medium">첨삭목표:</span> {ra.reviewGoal}
                      </div>
                    )}
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-white rounded-lg p-4 border border-gray-200">
                      {ra.resumeSections && Object.keys(ra.resumeSections).length > 0 ? (
                        <div className="space-y-3">
                          {getResumeSections(ra.companyType || []).map(key => {
                            const label: Record<string, string> = { motivation: '지원동기', motivationPublic: '지원동기+공공성', competency: '직무역량', problemSolving: '문제해결', teamwork: '협업', ethics: '윤리/가치관' };
                            const content = ra.resumeSections[key];
                            if (!content) return null;
                            return (
                              <div key={key}>
                                <p className="text-xs font-bold text-blue-700 mb-0.5">[{label[key] || key}]</p>
                                <p className="text-sm">{content}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : ra.resumeText}
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* 배정표 (멘토별 타임 슬롯) */}
        {activeTab === 'table' && (
          <>
            <LangFilterBar value={tableLangFilter} onChange={setTableLangFilter} />

            {/* 모바일 카드 뷰 */}
            <div className="sm:hidden space-y-3">
              {mentors.map(mentor => {
                const slotData = mentorTableData[mentor.id];
                if (!slotData) return null;
                const filteredSlots = ([1, 2, 3, 4] as const).map(t => {
                  const entries = slotData[`time${t}`];
                  if (tableLangFilter === 'all') return entries;
                  return entries.filter(e => applicantLangMap.get(e.applicantId) === tableLangFilter);
                });
                const totalVisible = filteredSlots.reduce((sum, s) => sum + s.length, 0);
                if (tableLangFilter !== 'all' && totalVisible === 0) return null;
                return (
                  <div key={mentor.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-gray-900">{mentor.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{mentor.field || mentor.job}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{totalVisible}명</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {filteredSlots.map((entries, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs font-semibold text-gray-500 mb-1">{idx + 1}타임</div>
                          {entries.length === 0 ? (
                            <span className="text-gray-300 text-xs">-</span>
                          ) : (
                            <div className="space-y-0.5">
                              {entries.map((e, i) => {
                                const lang = applicantLangMap.get(e.applicantId);
                                const langDot = lang === 'english' ? '🟢' : lang === 'chinese' ? '🔴' : '';
                                return (
                                  <div key={i} className="flex items-center gap-1">
                                    {tableLangFilter === 'all' && langDot && (
                                      <span className="text-xs leading-none">{langDot}</span>
                                    )}
                                    <span className={`text-xs ${e.isOriginalChoice ? 'text-gray-800' : 'text-orange-500'}`}>
                                      {e.applicantName}
                                    </span>
                                  </div>
                                );
                              })}
                              <div className="text-xs text-gray-400">{entries.length}명</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">아직 배정 결과가 없습니다.</div>
              )}
            </div>

            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 w-28">멘토</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">분야</th>
                      {[1, 2, 3, 4].map(t => (
                        <th key={t} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {t}타임
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mentors.map(mentor => {
                      const slotData = mentorTableData[mentor.id];
                      if (!slotData) return null;
                      const filteredSlots = ([1, 2, 3, 4] as const).map(t => {
                        const entries = slotData[`time${t}`];
                        if (tableLangFilter === 'all') return entries;
                        return entries.filter(e => applicantLangMap.get(e.applicantId) === tableLangFilter);
                      });
                      const totalVisible = filteredSlots.reduce((sum, s) => sum + s.length, 0);
                      return (
                        <tr key={mentor.id} className={`hover:bg-gray-50 ${
                          tableLangFilter !== 'all' && totalVisible === 0 ? 'opacity-30' : ''
                        }`}>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900 sticky left-0 bg-white whitespace-nowrap">
                            {mentor.name}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                            {mentor.field || mentor.job}
                          </td>
                          {filteredSlots.map((entries, idx) => (
                            <td key={idx} className="px-3 py-2 align-top">
                              {entries.length === 0 ? (
                                <span className="text-gray-200 text-xs">-</span>
                              ) : (
                                <div className="space-y-0.5">
                                  {entries.map((e, i) => {
                                    const lang = applicantLangMap.get(e.applicantId);
                                    const langDot = lang === 'english' ? '🟢' : lang === 'chinese' ? '🔴' : '';
                                    return (
                                      <div key={i} className="flex items-center gap-1">
                                        {tableLangFilter === 'all' && langDot && (
                                          <span className="text-xs leading-none">{langDot}</span>
                                        )}
                                        <span className={`text-xs whitespace-nowrap ${
                                          e.isOriginalChoice ? 'text-gray-800' : 'text-orange-500'
                                        }`}>
                                          {e.applicantName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  <div className="text-xs text-gray-400 mt-0.5">{entries.length}명</div>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {assignments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">아직 배정 결과가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 취소자 목록 */}
        {activeTab === 'cancelled' && (
          <>
            {cancelledApplicants.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">취소한 신청자가 없습니다.</div>
            ) : (
              <>
                {/* 모바일 카드 뷰 */}
                <div className="sm:hidden space-y-3">
                  {cancelledApplicants.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{c.name}</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">취소됨</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                        <span>생년월일: {c.birthDate}</span>
                        <span>전화: {c.phone4}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[c.choice1, c.choice2, c.choice3].filter(Boolean).map((ch, i) => {
                          const mname = mentors.find(m => m.id === ch)?.name || ch;
                          return (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{i + 1}지망: {mname}</span>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400">
                        신청: {c.appliedAt ? new Date(c.appliedAt).toLocaleString('ko-KR') : '-'}
                      </p>
                      <p className="text-xs text-red-400">
                        취소: {new Date(c.cancelledAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
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
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">1지망</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">2지망</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">3지망</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">취소일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cancelledApplicants.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 font-medium text-gray-900">{c.name}</td>
                            <td className="px-3 py-3 text-gray-600">{c.birthDate}</td>
                            <td className="px-3 py-3 text-gray-600">{c.phone4}</td>
                            <td className="px-3 py-3 text-gray-600 text-sm">{mentors.find(m => m.id === c.choice1)?.name || c.choice1 || '-'}</td>
                            <td className="px-3 py-3 text-gray-600 text-sm">{mentors.find(m => m.id === c.choice2)?.name || c.choice2 || '-'}</td>
                            <td className="px-3 py-3 text-gray-600 text-sm">{mentors.find(m => m.id === c.choice3)?.name || c.choice3 || '-'}</td>
                            <td className="px-3 py-3 text-gray-500 text-xs">{c.appliedAt ? new Date(c.appliedAt).toLocaleString('ko-KR') : '-'}</td>
                            <td className="px-3 py-3 text-red-500 text-xs">{new Date(c.cancelledAt).toLocaleString('ko-KR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
