import { View } from 'react-native';
import { PressableFeedback, Text } from 'heroui-native';
import { ChevronRight } from 'lucide-react-native';

import { DoshaBadge } from '@/components/ui/Dosha';
import { initials } from '@/lib/format';
import { BRAND_HEX } from '@/lib/theme';
import type { Patient } from '@/lib/types';

export interface PatientRowProps {
  patient: Patient;
  onPress?: () => void;
  /** Replaces the chief complaint line, e.g. therapy context. */
  subtitle?: string;
}

export function PatientRow({ patient, onPress, subtitle }: PatientRowProps) {
  const latest = patient.prakriti_history.at(-1);

  const body = (
    <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
      <View className="bg-saffron-soft h-11 w-11 items-center justify-center rounded-full">
        <Text.Paragraph type="body-sm" weight="bold" className="text-bark">
          {initials(patient.full_name)}
        </Text.Paragraph>
      </View>

      <View className="flex-1 gap-0.5">
        <Text.Paragraph weight="semibold" className="text-foreground" numberOfLines={1}>
          {patient.full_name}
        </Text.Paragraph>
        <Text.Paragraph type="body-xs" color="muted" numberOfLines={1}>
          {patient.age} yrs · {subtitle ?? patient.chief_complaint}
        </Text.Paragraph>
        {latest ? (
          <DoshaBadge dosha={latest.dominant} label={latest.constitution} className="mt-1.5" />
        ) : null}
      </View>

      {onPress ? <ChevronRight color={BRAND_HEX.barkSoft} size={18} /> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`Open ${patient.full_name}`}
      onPress={onPress}
    >
      {body}
    </PressableFeedback>
  );
}
