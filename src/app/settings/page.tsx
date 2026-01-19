"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Trash2, HardDrive, Moon, Sun, Laptop, AlertTriangle, Scale, Bell, Globe, MessageSquare } from 'lucide-react';
import { NotificationPermission } from '@/components/NotificationPermission';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { saveUserPreferences } from '@/services/firestoreService';

const regionOptions = [
    { id: 'Austria', label: 'Austria / Germany', emoji: '🇦🇹' },
    { id: 'USA', label: 'United States', emoji: '🇺🇸' },
    { id: 'UK', label: 'United Kingdom', emoji: '🇬🇧' },
    { id: 'International', label: 'International', emoji: '🌍' },
];

export default function SettingsPage() {
    const { clearAllData } = useMealStore();
    const { preferences, setPreferences } = useUserStore();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync preferences to Firebase when they change (debounced)
    useEffect(() => {
        if (!user) return;

        // Clear any existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the save operation (1 second)
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                setIsSaving(true);
                await saveUserPreferences(user.uid, preferences);
                console.log('Preferences synced to Firebase');
            } catch (error) {
                console.error('Failed to sync preferences:', error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [preferences, user]);

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            clearAllData();
            alert('All data has been cleared.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your app preferences and data.
                    {isSaving && <span className="text-orange-500 ml-2 text-sm">Saving...</span>}
                </p>
            </div>

            {/* Region */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    Region
                </h2>
                <div className="glass-card p-6 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-4">
                        This helps us suggest locally available ingredients.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {regionOptions.map((region) => (
                            <button
                                key={region.id}
                                onClick={() => setPreferences({ region: region.id })}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    preferences.region === region.id
                                        ? "bg-orange-500/10 border-orange-500 text-orange-600"
                                        : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="text-xl">{region.emoji}</span>
                                <span className="font-medium text-sm">{region.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Preferences */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    AI Preferences
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Taste Profile</label>
                        <p className="text-xs text-muted-foreground">
                            Describe your taste preferences to get better meal suggestions.
                        </p>
                        <textarea
                            value={preferences.tasteProfile || ''}
                            onChange={(e) => setPreferences({ tasteProfile: e.target.value })}
                            placeholder="e.g., I love spicy food, prefer Mediterranean flavors, enjoy creamy sauces, don't like too sweet dishes..."
                            className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Additional Notes for AI</label>
                        <p className="text-xs text-muted-foreground">
                            Any other preferences the AI should know about.
                        </p>
                        <textarea
                            value={preferences.additionalNotes || ''}
                            onChange={(e) => setPreferences({ additionalNotes: e.target.value })}
                            placeholder="e.g., I'm intermittent fasting, prefer quick meals on weekdays, like meal prep friendly recipes..."
                            className="w-full p-3 bg-secondary/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                            rows={3}
                        />
                    </div>
                </div>
            </section>

            {/* Appearance */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Sun className="w-5 h-5 text-orange-500" />
                    Appearance
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setTheme('light')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                                theme === 'light'
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Sun className="w-6 h-6" />
                            <span className="font-medium">Light</span>
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                                theme === 'dark'
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Moon className="w-6 h-6" />
                            <span className="font-medium">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                                theme === 'system'
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Laptop className="w-6 h-6" />
                            <span className="font-medium">System</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Unit Preferences */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-500" />
                    Units
                </h2>
                <div className="glass-card p-6 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setPreferences({ units: 'metric' })}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                                preferences.units === 'metric'
                                    ? "bg-orange-500/10 border-orange-500 text-orange-600"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-2xl">📏</span>
                            <span className="font-medium">Metric (g, ml)</span>
                        </button>
                        <button
                            onClick={() => setPreferences({ units: 'imperial' })}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                                preferences.units === 'imperial'
                                    ? "bg-orange-500/10 border-orange-500 text-orange-600"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-2xl">⚖️</span>
                            <span className="font-medium">Imperial (oz, cups)</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Notifications
                </h2>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <NotificationPermission showInSettings />
                </div>
            </section>

            {/* Data Management */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-orange-500" />
                    Data Management
                </h2>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-red-500/5">
                        <h2 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-muted-foreground mb-6 text-sm">
                            This will permanently delete all your saved meals, weekly plans, and preferences.
                            This action cannot be undone.
                        </p>
                        <button
                            onClick={handleClearData}
                            className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All Data
                        </button>
                    </div>
                </div>
            </section>

            {/* App Info */}
            <section className="space-y-4">
                <div className="glass-card p-6 rounded-2xl text-center text-sm text-muted-foreground">
                    <p>MealPrepper v0.1.0</p>
                    <p>Built with Next.js & Tailwind CSS</p>
                </div>
            </section>
        </div>
    );
}
