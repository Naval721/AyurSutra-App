import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AuthError,
  restoreSession,
  signIn as signInRequest,
  signUp as signUpRequest,
  type SignUpInput,
} from '@/lib/api/auth';
import type { AuthSession, UserRole } from '@/lib/types';

type SessionStatus = 'loading' | 'ready';

interface SessionState {
  status: SessionStatus;
  /** Persisted so the app reopens straight into the right role. */
  profileId: string | null;
  session: AuthSession | null;
  pending: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (input: SignUpInput) => Promise<boolean>;
  signOut: () => void;
  /** Re-reads the signed-in records after a write (prakriti, profile edits). */
  refresh: () => Promise<void>;
  clearError: () => void;
}

function messageFor(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      status: 'loading',
      profileId: null,
      session: null,
      pending: false,
      error: null,

      hydrate: async () => {
        const { profileId } = get();
        if (!profileId) {
          set({ status: 'ready', session: null });
          return;
        }
        try {
          const session = await restoreSession(profileId);
          set({ session, profileId: session ? profileId : null, status: 'ready' });
        } catch {
          set({ session: null, profileId: null, status: 'ready' });
        }
      },

      signIn: async (email, password) => {
        set({ pending: true, error: null });
        try {
          const session = await signInRequest(email, password);
          set({ session, profileId: session.profile.id, pending: false, status: 'ready' });
          return true;
        } catch (error) {
          set({ pending: false, error: messageFor(error) });
          return false;
        }
      },

      signUp: async (input) => {
        set({ pending: true, error: null });
        try {
          const session = await signUpRequest(input);
          set({ session, profileId: session.profile.id, pending: false, status: 'ready' });
          return true;
        } catch (error) {
          set({ pending: false, error: messageFor(error) });
          return false;
        }
      },

      signOut: () => {
        set({ session: null, profileId: null, error: null, pending: false, status: 'ready' });
      },

      refresh: async () => {
        const { profileId } = get();
        if (!profileId) return;
        const session = await restoreSession(profileId);
        if (session) set({ session });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'ayursutra.session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profileId: state.profileId }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useSessionStore.setState({ status: 'ready', session: null, profileId: null });
          return;
        }
        void state?.hydrate();
      },
    },
  ),
);

export function isPractitionerRole(role: UserRole): boolean {
  return role === 'doctor' || role === 'therapist' || role === 'admin';
}

/** Route group a signed-in profile belongs to. */
export function homeHrefFor(session: AuthSession): '/(patient)/(tabs)' | '/(practitioner)/(tabs)' {
  return session.profile.role === 'patient' ? '/(patient)/(tabs)' : '/(practitioner)/(tabs)';
}
