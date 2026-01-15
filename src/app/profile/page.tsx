"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserStore } from '@/store/userStore';
import { LogOut, User as UserIcon, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, signInWithGoogle, logout } = useAuth();
    const { preferences } = useUserStore();

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            {/* Account Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-orange-500" />
                    Account
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                        <UserIcon className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium">{user.displayName || 'User'}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground mb-4">Sign in to sync your meals and preferences across devices.</p>
                            <button
                                onClick={signInWithGoogle}
                                className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mx-auto shadow-sm"
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                Sign in with Google
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* App Settings */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    App Settings
                </h2>
                <Link
                    href="/settings"
                    className="glass-card p-4 rounded-xl flex items-center justify-between hover:bg-secondary/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-medium">General Settings</h3>
                            <p className="text-sm text-muted-foreground">Theme, data management</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
            </section>

            {/* Preferences Summary */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-500" />
                        Preferences
                    </h2>
                    <Link href="/onboarding?mode=edit" className="text-sm text-orange-500 hover:underline flex items-center gap-1">
                        Edit
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Diet Type</div>
                        <div className="font-medium capitalize">{preferences.dietaryType}</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Weight Goal</div>
                        <div className="font-medium capitalize">{preferences.weightGoal}</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Cuisines</div>
                        <div className="font-medium">
                            {preferences.cuisines?.length > 0 ? preferences.cuisines.join(', ') : 'Any'}
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Daily Calories</div>
                        <div className="font-medium">{preferences.calorieGoal} kcal</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Allergies</div>
                        <div className="font-medium">
                            {preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'None'}
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Cooking Skill</div>
                        <div className="font-medium capitalize">{preferences.cookingSkill}</div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="text-sm text-muted-foreground mb-1">Portions</div>
                        <div className="font-medium">{preferences.portions} people</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
