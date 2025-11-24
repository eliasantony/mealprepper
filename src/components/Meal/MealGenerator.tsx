"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { generateMealSuggestion } from '@/lib/gemini';
import { useMealStore } from '@/store/mealStore';
import { Meal } from '@/types';
import { MealCard } from './MealCard';

interface MealGeneratorProps {
    onMealGenerated?: (meal: Meal) => void;
}

export const MealGenerator = ({ onMealGenerated }: MealGeneratorProps) => {
    const [prompt, setPrompt] = useState('');
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedMeal, setGeneratedMeal] = useState<Meal | null>(null);
    const addSavedMeal = useMealStore((state) => state.addSavedMeal);

    const handleGenerate = async (isRefinement = false) => {
        const currentPrompt = isRefinement ? refinementPrompt : prompt;
        if (!currentPrompt.trim()) return;

        setIsLoading(true);
        try {
            const body = isRefinement
                ? { prompt: currentPrompt, context: generatedMeal }
                : { prompt: currentPrompt };

            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data.meal) {
                setGeneratedMeal(data.meal);
                if (isRefinement) {
                    setRefinementPrompt('');
                }
            }
        } catch (error) {
            console.error('Failed to generate meal:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedMeal) {
            addSavedMeal(generatedMeal);
            if (onMealGenerated) {
                onMealGenerated(generatedMeal);
            } else {
                setGeneratedMeal(null);
                setPrompt('');
                setRefinementPrompt('');
            }
        }
    };

    return (
        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-foreground">AI Meal Generator</h2>
            </div>

            <div className="flex flex-col gap-3 mb-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., High protein breakfast with eggs..."
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all resize-y"
                    rows={4}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate(false);
                        }
                    }}
                />
                <button
                    onClick={() => handleGenerate(false)}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                </button>
            </div>

            {generatedMeal && (
                <div className="mt-6 space-y-4">
                    <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <div className="mb-3">
                            <h3 className="font-medium text-orange-500">Generated Suggestion:</h3>
                        </div>
                        <MealCard meal={generatedMeal} />

                        {/* Refinement Section */}
                        <div className="mt-4 pt-4 border-t border-orange-500/20">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    placeholder="Refine this meal (e.g., 'Make it spicy', 'Swap chicken for tofu')"
                                    className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-orange-500/20 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleGenerate(true);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleGenerate(true)}
                                    disabled={isLoading || !refinementPrompt.trim()}
                                    className="px-3 py-2 bg-orange-500/20 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-500/30 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="mt-3 w-full py-2 bg-background text-orange-600 border border-orange-500/20 rounded-lg font-medium hover:bg-orange-500/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {onMealGenerated ? 'Add to Slot & Save' : 'Add to Saved Meals'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
