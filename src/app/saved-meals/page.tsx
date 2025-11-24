"use client";

import React, { useState } from 'react';
import { useMealStore } from '@/store/mealStore';
import { MealCard } from '@/components/Meal/MealCard';
import { RecipeDetails } from '@/components/Meal/RecipeDetails';
import { BookOpen, Trash2, Search } from 'lucide-react';
import { Meal } from '@/types';

export default function SavedMealsPage() {
    const { savedMeals, removeSavedMeal, selectedMeal, setSelectedMeal } = useMealStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMeals = savedMeals.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this meal from your library?')) {
            removeSavedMeal(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Saved Meals</h1>
                    <p className="text-muted-foreground">Your personal library of recipes.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search meals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl bg-card border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full md:w-64"
                    />
                </div>
            </div>

            {savedMeals.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-white/5 border-dashed">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="text-xl font-semibold text-white mb-2">Library is Empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Generate meals on the Weekly Plan page and save them here to build your collection.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMeals.map((meal) => (
                        <div key={meal.id} className="relative group">
                            <div onClick={() => setSelectedMeal(meal)} className="cursor-pointer">
                                <MealCard meal={meal} />
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, meal.id)}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 z-10"
                                title="Delete Meal"
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
        </div>
    );
}
