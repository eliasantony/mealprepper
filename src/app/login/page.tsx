"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ChefHat } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function LoginPage() {
    const { user, loading, signInWithGoogle } = useAuth();
    const { isOnboardingComplete } = useUserStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            if (isOnboardingComplete) {
                router.push('/');
            } else {
                router.push('/onboarding');
            }
        }
    }, [user, loading, router, isOnboardingComplete]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                        <ChefHat className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to MealPrepper</h1>
                    <p className="text-muted-foreground">
                        Your personal AI-powered meal planning assistant.
                        Sign in to start planning your week.
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full py-3 px-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Sign in with Google
                    </button>

                    <p className="text-xs text-muted-foreground">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
