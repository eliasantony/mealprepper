import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Meal } from '@/types';
import { cn } from '@/lib/utils';
import { GripVertical, Flame, Droplets, Wheat, Dumbbell, Clock } from 'lucide-react';
import { useMealStore } from '@/store/mealStore';

interface MealCardProps {
    meal: Meal;
    isOverlay?: boolean;
    onClick?: () => void;
    hideHandle?: boolean;
    variant?: 'compact' | 'expanded';
}

export const MealCard = ({ meal, isOverlay, onClick, hideHandle, variant = 'compact' }: MealCardProps) => {
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

    // Expanded variant for Saved Meals & Browse pages
    if (variant === 'expanded') {
        return (
            <div
                className={cn(
                    'bg-card p-4 rounded-xl shadow-sm border border-border group hover:border-orange-500/50 hover:shadow-lg transition-all cursor-pointer h-full flex flex-col',
                    isOverlay && 'shadow-xl rotate-2 scale-105 z-50'
                )}
                onClick={() => {
                    if (onClick) onClick();
                    else setSelectedMeal(meal);
                }}
            >
                {/* Header with emoji and name */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center text-3xl shadow-sm border border-orange-500/20 shrink-0">
                        {meal.emoji ? meal.emoji.split(' ')[0] : '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 text-base">
                            {meal.name}
                        </h3>
                        {meal.author && (
                            <p className="text-xs text-muted-foreground mt-0.5">by {meal.author}</p>
                        )}
                    </div>
                </div>

                {/* Description */}
                {meal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
                        {meal.description}
                    </p>
                )}

                {/* Macros Grid */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-orange-500/10 rounded-lg p-2 text-center">
                        <Flame className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
                        <div className="text-xs font-semibold text-foreground">{meal.macros.calories || 0}</div>
                        <div className="text-[10px] text-muted-foreground">kcal</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                        <Dumbbell className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                        <div className="text-xs font-semibold text-foreground">{meal.macros.protein || 0}g</div>
                        <div className="text-[10px] text-muted-foreground">protein</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2 text-center">
                        <Wheat className="w-3.5 h-3.5 text-green-500 mx-auto mb-0.5" />
                        <div className="text-xs font-semibold text-foreground">{meal.macros.carbs || 0}g</div>
                        <div className="text-[10px] text-muted-foreground">carbs</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                        <Droplets className="w-3.5 h-3.5 text-yellow-500 mx-auto mb-0.5" />
                        <div className="text-xs font-semibold text-foreground">{meal.macros.fats || 0}g</div>
                        <div className="text-[10px] text-muted-foreground">fats</div>
                    </div>
                </div>

                {/* Footer: Servings, Time, Tags */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{meal.servings || 2} servings</span>
                        {meal.timeLimit && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meal.timeLimit}m
                            </span>
                        )}
                    </div>
                    {meal.tags && meal.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap justify-end">
                            {meal.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Compact variant (original) for Weekly View
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
