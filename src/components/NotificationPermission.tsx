"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Loader2, Calendar, ChefHat, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    requestNotificationPermission,
    getNotificationPermissionStatus,
    initializeMessaging,
    onForegroundMessage
} from "@/lib/messaging";
import { toast } from "sonner";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface NotificationPreferences {
    enabled: boolean;
    mealReminders: boolean;      // Daily meal prep reminders
    weeklyPlanning: boolean;     // Weekly planning nudge (e.g., Sunday)
    recipeSuggestions: boolean;  // New recipe suggestions
}

const defaultPreferences: NotificationPreferences = {
    enabled: false,
    mealReminders: true,
    weeklyPlanning: true,
    recipeSuggestions: true,
};

interface NotificationPermissionProps {
    /** Show as settings view with preference toggles */
    showInSettings?: boolean;
}

export function NotificationPermission({ showInSettings = false }: NotificationPermissionProps) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        // Check initial permission status
        const status = getNotificationPermissionStatus();
        setPermissionStatus(status);
        setIsSupported(status !== 'unsupported');

        // Load user preferences
        loadPreferences();

        // Check if we should show the prompt
        if (!showInSettings && status === 'default') {
            const dismissed = localStorage.getItem('notification-prompt-dismissed');
            const hasSeenOnboarding = localStorage.getItem('onboarding-completed');

            if (hasSeenOnboarding && !dismissed) {
                setTimeout(() => setShowPrompt(true), 10000);
            }
        }

        // Setup foreground message handler
        if (status === 'granted') {
            setupForegroundHandler();
        }
    }, [showInSettings]);

    const loadPreferences = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const prefDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'notifications'));
            if (prefDoc.exists()) {
                setPreferences({ ...defaultPreferences, ...prefDoc.data() as NotificationPreferences });
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
        }
    };

    const savePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
        const user = auth.currentUser;
        if (!user) return;

        setIsSaving(true);
        const updatedPrefs = { ...preferences, ...newPrefs };

        try {
            await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), updatedPrefs);
            setPreferences(updatedPrefs);
            toast.success('Preferences saved');
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const setupForegroundHandler = async () => {
        await initializeMessaging();
        onForegroundMessage((payload) => {
            const notification = (payload as { notification?: { title?: string; body?: string } }).notification;
            if (notification) {
                toast(notification.title || 'New Notification', {
                    description: notification.body,
                    action: {
                        label: 'View',
                        onClick: () => {
                            const data = (payload as { data?: { url?: string } }).data;
                            if (data?.url) window.location.href = data.url;
                        },
                    },
                });
            }
        });
    };

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            const token = await requestNotificationPermission();
            if (token) {
                setPermissionStatus('granted');
                setShowPrompt(false);
                await savePreferences({ enabled: true });
                toast.success('Notifications enabled!', {
                    description: "You'll receive meal reminders and updates.",
                });
                setupForegroundHandler();
            } else {
                const newStatus = getNotificationPermissionStatus();
                setPermissionStatus(newStatus);
                if (newStatus === 'denied') {
                    toast.error('Notifications blocked', {
                        description: 'Please enable notifications in your browser settings.',
                    });
                }
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('notification-prompt-dismissed', 'true');
    };

    const handleSendTestNotification = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setIsTesting(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    userId: user.uid,
                    title: 'Test Notification 🍲',
                    body: 'If you see this, FCM is working perfectly on your device!',
                    url: '/dashboard',
                    tag: 'test-notification',
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Test notification sent!', {
                    description: 'It may take a few seconds to arrive.',
                });
            } else {
                throw new Error(data.error || 'Failed to send');
            }
        } catch (error) {
            console.error('Error sending test notification:', error);
            toast.error('Failed to send test notification');
        } finally {
            setIsTesting(false);
        }
    };

    // Settings view with preference toggles
    if (showInSettings) {
        return (
            <div className="space-y-4 p-4">
                {/* Main toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {preferences.enabled && permissionStatus === 'granted' ? (
                            <Bell className="h-5 w-5 text-primary" />
                        ) : (
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                            <p className="font-medium text-foreground">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                {!isSupported && 'Not supported in this browser'}
                                {isSupported && permissionStatus === 'granted' && preferences.enabled && 'Enabled'}
                                {isSupported && permissionStatus === 'granted' && !preferences.enabled && 'Paused'}
                                {isSupported && permissionStatus === 'denied' && 'Blocked in browser settings'}
                                {isSupported && permissionStatus === 'default' && 'Get meal reminders & updates'}
                            </p>
                        </div>
                    </div>

                    {isSupported && permissionStatus !== 'denied' && (
                        <button
                            onClick={
                                (permissionStatus === 'granted' && preferences.enabled)
                                    ? () => savePreferences({ enabled: false })
                                    : handleEnableNotifications
                            }
                            disabled={isLoading || isSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${preferences.enabled && permissionStatus === 'granted'
                                ? 'bg-primary/20 text-primary hover:bg-primary/30'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {(isLoading || isSaving) && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
                            {!isLoading && !isSaving && preferences.enabled && permissionStatus === 'granted' && 'Enabled'}
                            {!isLoading && !isSaving && !preferences.enabled && permissionStatus === 'granted' && 'Paused'}
                            {!isLoading && !isSaving && permissionStatus === 'default' && 'Enable'}
                        </button>
                    )}
                </div>

                {/* Notification type toggles (only show when enabled) */}
                {permissionStatus === 'granted' && preferences.enabled && (
                    <div className="space-y-3 pt-4 border-t border-border">
                        <p className="text-sm font-medium text-muted-foreground">Notification Types</p>

                        {/* Meal Reminders */}
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                                    <ChefHat className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Meal Reminders</p>
                                    <p className="text-xs text-muted-foreground">Daily prep reminders at meal times</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.mealReminders}
                                onChange={(e) => savePreferences({ mealReminders: e.target.checked })}
                                disabled={isSaving}
                                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                            />
                        </label>

                        {/* Weekly Planning */}
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Weekly Planning</p>
                                    <p className="text-xs text-muted-foreground">Sunday reminder to plan your week</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.weeklyPlanning}
                                onChange={(e) => savePreferences({ weeklyPlanning: e.target.checked })}
                                disabled={isSaving}
                                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                            />
                        </label>

                        {/* Recipe Suggestions */}
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Recipe Suggestions</p>
                                    <p className="text-xs text-muted-foreground">New recipes based on your preferences</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.recipeSuggestions}
                                onChange={(e) => savePreferences({ recipeSuggestions: e.target.checked })}
                                disabled={isSaving}
                                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                            />
                        </label>

                        {/* Test Notification Button */}
                        <div className="pt-4 mt-4 border-t border-border/50">
                            <button
                                onClick={handleSendTestNotification}
                                disabled={isTesting}
                                className="w-full py-2.5 rounded-xl bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {isTesting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Bell className="h-4 w-4" />
                                )}
                                Send Test Notification
                            </button>
                            <p className="mt-2 text-[11px] text-center text-muted-foreground">
                                Test both foreground (while using app) and background (after closing app) notifications.
                            </p>
                        </div>
                    </div>
                )}

                {/* Browser blocked message */}
                {permissionStatus === 'denied' && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        Notifications are blocked by your browser. Please enable them in your browser&apos;s site settings.
                    </div>
                )}
            </div>
        );
    }

    // Popup prompt (shown after onboarding)
    if (!showPrompt || !isSupported || permissionStatus !== 'default') {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
            >
                <div className="glass-card rounded-2xl p-4 shadow-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground">Stay on Track</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Get reminders for meal prep and weekly planning
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={handleEnableNotifications}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Bell className="h-4 w-4" />
                                    Enable Notifications
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
