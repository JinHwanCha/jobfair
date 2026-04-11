import { NextRequest, NextResponse } from 'next/server';
import { addResumeApplicant, getResumeApplicantCount } from '@/lib/data';
import { ResumeApplyFormData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ResumeApplyFormData = await request.json();

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

    if (!body.resumeText || body.resumeText.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: '자소서 내용을 10자 이상 입력해주세요.',
      });
    }

    if (!body.agreedToTerms) {
      return NextResponse.json({
        success: false,
        error: '개인정보 수집 및 이용에 동의해야 합니다.',
      });
    }

    const applicant = await addResumeApplicant({
      name: body.name,
      birthDate: body.birthDate,
      phone4: body.phone4,
      department: body.department || '',
      birthYear: body.birthYear || '',
      currentStatus: body.currentStatus || '',
      desiredField: body.desiredField || '',
      resumeText: body.resumeText,
      agreedToTerms: body.agreedToTerms,
    });

    return NextResponse.json({
      success: true,
      data: applicant,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'LIMIT_REACHED') {
      return NextResponse.json({
        success: false,
        error: '선착순 12명 마감되었습니다. 더 이상 신청할 수 없습니다.',
      });
    }
    console.error('자소서 신청 처리 오류:', error);
    return NextResponse.json({
      success: false,
      error: '신청 처리 중 오류가 발생했습니다.',
    });
  }
}

export async function GET() {
  try {
    const count = await getResumeApplicantCount();
    return NextResponse.json({
      success: true,
      data: { count, max: 12 },
    });
  } catch (error) {
    console.error('자소서 신청 현황 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '조회 중 오류가 발생했습니다.',
    });
  }
}
