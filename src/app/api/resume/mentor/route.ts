import { NextRequest, NextResponse } from 'next/server';
import { getResumeMentors, getAllResumeApplicants } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone4 } = body;

    if (!name || !phone4 || phone4.length !== 4) {
      return NextResponse.json({
        success: false,
        error: '이름과 전화번호 뒷자리 4자리를 입력해주세요.',
      });
    }

    const mentors = await getResumeMentors();
    const mentor = mentors.find(
      (m) => m.name.trim() === name.trim() && m.phone4 === phone4
    );

    if (!mentor) {
      return NextResponse.json({
        success: false,
        error: '자소서 멘토 정보를 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.',
      });
    }

    const applicants = await getAllResumeApplicants();

    return NextResponse.json({
      success: true,
      data: {
        mentorName: mentor.name,
        mentorJob: mentor.job,
        applicants: applicants.map(a => ({
          name: a.name,
          department: a.department,
          birthYear: a.birthYear,
          currentStatus: a.currentStatus,
          desiredField: a.desiredField,
          companyType: a.companyType,
          reviewGoal: a.reviewGoal,
          resumeText: a.resumeText,
          resumeSections: a.resumeSections,
          jobPostingUrls: a.jobPostingUrls,
          queueNumber: a.queueNumber,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('자소서 멘토 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '조회 중 오류가 발생했습니다.',
    });
  }
}
