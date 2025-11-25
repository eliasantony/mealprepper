"use client";

import React from 'react';
import { Trash2, HardDrive, Moon, Sun, Laptop, AlertTriangle, Scale } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { clearAllData } = useMealStore();
    const { preferences, setPreferences } = useUserStore();
    const { theme, setTheme } = useTheme();

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
                <p className="text-muted-foreground">Manage your app preferences and data.</p>
            </div>

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
