"use client";

import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { generateMealSuggestion } from '@/lib/gemini';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import { Meal } from '@/types';
import { saveMealToFirestore } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';
import { MealCard } from './MealCard';
import { RecipeDetails } from './RecipeDetails';
import { Lightbulb, ArrowRight, ChefHat } from 'lucide-react';

interface MealIdea {
    name: string;
    description: string;
    emoji: string;
    tags: string[];
}

interface MealGeneratorProps {
    onMealGenerated?: (meal: Meal) => void;
}

export const MealGenerator = ({ onMealGenerated }: MealGeneratorProps) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedMeal, setGeneratedMeal] = useState<Meal | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [mode, setMode] = useState<'direct' | 'brainstorm'>('direct');
    const [mealIdeas, setMealIdeas] = useState<MealIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<MealIdea | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<string>('Dinner');
    const [keywords, setKeywords] = useState('');
    const [timeLimit, setTimeLimit] = useState<string>('');
    const addSavedMeal = useMealStore((state) => state.addSavedMeal);

    const { preferences } = useUserStore();
    const { user } = useAuth();

    const handleGenerate = async (idea?: MealIdea) => {
        if (!prompt.trim() && !idea && mode === 'direct') return;

        setIsLoading(true);
        setGeneratedMeal(null);

        try {
            const body = {
                prompt: idea ? '' : (mode === 'brainstorm' ? `${selectedMealType} ideas` : prompt),
                userPreferences: preferences,
                mode: idea ? 'generation' : mode,
                mealIdea: idea,
                keywords: mode === 'brainstorm' ? keywords : undefined,
                timeLimit: mode === 'brainstorm' ? timeLimit : undefined
            };

            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (mode === 'brainstorm' && !idea) {
                if (data.ideas) {
                    setMealIdeas(data.ideas);
                }
            } else if (data.meal) {
                setGeneratedMeal(data.meal);
                setShowDetails(true); // Auto-open details
            }
        } catch (error) {
            console.error('Failed to generate meal:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (generatedMeal) {
            addSavedMeal(generatedMeal);
            if (user) {
                try {
                    await saveMealToFirestore(user.uid, generatedMeal);
                } catch (error) {
                    console.error("Failed to save meal to Firestore:", error);
                }
            }
            if (onMealGenerated) {
                onMealGenerated(generatedMeal);
            } else {
                setGeneratedMeal(null);
                setPrompt('');
            }
        }
    };

    return (
        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-foreground">AI Meal Generator</h2>
                </div>
                <div className="flex bg-secondary/50 rounded-lg p-1">
                    <button
                        onClick={() => setMode('direct')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'direct' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Direct
                    </button>
                    <button
                        onClick={() => setMode('brainstorm')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'brainstorm' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Brainstorm
                    </button>
                </div>
            </div>

            {mode === 'direct' ? (
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
                                handleGenerate();
                            }
                        }}
                    />
                    <button
                        onClick={() => handleGenerate()}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Recipe'}
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedMealType(type)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedMealType === type ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-secondary/30 border-transparent hover:bg-secondary/50 text-muted-foreground'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="Keywords (e.g., chicken, spicy, pasta)"
                            className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                        />
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {['15', '30', '45', '60'].map((mins) => (
                                <button
                                    key={mins}
                                    onClick={() => setTimeLimit(timeLimit === mins ? '' : mins)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${timeLimit === mins ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-secondary/30 border-transparent hover:bg-secondary/50 text-muted-foreground'}`}
                                >
                                    &lt; {mins} mins
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => handleGenerate()}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                        {isLoading && !selectedIdea ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lightbulb className="w-4 h-4" /> Suggest Ideas</>}
                    </button>

                    {mealIdeas.length > 0 && (
                        <div className="space-y-3 mt-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Select an idea to generate:</h3>
                            {mealIdeas.map((idea, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSelectedIdea(idea);
                                        handleGenerate(idea);
                                    }}
                                    disabled={isLoading}
                                    className="w-full p-4 bg-card hover:bg-secondary/50 border border-border rounded-xl text-left transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{idea.emoji}</span>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground group-hover:text-orange-500 transition-colors">{idea.name}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {idea.tags?.map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    {isLoading && selectedIdea === idea && (
                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {generatedMeal && (
                <div className="mt-6 space-y-4">
                    <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <div className="mb-3">
                            <h3 className="font-medium text-orange-500">Generated Suggestion:</h3>
                        </div>
                        <div onClick={() => setShowDetails(true)} className="cursor-pointer hover:opacity-90 transition-opacity">
                            <MealCard meal={generatedMeal} />
                        </div>

                        <button
                            onClick={() => setShowDetails(true)}
                            className="w-full mt-3 py-2 bg-background text-orange-600 border border-orange-500/20 rounded-lg font-medium hover:bg-orange-500/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            View Details & Adapt
                        </button>
                    </div>
                </div>
            )}

            {showDetails && generatedMeal && (
                <RecipeDetails
                    meal={generatedMeal}
                    onClose={() => setShowDetails(false)}
                    onUpdate={(updatedMeal) => setGeneratedMeal(updatedMeal)}
                    onSelect={onMealGenerated}
                />
            )}
        </div>
    );
};
