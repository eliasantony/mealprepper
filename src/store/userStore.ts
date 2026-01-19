import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Calorie distribution percentages for each meal type (should sum to ~1.0)
export interface CalorieDistribution {
    breakfast: number;
    lunch: number;
    afternoon_snack: number;
    dinner: number;
    evening_snack: number;
}

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
    // New preferences for AI optimization
    region: string;
    budget: 'low' | 'medium' | 'high' | 'premium';
    tasteProfile: string; // AI-generated summary of user's taste preferences
    additionalNotes: string; // User's free-text notes for AI fine-tuning
    calorieDistribution: CalorieDistribution; // Custom calorie distribution per meal type
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
    // New defaults for AI optimization
    region: 'Austria',
    budget: 'medium',
    tasteProfile: '',
    additionalNotes: '',
    calorieDistribution: {
        breakfast: 0.20,
        lunch: 0.30,
        afternoon_snack: 0.10,
        dinner: 0.30,
        evening_snack: 0.10,
    },
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
