import { useNavigate } from 'react-router-dom';
import { HskLevel } from '../../api/hsk-api';

interface HskCardProps {
  hsk: HskLevel;
}

export default function HskCard({ hsk }: HskCardProps) {
  const navigate = useNavigate();

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      5: 'bg-red-500',
      6: 'bg-pink-500',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div
      onClick={() => navigate(`/hsk/${hsk.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-16 h-16 ${getLevelColor(hsk.level)} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-2xl font-bold">{hsk.level}</span>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          <span className="text-sm text-gray-600">{hsk.lessonCount} bài học</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 chinese-text">{hsk.name}</h3>
      {hsk.description && (
        <p className="text-gray-600 text-sm">{hsk.description}</p>
      )}
    </div>
  );
}