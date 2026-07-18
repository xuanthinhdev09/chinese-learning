import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg chinese-text">中</span>
              </div>
              <span className="ml-2 font-semibold text-gray-900">Chinese Learning</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.username}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Xin chào, {user?.username}! 👋
          </h1>
          <p className="mt-2 text-gray-600">Tiếp tục hành trình học tiếng Trung của bạn</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Từ vựng đã học</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bài hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chuỗi ngày học</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Learning Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bắt đầu học</h2>

          {/* HSK Levels Quick Access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vocabulary Study Card */}
            <Link to="/vocabulary/study" className="block">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-center h-16 mb-4">
                  <span className="text-4xl">📇</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Học Từ Vựng</h3>
                <p className="text-emerald-100 text-sm">Flashcard & Quiz - HSK 1-2</p>
              </div>
            </Link>

            {/* HSK 1 Card */}
            <Link to="/hsk" className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">1</span>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-sm text-green-700">3 bài học</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 chinese-text">HSK 1</h3>
                <p className="text-gray-600 text-sm">Cơ bản - 150 từ vựng</p>
              </div>
            </Link>

            {/* HSK 2 Card */}
            <Link to="/hsk" className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">2</span>
                  </div>
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-sm text-blue-700">2 bài học</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 chinese-text">HSK 2</h3>
                <p className="text-gray-600 text-sm">Sơ cấp - 300 từ vựng</p>
              </div>
            </Link>

            {/* View All HSK Card */}
            <Link to="/hsk" className="block">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-center h-16 mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Xem tất cả HSK</h3>
                <p className="text-blue-100 text-sm">HSK 1-6 với đầy đủ bài học</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-600">Bắt đầu học để theo dõi tiến độ của bạn!</p>
            <Link
              to="/hsk"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bắt đầu học ngay
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
