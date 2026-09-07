import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthProvider = 'apple' | 'email';

export interface Profile {
  name: string;
  email: string | null;
  provider: AuthProvider;
  /** Opaque local account id — Apple's user id, or a hash of the email. */
  accountId: string;
  createdAt: number;
}

export interface OnboardingAnswers {
  goals: string[];
  focusHours: number;
  rituals: string[];
  waterGoal: number;
  stepGoal: number;
  wakeTime: string;
}

export interface ProfileState {
  hydrated: boolean;
  profile: Profile | null;
  onboarded: boolean;
  answers: OnboardingAnswers | null;

  signIn(profile: Omit<Profile, 'createdAt'>): void;
  signOut(): void;
  completeOnboarding(answers: OnboardingAnswers, name: string): void;
  setName(name: string): void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      hydrated: false,
      profile: null,
      onboarded: false,
      answers: null,

      signIn: (profile) => set({ profile: { ...profile, createdAt: Date.now() } }),
      signOut: () => set({ profile: null, onboarded: false, answers: null }),
      completeOnboarding: (answers, name) =>
        set((s) => ({
          answers,
          onboarded: true,
          profile: s.profile ? { ...s.profile, name: name || s.profile.name } : s.profile,
        })),
      setName: (name) => set((s) => ({ profile: s.profile ? { ...s.profile, name } : s.profile })),
    }),
    {
      name: 'life-profile-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useProfileStore.setState({ hydrated: true });
      },
    }
  )
);

/** First name only — the dashboard greeting uses it. */
export function firstName(profile: Profile | null): string {
  if (!profile?.name) return 'there';
  return profile.name.trim().split(/\s+/)[0];
}
