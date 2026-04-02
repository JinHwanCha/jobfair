import { NextRequest, NextResponse } from 'next/server';
import { getMyAssignment, findApplicant } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone4 = searchParams.get('phone4');

    if (!name || !phone4) {
      return NextResponse.json({
        success: false,
        error: '이름과 전화번호 뒷자리를 입력해주세요.',
      });
    }

    const assignment = await getMyAssignment(name, phone4);

    if (!assignment) {
      // 신청은 했지만 아직 배정이 안 된 경우 확인
      const applicant = await findApplicant(name, phone4);
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
