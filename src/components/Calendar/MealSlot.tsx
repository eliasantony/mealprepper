import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { MealType, Meal } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';
import { CSS } from '@dnd-kit/utilities';

interface MealSlotProps {
    date: string;
    slotType: MealType;
    meal?: Meal;
    onClick?: () => void;
}

const slotLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    'snack-afternoon': 'Afternoon Snack',
    dinner: 'Dinner',
    'snack-evening': 'Evening Snack',
};

export const MealSlot = ({ date, slotType, meal, onClick }: MealSlotProps) => {
    const { setSelectedMeal, removeMealFromSlot } = useMealStore();

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `${date}-${slotType}`,
        data: {
            type: 'slot',
            date,
            slotType,
        },
    });

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: `${date}-${slotType}-meal`,
        data: {
            type: 'meal',
            meal,
            date,
            slotType,
        },
        disabled: !meal,
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    const handleMealClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (meal) {
            setSelectedMeal(meal);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeMealFromSlot(date, slotType);
    };

    return (
        <div
            ref={setDroppableRef}
            onClick={onClick}
            className={cn(
                'min-h-[120px] p-3 rounded-xl border border-dashed transition-all duration-300 relative group/slot cursor-pointer flex flex-col',
                isOver
                    ? 'border-orange-500 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]'
                    : 'border-border/60 hover:border-border hover:bg-secondary/50',
                meal ? 'border-solid border-transparent bg-transparent p-0' : ''
            )}
        >
            {!meal && (
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 group-hover/slot:text-muted-foreground transition-colors absolute top-0 left-0">
                        {slotLabels[slotType]}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground shadow-sm border border-border opacity-0 group-hover/slot:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                    </div>
                </div>
            )}

            {meal && (
                <div
                    ref={setDraggableRef}
                    {...listeners}
                    {...attributes}
                    style={style}
                    className={cn(
                        "relative group flex-1 flex flex-col w-full touch-none",
                        isDragging && "opacity-50"
                    )}
                    onClick={handleMealClick}
                >
                    <div className="flex-1 bg-card border border-border/50 rounded-xl p-3 shadow-sm hover:border-orange-500/50 transition-all hover:shadow-md flex flex-col justify-center gap-1 w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-xl shrink-0">
                                {meal.emoji || '🍽️'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                    {meal.name}
                                </div>
                                <div className="text-xs text-orange-500 font-medium">
                                    {meal.macros.calories} kcal
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 p-2 bg-destructive text-white rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:scale-110 z-10"
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on delete button
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};
