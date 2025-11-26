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
    setSavedMeals: (meals: Meal[]) => void;
    clearAllData: () => void;
}

export const useMealStore = create<MealState>()(
    persist(
        (set) => ({
            savedMeals: [],
            weekPlan: {},
            addSavedMeal: (meal) =>
                set((state) => {
                    const existingIndex = state.savedMeals.findIndex(m => m.id === meal.id);
                    let newSavedMeals = [...state.savedMeals];

                    if (existingIndex >= 0) {
                        newSavedMeals[existingIndex] = meal;
                    } else {
                        newSavedMeals.push(meal);
                    }

                    // Also update any instances of this meal in the weekPlan
                    const newWeekPlan = { ...state.weekPlan };
                    Object.keys(newWeekPlan).forEach(date => {
                        const dayPlan = newWeekPlan[date];
                        if (dayPlan.meals) {
                            let dayUpdated = false;
                            const newMeals = { ...dayPlan.meals };

                            Object.keys(newMeals).forEach(slot => {
                                if (newMeals[slot as MealType]?.id === meal.id) {
                                    newMeals[slot as MealType] = meal;
                                    dayUpdated = true;
                                }
                            });

                            if (dayUpdated) {
                                newWeekPlan[date] = {
                                    ...dayPlan,
                                    meals: newMeals
                                };
                            }
                        }
                    });

                    return {
                        savedMeals: newSavedMeals,
                        weekPlan: newWeekPlan
                    };
                }),
            removeSavedMeal: (id) =>
                set((state) => ({
                    savedMeals: state.savedMeals.filter((m) => m.id !== id),
                })),
            setSavedMeals: (meals) => set({ savedMeals: meals }),
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
            clearAllData: () => set({ savedMeals: [], weekPlan: {} }),
        }),
        {
            name: 'meal-storage',
        }
    )
);
