import React from 'react';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export function Footer() {
    return (
        <footer className="py-12 border-t border-border bg-background/50 backdrop-blur-sm snap-end">
            <div className="container mx-auto px-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-foreground">MealPrepper</span>
                </div>
                <div className="flex justify-center gap-8 mb-8 text-sm font-medium">
                    <Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
                    <Link href="/contact" className="hover:text-orange-500 transition-colors">Contact</Link>
                </div>
                <p>© {new Date().getFullYear()} MealPrepper. All rights reserved.</p>
            </div>
        </footer>
    );
}
