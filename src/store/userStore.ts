import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
    dietaryType: string;
    weightGoal: 'lose' | 'maintain' | 'gain';
    allergies: string[];
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
    cookingSkill: 'beginner' | 'intermediate' | 'advanced';
    cookingTime: number; // minutes
    portions: number;
    units: 'metric' | 'imperial';
    cuisines: string[];
    dislikes: string[];
}

interface UserState {
    preferences: UserPreferences;
    isOnboardingComplete: boolean;
    setPreferences: (prefs: Partial<UserPreferences>) => void;
    completeOnboarding: () => void;
    resetUser: () => void;
}

const initialPreferences: UserPreferences = {
    dietaryType: 'balanced',
    weightGoal: 'maintain',
    allergies: [],
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatsGoal: 65,
    cookingSkill: 'intermediate',
    cookingTime: 30,
    portions: 2,
    units: 'metric',
    cuisines: [],
    dislikes: [],
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            preferences: initialPreferences,
            isOnboardingComplete: false,
            setPreferences: (prefs) =>
                set((state) => ({
                    preferences: { ...state.preferences, ...prefs },
                })),
            completeOnboarding: () => set({ isOnboardingComplete: true }),
            resetUser: () => set({ preferences: initialPreferences, isOnboardingComplete: false }),
        }),
        {
            name: 'user-storage',
        }
    )
);
