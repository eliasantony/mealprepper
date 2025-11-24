import React from 'react';
import { Meal } from '@/types';
import { X, Clock, Flame, Utensils, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecipeDetailsProps {
    meal: Meal | null;
    onClose: () => void;
}

export const RecipeDetails = ({ meal, onClose }: RecipeDetailsProps) => {
    if (!meal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="relative h-48 bg-gradient-to-r from-orange-500/20 to-orange-500/5 flex items-center justify-center">
                        <ChefHat className="w-16 h-16 text-orange-500/50" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-foreground mb-2">{meal.name}</h2>
                        <p className="text-muted-foreground mb-6">{meal.description}</p>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-orange-500/10 p-4 rounded-xl text-center border border-orange-500/20">
                                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">{meal.macros.calories}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Calories</div>
                            </div>
                            <div className="bg-blue-500/10 p-4 rounded-xl text-center border border-blue-500/20">
                                <Utensils className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">{meal.macros.protein}g</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Protein</div>
                            </div>
                            <div className="bg-green-500/10 p-4 rounded-xl text-center border border-green-500/20">
                                <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                <div className="font-bold text-foreground">{meal.macros.carbs}g</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Carbs</div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">1</span>
                                    Ingredients
                                </h3>
                                <ul className="space-y-2">
                                    {meal.ingredients.map((ing, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm border-b border-border pb-2">
                                            <span className="text-muted-foreground">{ing.name}</span>
                                            <span className="font-medium text-foreground">{ing.amount}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">2</span>
                                    Instructions
                                </h3>
                                <ol className="space-y-4">
                                    {meal.instructions?.map((step, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                            <span className="font-bold text-muted-foreground/50">{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
