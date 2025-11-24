import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MealType, Meal } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface MealSlotProps {
    date: string;
    slotType: MealType;
    meal?: Meal;
    onRemove?: () => void;
    onClick?: () => void;
}

const slotLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    'snack-afternoon': 'Afternoon Snack',
    dinner: 'Dinner',
    'snack-evening': 'Evening Snack',
};

export const MealSlot = ({ date, slotType, meal, onRemove, onClick }: MealSlotProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `${date}-${slotType}`,
        data: {
            type: 'slot',
            date,
            slotType,
        },
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                'min-h-[120px] p-3 rounded-xl border border-dashed transition-all duration-300 relative group/slot cursor-pointer',
                isOver
                    ? 'border-orange-500 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5',
                meal ? 'border-solid border-transparent bg-transparent p-0' : ''
            )}
        >
            {!meal && (
                <>
                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2 group-hover/slot:text-muted-foreground/60 transition-colors">
                        {slotLabels[slotType]}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 group-hover/slot:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <Plus className="w-4 h-4" />
                        </div>
                    </div>
                </>
            )}

            {meal && (
                <div className="relative group h-full">
                    <div className="h-full bg-card border border-white/5 rounded-xl p-3 shadow-lg hover:border-orange-500/50 transition-all hover:shadow-orange-500/10">
                        <div className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                            {meal.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-orange-400">{meal.macros.calories} kcal</span>
                        </div>
                    </div>

                    {onRemove && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-destructive text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
