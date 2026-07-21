interface ImportProgressProps {
  progress: number;
  created: number;
  skipped: number;
  errors: number;
  isImporting: boolean;
}

export function ImportProgress({
  progress,
  created,
  skipped,
  errors,
  isImporting,
}: ImportProgressProps) {
  if (!isImporting && progress === 0) return null;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-4 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Created" value={created} color="green" />
        <StatCard label="Skipped" value={skipped} color="yellow" />
        <StatCard label="Errors" value={errors} color="red" />
      </div>

      {/* Status Message */}
      {isImporting && progress < 100 && (
        <div className="flex items-center text-gray-600">
          <svg
            className="animate-spin h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'green' | 'yellow' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div
      className={`border rounded-lg p-4 text-center ${colorClasses[color]}`}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
