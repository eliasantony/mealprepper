import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Calendar, Check, ChefHat, ChevronLeft, ChevronRight, RefreshCw, Trash } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Meal, MealType } from '@/types';
import { cn } from '@/lib/utils';
import { useMealStore } from '@/store/mealStore';
import { useAuth } from '@/context/AuthContext';
import { saveMealToFirestore, saveWeekPlan } from '@/services/firestoreService';

interface PlanWeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
}

type SlotKey = string; // format: "YYYY-MM-DD|mealType"

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack-afternoon', 'dinner', 'snack-evening'];

interface GeneratedIdea {
    type: MealType;
    name: string;
    description: string;
    emoji: string;
    reasoning?: string;
    tags?: string[];
    servingsRequired: number;
    assignedSlots: string[]; // dates
}

export const PlanWeekModal = ({ isOpen, onClose, currentDate }: PlanWeekModalProps) => {
    const { user } = useAuth();
    const { addSavedMeal, setMealForSlot, weekPlan } = useMealStore();

    // Step 1 state
    const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(new Set());
    const [keywords, setKeywords] = useState('');
    const [mobilePage, setMobilePage] = useState(0); // 0, 1, 2 for chunks of days

    // Step 2 state
    const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);

    // UI state
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Helpers for dates
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    const toggleSlot = (date: string, type: MealType) => {
        const key = `${date}| ${type} `;
        const newSet = new Set(selectedSlots);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedSlots(newSet);
    };

    const toggleDay = (date: string) => {
        // If all slots for this day are selected, deselect all. Otherwise select all.
        const allSelected = MEAL_TYPES.every(type => selectedSlots.has(`${date}| ${type} `));
        const newSet = new Set(selectedSlots);

        MEAL_TYPES.forEach(type => {
            const key = `${date}| ${type} `;
            if (allSelected) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
        });
        setSelectedSlots(newSet);
    };

    const toggleRow = (type: MealType) => {
        // If all slots for this type are selected, deselect all. Otherwise select all.
        const allSelected = weekDays.every(d => selectedSlots.has(`${format(d, 'yyyy-MM-dd')}| ${type} `));
        const newSet = new Set(selectedSlots);

        weekDays.forEach(d => {
            const key = `${format(d, 'yyyy-MM-dd')}| ${type} `;
            if (allSelected) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
        });
        setSelectedSlots(newSet);
    };

    const handleGenerateIdeas = async () => {
        if (selectedSlots.size === 0) return;
        setIsLoading(true);

        // Group slots by type to request efficient "Meal Prep" ideas
        // Structure: { 'lunch': 3, 'dinner': 2 }
        const typeCounts: Record<string, { count: number; dates: string[] }> = {};

        Array.from(selectedSlots).forEach(slotKey => {
            const [date, type] = slotKey.split('|');
            if (!typeCounts[type]) {
                typeCounts[type] = { count: 0, dates: [] };
            }
            typeCounts[type].count++;
            typeCounts[type].dates.push(date);
        });

        try {
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'brainstorm_week',
                    prompt: keywords, // Optional keywords
                    context: typeCounts // We pass the structure of what we need
                }),
            });

            const data = await response.json();
            if (data.ideas) {
                // Map ideas back to our local structure
                setIdeas(data.ideas.map((idea: any) => ({
                    ...idea,
                    // Ensure it maps to the correct slots we requested
                    assignedSlots: typeCounts[idea.type]?.dates || []
                })));
                setStep(2);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateIdea = async (index: number) => {
        const ideaToRegen = ideas[index];
        if (!ideaToRegen) return;

        setIsLoading(true);

        try {
            const response = await fetch('/api/generate-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'brainstorm_week',
                    prompt: keywords,
                    context: {
                        [ideaToRegen.type]: {
                            count: ideaToRegen.assignedSlots.length,
                            dates: ideaToRegen.assignedSlots
                        }
                    }
                }),
            });

            const data = await response.json();
            if (data.ideas && data.ideas.length > 0) {
                const newIdeaRaw = data.ideas[0];
                const newIdea = {
                    ...newIdeaRaw,
                    assignedSlots: ideaToRegen.assignedSlots
                };

                const newIdeas = [...ideas];
                newIdeas[index] = newIdea;
                setIdeas(newIdeas);
            }
        } catch (error) {
            console.error("Error regenerating idea", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRecipes = async () => {
        setIsLoading(true);
        setStep(3);
        let completed = 0;
        const total = ideas.length;

        for (const idea of ideas) {
            try {
                // Generate full recipe
                const response = await fetch('/api/generate-meal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mealIdea: idea,
                        userPreferences: { portions: idea.servingsRequired } // Force servings to match slot count
                    }),
                });

                const data = await response.json();
                if (data.meal) {
                    const fullMeal = data.meal;

                    // 1. Save to My Meals
                    if (user) {
                        try {
                            // Ensure it has an ID
                            if (!fullMeal.id) fullMeal.id = crypto.randomUUID();

                            // Save to firestore/store
                            addSavedMeal(fullMeal);
                            await saveMealToFirestore(user.uid, fullMeal);

                            // 2. Assign to slots
                            idea.assignedSlots.forEach(date => {
                                setMealForSlot(date, idea.type, fullMeal);
                            });

                        } catch (e) {
                            console.error("Error saving generated meal", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error generating recipe for idea", idea.name, error);
            }
            completed++;
            setProgress(Math.round((completed / total) * 100));
        }

        // Final sync of week plan is handled by the store subscription in AuthContext
        // But for safety/immediacy we could force it? The store watcher is pretty good.

        setIsLoading(false);
        // Close after a brief showing of 100%
        setTimeout(() => {
            onClose();
            // Reset state
            setTimeout(() => {
                setStep(1);
                setSelectedSlots(new Set());
                setIdeas([]);
                setKeywords('');
                setProgress(0);
            }, 300);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                Plan My Week
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {step === 1 && "Select the meals you want to cook"}
                                {step === 2 && "Review suggestions based on your plan"}
                                {step === 3 && "Creating your recipes..."}
                            </p>
                        </div>
                        {!isLoading && step !== 3 && (
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {step === 1 && (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">1. Select Slots</h3>
                                        <span className="text-sm text-muted-foreground">{selectedSlots.size} slots selected</span>
                                    </div>

                                    {/* Mobile View (3 days) */}
                                    <div className="md:hidden space-y-4">
                                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-muted-foreground">
                                            <div></div>
                                            {weekDays.slice(mobilePage * 3, (mobilePage + 1) * 3).map(d => (
                                                <div key={d.toString()} className="flex flex-col items-center">
                                                    <div className="font-bold text-foreground">{format(d, 'EEE')}</div>
                                                    <div>{format(d, 'd')}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {MEAL_TYPES.map(type => (
                                            <div key={type} className="grid grid-cols-4 gap-2 items-center">
                                                <div className="text-right text-xs font-medium capitalize text-muted-foreground pr-2">
                                                    {type.replace('-', ' ')}
                                                </div>
                                                {weekDays.slice(mobilePage * 3, (mobilePage + 1) * 3).map(d => {
                                                    const dateStr = format(d, 'yyyy-MM-dd');
                                                    const isSelected = selectedSlots.has(`${dateStr}| ${type} `);
                                                    return (
                                                        <div
                                                            key={`${dateStr} -${type} `}
                                                            onClick={() => toggleSlot(dateStr, type)}
                                                            className={cn(
                                                                "h-10 rounded-lg cursor-pointer transition-all border border-transparent flex items-center justify-center",
                                                                isSelected
                                                                    ? "bg-orange-500/10 border-orange-500/50 shadow-sm"
                                                                    : "bg-secondary/30",
                                                            )}
                                                        >
                                                            {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}

                                        {/* Mobile Pagination */}
                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                onClick={() => setMobilePage(Math.max(0, mobilePage - 1))}
                                                disabled={mobilePage === 0}
                                                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-30"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className={cn("w-2 h-2 rounded-full", i === mobilePage ? "bg-orange-500" : "bg-border")} />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setMobilePage(Math.min(2, mobilePage + 1))}
                                                disabled={mobilePage === 2}
                                                className="p-2 hover:bg-secondary rounded-lg disabled:opacity-30"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Desktop View (Full Table) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full min-w-[800px] border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="p-2 text-left"></th>
                                                    {weekDays.map(d => (
                                                        <th key={d.toString()} className="p-2 text-center min-w-[100px]">
                                                            <button
                                                                onClick={() => toggleDay(format(d, 'yyyy-MM-dd'))}
                                                                className="hover:bg-secondary/50 rounded px-2 py-1 transition-colors group"
                                                            >
                                                                <div className="font-bold text-foreground">{format(d, 'EEE')}</div>
                                                                <div className="text-xs text-muted-foreground group-hover:text-primary">{format(d, 'MMM d')}</div>
                                                            </button>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {MEAL_TYPES.map(type => (
                                                    <tr key={type} className="border-t border-border/50">
                                                        <td className="p-2 font-medium text-sm capitalize text-muted-foreground text-right pr-4">
                                                            <button onClick={() => toggleRow(type)} className="hover:text-foreground transition-colors">
                                                                {type.replace('-', ' ')}
                                                            </button>
                                                        </td>
                                                        {weekDays.map(d => {
                                                            const dateStr = format(d, 'yyyy-MM-dd');
                                                            const isSelected = selectedSlots.has(`${dateStr}| ${type} `);
                                                            return (
                                                                <td key={`${dateStr} -${type} `} className="p-1">
                                                                    <div
                                                                        onClick={() => toggleSlot(dateStr, type)}
                                                                        className={cn(
                                                                            "h-12 rounded-lg cursor-pointer transition-all border border-transparent flex items-center justify-center",
                                                                            isSelected
                                                                                ? "bg-orange-500/10 border-orange-500/50 shadow-sm"
                                                                                : "bg-secondary/30 hover:bg-secondary/70",
                                                                        )}
                                                                    >
                                                                        {isSelected && <Check className="w-5 h-5 text-orange-500" />}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-2xl">
                                    <h3 className="font-semibold text-lg">2. Preferences (Optional)</h3>
                                    <textarea
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="Any particular craving? e.g. 'Mexican food', 'Vegetarian', 'Use up spinach'..."
                                        className="w-full h-24 p-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {ideas.map((idea, idx) => (
                                        <div key={idx} className="bg-card border border-border rounded-xl p-5 hover:border-orange-500/50 transition-colors shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-4xl shadow-sm mb-2">{idea.emoji}</div>
                                                <div className="flex gap-2">
                                                    <div className="bg-secondary px-2 py-1 rounded text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        {idea.type.replace('-', ' ')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-lg p-1 border border-border">
                                                <button
                                                    onClick={() => handleRegenerateIdea(idx)}
                                                    disabled={isLoading}
                                                    className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-orange-500 transition-colors"
                                                    title="Regenerate Idea"
                                                >
                                                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newIdeas = [...ideas];
                                                        newIdeas.splice(idx, 1);
                                                        setIdeas(newIdeas);
                                                    }}
                                                    className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                                                    title="Remove Idea"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 line-clamp-1" title={idea.name}>{idea.name}</h3>
                                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 h-10" title={idea.description}>{idea.description}</p>

                                            <div className="flex items-center gap-2 text-xs text-orange-600 font-medium bg-orange-500/10 px-3 py-2 rounded-lg">
                                                <Calendar className="w-4 h-4" />
                                                <span>Takes {idea.assignedSlots.length} slots</span>
                                                <span className="text-muted-foreground/50">|</span>
                                                <span>Yields {idea.servingsRequired} servings</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {ideas.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No meals selected. Go back to add some slots or generate new ideas.
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-secondary rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ChefHat className="w-10 h-10 text-orange-500" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold">Chef is cooking...</h3>
                                    <p className="text-muted-foreground">Creating {ideas.length} custom recipes and updating your schedule.</p>
                                </div>

                                <div className="w-full max-w-md space-y-2">
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 transition-all duration-500 ease-out"
                                            style={{ width: `${progress}% ` }}
                                        />
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">{progress}%</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border bg-card">
                        <div className="flex justify-end gap-3">
                            {step === 1 && (
                                <button
                                    onClick={handleGenerateIdeas}
                                    disabled={selectedSlots.size === 0 || isLoading}
                                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    Generate Plan
                                </button>
                            )}
                            {step === 2 && (
                                <>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2.5 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCreateRecipes}
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        <Check className="w-5 h-5" />
                                        Confirm & Create
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
