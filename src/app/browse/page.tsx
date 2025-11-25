"use client";

import React, { useEffect, useState } from 'react';
import { Meal } from '@/types';
import { getPublicRecipes } from '@/services/firestoreService';
import { MealCard } from '@/components/Meal/MealCard';
import { RecipeDetails } from '@/components/Meal/RecipeDetails';
import { Search, Filter, Loader2, Globe, ChefHat } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';
import { saveMealToFirestore } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';

export default function BrowsePage() {
    const [recipes, setRecipes] = useState<Meal[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Meal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const { addSavedMeal, savedMeals } = useMealStore();
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

    const handleSaveRecipe = async (meal: Meal) => {
        // Check if already saved
        if (savedMeals.some(m => m.id === meal.id)) return;

        addSavedMeal(meal);
        if (user) {
            try {
                await saveMealToFirestore(user.uid, meal);
            } catch (error) {
                console.error("Failed to save meal:", error);
            }
        }
        setSelectedMeal(null);
    };

    return (
        <div className="container mx-auto p-6 space-y-8 pb-24 md:pb-8">
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
                    className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecipes.length > 0 ? (
                        filteredRecipes.map(recipe => (
                            <div key={recipe.id} onClick={() => setSelectedMeal(recipe)} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                <MealCard meal={recipe} />
                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-1">
                                    <span>by {recipe.author || 'Anonymous'}</span>
                                    {savedMeals.some(m => m.id === recipe.id) && (
                                        <span className="text-green-500 font-medium">Saved</span>
                                    )}
                                </div>
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
                    onSelect={(meal) => handleSaveRecipe(meal)}
                />
            )}
        </div>
    );
}
