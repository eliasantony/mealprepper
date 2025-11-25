import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { UserPreferences } from '@/store/userStore';
import { Meal, WeekPlan } from '@/types';

export const saveUserPreferences = async (userId: string, preferences: UserPreferences) => {
    try {
        await setDoc(doc(db, 'users', userId), { preferences }, { merge: true });
    } catch (error) {
        console.error('Error saving preferences:', error);
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
