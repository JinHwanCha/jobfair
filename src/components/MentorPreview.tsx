'use client';

import { useState } from 'react';
import MentorCard from '@/components/MentorCard';
import MentorModal from '@/components/MentorModal';
import { Mentor } from '@/types';

interface MentorPreviewProps {
  mentors: Mentor[];
}

export default function MentorPreview({ mentors }: MentorPreviewProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onClickDetail={() => setSelectedMentor(mentor)}
          />
        ))}
      </div>

      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </>
  );
}
