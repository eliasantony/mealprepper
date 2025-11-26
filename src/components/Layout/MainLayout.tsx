"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';

    return (
        <>
            <Header />
            <main
                className={cn(
                    "flex-1",
                    isLandingPage
                        ? "h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-background overflow-x-hidden"
                        : "container mx-auto px-4 pt-24 pb-8"
                )}
            >
                {children}
            </main>
        </>
    );
};
