import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DayPlan, MealType } from '@/types';
import { MealSlot } from './MealSlot';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface DayColumnProps {
    date: string;
    dayPlan?: DayPlan;
    isToday?: boolean;
    onSlotClick: (slot: MealType) => void;
}

const slots: MealType[] = [
    'breakfast',
    'lunch',
    'snack-afternoon',
    'dinner',
    'snack-evening',
];

export const DayColumn = ({ date, dayPlan, isToday, onSlotClick }: DayColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: date,
        data: {
            type: 'day',
            date,
        },
    });

    const dateObj = parseISO(date);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex flex-col gap-3 min-w-[220px] flex-1 rounded-2xl p-3 transition-all duration-300',
                isToday
                    ? 'bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 shadow-[0_0_30px_-10px_rgba(249,115,22,0.1)]'
                    : 'bg-card/30 border border-border hover:bg-card/50'
            )}
        >
            <div className="text-center mb-2 py-2">
                <div className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-1", isToday ? "text-orange-500" : "text-muted-foreground")}>
                    {format(dateObj, 'EEE')}
                </div>
                <div className={cn("text-3xl font-black tracking-tight", isToday ? "text-primary" : "text-foreground/80")}>
                    {format(dateObj, 'd')}
                </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
                {slots.map((slot) => (
                    <MealSlot
                        key={`${date}-${slot}`}
                        date={date}
                        slotType={slot}
                        meal={dayPlan?.meals?.[slot]}
                        onClick={() => onSlotClick(slot)}
                    />
                ))}

                {/* Daily Summary */}
                <div className="mt-2 pt-3 border-t border-border">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Daily Total</span>
                        <span className="font-bold text-foreground">
                            {Object.values(dayPlan?.meals || {}).reduce((acc, meal) => acc + (meal?.macros.calories || 0), 0)} kcal
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                        <div className="text-[10px] text-center p-1 rounded bg-blue-500/10 text-blue-600">
                            <div className="font-bold">{Object.values(dayPlan?.meals || {}).reduce((acc, meal) => acc + (meal?.macros.protein || 0), 0)}g</div>
                            <div className="opacity-70">P</div>
                        </div>
                        <div className="text-[10px] text-center p-1 rounded bg-green-500/10 text-green-600">
                            <div className="font-bold">{Object.values(dayPlan?.meals || {}).reduce((acc, meal) => acc + (meal?.macros.carbs || 0), 0)}g</div>
                            <div className="opacity-70">C</div>
                        </div>
                        <div className="text-[10px] text-center p-1 rounded bg-yellow-500/10 text-yellow-600">
                            <div className="font-bold">{Object.values(dayPlan?.meals || {}).reduce((acc, meal) => acc + (meal?.macros.fats || 0), 0)}g</div>
                            <div className="opacity-70">F</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
