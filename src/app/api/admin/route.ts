import { NextRequest, NextResponse } from 'next/server';
import { getAllApplicants, getAllAssignments, getMentorApplicationCounts, getMentors, deleteAllData, deleteApplicant, getAllResumeApplicants } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mentors = await getMentors();
    const applicants = await getAllApplicants();
    const assignments = await getAllAssignments();
    const mentorCounts = await getMentorApplicationCounts(mentors);
    const resumeApplicants = await getAllResumeApplicants();

    return NextResponse.json({
      success: true,
      data: {
        applicants,
        assignments,
        mentors,
        mentorCounts,
        resumeApplicants,
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

const ADMIN_CODE = '0509';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, applicantId } = body;

    if (code !== ADMIN_CODE) {
      return NextResponse.json({
        success: false,
        error: '관리자 코드가 올바르지 않습니다.',
      });
    }

    if (applicantId) {
      await deleteApplicant(applicantId);
      return NextResponse.json({
        success: true,
        message: '해당 신청자가 삭제되었습니다.',
      });
    }

    await deleteAllData();

    return NextResponse.json({
      success: true,
      message: '모든 신청 데이터가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('데이터 삭제 오류:', error);
    return NextResponse.json({
      success: false,
      error: '데이터 삭제 중 오류가 발생했습니다.',
    });
  }
}
