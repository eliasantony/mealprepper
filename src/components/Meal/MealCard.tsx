import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Meal } from '@/types';
import { cn } from '@/lib/utils';
import { GripVertical, Flame, Utensils } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';

interface MealCardProps {
    meal: Meal;
    isOverlay?: boolean;
    onClick?: () => void;
    hideHandle?: boolean;
}

export const MealCard = ({ meal, isOverlay, onClick, hideHandle }: MealCardProps) => {
    const setSelectedMeal = useMealStore((state) => state.setSelectedMeal);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: meal.id,
        data: {
            type: 'meal',
            meal,
        },
        disabled: !!hideHandle
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={hideHandle ? undefined : setNodeRef}
            style={style}
            {...(!hideHandle ? listeners : {})}
            {...(!hideHandle ? attributes : {})}
            className={cn(
                'bg-card p-3 rounded-lg shadow-sm border border-border group hover:border-orange-500/50 hover:shadow-md transition-all',
                !hideHandle && 'cursor-grab active:cursor-grabbing',
                isOverlay && 'shadow-xl rotate-2 scale-105 z-50 bg-card'
            )}
            onClick={() => {
                if (onClick) onClick();
                else setSelectedMeal(meal);
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start justify-between gap-3 mb-2 w-full">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl shadow-sm border border-border shrink-0">
                            {meal.emoji ? meal.emoji.split(' ')[0] : '🍽️'}
                        </div>
                        <h3 className="font-semibold text-foreground leading-tight line-clamp-1">{meal.name}</h3>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                            <span className={cn("font-medium", meal.macros.calories > 0 ? "text-orange-500" : "")}>{meal.macros.calories} kcal</span>
                            <span>•</span>
                            <span>{meal.servings || 2} srv</span>
                            {meal.timeLimit && (
                                <>
                                    <span>•</span>
                                    <span>{meal.timeLimit}m</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {!hideHandle && (
                    <div className="h-full flex items-center justify-center pl-2 border-l border-border/50">
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                )}
            </div>
        </div>
    );
};
