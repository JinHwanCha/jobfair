import { NextRequest, NextResponse } from 'next/server';
import { getMyAssignment, findApplicant, findApplicants } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone4 = searchParams.get('phone4');
    const birthDate = searchParams.get('birthDate');

    if (!name || !phone4) {
      return NextResponse.json({
        success: false,
        error: '이름과 전화번호 뒷자리를 입력해주세요.',
      });
    }

    // birthDate 없이 조회 시 → 동명이인 확인
    if (!birthDate) {
      const applicants = await findApplicants(name, phone4);
      if (applicants.length === 0) {
        return NextResponse.json({
          success: false,
          error: '신청 정보를 찾을 수 없습니다. 먼저 멘토 신청을 해주세요.',
        });
      }
      if (applicants.length === 1) {
        // 한 명만 있으면 바로 배정 조회
        const assignment = await getMyAssignment(name, phone4, applicants[0].birthDate);
        if (!assignment) {
          return NextResponse.json({
            success: false,
            error: '신청은 완료되었으나 아직 배정이 처리되지 않았습니다. 잠시 후 다시 확인해주세요.',
            applied: true,
          });
        }
        return NextResponse.json({ success: true, data: assignment });
      }
      // 여러 명 → 생년월일 선택 필요
      return NextResponse.json({
        success: false,
        needBirthDate: true,
        birthDates: applicants.map(a => a.birthDate),
        error: '동일한 이름과 전화번호로 여러 건의 신청이 있습니다. 생년월일을 선택해주세요.',
      });
    }

    // birthDate가 있으면 정확히 조회
    const assignment = await getMyAssignment(name, phone4, birthDate);

    if (!assignment) {
      const applicant = await findApplicant(name, phone4, birthDate);
      if (applicant) {
        return NextResponse.json({
          success: false,
          error: '신청은 완료되었으나 아직 배정이 처리되지 않았습니다. 잠시 후 다시 확인해주세요.',
          applied: true,
        });
      }
      return NextResponse.json({
        success: false,
        error: '신청 정보를 찾을 수 없습니다. 먼저 멘토 신청을 해주세요.',
      });
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('배정 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '조회 중 오류가 발생했습니다.',
    });
  }
}
