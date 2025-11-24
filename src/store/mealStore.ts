import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Meal, WeekPlan, MealType } from '@/types';

interface MealState {
    savedMeals: Meal[];
    weekPlan: WeekPlan;
    addSavedMeal: (meal: Meal) => void;
    removeSavedMeal: (id: string) => void;
    setMealForSlot: (date: string, slot: MealType, meal: Meal) => void;
    removeMealFromSlot: (date: string, slot: MealType) => void;
    rateMeal: (id: string, rating: number) => void;
    selectedMeal: Meal | null;
    setSelectedMeal: (meal: Meal | null) => void;
}

export const useMealStore = create<MealState>()(
    persist(
        (set) => ({
            savedMeals: [],
            weekPlan: {},
            addSavedMeal: (meal) =>
                set((state) => ({ savedMeals: [...state.savedMeals, meal] })),
            removeSavedMeal: (id) =>
                set((state) => ({
                    savedMeals: state.savedMeals.filter((m) => m.id !== id),
                })),
            setMealForSlot: (date, slot, meal) =>
                set((state) => {
                    const dayPlan = state.weekPlan[date] || { date, meals: {} };
                    return {
                        weekPlan: {
                            ...state.weekPlan,
                            [date]: {
                                ...dayPlan,
                                meals: {
                                    ...dayPlan.meals,
                                    [slot]: meal,
                                },
                            },
                        },
                    };
                }),
            removeMealFromSlot: (date, slot) =>
                set((state) => {
                    const dayPlan = state.weekPlan[date];
                    if (!dayPlan) return state;
                    const newMeals = { ...dayPlan.meals };
                    delete newMeals[slot];
                    return {
                        weekPlan: {
                            ...state.weekPlan,
                            [date]: {
                                ...dayPlan,
                                meals: newMeals,
                            },
                        },
                    };
                }),
            rateMeal: (id, rating) =>
                set((state) => ({
                    savedMeals: state.savedMeals.map((m) =>
                        m.id === id ? { ...m, rating } : m
                    ),
                })),
            selectedMeal: null,
            setSelectedMeal: (meal) => set({ selectedMeal: meal }),
        }),
        {
            name: 'meal-storage',
        }
    )
);
