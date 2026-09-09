import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';
import { CalendarCheck, FileText, User, Users } from 'lucide-react-native';

import { useSessionStore } from '@/lib/store/session';

export default function PractitionerTabsLayout() {
  const session = useSessionStore((state) => state.session);
  const [background, foreground, border, accent, muted] = useThemeColor([
    'background',
    'foreground',
    'border',
    'accent',
    'muted',
  ]);

  const isTherapist = session?.profile.role === 'therapist';

  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- expo-status-bar's `style` prop is a string enum ('dark' | 'light' | ...), not a RN style object. */}
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: background },
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          tabBarStyle: { backgroundColor: background, borderTopColor: border },
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isTherapist ? 'Tasks' : 'Roster',
            tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="prescriptions"
          options={{
            title: 'Prescriptions',
            // Therapists do not prescribe, so the tab is hidden for them.
            href: isTherapist ? null : undefined,
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
