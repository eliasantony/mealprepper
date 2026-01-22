"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getUserData, getMyRecipes, getBookmarkedRecipes, getWeekPlan, saveWeekPlan } from '@/services/firestoreService';
import { useUserStore } from '@/store/userStore';
import { useMealStore } from '@/store/mealStore';
import { Meal } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { setPreferences, completeOnboarding, resetUser } = useUserStore();

    useEffect(() => {
        let unsubscribeWeekPlan: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Fetch user data from Firestore
                try {
                    const userData = await getUserData(user.uid);
                    console.log("AuthContext: Fetched userData:", userData);
                    if (userData) {
                        if (userData.preferences) {
                            console.log("AuthContext: Setting preferences");
                            setPreferences(userData.preferences);
                        }
                        if (userData.hasCompletedOnboarding) {
                            console.log("AuthContext: Completing onboarding");
                            completeOnboarding();
                        }
                    }

                    // Fetch user's authored recipes
                    const myRecipes = await getMyRecipes(user.uid);
                    if (myRecipes.length > 0) {
                        useMealStore.getState().setSavedMeals(myRecipes);
                    }

                    // Fetch bookmarked recipes
                    const bookmarkedRecipes = await getBookmarkedRecipes(user.uid);
                    if (bookmarkedRecipes.length > 0) {
                        useMealStore.getState().setBookmarkedRecipes(bookmarkedRecipes);
                    }

                    // REAL-TIME SYNC: Listen for user document changes (includes weekPlan, preferences, etc.)
                    unsubscribeWeekPlan = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
                        if (snapshot.exists()) {
                            const data = snapshot.data();
                            console.log("AuthContext: User document snapshot updated", data);

                            // 1. Sync Onboarding & Preferences
                            if (data.preferences) {
                                useUserStore.getState().setPreferences(data.preferences);
                            }
                            if (data.hasCompletedOnboarding) {
                                useUserStore.getState().completeOnboarding();
                            }

                            // 2. Sync Week Plan
                            if (data.weekPlan) {
                                // Re-fetch current recipes from store to ensure we have the latest list for resolution
                                const currentSaved = useMealStore.getState().savedMeals;
                                const currentBookmarks = useMealStore.getState().bookmarkedRecipes;
                                const allRecipes = [...currentSaved, ...currentBookmarks];

                                // Transform snapshot data back into full Meal objects using pre-loaded recipes
                                const weekPlan: any = {};
                                for (const [date, dayPlan] of Object.entries(data.weekPlan)) {
                                    if (!dayPlan || typeof dayPlan !== 'object') continue;
                                    const mealIds = (dayPlan as any).meals || {};
                                    weekPlan[date] = { date: (dayPlan as any).date || date, meals: {} };

                                    for (const [slot, mealId] of Object.entries(mealIds)) {
                                        if (mealId) {
                                            const recipe = allRecipes.find(r => r.id === mealId);
                                            if (recipe) {
                                                weekPlan[date].meals[slot] = recipe;
                                            }
                                        }
                                    }
                                }
                                useMealStore.getState().setWeekPlan(weekPlan);
                            }
                        }
                    });

                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                resetUser();
                if (unsubscribeWeekPlan) unsubscribeWeekPlan();
            }
            // Small delay to allow store updates to propagate before AuthGuard checks
            setTimeout(() => setLoading(false), 100);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeWeekPlan) unsubscribeWeekPlan();
        };
    }, []);

    // Sync local week plan changes TO Firestore
    useEffect(() => {
        if (!user) return;

        let timeoutId: NodeJS.Timeout;
        let lastWeekPlan = useMealStore.getState().weekPlan;

        const unsubscribe = useMealStore.subscribe((state) => {
            // Only sync if the change was local (not from the onSnapshot listener)
            // Note: In a production app, we'd use a flag or check if the contents are identical
            if (state.weekPlan !== lastWeekPlan) {
                lastWeekPlan = state.weekPlan;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    saveWeekPlan(user.uid, state.weekPlan);
                }, 2000); // 2 second debounce for saving
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [user]);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
