import { NextResponse } from 'next/server';
import { exportData } from '@/lib/data';

export async function GET() {
  try {
    const data = await exportData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('데이터 내보내기 오류:', error);
    return NextResponse.json({
      success: false,
      error: '내보내기 중 오류가 발생했습니다.',
    });
  }
}
