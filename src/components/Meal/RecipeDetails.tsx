import React, { useState } from 'react';
import { Meal } from '@/types';
import { X, Clock, Flame, Utensils, ChefHat, Sparkles, Loader2, Plus, Check, Edit2, Save, Trash, RefreshCw, Droplets, Globe, Lock, Copy } from 'lucide-react';
import { toast } from 'sonner';
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
    selectButtonLabel?: string;
}

export const RecipeDetails = ({ meal, onClose, onUpdate, onSelect, selectButtonLabel }: RecipeDetailsProps) => {
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [editedMeal, setEditedMeal] = useState<Meal | null>(null);
    // Local state to display updates immediately even if parent prop hasn't updated yet
    const [displayMeal, setDisplayMeal] = useState<Meal | null>(meal);
    const [visibility, setVisibility] = useState<'public' | 'private'>(meal?.visibility || 'public');
    const [servings, setServings] = useState<number | string>(meal?.servings || 2);

    // Sync displayMeal when prop changes
    React.useEffect(() => {
        setDisplayMeal(meal);
    }, [meal]);

    // Initialize editedMeal when entering edit mode
    React.useEffect(() => {
        if (isEditing && displayMeal) {
            setEditedMeal(prev => {
                if (prev) return prev;

                const initialEditedMeal = JSON.parse(JSON.stringify(displayMeal));

                // Scale ingredients to match the current view-mode servings
                // We use the current 'servings' state which reflects the view mode value at the moment of entering edit
                const currentServings = typeof servings === 'number' ? servings : (parseFloat(servings as string) || (displayMeal.servings || 2));
                const originalServings = displayMeal.servings || 2;

                if (currentServings !== originalServings) {
                    initialEditedMeal.ingredients = initialEditedMeal.ingredients.map((ing: any) => ({
                        ...ing,
                        amount: getScaledAmount(ing.amount, originalServings, currentServings)
                    }));
                    initialEditedMeal.servings = currentServings;
                }

                return initialEditedMeal;
            });
        } else {
            setEditedMeal(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, displayMeal]);

    // Update servings if meal changes
    React.useEffect(() => {
        if (displayMeal?.servings) {
            setServings(displayMeal.servings);
        }
    }, [displayMeal]);

    const { addSavedMeal, savedMeals, setSelectedMeal } = useMealStore();
    const { user } = useAuth();

    if (!displayMeal) return null;

    const isAlreadySaved = savedMeals.some(m => m.id === displayMeal.id);

    // Helper to scale ingredient amounts
    const getScaledAmount = (amount: string, originalServings: number, newServings: number) => {
        if (originalServings === newServings) return amount;

        // Try to find the first number in the string
        const match = amount.match(/^(\d+(\.\d+)?|\d+\/\d+)(\s*.*)$/);
        if (!match) return amount;

        const numberPart = match[1];
        const textPart = match[3];

        let value = 0;
        if (numberPart.includes('/')) {
            const [num, den] = numberPart.split('/').map(Number);
            value = num / den;
        } else {
            value = parseFloat(numberPart);
        }

        if (isNaN(value)) return amount;

        const scaledValue = (value / originalServings) * newServings;

        // Format nicely
        let formattedValue = '';
        if (Number.isInteger(scaledValue)) {
            formattedValue = scaledValue.toString();
        } else {
            formattedValue = scaledValue.toFixed(1).replace(/\.0$/, '');
        }

        return `${formattedValue}${textPart}`;
    };

    const handleCloneAndEdit = () => {
        if (!user || !displayMeal) return;
        const newMeal = {
            ...displayMeal,
            id: crypto.randomUUID(),
            userId: user.uid,
            author: user.displayName || 'Me',
            name: `${displayMeal.name} (Copy)`,
            visibility: 'private' as const,
            createdAt: new Date().toISOString()
        };
        setDisplayMeal(newMeal);
        setIsEditing(true);
    };

    const handleRefine = async () => {
        if (!refinementPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const token = user ? await user.getIdToken() : '';
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: refinementPrompt,
                    context: displayMeal
                }),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    toast.error('Daily limit reached. Please try again later.');
                } else {
                    toast.error('Failed to refine meal');
                }
                return;
            }

            const data = await response.json();
            if (data.meal && onUpdate) {
                onUpdate(data.meal);
                setDisplayMeal(data.meal);
                setRefinementPrompt('');
            }
        } catch (error) {
            console.error('Failed to refine meal:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };



    const handleRecalculate = async () => {
        if (!editedMeal) return;
        setIsRecalculating(true);
        const payload = {
            mode: 'recalculate',
            context: editedMeal
        };

        try {
            const token = user ? await user.getIdToken() : '';
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status === 429) {
                    toast.error('Daily limit reached. Please try again later.');
                } else {
                    toast.error('Failed to recalculate macros');
                }
                return;
            }

            const data = await response.json();

            if (data.macros) {
                // API returns total macros for the ingredients
                // We need to divide by servings to get per-serving macros
                const rawServings = typeof servings === 'number' ? servings : parseFloat(servings as string);
                const currentServings = !isNaN(rawServings) && rawServings > 0 ? rawServings : 2;

                const perServingMacros = {
                    calories: Math.round((data.macros.calories || 0) / currentServings),
                    protein: Math.round((data.macros.protein || 0) / currentServings),
                    carbs: Math.round((data.macros.carbs || 0) / currentServings),
                    fats: Math.round((data.macros.fats || 0) / currentServings),
                };

                setEditedMeal({
                    ...editedMeal,
                    macros: perServingMacros
                });
            }
        } catch (error) {
            console.error('Failed to recalculate macros:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleSave = async () => {
        if (isEditing && editedMeal) {
            // Save manual edits
            // If servings changed in edit mode, we update the meal's servings
            // But we do NOT scale ingredients because the user is defining the "real" yield
            const currentServings = (typeof servings === 'number' ? servings : parseFloat(servings as string)) || 2;
            const updatedMeal = { ...editedMeal, servings: currentServings };

            // Optimistically update local state
            setDisplayMeal(updatedMeal);

            if (onUpdate) {
                onUpdate(updatedMeal);
            }
            // If it's already saved in store, update it there too
            if (isAlreadySaved) {
                addSavedMeal(updatedMeal);
                // Also update the selected meal in store to reflect changes
                setSelectedMeal(updatedMeal);

                if (user) {
                    try {
                        await saveMealToFirestore(user.uid, updatedMeal);
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
            const currentServings = (typeof servings === 'number' ? servings : parseFloat(servings as string)) || 2;
            const mealToSave = {
                ...displayMeal,
                servings: currentServings,
                visibility,
                author: user?.displayName || 'Anonymous',
                userId: user?.uid,
                createdAt: displayMeal.createdAt || new Date().toISOString()
            };

            // Optimistically update local state
            setDisplayMeal(mealToSave);

            addSavedMeal(mealToSave);
            // Also update the selected meal in store to reflect changes
            setSelectedMeal(mealToSave);

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
            const currentServings = (typeof servings === 'number' ? servings : parseFloat(servings as string)) || 2;
            onSelect({ ...displayMeal, servings: currentServings });
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
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background rounded-full transition-colors z-50"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
                                {isEditing && editedMeal ? (
                                    <input
                                        type="text"
                                        value={editedMeal.name}
                                        onChange={(e) => setEditedMeal({ ...editedMeal, name: e.target.value })}
                                        className="w-full sm:flex-1 text-2xl font-bold bg-secondary/50 border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        placeholder="Recipe Name"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-foreground">{displayMeal.name}</h2>
                                )}

                                <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                                    {!isEditing && user && displayMeal.userId === user.uid && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                            title="Edit Recipe"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    {user && displayMeal.userId === user.uid && (
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
                                            <span className="hidden sm:inline">Save Changes</span>
                                            <span className="sm:hidden">Save</span>
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
                                                    {selectButtonLabel || (onSelect ? 'Save & Use' : 'Save Meal')}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEditing && editedMeal ? (
                                <textarea
                                    value={editedMeal.description}
                                    onChange={(e) => setEditedMeal({ ...editedMeal, description: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-muted-foreground resize-none"
                                    rows={4}
                                    placeholder="Description"
                                />
                            ) : (
                                <p className="text-muted-foreground">{displayMeal.description}</p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                Estimated Macros
                                <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                                    Values are approximate
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-orange-500/10 p-4 rounded-xl text-center border border-orange-500/20">
                                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                    <div className="font-bold text-foreground">
                                        {isEditing && editedMeal ? (editedMeal.macros.calories || 0) : (displayMeal.macros.calories || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Calories</div>
                                    <div className="text-[10px] text-muted-foreground/70">(per serving)</div>
                                </div>
                                <div className="bg-blue-500/10 p-4 rounded-xl text-center border border-blue-500/20">
                                    <Utensils className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                    <div className="font-bold text-foreground">
                                        {isEditing && editedMeal ? (editedMeal.macros.protein || 0) : (displayMeal.macros.protein || 0)}g
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Protein</div>
                                    <div className="text-[10px] text-muted-foreground/70">(per serving)</div>
                                </div>
                                <div className="bg-green-500/10 p-4 rounded-xl text-center border border-green-500/20">
                                    <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                    <div className="font-bold text-foreground">
                                        {isEditing && editedMeal ? (editedMeal.macros.carbs || 0) : (displayMeal.macros.carbs || 0)}g
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Carbs</div>
                                    <div className="text-[10px] text-muted-foreground/70">(per serving)</div>
                                </div>
                                <div className="bg-yellow-500/10 p-4 rounded-xl text-center border border-yellow-500/20">
                                    <Droplets className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                    <div className="font-bold text-foreground">
                                        {isEditing && editedMeal ? (editedMeal.macros.fats || 0) : (displayMeal.macros.fats || 0)}g
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Fats</div>
                                    <div className="text-[10px] text-muted-foreground/70">(per serving)</div>
                                </div>
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
                                    Recalculate Macros (for {servings} servings)
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
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">1</span>
                                        Ingredients
                                    </h3>

                                    {isEditing ? (
                                        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                                            <span className="text-sm font-medium pl-2">Servings:</span>
                                            <input
                                                type="text"
                                                value={servings}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '') setServings('');
                                                    else {
                                                        const num = parseInt(val);
                                                        if (!isNaN(num)) setServings(num);
                                                    }
                                                }}
                                                className="w-12 bg-transparent border-none text-center text-sm font-medium focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                                            <button
                                                onClick={() => setServings(Math.max(1, (typeof servings === 'number' ? servings : 1) - 1))}
                                                className="w-6 h-6 flex items-center justify-center hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-medium w-4 text-center">{servings}</span>
                                            <button
                                                onClick={() => setServings(Math.min(20, (typeof servings === 'number' ? servings : 1) + 1))}
                                                className="w-6 h-6 flex items-center justify-center hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                                            >
                                                +
                                            </button>
                                            <span className="text-xs text-muted-foreground ml-1 pr-1">servings</span>
                                        </div>
                                    )}
                                </div>

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
                                        displayMeal.ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center justify-between text-sm border-b border-border pb-2">
                                                <span className="text-muted-foreground">{ing.name}</span>
                                                <span className="font-medium text-foreground">
                                                    {getScaledAmount(ing.amount, displayMeal.servings || 2, typeof servings === 'number' ? servings : (parseFloat(servings as string) || 1))}
                                                </span>
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
                                                        rows={4}
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
                                        displayMeal.instructions?.map((step, i) => (
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
