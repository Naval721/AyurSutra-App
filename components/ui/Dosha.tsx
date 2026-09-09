import { View } from 'react-native';
import { Text } from 'heroui-native';

import { DOSHA_CLASS, DOSHA_ELEMENT, DOSHA_LABEL } from '@/lib/theme';
import type { Dosha, DoshaScores } from '@/lib/types';
import { cn } from '@/lib/utils';

const ORDER: Dosha[] = ['vata', 'pitta', 'kapha'];

export interface DoshaBarProps {
  scores: DoshaScores;
  /** Shows the Vata / Pitta / Kapha percentages under the bar. */
  showLegend?: boolean;
  className?: string;
}

/** Single stacked bar showing the Vata-Pitta-Kapha split of a Prakriti result. */
export function DoshaBar({ scores, showLegend = true, className }: DoshaBarProps) {
  const total = ORDER.reduce((sum, dosha) => sum + scores[dosha], 0) || 1;

  return (
    <View className={className}>
      <View className="bg-surface-secondary h-3 flex-row overflow-hidden rounded-full">
        {ORDER.map((dosha) => (
          <View
            key={dosha}
            className={DOSHA_CLASS[dosha].bg}
            style={{ flex: scores[dosha] / total }}
          />
        ))}
      </View>
      {showLegend ? (
        <View className="mt-2 flex-row justify-between">
          {ORDER.map((dosha) => (
            <View key={dosha} className="flex-row items-center gap-1.5">
              <View className={cn('h-2 w-2 rounded-full', DOSHA_CLASS[dosha].bg)} />
              <Text.Paragraph type="body-xs" color="muted">
                {DOSHA_LABEL[dosha]} {Math.round(scores[dosha])}%
              </Text.Paragraph>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export interface DoshaBadgeProps {
  dosha: Dosha;
  /** Overrides the label, e.g. "Vata-Pitta" for a dual constitution. */
  label?: string;
  withElement?: boolean;
  className?: string;
}

/** Compact constitution tag used on patient rows and headers. */
export function DoshaBadge({ dosha, label, withElement = false, className }: DoshaBadgeProps) {
  const tone = DOSHA_CLASS[dosha];

  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', tone.softBg, className)}>
      <Text.Paragraph type="body-xs" weight="semibold" className={tone.text}>
        {label ?? DOSHA_LABEL[dosha]}
        {withElement ? ` · ${DOSHA_ELEMENT[dosha]}` : ''}
      </Text.Paragraph>
    </View>
  );
}
