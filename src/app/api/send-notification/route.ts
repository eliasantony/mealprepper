import { NextRequest, NextResponse } from 'next/server';
import { firestore, messaging } from '@/lib/firebase-admin';

interface SendNotificationRequest {
    userId: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
}

/**
 * POST /api/send-notification
 * Send a push notification to a specific user
 * 
 * This endpoint should be protected and only called from:
 * - Server-side cron jobs
 * - Admin actions
 * - Other authenticated server contexts
 */
export async function POST(request: NextRequest) {
    try {
        // Check for API key or other auth mechanism for server-to-server calls
        const authHeader = request.headers.get('authorization');
        const apiKey = process.env.NOTIFICATION_API_KEY;

        // Simple API key auth for server-to-server calls
        if (apiKey && authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!firestore || !messaging) {
            return NextResponse.json(
                { error: 'Firebase Admin not initialized' },
                { status: 500 }
            );
        }

        const body: SendNotificationRequest = await request.json();
        const { userId, title, body: notificationBody, url, tag } = body;

        if (!userId || !title || !notificationBody) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, title, body' },
                { status: 400 }
            );
        }

        // Get user's FCM tokens from Firestore
        const tokensSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('fcmTokens')
            .get();

        if (tokensSnapshot.empty) {
            return NextResponse.json(
                { error: 'No FCM tokens found for user', sent: 0 },
                { status: 404 }
            );
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token as string);

        // Prepare the notification message
        const message = {
            notification: {
                title,
                body: notificationBody,
            },
            data: {
                url: url || '/dashboard',
                tag: tag || 'mealprepper',
                timestamp: new Date().toISOString(),
            },
            webpush: {
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    tag: tag || 'mealprepper',
                },
                fcmOptions: {
                    link: url || '/dashboard',
                },
            },
        };

        // Send to all tokens
        const sendPromises = tokens.map(async (token) => {
            try {
                await messaging!.send({ ...message, token });
                return { token, success: true };
            } catch (error: unknown) {
                const errorCode = (error as { code?: string }).code;
                // Remove invalid tokens
                if (
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/registration-token-not-registered'
                ) {
                    await firestore!
                        .collection('users')
                        .doc(userId)
                        .collection('fcmTokens')
                        .doc(token)
                        .delete();
                    console.log(`Removed stale FCM token for user ${userId}`);
                }
                return { token, success: false, error: errorCode };
            }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failedCount,
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/send-notification
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        messaging: !!messaging,
        firestore: !!firestore,
    });
}
