import { NextRequest, NextResponse } from 'next/server';
import { findApplicant, findApplicants, cancelApplicant, getAllApplicants, getMentors, setAssignments, setMentorSlots } from '@/lib/data';
import { runAutoAssignment } from '@/lib/assignment';

export const dynamic = 'force-dynamic';

// Vercel 함수 타임아웃 연장 (기본 10초 → 60초)
export const maxDuration = 60;

// 신청자 조회 (취소 전 본인 확인)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone4 = searchParams.get('phone4');
    const birthDate = searchParams.get('birthDate');

    if (!name || !phone4) {
      return NextResponse.json({ success: false, error: '이름과 전화번호 뒷자리를 입력해주세요.' });
    }

    if (!birthDate) {
      const applicants = await findApplicants(name, phone4);
      if (applicants.length === 0) {
        return NextResponse.json({ success: false, error: '신청 정보를 찾을 수 없습니다.' });
      }
      if (applicants.length === 1) {
        const a = applicants[0];
        return NextResponse.json({
          success: true,
          data: { name: a.name, birthDate: a.birthDate, phone4: a.phone4, choice1: a.choice1, choice2: a.choice2, choice3: a.choice3, choice4: a.choice4, choice5: a.choice5, choice6: a.choice6 },
        });
      }
      return NextResponse.json({
        success: false,
        needBirthDate: true,
        birthDates: applicants.map((a) => a.birthDate),
      });
    }

    const applicant = await findApplicant(name, phone4, birthDate);
    if (!applicant) {
      return NextResponse.json({ success: false, error: '신청 정보를 찾을 수 없습니다.' });
    }
    return NextResponse.json({
      success: true,
      data: { name: applicant.name, birthDate: applicant.birthDate, phone4: applicant.phone4, choice1: applicant.choice1, choice2: applicant.choice2, choice3: applicant.choice3, choice4: applicant.choice4, choice5: applicant.choice5, choice6: applicant.choice6 },
    });
  } catch (error) {
    console.error('취소 조회 오류:', error);
    return NextResponse.json({ success: false, error: '조회 중 오류가 발생했습니다.' });
  }
}

// 신청 취소 처리
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone4, birthDate } = body;

    if (!name || !phone4 || !birthDate) {
      return NextResponse.json({ success: false, error: '본인 확인 정보가 부족합니다.' });
    }

    const applicant = await findApplicant(name, phone4, birthDate);
    if (!applicant) {
      return NextResponse.json({ success: false, error: '신청 정보를 찾을 수 없습니다.' });
    }

    await cancelApplicant(applicant);

    // 자동 재배정 실행 (취소로 비워진 슬롯을 활용해 전체 재배정)
    try {
      const allMentors = await getMentors();
      // 김지선, 김교은 멘토는 당일 불참으로 배정 제외
      const mentors = allMentors.filter(m => m.name !== '김지선' && m.name !== '김교은');
      const allApplicants = await getAllApplicants();
      if (mentors.length > 0 && allApplicants.length > 0) {
        const { assignments, mentorSlots } = runAutoAssignment(allApplicants, mentors);
        await setAssignments(assignments);
        await setMentorSlots(mentorSlots);
      }
    } catch (assignError) {
      console.error('자동 재배정 오류 (취소는 완료됨):', assignError);
    }

    return NextResponse.json({ success: true, message: '신청이 취소되었습니다.' });
  } catch (error) {
    console.error('신청 취소 오류:', error);
    return NextResponse.json({ success: false, error: '취소 처리 중 오류가 발생했습니다.' });
  }
}
