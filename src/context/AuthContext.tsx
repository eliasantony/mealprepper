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
                    if (userData && userData.preferences) {
                        setPreferences(userData.preferences);
                        completeOnboarding();
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
            setLoading(false);
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
