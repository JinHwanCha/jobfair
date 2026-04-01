'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import { Mentor } from '@/types';

// 긴 카테고리 문자열에서 영어 이름만 추출 (예: "Building – 기술과..." → "Building")
function extractShortCategories(category: string): string[] {
  const knownCategories = [
    'Building', 'Leading', 'Operating', 'Teaching',
    'Connecting', 'Creating', 'Healing', 'Influencing',
    'Protecting Justice', 'Serving',
  ];
  const found = knownCategories.filter(cat =>
    category.includes(cat)
  );
  return found.length > 0 ? found : ['기타'];
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetch('/api/mentors')
      .then(res => res.json())
      .then(result => {
        if (result.success) setMentors(result.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // 실제 데이터에서 짧은 카테고리 목록 동적 생성
  const categories = useMemo(() => {
    const cats = new Set<string>();
    mentors.forEach(m => {
      extractShortCategories(m.category).forEach(c => cats.add(c));
    });
    return ['전체', ...Array.from(cats).sort()];
  }, [mentors]);

  // 필터링된 멘토 목록
  const filteredMentors = mentors.filter((mentor) => {
    const mentorCats = extractShortCategories(mentor.category);
    const categoryMatch =
      selectedCategory === '전체' || mentorCats.includes(selectedCategory);
    const q = searchQuery.toLowerCase();
    const searchMatch =
      searchQuery === '' ||
      mentor.name.toLowerCase().includes(q) ||
      mentor.job.toLowerCase().includes(q) ||
      mentor.field.toLowerCase().includes(q) ||
      mentor.jobTitle.toLowerCase().includes(q) ||
      mentor.category.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });

  return (
    <div className="page-container">
      <Header />

      <main className="content-container">
        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">멘토 소개</h1>
          <p className="text-gray-600">
            {isLoading ? '멘토 정보를 불러오는 중...' : `다양한 분야의 ${mentors.length}명의 멘토를 만나보세요`}
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              placeholder="멘토 이름, 직업으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-200 text-gray-700 hover:bg-warm-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 멘토 목록 */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">멘토 정보를 불러오는 중...</p>
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onClickDetail={() => setSelectedMentor(mentor)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* 신청 유도 */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary-100 to-warm-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            관심있는 멘토를 찾으셨나요?
          </h2>
          <p className="text-gray-600 mb-6">
            지금 바로 신청하고 멘토와의 특별한 만남을 준비하세요!
          </p>
          <Link href="/apply" className="btn-primary inline-block">
            신청하러 가기
          </Link>
        </div>
      </main>

      {/* 멘토 상세 모달 */}
      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
}
