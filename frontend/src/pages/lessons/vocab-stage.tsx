import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { vocabularyApi } from '../../api/vocabulary-api';
import { PracticeItem, PracticeRunner } from '../../components/today/practice-runner';

/**
 * Stage 1 của wizard: từ vựng. Ép tuần tự flashcard → quiz (quiz chỉ mở sau
 * khi hết flashcard). Mỗi lượt đều ghi SM-2 quality vào vocabularyApi.
 */
export function VocabStage({
  items,
  onComplete,
}: {
  items: PracticeItem[];
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'flashcard' | 'quiz'>('flashcard');

  const record = async (item: PracticeItem, quality: number) => {
    await vocabularyApi.recordProgress({ vocabularyId: item.id, quality });
  };

  if (step === 'flashcard') {
    return (
      <PracticeRunner
        title={t('learn.vocabFlashcardTitle')}
        items={items}
        mode="flashcard"
        onRate={record}
        onDone={() => setStep('quiz')}
      />
    );
  }

  return (
    <PracticeRunner
      title={t('learn.vocabQuizTitle')}
      items={items}
      mode="quiz"
      onRate={record}
      onDone={onComplete}
    />
  );
}
