import { NextResponse } from 'next/server';
import { z } from 'zod';
import { firestore } from '@/lib/firebase-admin';

const ContactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().optional(),
    message: z.string().min(10),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const validation = ContactSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { name, email, subject, message } = validation.data;

        await firestore.collection('contact_messages').add({
            name,
            email,
            subject,
            message,
            timestamp: new Date().toISOString(),
            status: 'new'
        });

        return NextResponse.json({ success: true, message: 'Message received' });
    } catch (error) {
        console.error('Contact error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
