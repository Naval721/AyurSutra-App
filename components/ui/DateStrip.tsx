import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { addDays, format, startOfDay } from 'date-fns';
import { PressableFeedback, Text } from 'heroui-native';

import { toYmd } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DateStripProps {
  /** Selected day as yyyy-MM-dd. */
  value: string;
  onChange: (ymd: string) => void;
  /** How many days to render, starting from `offsetDays` before today. */
  days?: number;
  offsetDays?: number;
}

/** Horizontal day picker used by the roster, therapist tasks and booking. */
export function DateStrip({ value, onChange, days = 14, offsetDays = -2 }: DateStripProps) {
  const dates = useMemo(() => {
    const base = startOfDay(new Date());
    return Array.from({ length: days }, (_, index) => addDays(base, offsetDays + index));
  }, [days, offsetDays]);

  const todayYmd = toYmd(new Date());

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {dates.map((date) => {
        const ymd = toYmd(date);
        const selected = ymd === value;

        return (
          <PressableFeedback
            key={ymd}
            accessibilityRole="button"
            accessibilityLabel={format(date, 'EEEE d MMMM')}
            accessibilityState={{ selected }}
            onPress={() => onChange(ymd)}
            className={cn(
              'h-16 w-14 items-center justify-center rounded-2xl border',
              selected ? 'bg-accent border-accent' : 'bg-surface border-border',
            )}
          >
            <Text.Paragraph
              type="body-xs"
              className={selected ? 'text-accent-foreground' : 'text-muted'}
            >
              {format(date, 'EEE')}
            </Text.Paragraph>
            <Text.Paragraph
              weight="bold"
              className={selected ? 'text-accent-foreground' : 'text-foreground'}
            >
              {format(date, 'd')}
            </Text.Paragraph>
            {ymd === todayYmd ? (
              <View
                className={cn(
                  'mt-0.5 h-1 w-1 rounded-full',
                  selected ? 'bg-accent-foreground' : 'bg-accent',
                )}
              />
            ) : null}
          </PressableFeedback>
        );
      })}
    </ScrollView>
  );
}
