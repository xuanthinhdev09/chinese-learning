import { cn } from '../../utils/cn';

/**
 * Avatar tròn: emoji đã chọn trong hồ sơ, hoặc chữ cái đầu của username khi
 * chưa chọn avatar. Dùng chung cho header dropdown + mobile menu.
 */
export function UserAvatar({
  user,
  size = 'md',
}: {
  user?: { username: string; email: string; avatar?: string };
  size?: 'md' | 'lg';
}) {
  const ring =
    'transition-shadow hover:ring-2 hover:ring-primary/30 rounded-full';
  const box = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  if (user?.avatar) {
    return (
      <span
        className={cn(
          'flex items-center justify-center',
          box,
          'bg-gray-100 text-lg select-none',
          ring
        )}
        aria-hidden="true"
      >
        {user.avatar}
      </span>
    );
  }
  const initial = (user?.username ?? user?.email ?? '?').charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        'flex items-center justify-center',
        box,
        'bg-primary text-white text-sm font-semibold select-none',
        ring
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
