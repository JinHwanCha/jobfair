'use client';

import { useState, useEffect } from 'react';
import { Applicant, Assignment, Mentor } from '@/types';

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
  const [mentorCounts, setMentorCounts] = useState<Record<string, { choice1: number; choice2: number; choice3: number; total: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');

  // 데이터 로드
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

  useEffect(() => {
    loadData();
  }, []);

  // 자동 배정 실행
  const runAssignment = async () => {
    if (!confirm('자동 배정을 실행하시겠습니까? 기존 배정 결과가 덮어씌워집니다.')) {
      return;
    }

    setIsAssigning(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/assign', {
        method: 'POST',
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

  // 전체 데이터 삭제
  const deleteAllData = async () => {
    const code = prompt('관리자 코드를 입력하세요:');
    if (!code) return;

    if (!confirm('정말로 모든 신청자/배정 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

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

  // 개별 신청자 삭제
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

  // 데이터 내보내기
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">직업박람회 관리</h1>
              <p className="text-sm text-gray-500">
                총 신청자: {applicants.length}명 | 배정 완료: {assignments.length}명
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={deleteAllData}
                disabled={isDeleting || applicants.length === 0}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '전체 삭제'}
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                데이터 내보내기
              </button>
              <button
                onClick={runAssignment}
                disabled={isAssigning || applicants.length === 0}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50"
              >
                {isAssigning ? '배정 중...' : '자동 배정 실행'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('applicants')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'applicants'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            신청자 목록 ({applicants.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'assignments'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            배정 결과 ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'mentors'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            멘토별 현황 ({mentors.length})
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 신청자 목록 */}
        {activeTab === 'applicants' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생년월일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화뒷자리</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1지망</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2지망</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3지망</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{applicant.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{applicant.birthDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{applicant.phone4}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {mentors.find(m => m.id === applicant.choice1)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {mentors.find(m => m.id === applicant.choice2)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {mentors.find(m => m.id === applicant.choice3)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(applicant.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteApplicant(applicant.id, applicant.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {applicants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  아직 신청자가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 배정 결과 */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">1타임</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">장소</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2타임</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">장소</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3타임</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">장소</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.applicantId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {assignment.applicantName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {assignment.time1 ? (
                          <span className={assignment.time1.isOriginalChoice ? 'text-green-600' : 'text-orange-600'}>
                            {assignment.time1.mentorName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {assignment.time1?.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {assignment.time2 ? (
                          <span className={assignment.time2.isOriginalChoice ? 'text-green-600' : 'text-orange-600'}>
                            {assignment.time2.mentorName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {assignment.time2?.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {assignment.time3 ? (
                          <span className={assignment.time3.isOriginalChoice ? 'text-green-600' : 'text-orange-600'}>
                            {assignment.time3.mentorName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {assignment.time3?.location || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assignments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  아직 배정 결과가 없습니다. 자동 배정을 실행해주세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 멘토별 현황 */}
        {activeTab === 'mentors' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => {
              const counts = mentorCounts[mentor.id] || { choice1: 0, choice2: 0, choice3: 0, total: 0 };
              return (
                <div key={mentor.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{mentor.name}</h3>
                      <p className="text-sm text-primary-600">{mentor.job}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {extractShortCategory(mentor.category)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">1지망</span>
                      <span className="font-medium">{counts.choice1}명</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">2지망</span>
                      <span className="font-medium">{counts.choice2}명</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">3지망</span>
                      <span className="font-medium">{counts.choice3}명</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">총 신청</span>
                      <span className="font-bold text-primary-600">{counts.total}명</span>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    장소: {mentor.location}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
