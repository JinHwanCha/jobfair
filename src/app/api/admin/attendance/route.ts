import { NextRequest, NextResponse } from 'next/server';
import { setApplicantAttendance } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicantId, attended } = body;

    if (!applicantId || typeof attended !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'applicantId와 attended(boolean)가 필요합니다.',
      });
    }

    await setApplicantAttendance(applicantId, attended);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('출석 업데이트 오류:', error);
    return NextResponse.json({
      success: false,
      error: '출석 업데이트 중 오류가 발생했습니다.',
    });
  }
}
