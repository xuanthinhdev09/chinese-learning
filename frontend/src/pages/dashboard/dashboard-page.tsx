import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, CircularProgress } from '../../components/ui';
import { PageLoading } from '../../components/common';

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  trend?: number; // positive for up, negative for down
}

function StatCard({ icon, label, value, color, trend }: StatCardProps) {
  return (
    <Card padding="md" hover className="group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm text-muted">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div className={trend >= 0 ? 'text-accent' : 'text-destructive'}>
            <span className="text-sm font-medium">
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <PageLoading text="Đang tải dashboard..." fullScreen />;
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display mb-2">
          Xin chào, {user?.username}! 👋
        </h1>
        <p className="text-muted">Tiếp tục hành trình học tiếng Trung của bạn</p>
      </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📚"
            label="Từ vựng đã học"
            value={482}
            color="bg-primary-light"
            trend={12}
          />
          <StatCard
            icon="✅"
            label="Bài hoàn thành"
            value={36}
            color="bg-green-100"
            trend={8}
          />
          <StatCard
            icon="🔥"
            label="Chuỗi ngày"
            value={12}
            color="bg-orange-100"
          />
          <StatCard
            icon="⏱️"
            label="Thời gian học"
            value="24h"
            color="bg-purple-100"
          />
        </div>

        {/* Continue Learning Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground font-display">Tiếp tục học</h2>
            <Link to="/hsk" className="text-sm text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>

          {/* Current HSK Progress Card */}
          <Card padding="lg" className="mb-6 border-l-4 border-l-primary">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent" className="text-xs">Đang học</Badge>
                  <span className="text-sm text-muted">HSK 1</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  HSK 1 - Cơ bản
                </h3>
                <p className="text-muted mb-4">Còn 3 bài để hoàn thành level này</p>
                <Progress value={70} color="accent" size="md" showLabel />
              </div>
              <div className="text-center">
                <CircularProgress value={73} size={80} showLabel color="accent" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/lessons/8">
                <Button variant="primary" className="w-full sm:w-auto">
                  Tiếp tục Bài 8 →
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground font-display mb-4">Bắt đầu học</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vocabulary Study Card - Featured */}
            <Link to="/vocabulary/study" className="block group">
              <Card className="bg-gradient-to-br from-primary to-primary-dark text-white border-0 h-full group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-center h-20 mb-4">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-200">📇</span>
                </div>
                <h3 className="text-2xl font-semibold mb-2 font-display">Học Từ Vựng</h3>
                <p className="text-primary-light text-sm mb-4">Flashcard & Quiz thông minh</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <span className="text-sm">HSK 1</span>
                  <Badge variant="muted" className="bg-white/20 text-white border-0">Hot</Badge>
                </div>
              </Card>
            </Link>

            {/* Review Card */}
            <Link to="/vocabulary/review" className="block group">
              <Card className="h-full group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-accent/10 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <Badge variant="accent">Cần ôn tập</Badge>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Ôn Tập Theo Chu kỳ</h3>
                <p className="text-muted text-sm mb-4">24 từ cần ôn tập hôm nay</p>
                <div className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                  Ôn tập ngay →
                </div>
              </Card>
            </Link>

            {/* HSK Levels Card */}
            <Link to="/hsk" className="block group">
              <Card className="h-full group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-primary-light rounded-lg flex items-center justify-center">
                    <span className="text-3xl">📚</span>
                  </div>
                  <Badge variant="primary">MVP</Badge>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">HSK 1 - Cơ bản</h3>
                <p className="text-muted text-sm mb-4">150 từ vựng cơ bản nhất</p>
                <div className="grid grid-cols-3 gap-1 mt-4">
                  {[1].map((level) => (
                    <div
                      key={level}
                      className="text-center p-2 rounded bg-background-alt"
                    >
                      <span className="text-sm font-medium">{level}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Daily Goals */}
        <Card padding="md" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎯</span>
              <span>Mục tiêu hôm nay</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-foreground">Ôn tập 20 từ vựng</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-foreground">Hoàn thành 1 bài học</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-foreground">Làm 10 câu quiz</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-border last:pb-0 last:border-0">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✅</span>
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">Hoàn thành HSK 1 Bài 7</p>
                  <p className="text-sm text-muted">2 giờ trước</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pb-4 border-b border-border last:pb-0 last:border-0">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📚</span>
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">Ôn tập 50 flashcards</p>
                  <p className="text-sm text-muted">Hôm qua</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🏆</span>
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium">Đạt thành tích "7 ngày liên tiếp"</p>
                  <p className="text-sm text-muted">2 ngày trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </>
  );
}
