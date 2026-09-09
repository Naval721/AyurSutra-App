import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Fire-and-forget haptics. No-ops on web, where the API is unsupported, and
 * swallows failures so a device without a taptic engine never breaks a handler.
 */

function run(effect: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  effect().catch(() => {});
}

/** Selecting a slot, a day, a doctor: the lightest possible confirmation. */
export function tapSelection(): void {
  run(() => Haptics.selectionAsync());
}

/** Ticking off a Dinacharya habit or advancing a session. */
export function tapToggle(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A booking confirmed, a log saved, a prescription issued. */
export function tapSuccess(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A rejected booking or a validation failure the user has to fix. */
export function tapError(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
