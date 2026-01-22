import React, { useState, useEffect } from 'react';
import { Meal, MealType } from '@/types';
import { X, Sparkles, BookOpen, Plus, Search, ExternalLink, ChefHat, Bookmark, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealGenerator } from './MealGenerator';
import { useMealStore } from '@/store/mealStore';
import { MealCard } from './MealCard';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getPublicRecipes } from '@/services/firestoreService';

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    slotType: MealType;
}

type Tab = 'generate' | 'saved';
type SavedSubTab = 'my-recipes' | 'bookmarked' | 'browse';

const slotLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    afternoon_snack: 'Afternoon Snack',
    dinner: 'Dinner',
    evening_snack: 'Evening Snack',
};

export const AddMealModal = ({ isOpen, onClose, date, slotType }: AddMealModalProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('generate');
    const [savedSubTab, setSavedSubTab] = useState<SavedSubTab>('my-recipes');
    const [searchQuery, setSearchQuery] = useState('');
    const [itemsToShow, setItemsToShow] = useState(6);
    const [publicRecipes, setPublicRecipes] = useState<Meal[]>([]);
    const [isLoadingPublic, setIsLoadingPublic] = useState(false);

    const { savedMeals, bookmarkedRecipes, setMealForSlot } = useMealStore();

    useEffect(() => {
        if (isOpen && activeTab === 'saved' && savedSubTab === 'browse' && publicRecipes.length === 0) {
            const fetchPublic = async () => {
                setIsLoadingPublic(true);
                try {
                    const data = await getPublicRecipes();
                    setPublicRecipes(data);
                } catch (error) {
                    console.error("Failed to fetch public recipes:", error);
                } finally {
                    setIsLoadingPublic(false);
                }
            };
            fetchPublic();
        }
    }, [isOpen, activeTab, savedSubTab, publicRecipes.length]);

    const handleAddMeal = (meal: Meal) => {
        setMealForSlot(date, slotType, meal);
        onClose();
    };

    const currentSource = savedSubTab === 'my-recipes'
        ? savedMeals
        : savedSubTab === 'bookmarked'
            ? bookmarkedRecipes
            : publicRecipes;

    const filteredMeals = currentSource.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meal.description && meal.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        meal.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const visibleMeals = filteredMeals.slice(0, itemsToShow);
    const hasMore = itemsToShow < filteredMeals.length;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" />
                            Add {slotLabels[slotType]}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                                activeTab === 'generate'
                                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-500/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                                activeTab === 'saved'
                                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-500/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            Select Recipe
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-secondary/30 flex flex-col">
                        {activeTab === 'generate' ? (
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Describe what you want to eat, and our AI will create a recipe for you.
                                </p>
                                <MealGenerator
                                    onMealGenerated={handleAddMeal}
                                    slotType={slotType}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0">
                                {/* Sub-tabs for Saved Meals */}
                                <div className="flex gap-1 p-2 bg-muted/30 border-b border-border">
                                    <button
                                        onClick={() => { setSavedSubTab('my-recipes'); setSearchQuery(''); }}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all",
                                            savedSubTab === 'my-recipes'
                                                ? "bg-card text-orange-500 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <ChefHat className="w-3.5 h-3.5" />
                                        My Recipes
                                    </button>
                                    <button
                                        onClick={() => { setSavedSubTab('bookmarked'); setSearchQuery(''); }}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all",
                                            savedSubTab === 'bookmarked'
                                                ? "bg-card text-orange-500 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Bookmark className="w-3.5 h-3.5" />
                                        Bookmarked
                                    </button>
                                    <button
                                        onClick={() => { setSavedSubTab('browse'); setSearchQuery(''); }}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg transition-all",
                                            savedSubTab === 'browse'
                                                ? "bg-card text-orange-500 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        Browse Public
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder={
                                                    savedSubTab === 'my-recipes' ? "Search your recipes..." :
                                                        savedSubTab === 'bookmarked' ? "Search your bookmarks..." :
                                                            "Search all public recipes..."
                                                }
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                            />
                                        </div>

                                        {isLoadingPublic && savedSubTab === 'browse' ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                                                <p className="text-sm">Fetching public recipes...</p>
                                            </div>
                                        ) : currentSource.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                {savedSubTab === 'my-recipes' ? <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-20" /> :
                                                    savedSubTab === 'bookmarked' ? <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-20" /> :
                                                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />}
                                                <p>No {savedSubTab.replace('-', ' ')} yet.</p>
                                            </div>
                                        ) : filteredMeals.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No matches found for "{searchQuery}"</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {visibleMeals.map((meal, index) => (
                                                        <MealCard
                                                            key={`${meal.id}-${index}`}
                                                            meal={meal}
                                                            hideHandle
                                                            variant="expanded"
                                                            onSelect={handleAddMeal}
                                                            selectButtonLabel="Use Meal"
                                                        />
                                                    ))}
                                                </div>

                                                {hasMore && (
                                                    <div className="flex justify-center pt-2">
                                                        <button
                                                            onClick={() => setItemsToShow((prev: number) => prev + 6)}
                                                            className="px-6 py-2 bg-secondary hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors"
                                                        >
                                                            Load More
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border/50">
                                        <Link
                                            href="/saved-meals"
                                            className="flex items-center justify-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium py-2 rounded-xl hover:bg-orange-500/5 transition-all"
                                            onClick={onClose}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Manage My Library
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
