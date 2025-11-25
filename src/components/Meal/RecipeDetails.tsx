import React, { useState } from 'react';
import { Meal } from '@/types';
import { X, Clock, Flame, Utensils, ChefHat, Sparkles, Loader2, Plus, Check, Edit2, Save, Trash, RefreshCw, Droplets, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/context/AuthContext';
import { saveMealToFirestore } from '@/services/firestoreService';
import { cn } from '@/lib/utils';

interface RecipeDetailsProps {
    meal: Meal | null;
    onClose: () => void;
    onUpdate?: (meal: Meal) => void;
    onSelect?: (meal: Meal) => void;
}

export const RecipeDetails = ({ meal, onClose, onUpdate, onSelect }: RecipeDetailsProps) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [editedMeal, setEditedMeal] = useState<Meal | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'private'>(meal?.visibility || 'private');

    // Initialize editedMeal when entering edit mode
    React.useEffect(() => {
        if (isEditing && meal) {
            setEditedMeal(JSON.parse(JSON.stringify(meal)));
        }
    }, [isEditing, meal]);

    const { addSavedMeal, savedMeals } = useMealStore();
    const { user } = useAuth();

    if (!meal) return null;

    const isAlreadySaved = savedMeals.some(m => m.id === meal.id);

    const handleRefine = async () => {
        if (!refinementPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: refinementPrompt,
                    context: meal
                }),
            });

            const data = await response.json();
            if (data.meal && onUpdate) {
                onUpdate(data.meal);
                setRefinementPrompt('');
            }
        } catch (error) {
            console.error('Failed to refine meal:', error);
        } finally {
            setIsGenerating(false);
        }
    };



    const handleRecalculate = async () => {
        if (!editedMeal) return;
        setIsRecalculating(true);
        try {
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'recalculate',
                    context: editedMeal
                }),
            });

            const data = await response.json();
            if (data.macros) {
                setEditedMeal({
                    ...editedMeal,
                    macros: data.macros
                });
            }
        } catch (error) {
            console.error('Failed to recalculate macros:', error);
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleSave = async () => {
        if (isEditing && editedMeal) {
            // Save manual edits
            if (onUpdate) {
                onUpdate(editedMeal);
            }
            // If it's already saved in store, update it there too
            if (isAlreadySaved) {
                addSavedMeal(editedMeal);
                if (user) {
                    try {
                        await saveMealToFirestore(user.uid, editedMeal);
                    } catch (error) {
                        console.error("Failed to update meal in Firestore:", error);
                    }
                }
            }
            setIsEditing(false);
            return;
        }

        setIsSaving(true);

        // Save to library if not already saved
        if (!isAlreadySaved) {
            const mealToSave = {
                ...meal,
                visibility,
                author: user?.displayName || 'Anonymous',
                userId: user?.uid,
                createdAt: meal.createdAt || new Date().toISOString()
            };
            addSavedMeal(mealToSave);

            if (user) {
                try {
                    await saveMealToFirestore(user.uid, mealToSave);
                } catch (error) {
                    console.error("Failed to save meal to Firestore:", error);
                }
            }
        }

        setIsSaving(false);
        setIsSaved(true);

        // Trigger selection for the slot
        if (onSelect) {
            onSelect(meal);
        }

        setTimeout(() => setIsSaved(false), 2000);
    };

    const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
        if (!editedMeal) return;
        const newIngredients = [...editedMeal.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setEditedMeal({ ...editedMeal, ingredients: newIngredients });
    };

    const addIngredient = () => {
        if (!editedMeal) return;
        setEditedMeal({
            ...editedMeal,
            ingredients: [...editedMeal.ingredients, { name: '', amount: '' }]
        });
    };

    const removeIngredient = (index: number) => {
        if (!editedMeal) return;
        const newIngredients = editedMeal.ingredients.filter((_, i) => i !== index);
        setEditedMeal({ ...editedMeal, ingredients: newIngredients });
    };

    const updateInstruction = (index: number, value: string) => {
        if (!editedMeal) return;
        const newInstructions = [...(editedMeal.instructions || [])];
        newInstructions[index] = value;
        setEditedMeal({ ...editedMeal, instructions: newInstructions });
    };

    const addInstruction = () => {
        if (!editedMeal) return;
        setEditedMeal({
            ...editedMeal,
            instructions: [...(editedMeal.instructions || []), '']
        });
    };

    const removeInstruction = (index: number) => {
        if (!editedMeal) return;
        const newInstructions = (editedMeal.instructions || []).filter((_, i) => i !== index);
        setEditedMeal({ ...editedMeal, instructions: newInstructions });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                >
                    <div className="relative h-48 bg-gradient-to-r from-orange-500/20 to-orange-500/5 flex items-center justify-center shrink-0">
                        <ChefHat className="w-16 h-16 text-orange-500/50" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        <div>
                            <div className="flex items-start justify-between gap-8 mb-2">
                                {isEditing && editedMeal ? (
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            value={editedMeal.name}
                                            onChange={(e) => setEditedMeal({ ...editedMeal, name: e.target.value })}
                                            className="w-full text-2xl font-bold bg-secondary/50 border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                            placeholder="Recipe Name"
                                        />
                                        <textarea
                                            value={editedMeal.description}
                                            onChange={(e) => setEditedMeal({ ...editedMeal, description: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-muted-foreground resize-none"
                                            rows={2}
                                            placeholder="Description"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{meal.name}</h2>
                                        <p className="text-muted-foreground">{meal.description}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                            title="Edit Recipe"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    {!isAlreadySaved && !isSaved && (
                                        <button
                                            onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors flex items-center gap-2",
                                                visibility === 'public'
                                                    ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                            title={visibility === 'public' ? "Public Recipe" : "Private Recipe"}
                                        >
                                            {visibility === 'public' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                        </button>
                                    )}

                                    {isEditing ? (
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving || (isAlreadySaved && !onSelect)}
                                            className={cn(
                                                "px-8 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all",
                                                isAlreadySaved
                                                    ? "bg-green-500/10 text-green-600 cursor-default"
                                                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                                            )}
                                        >
                                            {isAlreadySaved || isSaved ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    {onSelect ? 'Used' : 'Saved'}
                                                </>
                                            ) : (
                                                <>
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                    {onSelect ? 'Save & Use' : 'Save Meal'}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-orange-500/10 p-4 rounded-xl text-center border border-orange-500/20">
                                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">
                                    {isEditing && editedMeal ? editedMeal.macros.calories : meal.macros.calories}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Calories</div>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-xl text-center border border-blue-500/20">
                                <Utensils className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">
                                    {isEditing && editedMeal ? editedMeal.macros.protein : meal.macros.protein}g
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Protein</div>
                            </div>
                            <div className="bg-green-500/10 p-4 rounded-xl text-center border border-green-500/20">
                                <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">
                                    {isEditing && editedMeal ? editedMeal.macros.carbs : meal.macros.carbs}g
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Carbs</div>
                            </div>
                            <div className="bg-yellow-500/10 p-4 rounded-xl text-center border border-yellow-500/20">
                                <Droplets className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">
                                    {isEditing && editedMeal ? editedMeal.macros.fats : meal.macros.fats}g
                                </div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Fats</div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleRecalculate}
                                    disabled={isRecalculating}
                                    className="text-xs flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50"
                                >
                                    <RefreshCw className={cn("w-3 h-3", isRecalculating && "animate-spin")} />
                                    Recalculate Macros
                                </button>
                            </div>
                        )}

                        {/* Adaptation Section */}
                        <div className="pt-6 pb-6 border-t border-b border-border">
                            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                Adapt Recipe
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    placeholder="e.g., 'Make it spicy', 'Swap chicken for tofu'"
                                    className="flex-1 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRefine();
                                    }}
                                />
                                <button
                                    onClick={handleRefine}
                                    disabled={isGenerating || !refinementPrompt.trim()}
                                    className="px-4 py-2 bg-orange-500/10 text-orange-600 rounded-xl font-medium hover:bg-orange-500/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Adapt
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">1</span>
                                    Ingredients
                                </h3>
                                <ul className="space-y-2">
                                    {isEditing && editedMeal ? (
                                        <>
                                            {editedMeal.ingredients.map((ing, i) => (
                                                <li key={i} className="flex items-center gap-2 pb-2 group">
                                                    <input
                                                        type="text"
                                                        value={ing.name}
                                                        onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                                                        className="flex-1 bg-secondary/50 border border-border rounded px-2 py-1 text-sm"
                                                        placeholder="Ingredient"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={ing.amount}
                                                        onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                                                        className="w-24 bg-secondary/50 border border-border rounded px-2 py-1 text-sm font-medium"
                                                        placeholder="Amount"
                                                    />
                                                    <button onClick={() => removeIngredient(i)} className="text-red-500 hover:bg-red-500/10 p-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                            <button onClick={addIngredient} className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Add Ingredient
                                            </button>
                                        </>
                                    ) : (
                                        meal.ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center justify-between text-sm border-b border-border pb-2">
                                                <span className="text-muted-foreground">{ing.name}</span>
                                                <span className="font-medium text-foreground">{ing.amount}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">2</span>
                                    Instructions
                                </h3>
                                <ol className="space-y-4">
                                    {isEditing && editedMeal ? (
                                        <>
                                            {(editedMeal.instructions || []).map((step, i) => (
                                                <li key={i} className="flex gap-2 group">
                                                    <span className="font-bold text-muted-foreground/50 pt-1">{i + 1}.</span>
                                                    <textarea
                                                        value={step}
                                                        onChange={(e) => updateInstruction(i, e.target.value)}
                                                        className="flex-1 bg-secondary/50 border border-border rounded px-2 py-1 text-sm resize-none"
                                                        rows={2}
                                                        placeholder="Step instruction"
                                                    />
                                                    <button onClick={() => removeInstruction(i)} className="text-red-500 hover:bg-red-500/10 p-1 rounded h-fit opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                            <button onClick={addInstruction} className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Add Step
                                            </button>
                                        </>
                                    ) : (
                                        meal.instructions?.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                                <span className="font-bold text-muted-foreground/50">{i + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))
                                    )}
                                </ol>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
