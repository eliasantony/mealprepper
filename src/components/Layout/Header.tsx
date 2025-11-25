"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Calendar, Settings, Menu, X, BookOpen, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

export const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-border">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 group-hover:scale-105 transition-transform shadow-lg shadow-orange-500/20">
                        <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                        MealPrepper
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isActive('/')
                                ? "text-foreground bg-secondary border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                        )}
                    >
                        <Calendar className={cn("w-4 h-4", isActive('/') ? "text-orange-500" : "")} />
                        <span>Weekly Plan</span>
                    </Link>
                    <Link
                        href="/saved-meals"
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isActive('/saved-meals')
                                ? "text-foreground bg-secondary border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                        )}
                    >
                        <BookOpen className={cn("w-4 h-4", isActive('/saved-meals') ? "text-orange-500" : "")} />
                        <span>Saved Meals</span>
                    </Link>
                    <Link
                        href="/browse"
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isActive('/browse')
                                ? "text-foreground bg-secondary border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                        )}
                    >
                        <Globe className={cn("w-4 h-4", isActive('/browse') ? "text-orange-500" : "")} />
                        <span>Browse</span>
                    </Link>
                    <Link
                        href="/profile"
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            isActive('/profile')
                                ? "text-foreground bg-secondary border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                        )}
                    >
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                            <img
                                src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span>Profile</span>
                    </Link>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl overflow-hidden"
                    >
                        <nav className="flex flex-col p-4 gap-2">
                            <Link
                                href="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive('/') ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <Calendar className={cn("w-5 h-5", isActive('/') ? "text-orange-500" : "")} />
                                <span>Weekly Plan</span>
                            </Link>
                            <Link
                                href="/saved-meals"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive('/saved-meals') ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <BookOpen className={cn("w-5 h-5", isActive('/saved-meals') ? "text-orange-500" : "")} />
                                <span>Saved Meals</span>
                            </Link>
                            <Link
                                href="/browse"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive('/browse') ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <Globe className={cn("w-5 h-5", isActive('/browse') ? "text-orange-500" : "")} />
                                <span>Browse</span>
                            </Link>
                            <Link
                                href="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive('/profile') ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                    <img
                                        src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span>Profile</span>
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};
