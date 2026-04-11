import { NextResponse } from 'next/server';
import { getResumeMentors } from '@/lib/data';

export async function GET() {
  try {
    const mentors = await getResumeMentors();
    return NextResponse.json({
      success: true,
      data: mentors,
    });
  } catch (error) {
    console.error('자소서 멘토 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '멘토 데이터 조회 중 오류가 발생했습니다.',
    });
  }
}
