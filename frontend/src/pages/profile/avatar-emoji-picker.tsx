import { cn } from '../../utils/cn';
import { AVATAR_EMOJIS } from './avatar-emojis';

export interface AvatarEmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
}

/**
 * Controlled grid of preset avatar emojis — tap to select.
 * The selected emoji gets a highlight ring.
 */
export function AvatarEmojiPicker({ value, onChange }: AvatarEmojiPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Chọn avatar">
      {AVATAR_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="radio"
          aria-checked={value === emoji}
          onClick={() => onChange(emoji)}
          className={cn(
            'aspect-square flex items-center justify-center',
            'text-2xl rounded-xl',
            'bg-gray-50 dark:bg-gray-700',
            'border border-gray-200 dark:border-gray-600',
            'transition-all duration-150',
            'hover:bg-gray-100 dark:hover:bg-gray-600',
            'active:scale-95',
            value === emoji &&
              'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/30'
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
