"use client";

import React, { useState } from 'react';
import { useMealStore } from '@/store/mealStore';
import { MealCard } from '@/components/Meal/MealCard';
import { RecipeDetails } from '@/components/Meal/RecipeDetails';
import { CreateMealModal } from '@/components/Meal/CreateMealModal';
import { BookOpen, Trash2, Search, Plus, ChefHat, Bookmark, Globe } from 'lucide-react';
import { Meal } from '@/types';
import { deleteMealFromFirestore, removeBookmark } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type TabType = 'my-recipes' | 'bookmarked';

export default function SavedMealsPage() {
    const { savedMeals, bookmarkedRecipes, removeSavedMeal, removeBookmark: removeBookmarkFromStore, selectedMeal, setSelectedMeal } = useMealStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('my-recipes');

    const { user } = useAuth();

    // Filter based on active tab
    const currentMeals = activeTab === 'my-recipes' ? savedMeals : bookmarkedRecipes;

    const filteredMeals = currentMeals.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDeleteRecipe = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this recipe from your library?')) {
            removeSavedMeal(id);
            if (user) {
                try {
                    await deleteMealFromFirestore(user.uid, id);
                } catch (error) {
                    console.error("Failed to delete meal from Firestore:", error);
                }
            }
        }
    };

    const handleRemoveBookmark = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Remove this recipe from your bookmarks?')) {
            removeBookmarkFromStore(id);
            if (user) {
                try {
                    await removeBookmark(user.uid, id);
                } catch (error) {
                    console.error("Failed to remove bookmark from Firestore:", error);
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Saved Meals</h1>
                    <p className="text-muted-foreground">Your personal library of recipes.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search meals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full md:w-64"
                        />
                    </div>
                    <Link
                        href="/browse"
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl font-medium hover:bg-muted transition-colors border border-border whitespace-nowrap"
                    >
                        <Globe className="w-4 h-4" />
                        Explore
                    </Link>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Create New
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('my-recipes')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                        activeTab === 'my-recipes'
                            ? "text-orange-500"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ChefHat className="w-4 h-4" />
                    My Recipes
                    <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        activeTab === 'my-recipes' ? "bg-orange-500/20 text-orange-500" : "bg-secondary text-muted-foreground"
                    )}>
                        {savedMeals.length}
                    </span>
                    {activeTab === 'my-recipes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('bookmarked')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                        activeTab === 'bookmarked'
                            ? "text-orange-500"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bookmark className="w-4 h-4" />
                    Bookmarked
                    <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        activeTab === 'bookmarked' ? "bg-orange-500/20 text-orange-500" : "bg-secondary text-muted-foreground"
                    )}>
                        {bookmarkedRecipes.length}
                    </span>
                    {activeTab === 'bookmarked' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            {currentMeals.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-border/50 border-dashed">
                    {activeTab === 'my-recipes' ? (
                        <>
                            <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Recipes Yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Create your own recipes or generate them with AI on the Weekly Plan page.
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20"
                            >
                                <Plus className="w-5 h-5" />
                                Create Your First Recipe
                            </button>
                        </>
                    ) : (
                        <>
                            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">No Bookmarks</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                Browse public recipes and bookmark your favorites to save them here.
                            </p>
                            <Link
                                href="/browse"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary text-foreground rounded-xl font-medium hover:bg-muted transition-colors border border-border"
                            >
                                <Globe className="w-5 h-5 text-orange-500" />
                                Discover Public Recipes
                            </Link>
                        </>
                    )}
                </div>
            ) : filteredMeals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No recipes found matching "{searchQuery}"
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMeals.map((meal) => (
                        <div key={meal.id} className="relative group">
                            <div onClick={() => setSelectedMeal(meal)} className="cursor-pointer h-full">
                                <MealCard meal={meal} hideHandle={true} variant="expanded" />
                            </div>
                            <button
                                onClick={(e) => activeTab === 'my-recipes'
                                    ? handleDeleteRecipe(e, meal.id)
                                    : handleRemoveBookmark(e, meal.id)
                                }
                                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-10"
                                title={activeTab === 'my-recipes' ? "Delete Recipe" : "Remove Bookmark"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <RecipeDetails
                meal={selectedMeal}
                onClose={() => setSelectedMeal(null)}
            />

            <CreateMealModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onMealCreated={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
