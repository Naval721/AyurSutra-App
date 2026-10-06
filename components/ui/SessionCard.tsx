import { View } from 'react-native';
import { Button, Text } from 'heroui-native';

import { StatusChip } from '@/components/ui/StatusChip';
import { Surface } from '@/components/ui/Surface';
import { TREATMENT_STAGE_LABEL, formatRelativeDay } from '@/lib/format';
import type { SessionStatus, TreatmentSession } from '@/lib/types';

interface SessionAction {
  label: string;
  status: SessionStatus;
}

function actionsFor(status: SessionStatus): SessionAction[] {
  switch (status) {
    case 'pending':
      return [
        { label: 'Start', status: 'in_progress' },
        { label: 'Mark done', status: 'completed' },
        { label: 'Skip', status: 'skipped' },
      ];
    case 'in_progress':
      return [
        { label: 'Mark done', status: 'completed' },
        { label: 'Skip', status: 'skipped' },
      ];
    default:
      return [{ label: 'Reopen', status: 'pending' }];
  }
}

export interface SessionCardProps {
  session: TreatmentSession;
  /** Patient and protocol context, shown under the therapy name. */
  caption?: string;
  /** Shows the session date instead of relying on the screen's selected day. */
  showDate?: boolean;
  onStatusChange?: (status: SessionStatus) => void;
  onOpenPlan?: () => void;
  openPlanLabel?: string;
  busy?: boolean;
}

/** One Panchakarma session, used by therapist tasks and treatment detail. */
export function SessionCard({
  session,
  caption,
  showDate = false,
  onStatusChange,
  onOpenPlan,
  openPlanLabel = 'View plan',
  busy = false,
}: SessionCardProps) {
  return (
    <Surface className="gap-3">
      <View className="flex-row items-start gap-3">
        <View className="bg-saffron-soft h-11 w-11 items-center justify-center rounded-xl">
          <Text.Paragraph type="body-xs" className="text-bark">
            Day
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" weight="bold" className="text-bark">
            {session.day}
          </Text.Paragraph>
        </View>

        <View className="flex-1 gap-1">
          <Text.Paragraph weight="semibold" className="text-foreground">
            {session.therapy_name}
          </Text.Paragraph>
          {caption ? (
            <Text.Paragraph type="body-xs" color="muted" numberOfLines={2}>
              {caption}
            </Text.Paragraph>
          ) : null}
          <Text.Paragraph type="body-xs" color="muted">
            {TREATMENT_STAGE_LABEL[session.stage]} · {session.duration_min} min
            {session.room ? ` · ${session.room}` : ''}
            {showDate ? ` · ${formatRelativeDay(session.date)}` : ''}
          </Text.Paragraph>
        </View>

        <StatusChip kind="session" status={session.status} />
      </View>

      {session.notes ? (
        <Text.Paragraph
          type="body-xs"
          color="muted"
          className="bg-surface-secondary rounded-xl p-3"
        >
          {session.notes}
        </Text.Paragraph>
      ) : null}

      {onStatusChange || onOpenPlan ? (
        <View className="flex-row flex-wrap gap-2">
          {onStatusChange
            ? actionsFor(session.status).map((action) => {
                const isPrimary =
                  (session.status === 'pending' && action.status === 'in_progress') ||
                  (session.status === 'in_progress' && action.status === 'completed');
                return (
                  <Button
                    key={action.status}
                    size="sm"
                    variant={isPrimary ? 'primary' : 'secondary'}
                    isDisabled={busy}
                    onPress={() => onStatusChange(action.status)}
                  >
                    <Button.Label>{action.label}</Button.Label>
                  </Button>
                );
              })
            : null}
          {onOpenPlan ? (
            <Button size="sm" variant="tertiary" onPress={onOpenPlan}>
              <Button.Label>{openPlanLabel}</Button.Label>
            </Button>
          ) : null}
        </View>
      ) : null}
    </Surface>
  );
}
