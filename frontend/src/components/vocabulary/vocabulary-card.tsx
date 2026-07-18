import { Vocabulary } from '../../api/vocabulary-api';

interface VocabularyCardProps {
  vocabulary: Vocabulary;
}

export default function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="text-center">
        {/* Hanzi - Large, prominent */}
        <div className="text-5xl font-bold text-gray-900 mb-4 chinese-text">{vocabulary.hanzi}</div>

        {/* Pinyin with tone marks */}
        <div className="text-xl text-gray-700 mb-2">{vocabulary.pinyin}</div>

        {/* Meaning - Vietnamese */}
        <div className="text-lg text-gray-900 font-medium mb-3">{vocabulary.meaning}</div>

        {/* Word type badge */}
        {vocabulary.wordType && (
          <div className="inline-block bg-gray-100 px-3 py-1 rounded-full mb-3">
            <span className="text-xs text-gray-600">{vocabulary.wordType}</span>
          </div>
        )}

        {/* Example sentence */}
        {vocabulary.example && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
            <div className="text-sm text-gray-700">{vocabulary.example}</div>
          </div>
        )}

        {/* Audio button placeholder */}
        <div className="mt-4">
          <button
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center justify-center gap-1"
            disabled={!vocabulary.audioUrl}
          >
            <span>🔊</span>
            <span>{vocabulary.audioUrl ? 'Nghe phát âm' : 'Chưa có audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}