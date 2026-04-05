import { NextRequest, NextResponse } from 'next/server';
import { getMentors, getMentorSlots, getAllApplicants } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone4 } = body;

    if (!name || !phone4 || phone4.length !== 4) {
      return NextResponse.json({
        success: false,
        error: '이름과 전화번호 뒷자리 4자리를 입력해주세요.',
      });
    }

    const mentors = await getMentors();
    const mentor = mentors.find(
      (m) => m.name.trim() === name.trim() && m.phone4 === phone4
    );

    if (!mentor) {
      return NextResponse.json({
        success: false,
        error: '멘토 정보를 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.',
      });
    }

    const mentorSlots = await getMentorSlots();
    const mySlot = mentorSlots.find((s) => s.mentorId === mentor.id);

    const applicants = await getAllApplicants();
    const applicantMap = new Map(applicants.map((a) => [a.id, a]));

    const timeSlots = [];
    for (let t = 1; t <= 6; t++) {
      const slotKey = `time${t}` as keyof typeof mySlot;
      const assignedIds: string[] = mySlot ? (mySlot[slotKey] as string[]) || [] : [];

      const mentees = assignedIds.map((aid) => {
        const applicant = applicantMap.get(aid);
        if (!applicant) return { name: aid, message: '' };

        // Find which choiceN matches this mentor to get the corresponding messageN
        let message = '';
        for (let c = 1; c <= 6; c++) {
          const choiceKey = `choice${c}` as keyof typeof applicant;
          if (applicant[choiceKey] === mentor.id) {
            const msgKey = `message${c}` as keyof typeof applicant;
            message = (applicant[msgKey] as string) || '';
            break;
          }
        }

        return { name: applicant.name, message };
      });

      timeSlots.push({ time: t, mentees });
    }

    return NextResponse.json({
      success: true,
      data: {
        mentorName: mentor.name,
        mentorJob: mentor.job,
        timeSlots,
      },
    });
  } catch (error) {
    console.error('멘토 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '조회 중 오류가 발생했습니다.',
    });
  }
}
