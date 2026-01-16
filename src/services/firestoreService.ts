import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, query, where, deleteField, increment } from 'firebase/firestore';
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

// ============ Bookmark Functions ============

export interface Bookmark {
    recipeId: string;
    savedAt: string;
    notes?: string;
}

// Bookmark a public recipe (just stores a reference)
export const bookmarkRecipe = async (userId: string, recipeId: string, notes?: string): Promise<void> => {
    try {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', recipeId);
        await setDoc(bookmarkRef, {
            recipeId,
            savedAt: new Date().toISOString(),
            notes: notes || null
        });
    } catch (error) {
        console.error('Error bookmarking recipe:', error);
        throw error;
    }
};

// Remove a bookmark
export const removeBookmark = async (userId: string, recipeId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'bookmarks', recipeId));
    } catch (error) {
        console.error('Error removing bookmark:', error);
        throw error;
    }
};

// Get all bookmark references for a user
export const getBookmarks = async (userId: string): Promise<Bookmark[]> => {
    try {
        const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
        const querySnapshot = await getDocs(bookmarksRef);
        return querySnapshot.docs.map(doc => doc.data() as Bookmark);
    } catch (error) {
        console.error('Error getting bookmarks:', error);
        return [];
    }
};

// Get full recipe data for bookmarked recipes
export const getBookmarkedRecipes = async (userId: string): Promise<Meal[]> => {
    try {
        const bookmarks = await getBookmarks(userId);
        if (bookmarks.length === 0) return [];

        // Batch fetch recipes by ID
        const recipes: Meal[] = [];
        for (const bookmark of bookmarks) {
            const recipeDoc = await getDoc(doc(db, 'recipes', bookmark.recipeId));
            if (recipeDoc.exists()) {
                recipes.push({ ...recipeDoc.data() as Meal, bookmarkedAt: bookmark.savedAt });
            }
        }
        return recipes;
    } catch (error) {
        console.error('Error getting bookmarked recipes:', error);
        return [];
    }
};

// Check if a recipe is bookmarked
export const isRecipeBookmarked = async (userId: string, recipeId: string): Promise<boolean> => {
    try {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', recipeId);
        const bookmarkDoc = await getDoc(bookmarkRef);
        return bookmarkDoc.exists();
    } catch (error) {
        console.error('Error checking bookmark:', error);
        return false;
    }
};

// Get user's own authored recipes
export const getMyRecipes = async (userId: string): Promise<Meal[]> => {
    try {
        const q = query(collection(db, 'recipes'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Meal);
    } catch (error) {
        console.error('Error getting my recipes:', error);
        return [];
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

// ============ AI Usage Tracking ============

const AI_DAILY_LIMIT = 20;

// Get today's date string for consistent key
const getTodayKey = () => new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

// Get AI usage count for today
export const getAiUsageToday = async (userId: string): Promise<number> => {
    try {
        const todayKey = getTodayKey();
        const docRef = doc(db, 'users', userId, 'aiUsage', todayKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data().count || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error getting AI usage:', error);
        return 0;
    }
};

// Increment AI usage and return new count
export const incrementAiUsage = async (userId: string, mode: string): Promise<number> => {
    try {
        const todayKey = getTodayKey();
        const docRef = doc(db, 'users', userId, 'aiUsage', todayKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentCount = docSnap.data().count || 0;
            await updateDoc(docRef, {
                count: increment(1),
                lastCall: new Date().toISOString(),
                modes: { [mode]: increment(1) }
            });
            return currentCount + 1;
        } else {
            await setDoc(docRef, {
                count: 1,
                date: todayKey,
                lastCall: new Date().toISOString(),
                modes: { [mode]: 1 }
            });
            return 1;
        }
    } catch (error) {
        console.error('Error incrementing AI usage:', error);
        return 0;
    }
};

// Get remaining AI calls for today
export const getAiUsageRemaining = async (userId: string): Promise<{ used: number; remaining: number; limit: number }> => {
    const used = await getAiUsageToday(userId);
    return {
        used,
        remaining: Math.max(0, AI_DAILY_LIMIT - used),
        limit: AI_DAILY_LIMIT
    };
};

// Check if user can make an AI call (under limit)
export const canMakeAiCall = async (userId: string): Promise<boolean> => {
    const used = await getAiUsageToday(userId);
    return used < AI_DAILY_LIMIT;
};
