import React, { useState } from 'react';
import { Meal, MealType } from '@/types';
import { X, Sparkles, BookOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealGenerator } from './MealGenerator';
import { useMealStore } from '@/store/mealStore';
import { MealCard } from './MealCard';
import { cn } from '@/lib/utils';

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    slotType: MealType;
}

type Tab = 'generate' | 'saved';

export const AddMealModal = ({ isOpen, onClose, date, slotType }: AddMealModalProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('generate');
    const { savedMeals, setMealForSlot } = useMealStore();

    const handleAddMeal = (meal: Meal) => {
        setMealForSlot(date, slotType, meal);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" />
                            Add Meal to Slot
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                                activeTab === 'generate'
                                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-500/5"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
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
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            Saved Meals
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                        {activeTab === 'generate' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Describe what you want to eat, and our AI will create a recipe for you.
                                </p>
                                <MealGenerator onMealGenerated={handleAddMeal} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {savedMeals.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No saved meals yet.</p>
                                        <p className="text-xs">Generate some meals to build your library!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {savedMeals.map((meal) => (
                                            <div key={meal.id} onClick={() => handleAddMeal(meal)} className="cursor-pointer">
                                                <MealCard meal={meal} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
