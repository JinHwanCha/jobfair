'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface Mentee {
  name: string;
  message: string;
}

interface TimeSlotData {
  time: number;
  mentees: Mentee[];
}

interface MentorData {
  mentorName: string;
  mentorJob: string;
  timeSlots: TimeSlotData[];
}

export default function MentorPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone4, setPhone4] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MentorData | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone4.length !== 4) {
      setError(t('mentor.errorBoth'));
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone4 }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || t('mentor.errorGeneral'));
      } else {
        setData(json.data);
      }
    } catch {
      setError(t('mentor.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('mentor.title')}</h1>
      <p className="text-gray-500 mb-6">{t('mentor.subtitle')}</p>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('apply.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('apply.namePlaceholder')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mentor.phone4Label')}</label>
            <input
              type="text"
              value={phone4}
              onChange={(e) => setPhone4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-gray-900 text-primary-400 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? t('mentor.loading') : t('mentor.login')}
        </button>
      </form>

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 결과 */}
      {data && (
        <div>
          <div className="bg-primary-100 rounded-xl p-4 mb-6">
            <p className="text-gray-900 font-semibold text-lg">
              {data.mentorName} {t('mentor.mentorSuffix')}
            </p>
            <p className="text-gray-700 text-sm">{data.mentorJob}</p>
          </div>

          <div className="space-y-4">
            {data.timeSlots.map((slot) => (
              <div key={slot.time} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700">
                    {t('my.timeSlot')}{slot.time}
                  </h3>
                </div>
                <div className="p-4">
                  {slot.mentees.length === 0 ? (
                    <p className="text-gray-400 text-sm">{t('mentor.noMentees')}</p>
                  ) : (
                    <div className="space-y-3">
                      {slot.mentees.map((mentee, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 bg-warm-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-200 text-gray-900 rounded-full text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-800">{mentee.name}</span>
                          </div>
                          {mentee.message && (
                            <div className="ml-8 text-sm text-gray-600 bg-white rounded-md px-3 py-2 border border-gray-100">
                              💬 {mentee.message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">{t('my.notes')}</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>{t('mentor.note1')}</li>
              <li>{t('mentor.note2')}</li>
            </ul>
          </div>
        </div>
      )}

      {/* 초기 상태 */}
      {!data && !error && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>{t('mentor.prompt')}</p>
        </div>
      )}
    </div>
  );
}
