import { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { ProfileStatsGrid } from './profile-stats-grid';
import { ProfileEditForm } from './profile-edit-form';
import { ChangePasswordForm } from './change-password-form';

/**
 * Profile page: header card (view / inline edit), learning stats grid,
 * change-password card and logout. Composes the profile/* components.
 */
export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header — toggles between view mode and inline edit form */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100 text-center">
          {isEditing ? (
            <ProfileEditForm onCancel={() => setIsEditing(false)} />
          ) : (
            <>
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">{user?.avatar ?? '👤'}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.username}
              </h2>
              <p className="text-gray-600 mb-4">{user?.email}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Chỉnh sửa profile
              </button>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <ProfileStatsGrid />

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
          <ChangePasswordForm />
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
