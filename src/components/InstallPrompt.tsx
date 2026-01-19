"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode or display-mode)
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

        if (isStandalone) return;

        // Check if dismissed before
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) return;

        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return; // Don't show on desktop

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        // For iOS - only show on Safari (other iOS browsers can't install PWAs)
        if (isIOSDevice) {
            const isSafari = /Safari/.test(navigator.userAgent) &&
                !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
            if (isSafari) {
                // Show after a delay
                setTimeout(() => setShowPrompt(true), 5000);
            }
            return; // Don't set up beforeinstallprompt listener on iOS
        }

        // For Android/Chrome - listen for beforeinstallprompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay to not interrupt initial experience
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = (permanent: boolean) => {
        setShowPrompt(false);
        if (permanent) {
            localStorage.setItem("pwa-install-dismissed", "true");
        }
    };

    if (!showPrompt) return null;

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
                            {isIOS ? (
                                <Share className="h-5 w-5 text-primary" />
                            ) : (
                                <Download className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground">Install MealPrepper</h3>
                            {isIOS ? (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tap <Share className="inline h-4 w-4" /> then &quot;Add to Home Screen&quot; for the best experience
                                </p>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Install the app for quick access and offline support
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => handleDismiss(false)}
                            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {!isIOS && (
                            <button
                                onClick={handleInstall}
                                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Install App
                            </button>
                        )}
                        <button
                            onClick={() => handleDismiss(true)}
                            className={`rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors ${isIOS ? 'flex-1' : ''}`}
                        >
                            {isIOS ? "Got it" : "Not now"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
