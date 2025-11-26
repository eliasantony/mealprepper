"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

const PUBLIC_PATHS = ['/login', '/'];

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const { isOnboardingComplete } = useUserStore();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading) {
            if (!user && !PUBLIC_PATHS.includes(pathname) && pathname !== '/') {
                router.push('/login');
            } else if (user && (pathname === '/login' || pathname === '/')) {
                router.push('/dashboard');
            } else if (user && !isOnboardingComplete && pathname !== '/onboarding') {
                router.push('/onboarding');
            } else if (user && isOnboardingComplete && pathname === '/onboarding' && searchParams.get('mode') !== 'edit') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, pathname, router, isOnboardingComplete]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    // Prevent flash of protected content
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
};
