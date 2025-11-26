"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData, getSavedMeals } from '@/services/firestoreService';
import { useUserStore } from '@/store/userStore';
import { useMealStore } from '@/store/mealStore';

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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
                        } else {
                            console.log("AuthContext: hasCompletedOnboarding is false or missing");
                        }
                    } else {
                        console.log("AuthContext: No userData found");
                    }

                    // Fetch saved meals
                    const savedMeals = await getSavedMeals(user.uid);
                    if (savedMeals.length > 0) {
                        useMealStore.getState().setSavedMeals(savedMeals);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                resetUser();
            }
            // Small delay to allow store updates to propagate before AuthGuard checks
            setTimeout(() => setLoading(false), 100);
        });

        return () => unsubscribe();
    }, []);

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
