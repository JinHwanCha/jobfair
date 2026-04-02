import { NextRequest, NextResponse } from 'next/server';
import { upsertApplicant, getAllApplicants, getMentors, setAssignments, setMentorSlots } from '@/lib/data';
import { ApplyFormData } from '@/types';
import { runAutoAssignment } from '@/lib/assignment';

export async function POST(request: NextRequest) {
  try {
    const body: ApplyFormData = await request.json();

    // 유효성 검사
    if (!body.name || !body.birthDate || !body.phone4) {
      return NextResponse.json({
        success: false,
        error: '필수 정보가 누락되었습니다.',
      });
    }

    if (body.phone4.length !== 4) {
      return NextResponse.json({
        success: false,
        error: '전화번호 뒷자리는 4자리여야 합니다.',
      });
    }

    if (!body.choice1 || !body.choice2 || !body.choice3) {
      return NextResponse.json({
        success: false,
        error: '1지망, 2지망, 3지망 모두 선택해야 합니다.',
      });
    }

    if (!body.agreedToTerms) {
      return NextResponse.json({
        success: false,
        error: '개인정보 수집 및 이용에 동의해야 합니다.',
      });
    }

    // 신청자 저장 (동일 정보면 업데이트)
    const applicant = await upsertApplicant({
      name: body.name,
      birthDate: body.birthDate,
      phone4: body.phone4,
      choice1: body.choice1,
      choice2: body.choice2,
      choice3: body.choice3,
      agreedToTerms: body.agreedToTerms,
    });

    // 자동 배정 실행 (모든 신청자 대상으로 재배정)
    try {
      const mentors = await getMentors();
      const allApplicants = await getAllApplicants();
      if (mentors.length > 0 && allApplicants.length > 0) {
        const { assignments, mentorSlots } = runAutoAssignment(allApplicants, mentors);
        await setAssignments(assignments);
        await setMentorSlots(mentorSlots);
      }
    } catch (assignError) {
      console.error('자동 배정 오류 (신청은 완료됨):', assignError);
    }

    return NextResponse.json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    console.error('신청 처리 오류:', error);
    return NextResponse.json({
      success: false,
      error: '신청 처리 중 오류가 발생했습니다.',
    });
  }
}
