import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

// Rate limit configurations
const RATES = {
    AI: {
        limit: 20, // 5 requests
        window: 10 * 60 * 1000, // 10 minutes
    },
    PUBLIC: {
        limit: 60, // 60 requests
        window: 60 * 1000, // 1 minute
    },
};

// In-memory cache for rate limiting
// Note: In serverless (Vercel), this cache is per-instance and resets on cold starts.
// For production scale, use Redis (e.g., Upstash).
const tokenCache = new LRUCache<string, { count: number; expiresAt: number }>({
    max: 500,
    ttl: RATES.AI.window,
});

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only apply to API routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Identify the user or IP
    // We'll trust the user ID from headers if we set it in a previous layer (custom server)
    // But standard Next.js middleware runs before that. 
    // For 'Per User', we'd ideally decode the token here.
    // Integrating firebase-admin here is TRICKY in Edge Runtime (middleware).
    // Strategy: 
    // 1. IP address as fallback identifier.
    // 2. If Authorization header exists, use a hash of it as a temporary session ID.

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    // Simple heuristic: Use Authorization header as 'user' key if present, otherwise IP.
    const authHeader = req.headers.get('authorization');
    const clientId = authHeader ? authHeader.replace('Bearer ', '').slice(0, 30) : ip;

    const isAI = pathname.startsWith('/api/generate-meal');
    const rateConfig = isAI ? RATES.AI : RATES.PUBLIC;

    const now = Date.now();
    const key = `${isAI ? 'ai' : 'pub'}:${clientId}`;

    let record = tokenCache.get(key);

    if (!record || now > record.expiresAt) {
        record = { count: 0, expiresAt: now + rateConfig.window };
    }

    if (record.count >= rateConfig.limit) {
        return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
    }

    record.count += 1;
    tokenCache.set(key, record);

    const res = NextResponse.next();

    // Add rate limit headers
    res.headers.set('X-RateLimit-Limit', rateConfig.limit.toString());
    res.headers.set('X-RateLimit-Remaining', (rateConfig.limit - record.count).toString());

    return res;
}

export const config = {
    matcher: '/api/:path*',
};
