import { NextRequest, NextResponse } from 'next/server';
import { getMyAssignment } from '@/lib/data';

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

    const assignment = getMyAssignment(name, phone4);

    if (!assignment) {
      return NextResponse.json({
        success: false,
        error: '배정 정보를 찾을 수 없습니다. 신청 정보를 확인해주세요.',
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
