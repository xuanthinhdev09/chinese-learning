import { useNavigate } from 'react-router-dom';
import { LessonSummary } from '../../api/hsk-api';

interface LessonCardProps {
  lesson: LessonSummary;
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/lessons/${lesson.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 font-semibold">{lesson.order}</span>
        </div>
        <div className="bg-green-100 px-3 py-1 rounded-full">
          <span className="text-sm text-green-700">{lesson.vocabularyCount} từ</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 chinese-text">{lesson.title}</h3>
      {lesson.description && (
        <p className="text-gray-600 text-sm">{lesson.description}</p>
      )}
    </div>
  );
}