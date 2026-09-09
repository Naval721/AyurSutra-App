import { View } from 'react-native';
import { Button, Text } from 'heroui-native';

import { StatusChip } from '@/components/ui/StatusChip';
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
  busy?: boolean;
}

/** One Panchakarma session, used by therapist tasks and treatment detail. */
export function SessionCard({
  session,
  caption,
  showDate = false,
  onStatusChange,
  onOpenPlan,
  busy = false,
}: SessionCardProps) {
  return (
    <View className="border-border bg-surface gap-3 rounded-2xl border p-4">
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
            ? actionsFor(session.status).map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.status === 'completed' ? 'primary' : 'secondary'}
                  isDisabled={busy}
                  onPress={() => onStatusChange(action.status)}
                >
                  <Button.Label>{action.label}</Button.Label>
                </Button>
              ))
            : null}
          {onOpenPlan ? (
            <Button size="sm" variant="tertiary" onPress={onOpenPlan}>
              <Button.Label>View plan</Button.Label>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
