import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase-admin';

const FeedbackSchema = z.object({
    userId: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    message: z.string().optional(),
    category: z.enum(['bug', 'feature', 'general']),
    timestamp: z.string().datetime(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = FeedbackSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid feedback data', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { category, message, rating, userId } = validation.data;

        await firestore.collection('feedback').add({
            userId,
            rating,
            message,
            category,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, message: 'Feedback received' });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
