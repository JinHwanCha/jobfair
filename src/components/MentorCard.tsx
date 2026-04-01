import { Mentor } from '@/types';

interface MentorCardProps {
  mentor: Mentor;
  selected?: boolean;
  onSelect?: () => void;
  onClickDetail?: () => void;
  showSelectButton?: boolean;
  disabled?: boolean;
}

// 카테고리별 색상
export function getCategoryColor(category: string) {
  const colors: [string, string][] = [
    ['Building', 'bg-green-100 text-green-700'],
    ['Leading', 'bg-yellow-100 text-yellow-700'],
    ['Operating', 'bg-orange-100 text-orange-700'],
    ['Teaching', 'bg-blue-100 text-blue-700'],
    ['Connecting', 'bg-cyan-100 text-cyan-700'],
    ['Creating', 'bg-purple-100 text-purple-700'],
    ['Healing', 'bg-red-100 text-red-700'],
    ['Influencing', 'bg-pink-100 text-pink-700'],
    ['Protecting Justice', 'bg-indigo-100 text-indigo-700'],
    ['Serving', 'bg-teal-100 text-teal-700'],
  ];
  for (const [key, value] of colors) {
    if (category.includes(key)) return value;
  }
  return 'bg-gray-100 text-gray-700';
}

// 카테고리별 아이콘
export function getCategoryIcon(category: string) {
  const map: [string, string][] = [
    ['Building', '🔧'],
    ['Leading', '💼'],
    ['Operating', '⚙️'],
    ['Teaching', '📚'],
    ['Connecting', '🌐'],
    ['Creating', '🎨'],
    ['Healing', '🏥'],
    ['Influencing', '📢'],
    ['Protecting Justice', '⚖️'],
    ['Serving', '🤝'],
  ];
  for (const [key, icon] of map) {
    if (category.includes(key)) return icon;
  }
  return '✨';
}

// 긴 카테고리에서 짧은 영어 이름 추출
export function getShortCategoryLabel(category: string): string {
  const knownCategories = [
    'Building', 'Leading', 'Operating', 'Teaching',
    'Connecting', 'Creating', 'Healing', 'Influencing',
    'Protecting Justice', 'Serving',
  ];
  const found = knownCategories.filter(cat => category.includes(cat));
  return found.length > 0 ? found.join(' · ') : '기타';
}

export default function MentorCard({
  mentor,
  selected,
  onSelect,
  onClickDetail,
  showSelectButton,
  disabled,
}: MentorCardProps) {
  return (
    <div
      className={`mentor-card cursor-pointer ${
        selected ? 'ring-2 ring-primary-500 border-primary-500' : ''
      } ${disabled ? 'opacity-50' : ''}`}
      onClick={() => {
        if (!showSelectButton && onClickDetail) onClickDetail();
      }}
    >
      {/* 상단: 이름 + 직업 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getCategoryIcon(mentor.category)}</span>
            <h3 className="text-lg font-bold text-gray-800 truncate">{mentor.name}</h3>
          </div>
          <p className="text-primary-600 font-medium text-sm">{mentor.jobTitle || mentor.job}</p>
        </div>
        <span className={`category-badge shrink-0 ml-2 ${getCategoryColor(mentor.category)}`}>
          {getShortCategoryLabel(mentor.category)}
        </span>
      </div>

      {/* 경력 */}
      {mentor.experience && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="text-gray-400">경력</span>
          <span>{mentor.experience}</span>
        </div>
      )}

      {/* 멘토링 방식 */}
      {mentor.mentoringType && (
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
          <span className="text-gray-400 shrink-0">멘토링</span>
          <span className="line-clamp-1">{mentor.mentoringType}</span>
        </div>
      )}

      {/* 하단: 버튼 영역 */}
      <div className="flex gap-2 mt-auto">
        {showSelectButton && onClickDetail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickDetail();
            }}
            className="py-2 px-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
          >
            상세
          </button>
        )}

        {showSelectButton && onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            disabled={disabled}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
              selected
                ? 'bg-primary-500 text-white'
                : disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-warm-200 text-primary-700 hover:bg-warm-300'
            }`}
          >
            {selected ? '✓ 선택됨' : '선택하기'}
          </button>
        )}

        {!showSelectButton && onClickDetail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickDetail();
            }}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-warm-200 text-primary-700 hover:bg-warm-300 transition-colors"
          >
            자세히 보기
          </button>
        )}
      </div>
    </div>
  );
}
