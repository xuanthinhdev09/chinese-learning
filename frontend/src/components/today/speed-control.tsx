import { useState } from 'react';
import { cn } from '../../utils/cn';

const SPEED_OPTIONS = [
  { value: 0.75, label: '0.75x', desc: 'Chậm — dễ nghe' },
  { value: 0.8, label: '0.8x', desc: 'Hơi chậm' },
  { value: 1, label: '1x', desc: 'Bình thường' },
  { value: 1.25, label: '1.25x', desc: 'Nhanh — luyện phản xạ' },
];

interface SpeedControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** Dropdown tốc độ đọc TTS cho hội thoại (0.75x–1.25x, mặc định 1x). */
export function SpeedControl({ value, onChange, disabled = false }: SpeedControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="px-2 py-1 text-xs bg-primary-light text-primary-dark rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
        title="Tốc độ đọc"
      >
        {value}x
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-border z-10 animate-fade-in">
          <div className="p-2">
            <p className="text-xs text-muted mb-2 text-center">Tốc độ đọc</p>
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded mb-1 last:mb-0 transition-colors text-left',
                  value === option.value ? 'bg-primary text-white' : 'hover:bg-background-alt text-foreground'
                )}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="text-xs opacity-75 ml-2">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
