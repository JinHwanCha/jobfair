import { NextResponse } from 'next/server';
import { getAllApplicants, setAssignments, setMentorSlots, getMentors } from '@/lib/data';
import { runAutoAssignment } from '@/lib/assignment';

export async function POST() {
  try {
    const mentors = await getMentors();
    const applicants = await getAllApplicants();

    if (applicants.length === 0) {
      return NextResponse.json({
        success: false,
        error: '신청자가 없습니다.',
      });
    }

    // 자동 배정 실행
    const { assignments, mentorSlots } = runAutoAssignment(applicants, mentors);

    // 결과 저장
    await setAssignments(assignments);
    await setMentorSlots(mentorSlots);

    return NextResponse.json({
      success: true,
      data: {
        count: assignments.length,
        assignments,
      },
    });
  } catch (error) {
    console.error('자동 배정 오류:', error);
    return NextResponse.json({
      success: false,
      error: '자동 배정 중 오류가 발생했습니다.',
    });
  }
}
