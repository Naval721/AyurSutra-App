import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Text } from 'heroui-native';

import { LoadingState } from '@/components/ui/States';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Surface } from '@/components/ui/Surface';
import { fetchStaff } from '@/lib/api/auth';
import { queryKeys } from '@/lib/api/keys';
import { initials, titleCase } from '@/lib/format';
import { useSessionStore } from '@/lib/store/session';

export default function PractitionerProfileScreen() {
  const session = useSessionStore((state) => state.session);
  const signOut = useSessionStore((state) => state.signOut);

  const staffQuery = useQuery({
    queryKey: queryKeys.staff,
    queryFn: fetchStaff,
  });

  if (!session) {
    return (
      <Screen title="Profile">
        <LoadingState label="Loading your profile" />
      </Screen>
    );
  }

  const { profile, clinic } = session;
  const team = (staffQuery.data ?? []).filter((member) => member.id !== profile.id);

  return (
    <Screen title="Profile" subtitle="Your clinic details and team" scroll contentClassName="gap-6">
      <Surface className="flex-row items-center gap-4">
        <View className="bg-saffron-soft h-14 w-14 items-center justify-center rounded-full">
          <Text.Heading type="h5" className="text-bark">
            {initials(profile.full_name)}
          </Text.Heading>
        </View>
        <View className="flex-1 gap-0.5">
          <Text.Paragraph weight="semibold" className="text-foreground">
            {profile.full_name}
          </Text.Paragraph>
          <Text.Paragraph type="body-sm" color="muted">
            {titleCase(profile.role)}
            {profile.specialisation ? ` · ${profile.specialisation}` : ''}
          </Text.Paragraph>
          {profile.qualification ? (
            <Text.Paragraph type="body-xs" color="muted">
              {profile.qualification}
            </Text.Paragraph>
          ) : null}
        </View>
      </Surface>

      <View>
        <SectionHeader title="Contact" />
        <Surface className="gap-2">
          <View className="flex-row justify-between gap-3">
            <Text.Paragraph type="body-sm" color="muted">
              Email
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {profile.email}
            </Text.Paragraph>
          </View>
          <View className="flex-row justify-between gap-3">
            <Text.Paragraph type="body-sm" color="muted">
              Phone
            </Text.Paragraph>
            <Text.Paragraph type="body-sm" className="text-foreground">
              {profile.phone}
            </Text.Paragraph>
          </View>
        </Surface>
      </View>

      <View>
        <SectionHeader title="Clinic" caption={clinic.name} />
        <Surface className="gap-2">
          <Text.Paragraph type="body-sm" className="text-foreground">
            {clinic.address}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            {clinic.phone} · {clinic.timezone}
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            Open {clinic.opening_hour}:00 to {clinic.closing_hour}:00 · Break{' '}
            {clinic.break_window[0]}:00 to {clinic.break_window[1]}:00
          </Text.Paragraph>
          <Text.Paragraph type="body-xs" color="muted">
            Therapy rooms: {clinic.therapy_rooms.join(', ')}
          </Text.Paragraph>
        </Surface>
      </View>

      <View>
        <SectionHeader title="Team" caption="Doctors, therapists and clinic staff" />
        {staffQuery.isPending ? (
          <LoadingState label="Loading the team" />
        ) : (
          <View className="gap-3">
            {team.map((member) => (
              <Surface key={member.id} className="flex-row items-center gap-3">
                <View className="bg-surface-secondary h-10 w-10 items-center justify-center rounded-full">
                  <Text.Paragraph type="body-xs" weight="bold" className="text-foreground">
                    {initials(member.full_name)}
                  </Text.Paragraph>
                </View>
                <View className="flex-1">
                  <Text.Paragraph type="body-sm" weight="semibold" className="text-foreground">
                    {member.full_name}
                  </Text.Paragraph>
                  <Text.Paragraph type="body-xs" color="muted">
                    {titleCase(member.role)}
                    {member.specialisation ? ` · ${member.specialisation}` : ''}
                  </Text.Paragraph>
                </View>
              </Surface>
            ))}
          </View>
        )}
      </View>

      <Button variant="secondary" onPress={signOut}>
        <Button.Label>Sign out</Button.Label>
      </Button>

      <Text.Paragraph type="body-xs" color="muted" className="text-center">
        AyurSutra practitioner app · shares one backend with the clinic dashboard and patient app.
      </Text.Paragraph>
    </Screen>
  );
}
