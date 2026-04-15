import { NextRequest, NextResponse } from 'next/server';
import { addResumeApplicant, getResumeApplicantCount, hasApplicant } from '@/lib/data';
import { ResumeApplyFormData, getResumeSections } from '@/types';

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

    // 섹션별 자소서 검증
    const sections = getResumeSections(body.companyType || []);
    const resumeSections = body.resumeSections || {};
    for (const key of sections) {
      if (!resumeSections[key] || resumeSections[key].trim().length < 10) {
        return NextResponse.json({
          success: false,
          error: '모든 자소서 항목을 10자 이상 입력해주세요.',
        });
      }
    }

    if (!body.agreedToTerms) {
      return NextResponse.json({
        success: false,
        error: '개인정보 수집 및 이용에 동의해야 합니다.',
      });
    }

    // 멘토링 신청자 교차 차단
    const alreadyMentoringApplied = await hasApplicant(body.name, body.phone4, body.birthDate);
    if (alreadyMentoringApplied) {
      return NextResponse.json({
        success: false,
        error: 'CROSS_BLOCK_MENTORING',
      });
    }

    // resumeText 자동 생성 (섹션 합산)
    const resumeText = sections.map(key => `[${key}]\n${resumeSections[key] || ''}`).join('\n\n');

    const applicant = await addResumeApplicant({
      name: body.name,
      birthDate: body.birthDate,
      phone4: body.phone4,
      department: body.department || '',
      birthYear: body.birthYear || '',
      currentStatus: body.currentStatus || '',
      desiredField: body.desiredField || '',
      companyType: body.companyType || [],
      reviewGoal: body.reviewGoal || '',
      resumeText,
      resumeSections,
      jobPostingUrls: body.jobPostingUrls || [],
      agreedToTerms: body.agreedToTerms,
    });

    return NextResponse.json({
      success: true,
      data: applicant,
    });
  } catch (error: unknown) {
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
