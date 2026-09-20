import { useTranslation } from 'react-i18next';
import { Vocabulary } from '../../api/vocabulary-api';
import VocabularyCard from './vocabulary-card';

interface VocabularyListProps {
  vocabularies: Vocabulary[];
  loading?: boolean;
}

export default function VocabularyList({ vocabularies, loading }: VocabularyListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (vocabularies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('vocabulary.list.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vocabularies.map((vocab) => (
        <VocabularyCard key={vocab.id} vocabulary={vocab} />
      ))}
    </div>
  );
}