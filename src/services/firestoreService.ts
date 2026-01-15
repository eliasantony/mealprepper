import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, query, where, deleteField } from 'firebase/firestore';
import { UserPreferences } from '@/store/userStore';
import { Meal, WeekPlan, WeekPlanFirestore, MealType } from '@/types';

export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
    try {
        await setDoc(doc(db, 'users', userId), { preferences }, { merge: true });
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
    }
};

export const saveOnboardingData = async (userId: string, preferences: UserPreferences) => {
    try {
        await setDoc(doc(db, 'users', userId), {
            preferences,
            hasCompletedOnboarding: true
        }, { merge: true });
    } catch (error) {
        console.error('Error saving onboarding data:', error);
        throw error;
    }
};

export const updateUserData = async (userId: string, data: any) => {
    try {
        await setDoc(doc(db, 'users', userId), data, { merge: true });
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};

export const getUserData = async (userId: string) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
};

export const saveMealToFirestore = async (userId: string, meal: Meal) => {
    try {
        // Store in top-level recipes collection
        await setDoc(doc(db, 'recipes', meal.id), {
            ...meal,
            userId,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving meal:', error);
        throw error;
    }
};

export const getSavedMeals = async (userId: string): Promise<Meal[]> => {
    try {
        const q = query(collection(db, 'recipes'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Meal);
    } catch (error) {
        console.error('Error getting saved meals:', error);
        return [];
    }
};

export const getPublicRecipes = async (): Promise<Meal[]> => {
    try {
        const q = query(collection(db, 'recipes'), where('visibility', '==', 'public'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Meal);
    } catch (error) {
        console.error('Error getting public recipes:', error);
        return [];
    }
};

export const deleteMealFromFirestore = async (userId: string, mealId: string) => {
    try {
        await deleteDoc(doc(db, 'recipes', mealId));
    } catch (error) {
        console.error('Error deleting meal:', error);
        throw error;
    }
};

// Convert WeekPlan (with full Meal objects) to WeekPlanFirestore (with just IDs)
const weekPlanToFirestore = (weekPlan: WeekPlan): WeekPlanFirestore => {
    const result: WeekPlanFirestore = {};

    for (const [date, dayPlan] of Object.entries(weekPlan)) {
        if (!dayPlan || !dayPlan.meals) continue;

        const mealIds: { [key in MealType]?: string } = {};
        let hasAnyMeals = false;

        for (const [mealType, meal] of Object.entries(dayPlan.meals)) {
            if (meal && meal.id) {
                mealIds[mealType as MealType] = meal.id;
                hasAnyMeals = true;
            }
        }

        // Only include this day if it has at least one meal
        if (hasAnyMeals) {
            result[date] = {
                date: dayPlan.date,
                meals: mealIds
            };
        }
    }

    return result;
};

// Convert WeekPlanFirestore (IDs) back to WeekPlan (full objects)
// Requires savedMeals to resolve IDs
const firestoreToWeekPlan = (firestorePlan: WeekPlanFirestore, recipes: Meal[]): WeekPlan => {
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    const result: WeekPlan = {};

    for (const [date, dayPlan] of Object.entries(firestorePlan)) {
        if (!dayPlan || !dayPlan.meals) continue;

        const meals: { [key in MealType]?: Meal } = {};

        for (const [mealType, recipeId] of Object.entries(dayPlan.meals)) {
            if (recipeId) {
                // Handle both old format (full Meal) and new format (string ID)
                if (typeof recipeId === 'string') {
                    const recipe = recipeMap.get(recipeId);
                    if (recipe) {
                        meals[mealType as MealType] = recipe;
                    }
                } else if (typeof recipeId === 'object' && recipeId !== null) {
                    // Legacy: full Meal object stored in Firestore
                    meals[mealType as MealType] = recipeId as Meal;
                }
            }
        }

        result[date] = {
            date: dayPlan.date || date,
            meals
        };
    }

    return result;
};

export const saveWeekPlan = async (userId: string, weekPlan: WeekPlan) => {
    try {
        // Convert to slim format (IDs only) before saving
        const slimPlan = weekPlanToFirestore(weekPlan);
        await setDoc(doc(db, 'users', userId), { weekPlan: slimPlan }, { merge: true });
    } catch (error) {
        console.error('Error saving week plan:', error);
        throw error;
    }
};

export const getWeekPlan = async (userId: string, recipes: Meal[] = []): Promise<WeekPlan | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.weekPlan) return null;

            // Convert from Firestore format (IDs) to full WeekPlan
            return firestoreToWeekPlan(data.weekPlan, recipes);
        }
        return null;
    } catch (error) {
        console.error('Error getting week plan:', error);
        return null;
    }
};
