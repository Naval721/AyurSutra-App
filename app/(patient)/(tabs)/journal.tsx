import { FlatList, RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Text, useThemeColor } from 'heroui-native';
import { NotebookPen } from 'lucide-react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { Surface } from '@/components/ui/Surface';
import { queryKeys } from '@/lib/api/keys';
import { fetchLogs } from '@/lib/api/logs';
import { formatRelativeDay, toYmd } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';
import { BRAND_HEX } from '@/lib/theme';
import { DINACHARYA_ITEMS } from '@/lib/types';

/** Local guard: `bowel` is a small union, shown as a readable word. */
function bowelLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function average(values: number[]): string {
  if (values.length === 0) return 'n/a';
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function openLog(date: string) {
  router.push({ pathname: '/(patient)/log/[date]', params: { date } });
}

export default function JournalScreen() {
  const session = useSessionStore((state) => state.session);
  const patientId = session?.patient?.id ?? '';
  const today = toYmd(new Date());

  const logsQuery = useQuery({
    queryKey: queryKeys.logs(patientId),
    queryFn: () => fetchLogs(patientId),
    enabled: Boolean(patientId),
  });

  const [accent] = useThemeColor(['accent']);

  if (!patientId) {
    return (
      <Screen title="Journal">
        <LoadingState label="Loading your journal" />
      </Screen>
    );
  }

  if (logsQuery.isError) {
    return (
      <Screen title="Journal">
        <ErrorState
          message="We could not load your daily logs."
          onRetry={() => void logsQuery.refetch()}
        />
      </Screen>
    );
  }

  const logs = logsQuery.data ?? [];
  const recent = logs.slice(0, 7);

  return (
    <Screen
      title="Journal"
      subtitle="Your daily digestion, sleep and wellness log"
      padded={false}
      headerRight={
        <Button size="sm" onPress={() => openLog(today)}>
          <Button.Label>Log today</Button.Label>
        </Button>
      }
    >
      {logsQuery.isPending ? (
        <LoadingState label="Loading your entries" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={logsQuery.isRefetching}
              onRefresh={() => void logsQuery.refetch()}
              tintColor={accent}
            />
          }
          ListHeaderComponent={
            logs.length > 0 ? (
              <View className="flex-row gap-3 pb-1">
                <StatTile label="Entries" value={logs.length} caption="All time" />
                <StatTile
                  label="Digestion"
                  value={average(recent.map((log) => log.digestion))}
                  caption={recent.length === 7 ? 'Last 7 logs' : `Last ${recent.length} logs`}
                />
                <StatTile
                  label="Sleep"
                  value={average(recent.map((log) => log.sleep_hours))}
                  caption="Hours avg"
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No entries yet"
              message="Record how your digestion, sleep and energy feel each day. Your doctor reviews this before every visit."
              icon={<NotebookPen color={BRAND_HEX.saffron} size={22} />}
              action={
                <Button onPress={() => openLog(today)}>
                  <Button.Label>{"Write today's log"}</Button.Label>
                </Button>
              }
            />
          }
          renderItem={({ item }) => {
            const habits = Object.values(item.dinacharya).filter(Boolean).length;
            return (
              <Surface
                className="gap-2"
                accessibilityLabel={`Open log for ${item.log_date}`}
                onPress={() => openLog(item.log_date)}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <Text.Paragraph weight="semibold" className="text-foreground">
                    {formatRelativeDay(item.log_date)}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    Dinacharya {habits}/{DINACHARYA_ITEMS.length}
                  </Text.Paragraph>
                </View>

                <View className="flex-row flex-wrap gap-x-4 gap-y-1">
                  <Text.Paragraph type="body-xs" color="muted">
                    Digestion {item.digestion}/5
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    Sleep {item.sleep_hours} h ({item.sleep_quality}/5)
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    Energy {item.energy}/5
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    Mood {item.mood}/5
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    Bowel {bowelLabel(item.bowel)}
                  </Text.Paragraph>
                </View>

                {item.symptoms.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {item.symptoms.map((symptom) => (
                      <View key={symptom} className="bg-surface-secondary rounded-full px-2.5 py-1">
                        <Text.Paragraph type="body-xs" className="text-foreground">
                          {symptom}
                        </Text.Paragraph>
                      </View>
                    ))}
                  </View>
                ) : null}

                {item.notes ? (
                  <Text.Paragraph type="body-xs" color="muted" numberOfLines={2}>
                    {item.notes}
                  </Text.Paragraph>
                ) : null}
              </Surface>
            );
          }}
        />
      )}
    </Screen>
  );
}
