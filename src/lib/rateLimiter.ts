import { firestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const AI_DAILY_LIMIT = 20;

// Get today's date string in YYYY-MM-DD format
const getTodayKey = () => new Date().toISOString().split('T')[0];

export interface RateLimitResult {
    allowed: boolean;
    used: number;
    remaining: number;
    limit: number;
}

/**
 * Check if user can make an AI call and increment usage if allowed.
 * Uses Firebase Admin SDK for server-side access.
 * Returns rate limit info.
 */
export async function checkAndIncrementAiUsage(userId: string, mode: string): Promise<RateLimitResult> {
    // If firestore is not configured, allow the request (fallback to middleware protection)
    if (!firestore) {
        console.warn('Firebase Admin not configured, skipping Firestore rate limit check');
        return { allowed: true, used: 0, remaining: AI_DAILY_LIMIT, limit: AI_DAILY_LIMIT };
    }

    try {
        const todayKey = getTodayKey();
        const docRef = firestore.collection('users').doc(userId).collection('aiUsage').doc(todayKey);
        const docSnap = await docRef.get();

        let currentCount = 0;
        if (docSnap.exists) {
            currentCount = docSnap.data()?.count || 0;
        }

        // Check if limit would be exceeded
        if (currentCount >= AI_DAILY_LIMIT) {
            return {
                allowed: false,
                used: currentCount,
                remaining: 0,
                limit: AI_DAILY_LIMIT
            };
        }

        // Increment the count
        if (docSnap.exists) {
            await docRef.update({
                count: FieldValue.increment(1),
                lastCall: new Date().toISOString(),
                [`modes.${mode}`]: FieldValue.increment(1)
            });
        } else {
            await docRef.set({
                count: 1,
                date: todayKey,
                lastCall: new Date().toISOString(),
                modes: { [mode]: 1 }
            });
        }

        return {
            allowed: true,
            used: currentCount + 1,
            remaining: AI_DAILY_LIMIT - currentCount - 1,
            limit: AI_DAILY_LIMIT
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // On error, allow the request but log it
        return { allowed: true, used: 0, remaining: AI_DAILY_LIMIT, limit: AI_DAILY_LIMIT };
    }
}

/**
 * Get current usage without incrementing (for display purposes).
 */
export async function getAiUsageStatus(userId: string): Promise<{ used: number; remaining: number; limit: number }> {
    if (!firestore) {
        return { used: 0, remaining: AI_DAILY_LIMIT, limit: AI_DAILY_LIMIT };
    }

    try {
        const todayKey = getTodayKey();
        const docRef = firestore.collection('users').doc(userId).collection('aiUsage').doc(todayKey);
        const docSnap = await docRef.get();

        const used = docSnap.exists ? (docSnap.data()?.count || 0) : 0;
        return {
            used,
            remaining: Math.max(0, AI_DAILY_LIMIT - used),
            limit: AI_DAILY_LIMIT
        };
    } catch (error) {
        console.error('Error getting AI usage status:', error);
        return { used: 0, remaining: AI_DAILY_LIMIT, limit: AI_DAILY_LIMIT };
    }
}
