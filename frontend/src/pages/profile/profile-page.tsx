import { useAuthStore } from '../../stores/auth-store';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
          <p className="text-gray-600 mb-4">{user?.email}</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Chỉnh sửa profile
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-1">Từ vựng đã học</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-1">Bài hoàn thành</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-1">Chuỗi ngày học</p>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
            <p className="text-sm text-gray-600 mb-1">Ngày hoạt động</p>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Đăng xuất
        </button>
      </div>
    </>
  );
}
