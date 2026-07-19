import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import { Button, Input } from '../../components/ui';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp!');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-light via-white to-background-alt">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-4xl chinese-text">中</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-display">Chinese Learning</h1>
          <p className="mt-2 text-sm text-muted">Tạo tài khoản mới để bắt đầu học</p>
        </div>

        {/* Register Card */}
        <div className="card-elevated p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Đăng ký</h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="username"
              type="text"
              label="Tên người dùng"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="username"
              error={error && !username ? 'Vui lòng nhập tên người dùng' : ''}
            />

            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              error={error && !email ? 'Vui lòng nhập email' : ''}
            />

            <Input
              id="password"
              type="password"
              label="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Tối thiểu 8 ký tự"
              error={error && !password ? 'Vui lòng nhập mật khẩu' : ''}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Nhập lại mật khẩu"
              error={
                error && !confirmPassword
                  ? 'Vui lòng xác nhận mật khẩu'
                  : password !== confirmPassword && error !== 'Mật khẩu phải có ít nhất 8 ký tự!'
                  ? 'Mật khẩu không khớp'
                  : ''
              }
            />

            {/* Terms agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-border text-primary focus:ring-primary"
              />
              <label className="text-sm text-muted">
                Tôi đồng ý với{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="mt-6"
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted">hoặc</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <span className="text-sm text-muted">Đã có tài khoản? </span>
            <Link
              to="/login"
              className="text-sm text-primary font-medium hover:underline ml-1"
            >
              Đăng nhập
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Bắt đầu hành trình học tiếng Trung của bạn ngay hôm nay
          </p>
        </div>
      </div>
    </div>
  );
}
