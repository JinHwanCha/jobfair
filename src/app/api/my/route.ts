import { NextRequest, NextResponse } from 'next/server';
import { getMyAssignment, findApplicant, findApplicants, cancelApplicant, getMentors } from '@/lib/data';
import { Assignment, AssignmentSlot } from '@/types';

export const dynamic = 'force-dynamic';

// DB에 저장된 배정 결과의 location 값을 현재 멘토 데이터로 최신화
async function enrichAssignmentLocations(assignment: Assignment): Promise<Assignment> {
  try {
    const allMentors = await getMentors();
    const mentorMap = new Map(allMentors.map(m => [m.id, m.location]));
    const enrichSlot = (slot: AssignmentSlot | null): AssignmentSlot | null => {
      if (!slot) return null;
      const currentLocation = mentorMap.get(slot.mentorId);
      return currentLocation ? { ...slot, location: currentLocation } : slot;
    };
    return {
      ...assignment,
      time1: enrichSlot(assignment.time1),
      time2: enrichSlot(assignment.time2),
      time3: enrichSlot(assignment.time3),
      time4: enrichSlot(assignment.time4),
    };
  } catch {
    return assignment;
  }
}

async function checkHasKimJiseonChoice(choiceIds: string[]): Promise<boolean> {
  try {
    const mentors = await getMentors();
    const jiseon = mentors.find(m => m.name === '김지선');
    if (!jiseon) return false;
    return choiceIds.includes(jiseon.id);
  } catch {
    return false;
  }
}

async function checkHasKimGyoeunChoice(choiceIds: string[]): Promise<boolean> {
  try {
    const mentors = await getMentors();
    const gyoeun = mentors.find(m => m.name === '김교은');
    if (!gyoeun) return false;
    return choiceIds.includes(gyoeun.id);
  } catch {
    return false;
  }
}

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
        const rawAssignment = await getMyAssignment(name, phone4, applicants[0].birthDate);
        if (!rawAssignment) {
          return NextResponse.json({
            success: false,
            error: '신청은 완료되었으나 아직 배정이 처리되지 않았습니다. 잠시 후 다시 확인해주세요.',
            applied: true,
          });
        }
        const assignment = await enrichAssignmentLocations(rawAssignment);
        const applicant0 = applicants[0];
        const choiceIds = [applicant0.choice1, applicant0.choice2, applicant0.choice3, applicant0.choice4, applicant0.choice5, applicant0.choice6].filter(Boolean);
        const hasKimJiseonChoice = await checkHasKimJiseonChoice(choiceIds);
        const hasKimGyoeunChoice = await checkHasKimGyoeunChoice(choiceIds);
        return NextResponse.json({ success: true, data: assignment, birthDate: applicants[0].birthDate, hasKimJiseonChoice, hasKimGyoeunChoice });
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
    const rawAssignment2 = await getMyAssignment(name, phone4, birthDate);
    const assignment = rawAssignment2 ? await enrichAssignmentLocations(rawAssignment2) : null;

    if (!rawAssignment2) {
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

    const applicantForChoice = await findApplicant(name, phone4, birthDate);
    const choiceIds2 = applicantForChoice
      ? [applicantForChoice.choice1, applicantForChoice.choice2, applicantForChoice.choice3, applicantForChoice.choice4, applicantForChoice.choice5, applicantForChoice.choice6].filter(Boolean)
      : [];
    const hasKimJiseonChoice2 = await checkHasKimJiseonChoice(choiceIds2);
    const hasKimGyoeunChoice2 = await checkHasKimGyoeunChoice(choiceIds2);

    return NextResponse.json({
      success: true,
      data: assignment,
      hasKimJiseonChoice: hasKimJiseonChoice2,
      hasKimGyoeunChoice: hasKimGyoeunChoice2,
    });
  } catch (error) {
    console.error('배정 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '조회 중 오류가 발생했습니다.',
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone4, birthDate } = body;

    if (!name || !phone4 || !birthDate) {
      return NextResponse.json({
        success: false,
        error: '본인 확인을 위한 정보가 부족합니다.',
      });
    }

    const applicant = await findApplicant(name, phone4, birthDate);
    if (!applicant) {
      return NextResponse.json({
        success: false,
        error: '신청 정보를 찾을 수 없습니다.',
      });
    }

    await cancelApplicant(applicant);

    return NextResponse.json({
      success: true,
      message: '신청이 취소되었습니다.',
    });
  } catch (error) {
    console.error('신청 취소 오류:', error);
    return NextResponse.json({
      success: false,
      error: '취소 처리 중 오류가 발생했습니다.',
    });
  }
}
