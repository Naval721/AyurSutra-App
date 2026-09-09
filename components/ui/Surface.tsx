import type { ReactNode } from 'react';
import { View } from 'react-native';
import { PressableFeedback } from 'heroui-native';

import { cn } from '@/lib/utils';

type SurfaceTone = 'default' | 'accent' | 'muted';

const TONE: Record<SurfaceTone, string> = {
  default: 'border-border bg-surface',
  accent: 'border-accent bg-saffron-soft',
  muted: 'border-border bg-surface-secondary',
};

export interface SurfaceProps {
  children: ReactNode;
  /** `accent` for the highlighted call-to-action panels, `muted` for inset blocks. */
  tone?: SurfaceTone;
  /** Turns the surface into a row: press feedback plus an accessible label. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Drops the inner padding for surfaces that clip their own rows. */
  bare?: boolean;
  className?: string;
}

/**
 * The one card in the app: `rounded-2xl` on a 1px border. Everything that reads
 * as a panel goes through here so radius, border and padding stay identical.
 */
export function Surface({
  children,
  tone = 'default',
  onPress,
  accessibilityLabel,
  bare = false,
  className,
}: SurfaceProps) {
  const body = (
    <View className={cn('rounded-2xl border', TONE[tone], !bare && 'p-4', className)}>
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {body}
    </PressableFeedback>
  );
}
