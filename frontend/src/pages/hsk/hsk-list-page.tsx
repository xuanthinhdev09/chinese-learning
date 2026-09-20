import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { hskApi } from '../../api/hsk-api';
import HskCard from '../../components/hsk/hsk-card';

export default function HskListPage() {
  const { t } = useTranslation();
  const { data: hskLevels, isLoading, error } = useQuery({
    queryKey: ['hsk-levels'],
    queryFn: () => hskApi.getLevels(),
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('hsk.title')}</h1>
        <p className="mt-2 text-gray-600">{t('hsk.subtitle')}</p>
      </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-700">{t('hsk.loadError')}</p>
          </div>
        )}

        {hskLevels && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hskLevels.map((hsk) => (
              <HskCard key={hsk.id} hsk={hsk} />
            ))}
          </div>
        )}
    </>
  );
}
