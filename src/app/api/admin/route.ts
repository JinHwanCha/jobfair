import { NextResponse } from 'next/server';
import { getAllApplicants, getAllAssignments, getMentorApplicationCounts, getMentors } from '@/lib/data';

export async function GET() {
  try {
    const mentors = await getMentors();
    const applicants = getAllApplicants();
    const assignments = getAllAssignments();
    const mentorCounts = getMentorApplicationCounts(mentors);

    return NextResponse.json({
      success: true,
      data: {
        applicants,
        assignments,
        mentors,
        mentorCounts,
      },
    });
  } catch (error) {
    console.error('관리자 데이터 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '데이터 조회 중 오류가 발생했습니다.',
    });
  }
}
