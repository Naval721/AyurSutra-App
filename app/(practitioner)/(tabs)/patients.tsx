import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SearchField, Text } from 'heroui-native';
import { UserSearch } from 'lucide-react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PatientRow } from '@/components/ui/PatientRow';
import { Screen } from '@/components/ui/Screen';
import { queryKeys } from '@/lib/api/keys';
import { fetchPatients } from '@/lib/api/patients';
import { formatRelativeDay } from '@/lib/format';
import { BRAND_HEX } from '@/lib/theme';

export default function PractitionerPatientsScreen() {
  const [search, setSearch] = useState('');

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients(search),
    queryFn: () => fetchPatients(search),
    placeholderData: (previous) => previous,
  });

  const patients = patientsQuery.data ?? [];

  return (
    <Screen
      title="Patients"
      subtitle="Prakriti history, active treatments and clinical notes"
      padded={false}
      keyboardAware
    >
      <View className="px-5 pb-4">
        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, complaint or phone" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </View>

      {patientsQuery.isPending ? (
        <LoadingState label="Loading the patient directory" />
      ) : patientsQuery.isError ? (
        <ErrorState onRetry={() => void patientsQuery.refetch()} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.patient.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            patients.length > 0 ? (
              <Text.Paragraph type="body-xs" color="muted">
                {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
              </Text.Paragraph>
            ) : null
          }
          renderItem={({ item }) => (
            <PatientRow
              patient={item.patient}
              subtitle={
                item.activeTreatmentName
                  ? item.activeTreatmentName
                  : item.nextVisit
                    ? `Next visit ${formatRelativeDay(item.nextVisit)}`
                    : item.patient.chief_complaint
              }
              onPress={() =>
                router.push({
                  pathname: '/(practitioner)/patient/[id]',
                  params: { id: item.patient.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<UserSearch color={BRAND_HEX.barkSoft} size={22} />}
              title="No matching patients"
              message="Try a different name, complaint or phone number."
            />
          }
        />
      )}
    </Screen>
  );
}
