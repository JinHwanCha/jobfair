import Link from 'next/link';
import Header from '@/components/Header';
import MentorPreview from '@/components/MentorPreview';
import { getMentors } from '@/lib/data';

export default async function HomePage() {
  const mentors = await getMentors();
  const previewMentors = mentors.slice(0, 4);

  return (
    <div className="page-container">
      <Header />

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">📅</span>
              <span className="font-medium">2026년 5월 9일 (토)</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">
              2026 직업박람회
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-100 mb-2">
              내수동교회에서 만나는 특별한 멘토링
            </p>
            
            <p className="text-primary-200 mb-8">
              다양한 분야의 전문가 멘토를 만나 진로에 대한 이야기를 나눠보세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="btn-primary bg-white text-primary-600 hover:bg-primary-50 shadow-xl"
              >
                지금 신청하기
              </Link>
              <Link
                href="/mentors"
                className="btn-secondary bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                멘토 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 행사 정보 섹션 */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="section-title text-center">행사 안내</h2>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">장소</h3>
              <p className="text-gray-600">내수동교회</p>
            </div>
            
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🕐</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">시간</h3>
              <p className="text-gray-600">3개 타임 진행</p>
              <p className="text-sm text-gray-500 mt-1">타임당 약 20분</p>
            </div>
            
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">대상</h3>
              <p className="text-gray-600">진로에 관심 있는</p>
              <p className="text-gray-600">청소년 누구나</p>
            </div>
          </div>
        </div>
      </section>

      {/* 진행 방식 섹션 */}
      <section className="py-12 sm:py-16 bg-warm-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="section-title text-center">진행 방식</h2>
          
          <div className="space-y-4">
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">멘토 신청</h3>
                <p className="text-gray-600">
                  희망하는 멘토를 1지망, 2지망, 3지망으로 선택하여 신청합니다.
                </p>
              </div>
            </div>
            
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">자동 배정</h3>
                <p className="text-gray-600">
                  신청 순서와 지망 순위에 따라 3개 타임에 멘토가 자동 배정됩니다.
                </p>
              </div>
            </div>
            
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">배정 확인</h3>
                <p className="text-gray-600">
                  마이페이지에서 배정된 멘토와 장소를 확인하고 행사 당일 참여하세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 멘토 미리보기 섹션 */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">참여 멘토</h2>
            <Link
              href="/mentors"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              전체 보기 →
            </Link>
          </div>
          
          <MentorPreview mentors={previewMentors} />

          {mentors.length > 0 && (
            <div className="text-center mt-8">
              <Link href="/mentors" className="btn-secondary inline-block">
                {mentors.length}명의 멘토 모두 보기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-warm-200 to-warm-300">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            지금 바로 신청하세요!
          </h2>
          <p className="text-gray-600 mb-8">
            다양한 분야의 멘토와 함께 진로에 대한 소중한 이야기를 나눠보세요.
          </p>
          <Link href="/apply" className="btn-primary inline-block">
            멘토 신청하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">
            © 2026 내수동교회 직업박람회. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            문의: 내수동교회 청소년부
          </p>
        </div>
      </footer>
    </div>
  );
}
