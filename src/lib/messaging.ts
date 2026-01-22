import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getApp } from 'firebase/app';

let messaging: Messaging | null = null;

/**
 * Get Firebase config for passing to service worker
 */
function getFirebaseConfig() {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
}

/**
 * Initialize Firebase Messaging (only call client-side)
 * Returns null if messaging is not supported
 */
export async function initializeMessaging(): Promise<Messaging | null> {
    if (typeof window === 'undefined') return null;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('Firebase Messaging is not supported in this browser');
            return null;
        }

        if (!messaging) {
            const app = getApp();
            messaging = getMessaging(app);
        }

        return messaging;
    } catch (error) {
        console.error('Error initializing messaging:', error);
        return null;
    }
}

/**
 * Request notification permission and get FCM token
 * Stores the token in Firestore for the current user
 */
export async function requestNotificationPermission(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        console.warn('User must be logged in to enable notifications');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Initialize messaging
        const msg = await initializeMessaging();
        if (!msg) return null;

        // Register service worker for FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        // Send Firebase config to service worker
        if (registration.active) {
            registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: getFirebaseConfig(),
            });
        }

        // Get FCM token
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('VAPID key not configured');
            return null;
        }

        const token = await getToken(msg, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });

        if (token) {
            // Store token in Firestore
            await saveTokenToFirestore(user.uid, token);
            console.log('FCM token saved successfully');
            return token;
        }

        return null;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return null;
    }
}

/**
 * Save FCM token to Firestore for the user
 */
async function saveTokenToFirestore(userId: string, token: string): Promise<void> {
    const tokenRef = doc(collection(db, 'users', userId, 'fcmTokens'), token);
    await setDoc(tokenRef, {
        token,
        createdAt: new Date(),
        platform: detectPlatform(),
        userAgent: navigator.userAgent,
    });
}

/**
 * Remove FCM token from Firestore (call when user logs out or disables notifications)
 */
export async function removeTokenFromFirestore(userId: string, token: string): Promise<void> {
    const tokenRef = doc(collection(db, 'users', userId, 'fcmTokens'), token);
    await deleteDoc(tokenRef);
}

/**
 * Listen for foreground messages
 * Call this in your app to handle notifications when app is open
 */
export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
    if (!messaging) {
        console.warn('Messaging not initialized');
        return null;
    }

    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
}

/**
 * Check if notifications are enabled for this browser
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

/**
 * Detect the platform for analytics
 */
function detectPlatform(): string {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Windows/.test(ua)) return 'windows';
    if (/Mac/.test(ua)) return 'macos';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
}
