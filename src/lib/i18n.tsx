'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'ko' | 'en' | 'zh';

const translations = {
  // ── Header / Nav ──
  'nav.logo': { ko: '직업박람회', en: 'Job Fair', zh: '职业博览会' },
  'nav.home': { ko: '홈', en: 'Home', zh: '首页' },
  'nav.mentors': { ko: '멘토 소개', en: 'Mentors', zh: '导师介绍' },
  'nav.apply': { ko: '신청하기', en: 'Apply', zh: '申请' },
  'nav.my': { ko: '내 배정 확인', en: 'My Assign', zh: '我的分配' },

  // ── Home – Hero ──
  'home.date': { ko: '2026년 5월 9일 (토) 오후 2:30', en: 'May 9, 2026 (Sat) 2:30 PM', zh: '2026年5月9日（周六）下午2:30' },
  'home.title': { ko: '2026 직업박람회', en: '2026 Job Fair', zh: '2026 职业博览会' },
  'home.subtitle': { ko: '내수동교회에서 만나는 특별한 멘토링', en: 'Special Mentoring at Naesudong Church', zh: '内秀洞教会的特别导师项目' },
  'home.desc': { ko: '다양한 분야의 전문가 멘토를 만나 진로에 대한 이야기를 나눠보세요', en: 'Meet expert mentors from various fields and explore your career path', zh: '与各领域专家导师交流，探讨您的职业发展' },
  'home.applyNow': { ko: '지금 신청하기', en: 'Apply Now', zh: '立即申请' },
  'home.browseMentors': { ko: '멘토 둘러보기', en: 'Browse Mentors', zh: '浏览导师' },

  // ── Home – Mentor Preview ──
  'home.mentorsSection': { ko: '참여 멘토', en: 'Mentors', zh: '参与导师' },
  'home.viewAll': { ko: '전체 보기 →', en: 'View All →', zh: '查看全部 →' },
  'home.viewAllMentors': { ko: '명의 멘토 모두 보기', en: ' mentors — View All', zh: '位导师 — 查看全部' },

  // ── Home – Event Info ──
  'home.eventInfo': { ko: '행사 안내', en: 'Event Info', zh: '活动指南' },
  'home.venue': { ko: '장소', en: 'Venue', zh: '地点' },
  'home.church': { ko: '내수동교회', en: 'Naesudong Church', zh: '内秀洞教会' },
  'home.time': { ko: '시간', en: 'Time', zh: '时间' },
  'home.timeSlots': { ko: '6개 타임 진행', en: '6 Time Slots', zh: '6个时段' },
  'home.perSlot': { ko: '타임당 약 15분', en: '~15 min per slot', zh: '每个时段约15分钟' },
  'home.target': { ko: '대상', en: 'Who', zh: '对象' },
  'home.targetDesc1': { ko: '진로에 관심 있는', en: 'Anyone interested', zh: '对职业发展' },
  'home.targetDesc2': { ko: '분들 누구나', en: 'in career paths', zh: '感兴趣的所有人' },

  // ── Home – How It Works ──
  'home.howItWorks': { ko: '진행 방식', en: 'How It Works', zh: '活动流程' },
  'home.step1Title': { ko: '멘토 신청', en: 'Apply for Mentors', zh: '导师申请' },
  'home.step1Desc': { ko: '희망하는 멘토를 1지망부터 6지망까지 선택하여 신청합니다.', en: 'Select your preferred mentors from 1st to 6th choice and apply.', zh: '选择您希望的导师，从第1志愿到第6志愿进行申请。' },
  'home.step2Title': { ko: '자동 배정', en: 'Auto Assignment', zh: '自动分配' },
  'home.step2Desc': { ko: '신청 순서와 지망 순위에 따라 6개 타임에 멘토가 자동 배정됩니다.', en: 'Mentors are automatically assigned to 6 time slots based on your preferences.', zh: '根据申请顺序和志愿排名，导师将自动分配到6个时段。' },
  'home.step3Title': { ko: '배정 확인', en: 'Check Assignment', zh: '确认分配' },
  'home.step3Desc': { ko: '마이페이지에서 배정된 멘토와 장소를 확인하고 행사 당일 참여하세요!', en: 'Check your assigned mentor and venue on My Page, then join the event!', zh: '在我的页面确认分配的导师和地点，参加活动！' },

  // ── Home – CTA / Footer ──
  'home.ctaTitle': { ko: '지금 바로 신청하세요!', en: 'Apply Now!', zh: '立即申请！' },
  'home.ctaDesc': { ko: '다양한 분야의 멘토와 함께 진로에 대한 소중한 이야기를 나눠보세요.', en: 'Share valuable career stories with mentors from various fields.', zh: '与各领域导师分享宝贵的职业故事。' },
  'home.ctaButton': { ko: '멘토 신청하기', en: 'Apply for Mentors', zh: '申请导师' },
  'home.footer': { ko: '© 2026 내수동교회 직업박람회. All rights reserved.', en: '© 2026 Naesudong Church Job Fair. All rights reserved.', zh: '© 2026 内秀洞教会职业博览会。保留所有权利。' },
  'home.footerContact': { ko: '문의: 내수동교회 청년부', en: 'Contact: Naesudong Church Young Adults Dept.', zh: '咨询：内秀洞教会青年部' },

  // ── Mentors Page ──
  'mentors.title': { ko: '멘토 소개', en: 'Meet the Mentors', zh: '导师介绍' },
  'mentors.loading': { ko: '멘토 정보를 불러오는 중...', en: 'Loading mentors...', zh: '正在加载导师信息...' },
  'mentors.searchPlaceholder': { ko: '멘토 이름, 직업으로 검색...', en: 'Search by name or job...', zh: '按姓名或职业搜索...' },
  'mentors.all': { ko: '전체', en: 'All', zh: '全部' },
  'mentors.noResults': { ko: '검색 결과가 없습니다.', en: 'No results found.', zh: '没有搜索结果。' },
  'mentors.interested': { ko: '관심있는 멘토를 찾으셨나요?', en: 'Found a mentor you like?', zh: '找到您感兴趣的导师了吗？' },
  'mentors.interestedDesc': { ko: '지금 바로 신청하고 멘토와의 특별한 만남을 준비하세요!', en: 'Apply now and prepare for a special meeting with your mentor!', zh: '现在申请，准备与导师的特别会面！' },
  'mentors.goApply': { ko: '신청하러 가기', en: 'Go to Apply', zh: '前往申请' },

  // ── Apply Page ──
  'apply.title': { ko: '멘토 신청', en: 'Apply for Mentors', zh: '导师申请' },
  'apply.subtitle': { ko: '희망하는 멘토를 선택해 신청하세요', en: 'Select your preferred mentors and apply', zh: '选择您希望的导师并申请' },
  'apply.step1Title': { ko: '기본 정보 입력', en: 'Basic Info', zh: '基本信息' },
  'apply.step2Title': { ko: '멘티 프로필', en: 'Mentee Profile', zh: '学员资料' },
  'apply.department': { ko: '학과', en: 'Major / Department', zh: '专业/学院' },
  'apply.departmentPlaceholder': { ko: '예: 컴퓨터공학과', en: 'e.g. Computer Science', zh: '例：计算机科学' },
  'apply.birthYear': { ko: '출생년도 확인', en: 'Confirm Birth Year', zh: '确认出生年份' },
  'apply.birthYearSuffix': { ko: '년생', en: ' born', zh: '年出生' },
  'apply.birthYearConfirmQ': { ko: '이 맞습니까?', en: '— Is this correct?', zh: '— 对吗？' },
  'apply.birthYearYes': { ko: '예, 맞습니다', en: 'Yes', zh: '是的' },
  'apply.birthYearNo': { ko: '아니오', en: 'No', zh: '不是' },
  'apply.birthYearManualPlaceholder': { ko: '실제 출생년도를 입력해주세요 (예: 2000)', en: 'Enter your actual birth year (e.g. 2000)', zh: '请输入实际出生年份（例：2000）' },
  'apply.alertBirthYearConfirm': { ko: '출생년도를 확인해주세요.', en: 'Please confirm your birth year.', zh: '请确认您的出生年份。' },
  'apply.currentStatus': { ko: '현재 상황', en: 'Current Status', zh: '当前状况' },
  'apply.currentStatusPlaceholder': { ko: '선택해주세요', en: 'Please select', zh: '请选择' },
  'apply.status1': { ko: '1학년', en: '1st Year', zh: '一年级' },
  'apply.status2': { ko: '2학년', en: '2nd Year', zh: '二年级' },
  'apply.status3': { ko: '3학년', en: '3rd Year', zh: '三年级' },
  'apply.status4': { ko: '4학년', en: '4th Year', zh: '四年级' },
  'apply.statusJobSeeker': { ko: '취준생', en: 'Job Seeker', zh: '求职者' },
  'apply.statusOther': { ko: '기타', en: 'Other', zh: '其他' },
  'apply.desiredField': { ko: '희망 직군', en: 'Desired Field', zh: '希望职业领域' },
  'apply.desiredFieldPlaceholder': { ko: '예: IT/개발, 디자인, 마케팅', en: 'e.g. IT/Dev, Design, Marketing', zh: '例：IT/开发、设计、市场营销' },
  'apply.interestTopics': { ko: '멘토에게 듣고 싶은 내용', en: 'Topics of Interest', zh: '想听导师讲的内容' },
  'apply.interestTopicsHint': { ko: '하나 이상 선택해주세요 (복수 선택 가능)', en: 'Select at least one (multiple allowed)', zh: '请至少选择一个（可多选）' },
  'apply.topic_career': { ko: '진로', en: 'Career Path', zh: '职业道路' },
  'apply.topic_employment': { ko: '취업', en: 'Employment', zh: '就业' },
  'apply.topic_interview': { ko: '면접', en: 'Interview', zh: '面试' },
  'apply.alertProfile': { ko: '모든 프로필 정보를 입력해주세요.', en: 'Please fill in all profile fields.', zh: '请填写所有资料信息。' },
  'apply.alertInterestTopics': { ko: '멘토에게 듣고 싶은 내용을 하나 이상 선택해주세요.', en: 'Please select at least one topic of interest.', zh: '请至少选择一个您感兴趣的话题。' },
  'apply.step3Title': { ko: '멘토 선택', en: 'Select Mentors', zh: '选择导师' },
  'apply.step4Title': { ko: '멘토에게 한마디', en: 'Message to Mentors', zh: '给导师的话' },
  'apply.step5Title': { ko: '신청 정보 확인', en: 'Review Application', zh: '确认申请信息' },
  'apply.name': { ko: '이름', en: 'Name', zh: '姓名' },
  'apply.namePlaceholder': { ko: '홍길동', en: 'John Doe', zh: '请输入姓名' },
  'apply.birthDate': { ko: '생년월일 (6자리)', en: 'Date of Birth (6 digits)', zh: '出生日期（6位数字）' },
  'apply.birthDateHint': { ko: '예: 2008년 3월 15일 → 080315', en: 'e.g. March 15, 2008 → 080315', zh: '例：2008年3月15日 → 080315' },
  'apply.phone4': { ko: '휴대폰 번호 뒷자리 (4자리)', en: 'Last 4 digits of phone number', zh: '手机号码后4位' },
  'apply.next': { ko: '다음', en: 'Next', zh: '下一步' },
  'apply.prev': { ko: '이전', en: 'Back', zh: '上一步' },
  'apply.selectGuide': { ko: '희망하는 멘토를 1지망부터 6지망까지 순서대로 선택해주세요.', en: 'Select your preferred mentors from 1st to 6th choice in order.', zh: '请按顺序选择您的第1至第6志愿导师。' },
  'apply.selectGuide2': { ko: '총 6개 타임이 진행되며, 선착순으로 타임당 3명씩 배정됩니다. 모든 지망이 다 찬 경우 비슷한 분야의 멘토로 대체 배정됩니다.', en: '6 time slots with 3 people each on a first-come basis. If all choices are full, you\'ll be assigned a similar mentor.', zh: '共6个时段，每个时段按先到先得分配3人。如果所有志愿都已满，将分配类似领域的导师。' },
  'apply.choice': { ko: '지망', en: 'Choice ', zh: '第{n}志愿' },
  'apply.select': { ko: '선택', en: 'Select', zh: '选择' },
  'apply.step4Desc': { ko: '각 멘토에게 하고 싶은 말이나 궁금한 점을 적어주세요. (선택사항)', en: 'Write a message or question for each mentor. (Optional)', zh: '请写下您想对每位导师说的话或问题。（可选）' },
  'apply.messagePlaceholder': { ko: ' 멘토에게 하고싶은 말이나 궁금한 점...', en: ' — your message or question...', zh: '导师 — 您的留言或问题...' },
  'apply.consent': { ko: '개인정보 수집 및 이용 동의', en: 'Consent to Personal Info Collection', zh: '同意收集和使用个人信息' },
  'apply.consentItem1': { ko: '수집 항목: 이름, 생년월일, 휴대폰 번호 뒷자리, 학과, 출생년도, 현재상황, 희망직군, 관심주제', en: 'Collected: name, DOB, phone last 4, major, birth year, status, desired field, topics', zh: '收集项目：姓名、出生日期、手机后4位、专业、出生年份、当前状况、希望职业、兴趣主题' },
  'apply.consentItem2': { ko: '수집 목적: 직업박람회 멘토 배정 및 행사 안내', en: 'Purpose: mentor assignment and event info', zh: '收集目的：职业博览会导师分配及活动指南' },
  'apply.consentItem3': { ko: '보유 기간: 행사 종료 후 1개월 이내 파기', en: 'Retention: deleted within 1 month after event', zh: '保留期间：活动结束后1个月内销毁' },
  'apply.consentAgree': { ko: '위 내용을 확인했으며, 개인정보 수집 및 이용에 동의합니다. (필수)', en: 'I have read and agree to the above. (Required)', zh: '我已确认上述内容，同意收集和使用个人信息。（必填）' },
  'apply.submitting': { ko: '신청 중...', en: 'Submitting...', zh: '提交中...' },
  'apply.submit': { ko: '신청하기', en: 'Submit', zh: '提交' },
  'apply.successTitle': { ko: '신청이 완료되었습니다!', en: 'Application Submitted!', zh: '申请已完成！' },
  'apply.successDesc': { ko: '배정 결과는 행사 전 "내 배정 확인" 페이지에서 확인하실 수 있습니다.', en: 'Check your assignment on the "My Assign" page before the event.', zh: '您可以在活动前在"我的分配"页面查看分配结果。' },
  'apply.checkResult': { ko: '배정 결과 확인하기', en: 'Check Assignment', zh: '查看分配结果' },
  'apply.goHome': { ko: '홈으로 돌아가기', en: 'Back to Home', zh: '返回首页' },
  'apply.alertAllInfo': { ko: '모든 정보를 입력해주세요.', en: 'Please fill in all fields.', zh: '请填写所有信息。' },
  'apply.alertPhone4': { ko: '전화번호 뒷자리 4자리를 입력해주세요.', en: 'Please enter the last 4 digits of your phone number.', zh: '请输入手机号码后4位。' },
  'apply.alertAllChoices': { ko: '1지망부터 6지망까지 모두 선택해주세요.', en: 'Please select all 6 choices.', zh: '请选择全部6个志愿。' },
  'apply.alertConsent': { ko: '개인정보 수집 및 이용에 동의해주세요.', en: 'Please agree to the personal info collection terms.', zh: '请同意收集和使用个人信息条款。' },
  'apply.alertDuplicate': { ko: '이미 선택한 멘토입니다. 다른 멘토를 선택해주세요.', en: 'Already selected. Please choose a different mentor.', zh: '已选择该导师。请选择其他导师。' },
  'apply.alertAllFilled': { ko: '6개 모두 선택되었습니다. 기존 선택을 해제하고 다시 선택해주세요.', en: 'All 6 choices are filled. Remove one to select a new mentor.', zh: '6个志愿已全部选择。请取消一个后重新选择。' },
  'apply.foreigner': { ko: '외국인 여부 (선택)', en: 'Foreigner (Optional)', zh: '外国人（可选）' },
  'apply.isForeigner': { ko: '외국인입니다', en: 'I am a foreigner', zh: '我是外国人' },
  'apply.languageGroup': { ko: '언어권 선택', en: 'Language Group', zh: '语言圈选择' },
  'apply.english': { ko: '영어권', en: 'English', zh: '英语圈' },
  'apply.chinese': { ko: '중화권', en: 'Chinese', zh: '中文圈' },
  'apply.errorDefault': { ko: '신청 중 오류가 발생했습니다.', en: 'An error occurred during submission.', zh: '提交过程中发生错误。' },
  'apply.errorNetwork': { ko: '네트워크 오류가 발생했습니다. 다시 시도해주세요.', en: 'Network error. Please try again.', zh: '网络错误。请重试。' },
  'apply.notYetOpen': { ko: '아직 신청 시간 전입니다', en: 'Applications are not open yet', zh: '申请时间尚未开始' },

  // ── Countdown ──
  'countdown.until': { ko: '신청 오픈까지', en: 'Until Applications Open', zh: '距离申请开放' },
  'countdown.days': { ko: '일', en: 'Days', zh: '天' },
  'countdown.hours': { ko: '시간', en: 'Hours', zh: '小时' },
  'countdown.minutes': { ko: '분', en: 'Min', zh: '分' },
  'countdown.seconds': { ko: '초', en: 'Sec', zh: '秒' },
  'countdown.d': { ko: '일', en: 'd', zh: '天' },
  'countdown.h': { ko: '시간', en: 'h', zh: '时' },
  'countdown.m': { ko: '분', en: 'm', zh: '分' },
  'countdown.s': { ko: '초', en: 's', zh: '秒' },
  'countdown.openDate': { ko: '2026년 4월 19일 (일) 오후 6:00 오픈', en: 'Opens Apr 19, 2026 (Sun) 6:00 PM KST', zh: '2026年4月19日（周日）下午6:00开放' },
  'countdown.bannerLabel': { ko: '🔔 신청 시작까지', en: '🔔 Applications open in', zh: '🔔 距离申请开放' },

  // ── Preview Modal ──
  'preview.button': { ko: '신청 미리보기', en: 'Preview Steps', zh: '预览申请步骤' },
  'preview.close': { ko: '확인', en: 'Got it', zh: '确认' },
  'preview.step1Title': { ko: '기본 정보 입력', en: 'Basic Info', zh: '基本信息' },
  'preview.step1Desc': { ko: '이름, 생년월일(6자리), 휴대폰 번호 뒷자리(4자리)를 입력합니다.\n\n🌏 외국인은 반드시 외국인 체크 후 영어권/중화권을 선택해주세요!', en: 'Enter your name, date of birth (6 digits), and last 4 digits of your phone number.\n\n🌏 Foreigners must check the foreigner box and select English or Chinese group!', zh: '输入姓名、出生日期（6位数字）和手机号码后4位。\n\n🌏 外国人请务必勾选外国人选项并选择英语圈/中文圈！' },
  'preview.step2Title': { ko: '멘티 프로필', en: 'Mentee Profile', zh: '学员资料' },
  'preview.step2Desc': { ko: '학과, 출생년도, 현재 상황, 희망 직군, 멘토에게 듣고 싶은 내용(진로/취업/면접)을 입력합니다.', en: 'Enter your major, birth year, current status, desired field, and topics you want to discuss.', zh: '输入专业、出生年份、当前状况、希望职业领域和想听的内容。' },
  'preview.step3Title': { ko: '멘토 선택', en: 'Select Mentors', zh: '选择导师' },
  'preview.step3Desc': { ko: '1지망부터 6지망까지 희망하는 멘토를 순서대로 선택합니다. 멘토 카드를 눌러 상세 정보를 확인할 수 있습니다.', en: 'Select your preferred mentors from 1st to 6th choice. Tap a mentor card to see details.', zh: '按顺序选择第1至第6志愿导师。点击导师卡片查看详情。' },
  'preview.step4Title': { ko: '멘토에게 한마디', en: 'Message to Mentors', zh: '给导师的话' },
  'preview.step4Desc': { ko: '각 멘토에게 하고 싶은 말이나 궁금한 점을 자유롭게 작성합니다. (선택사항)', en: 'Write a message or question for each selected mentor. (Optional)', zh: '给每位导师写下您的留言或问题。（可选）' },
  'preview.step5Title': { ko: '신청 정보 확인', en: 'Review & Submit', zh: '确认并提交' },
  'preview.step5Desc': { ko: '입력한 정보와 선택한 멘토를 최종 확인하고, 개인정보 동의 후 신청을 완료합니다.', en: 'Review your info and selected mentors, agree to the terms, and submit your application.', zh: '确认您的信息和选择的导师，同意条款后提交申请。' },

  // ── My Page ──
  'my.title': { ko: '내 배정 확인', en: 'My Assign', zh: '我的分配确认' },
  'my.subtitle': { ko: '신청 시 입력한 정보로 배정 결과를 확인하세요', en: 'Check your assignment with the info you provided', zh: '请使用申请时输入的信息确认分配结果' },
  'my.search': { ko: '조회하기', en: 'Search', zh: '查询' },
  'my.searching': { ko: '조회 중...', en: 'Searching...', zh: '查询中...' },
  'my.resultFor': { ko: '님의 배정 결과입니다', en: "'s Assignment Results", zh: '的分配结果' },
  'my.goToVenue': { ko: '행사 당일 아래 장소로 이동해주세요!', en: 'Please go to the venues below on event day!', zh: '活动当天请前往以下地点！' },
  'my.timeSlot': { ko: '타임', en: 'Time ', zh: '时段' },
  'my.preferred': { ko: '희망 멘토', en: 'Preferred', zh: '希望导师' },
  'my.alternative': { ko: '대체 배정', en: 'Alternative', zh: '替代分配' },
  'my.notAssigned': { ko: '배정되지 않음', en: 'Not assigned', zh: '未分配' },
  'my.originalChoice': { ko: '원래 선택: ', en: 'Original choice: ', zh: '原选择：' },
  'my.originalMessage': { ko: '하고 싶었던 말', en: 'Your message', zh: '想说的话' },
  'my.myMessage': { ko: '멘토에게 한마디', en: 'Your message', zh: '给导师的话' },
  'my.notes': { ko: '유의사항', en: 'Notes', zh: '注意事项' },
  'my.note1': { ko: '각 타임 시작 5분 전까지 배정된 장소로 이동해주세요.', en: 'Please arrive at your assigned venue 5 min before each time slot.', zh: '请在每个时段开始前5分钟到达分配的地点。' },
  'my.note2': { ko: '대체 배정된 경우 원래 선택한 멘토와 다를 수 있습니다.', en: 'For alternative assignments, the mentor may differ from your original choice.', zh: '替代分配的情况下，导师可能与您的原始选择不同。' },
  'my.note3': { ko: '문의사항은 안내 데스크로 연락해주세요.', en: 'For inquiries, contact the help desk.', zh: '如有疑问，请联系咨询台。' },
  'my.notFound': { ko: '배정 정보를 찾을 수 없습니다.', en: 'Assignment not found.', zh: '未找到分配信息。' },
  'my.notFoundDesc': { ko: '신청 시 입력한 이름과 전화번호를 다시 확인해주세요.', en: 'Please verify your name and phone number.', zh: '请重新确认申请时输入的姓名和电话号码。' },
  'my.promptSearch': { ko: '위 정보를 입력하고 조회 버튼을 눌러주세요.', en: 'Enter your info above and press Search.', zh: '请输入以上信息并点击查询按钮。' },
  'my.errorBoth': { ko: '이름과 전화번호 뒷자리를 입력해주세요.', en: 'Please enter your name and last 4 digits of phone.', zh: '请输入姓名和手机号码后4位。' },
  'my.errorPhone': { ko: '전화번호 뒷자리 4자리를 입력해주세요.', en: 'Please enter the last 4 digits.', zh: '请输入手机号码后4位。' },
  'my.errorGeneral': { ko: '조회 중 오류가 발생했습니다.', en: 'An error occurred.', zh: '查询中发生错误。' },
  'my.errorNoData': { ko: '배정 정보를 찾을 수 없습니다.', en: 'Assignment not found.', zh: '未找到分配信息。' },

  // ── Mentor Card ──
  'card.experience': { ko: '경력', en: 'Experience', zh: '经验' },
  'card.mentoring': { ko: '멘토링', en: 'Mentoring', zh: '导师指导' },
  'card.topics': { ko: '주제', en: 'Topics', zh: '主题' },
  'card.detail': { ko: '상세', en: 'Detail', zh: '详情' },
  'card.selected': { ko: '✓ 선택됨', en: '✓ Selected', zh: '✓ 已选择' },
  'card.select': { ko: '선택하기', en: 'Select', zh: '选择' },
  'card.viewMore': { ko: '자세히 보기', en: 'View Details', zh: '查看详情' },
  'card.other': { ko: '기타', en: 'Other', zh: '其他' },

  // ── Mentor Modal ──
  'modal.oneLiner': { ko: '✨ 한줄 소개', en: '✨ About', zh: '✨ 简介' },
  'modal.experience': { ko: '경력', en: 'Experience', zh: '经验' },
  'modal.mentoringStyle': { ko: '멘토링 방식', en: 'Mentoring Style', zh: '导师指导方式' },
  'modal.careerJourney': { ko: '🛤️ 커리어 여정', en: '🛤️ Career Journey', zh: '🛤️ 职业历程' },
  'modal.bibleVerse': { ko: '📖 직업과 관련된 말씀', en: '📖 Bible Verse', zh: '📖 与职业相关的经文' },
  'modal.advice': { ko: '💬 학생들에게 한마디', en: '💬 Message to Students', zh: '💬 给学生的话' },
  'modal.topics': { ko: '💬 멘토링 주제', en: '💬 Mentoring Topics', zh: '💬 导师主题' },
  'modal.major': { ko: '전공: ', en: 'Major: ', zh: '专业：' },
  'modal.field': { ko: ' 분야', en: ' field', zh: '领域' },
  'modal.close': { ko: '닫기', en: 'Close', zh: '关闭' },

  // ── Mentor Page ──
  'nav.mentor': { ko: '멘토 확인', en: 'Mentor', zh: '导师确认' },
  'mentor.title': { ko: '멘토 전용 페이지', en: 'Mentor Dashboard', zh: '导师专属页面' },
  'mentor.subtitle': { ko: '본인의 이름과 전화번호 뒷자리로 배정된 멘티를 확인하세요', en: 'View your assigned mentees with your name and phone number', zh: '使用您的姓名和电话号码后4位查看分配的学员' },
  'mentor.phone4Label': { ko: '전화번호 뒷자리 (4자리)', en: 'Last 4 digits of phone', zh: '电话号码后4位' },
  'mentor.login': { ko: '확인하기', en: 'View', zh: '查看' },
  'mentor.loading': { ko: '조회 중...', en: 'Loading...', zh: '查询中...' },
  'mentor.mentorSuffix': { ko: '멘토님의 배정 현황', en: "'s Assignment Status", zh: '导师的分配情况' },
  'mentor.noMentees': { ko: '배정된 멘티가 없습니다', en: 'No mentees assigned', zh: '没有分配的学员' },
  'mentor.yearBorn': { ko: '년생', en: ' born', zh: '年出生' },
  'mentor.desired': { ko: '희망', en: 'Desired', zh: '希望' },
  'mentor.errorBoth': { ko: '이름과 전화번호 뒷자리 4자리를 입력해주세요.', en: 'Please enter your name and last 4 digits of phone.', zh: '请输入姓名和电话号码后4位。' },
  'mentor.errorGeneral': { ko: '조회 중 오류가 발생했습니다.', en: 'An error occurred.', zh: '查询中发生错误。' },
  'mentor.note1': { ko: '이 페이지는 멘토 본인만 확인할 수 있습니다.', en: 'This page is only accessible to the mentor.', zh: '此页面仅供导师本人查看。' },
  'mentor.note2': { ko: '멘티의 메시지는 신청 시 작성한 내용입니다.', en: 'Mentee messages were written during application.', zh: '学员的留言是申请时填写的内容。' },
  'mentor.prompt': { ko: '이름과 전화번호 뒷자리를 입력하고 확인 버튼을 눌러주세요.', en: 'Enter your name and last 4 digits of phone, then press View.', zh: '请输入姓名和电话号码后4位，然后点击查看。' },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'ko',
  setLang: () => {},
  t: (key) => translations[key]?.ko ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved && (saved === 'ko' || saved === 'en' || saved === 'zh')) {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.ko;
  };

  // Avoid hydration mismatch by rendering children only after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
