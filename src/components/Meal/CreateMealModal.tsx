import React from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealGenerator } from './MealGenerator';
import { Meal } from '@/types';

interface CreateMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMealCreated: (meal: Meal) => void;
}

export const CreateMealModal = ({ isOpen, onClose, onMealCreated }: CreateMealModalProps) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" />
                            Create New Meal
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-secondary/30">
                        <p className="text-sm text-muted-foreground mb-4">
                            Use AI to brainstorm ideas or generate a specific recipe.
                        </p>
                        <MealGenerator onMealGenerated={(meal) => {
                            onMealCreated(meal);
                            onClose();
                        }} />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
