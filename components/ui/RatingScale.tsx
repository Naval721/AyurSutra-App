import { View } from 'react-native';
import { PressableFeedback, Text } from 'heroui-native';

import { tapSelection } from '@/lib/haptics';
import type { Rating } from '@/lib/types';
import { cn } from '@/lib/utils';

const VALUES: Rating[] = [1, 2, 3, 4, 5];

export interface RatingScaleProps {
  label: string;
  value: Rating;
  onChange: (value: Rating) => void;
  /** Shown under the row, e.g. "1 = sluggish, 5 = strong". */
  hint?: string;
}

/** 1–5 selector used across the daily symptom log. */
export function RatingScale({ label, value, onChange, hint }: RatingScaleProps) {
  return (
    <View className="gap-2">
      <Text.Paragraph type="body-sm" weight="medium" className="text-foreground">
        {label}
      </Text.Paragraph>
      <View className="flex-row gap-2">
        {VALUES.map((option) => {
          const selected = option === value;
          return (
            <PressableFeedback
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${option} of 5`}
              accessibilityState={{ selected }}
              onPress={() => {
                tapSelection();
                onChange(option);
              }}
              className={cn(
                'h-11 flex-1 items-center justify-center rounded-xl border',
                selected ? 'bg-accent border-accent' : 'bg-surface border-border',
              )}
            >
              <Text.Paragraph
                weight="semibold"
                className={selected ? 'text-accent-foreground' : 'text-foreground'}
              >
                {option}
              </Text.Paragraph>
            </PressableFeedback>
          );
        })}
      </View>
      {hint ? (
        <Text.Paragraph type="body-xs" color="muted">
          {hint}
        </Text.Paragraph>
      ) : null}
    </View>
  );
}
