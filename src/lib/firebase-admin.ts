import * as admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;
let messaging: admin.messaging.Messaging | null = null;

// Only initialize if credentials are present
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    firestore = admin.firestore();
    auth = admin.auth();
    messaging = admin.messaging();
}

export { firestore, auth, messaging };
