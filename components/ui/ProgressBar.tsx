import { View } from 'react-native';

import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  completed: number;
  total: number;
  /** Announced by screen readers, e.g. "Sessions completed". */
  label?: string;
  className?: string;
}

/** Thin track with a saffron fill. Used for session counts and assessment progress. */
export function ProgressBar({ completed, total, label, className }: ProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.min(100, Math.max(0, Math.round((completed / safeTotal) * 100)));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: completed }}
      className={cn('bg-surface-secondary h-2 overflow-hidden rounded-full', className)}
    >
      <View className="bg-accent h-2 rounded-full" style={{ width: `${percent}%` }} />
    </View>
  );
}
