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
}

export const MealCard = ({ meal, isOverlay, onClick }: MealCardProps) => {
    const setSelectedMeal = useMealStore((state) => state.setSelectedMeal);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: meal.id,
        data: {
            type: 'meal',
            meal,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                'bg-card p-3 rounded-lg shadow-sm border border-border cursor-grab active:cursor-grabbing group hover:border-orange-500/50 hover:shadow-md transition-all',
                isOverlay && 'shadow-xl rotate-2 scale-105 z-50 bg-card'
            )}
            onClick={() => {
                if (onClick) onClick();
                else setSelectedMeal(meal);
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2">{meal.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span>{meal.macros.calories}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-blue-500" />
                            <span>{meal.macros.protein}g P</span>
                        </div>
                    </div>
                </div>
                <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
            </div>
        </div>
    );
};
