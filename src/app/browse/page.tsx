"use client";

import React, { useEffect, useState } from 'react';
import { Meal } from '@/types';
import { getPublicRecipes, bookmarkRecipe } from '@/services/firestoreService';
import { MealCard } from '@/components/Meal/MealCard';
import { RecipeDetails } from '@/components/Meal/RecipeDetails';
import { Search, Loader2, Bookmark } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function BrowsePage() {
    const [recipes, setRecipes] = useState<Meal[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Meal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const { addBookmark, bookmarkedRecipes, savedMeals } = useMealStore();
    const { user } = useAuth();

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const data = await getPublicRecipes();
                setRecipes(data);
                setFilteredRecipes(data);
            } catch (error) {
                console.error("Failed to fetch public recipes:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = recipes.filter(recipe =>
            recipe.name.toLowerCase().includes(lowerQuery) ||
            recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery)) ||
            recipe.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
        setFilteredRecipes(filtered);
    }, [searchQuery, recipes]);

    // Check if recipe is already bookmarked or owned by user
    const isBookmarked = (recipeId: string) => bookmarkedRecipes.some(m => m.id === recipeId);
    const isOwned = (recipeId: string) => savedMeals.some(m => m.id === recipeId);

    const handleBookmarkRecipe = async (meal: Meal) => {
        if (isBookmarked(meal.id) || isOwned(meal.id)) {
            setSelectedMeal(null);
            return;
        }

        addBookmark(meal);
        if (user) {
            try {
                await bookmarkRecipe(user.uid, meal.id);
                toast.success('Recipe bookmarked!');
            } catch (error) {
                console.error("Failed to bookmark recipe:", error);
                toast.error('Failed to bookmark recipe');
            }
        }
        setSelectedMeal(null);
    };

    return (
        <div className="space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Browse Recipes
                    </h1>
                    <p className="text-muted-foreground mt-1">Discover recipes shared by the community.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search recipes, ingredients, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(recipe => (
                            <div
                                key={recipe.id}
                                onClick={() => setSelectedMeal(recipe)}
                                className="cursor-pointer hover:scale-[1.02] transition-transform relative h-full"
                            >
                                <MealCard meal={recipe} hideHandle={true} variant="expanded" />
                                {isOwned(recipe.id) ? (
                                    <div className="absolute top-3 right-3 text-[10px] px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full font-medium border border-orange-500/30">
                                        My Recipe
                                    </div>
                                ) : isBookmarked(recipe.id) ? (
                                    <div className="absolute top-3 right-3 text-[10px] px-2 py-1 bg-green-500/20 text-green-500 rounded-full font-medium border border-green-500/30 flex items-center gap-1">
                                        <Bookmark className="w-3 h-3 fill-current" />
                                        Bookmarked
                                    </div>
                                ) : null}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No recipes found matching your search.
                        </div>
                    )}
                </div>
            )}

            {selectedMeal && (
                <RecipeDetails
                    meal={selectedMeal}
                    onClose={() => setSelectedMeal(null)}
                    onSelect={!isOwned(selectedMeal.id) && !isBookmarked(selectedMeal.id) ? handleBookmarkRecipe : undefined}
                    selectButtonLabel={isOwned(selectedMeal.id) ? undefined : isBookmarked(selectedMeal.id) ? undefined : "Bookmark Recipe"}
                />
            )}
        </div>
    );
}
