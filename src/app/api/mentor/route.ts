import { NextRequest, NextResponse } from 'next/server';
import { getMentors, getMentorSlots, getAllApplicants, getResumeMentors, getAllResumeApplicants } from '@/lib/data';

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

    // 자소서 첨삭 멘토인지 확인
    if (!mentor) {
      const resumeMentors = await getResumeMentors();
      const resumeMentor = resumeMentors.find(
        (m) => m.name.trim() === name.trim() && m.phone4 === phone4
      );

      if (!resumeMentor) {
        return NextResponse.json({
          success: false,
          error: '멘토 정보를 찾을 수 없습니다. 이름과 전화번호를 확인해주세요.',
        });
      }

      // 자소서 첨삭 멘토: 자소서 신청자 목록 반환
      const resumeApplicants = await getAllResumeApplicants();
      return NextResponse.json({
        success: true,
        data: {
          mentorName: resumeMentor.name,
          mentorJob: resumeMentor.job,
          isResumeMentor: true,
          resumeApplicants: resumeApplicants.map(a => ({
            name: a.name,
            department: a.department,
            birthYear: a.birthYear,
            currentStatus: a.currentStatus,
            desiredField: a.desiredField,
            companyType: a.companyType,
            reviewGoal: a.reviewGoal,
            resumeText: a.resumeText,
            resumeSections: a.resumeSections,
            queueNumber: a.queueNumber,
            createdAt: a.createdAt,
          })),
        },
      });
    }

    const mentorSlots = await getMentorSlots();
    const mySlot = mentorSlots.find((s) => s.mentorId === mentor.id);

    const applicants = await getAllApplicants();
    const applicantMap = new Map(applicants.map((a) => [a.id, a]));

    const timeSlots = [];
    for (let t = 1; t <= 4; t++) {
      const slotKey = `time${t}` as keyof typeof mySlot;
      const assignedIds: string[] = mySlot ? (mySlot[slotKey] as string[]) || [] : [];

      const mentees = assignedIds.map((aid) => {
        const applicant = applicantMap.get(aid);
        if (!applicant) return { name: aid, message: '', department: '', birthYear: '', currentStatus: '', desiredField: '', interestTopics: [] };

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

        return {
          name: applicant.name,
          message,
          department: applicant.department || '',
          birthYear: applicant.birthYear || '',
          currentStatus: applicant.currentStatus || '',
          desiredField: applicant.desiredField || '',
          interestTopics: applicant.interestTopics || [],
        };
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
