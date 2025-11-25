import React, { useState } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import { DayColumn } from './DayColumn';
import { useMealStore } from '@/store/mealStore';
import { MealCard } from '@/components/Meal/MealCard';
import { Meal, MealType } from '@/types';

interface WeekViewProps {
    onSlotClick: (date: string, slot: MealType) => void;
}

export const WeekView = ({ onSlotClick }: WeekViewProps) => {
    const { weekPlan, setMealForSlot, removeMealFromSlot } = useMealStore();
    const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const meal = active.data.current?.meal as Meal;
        if (meal) {
            setActiveMeal(meal);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveMeal(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        const meal = activeData.meal as Meal;

        // Dropped on a slot
        if (overData.type === 'slot') {
            const { date: destDate, slotType: destSlot } = overData;
            const { date: sourceDate, slotType: sourceSlot } = activeData;

            // If it's the same slot, do nothing
            if (destDate === sourceDate && destSlot === sourceSlot) {
                return;
            }

            // Move the meal: remove from old slot, add to new slot
            if (sourceDate && sourceSlot) {
                removeMealFromSlot(sourceDate, sourceSlot as MealType);
            }
            setMealForSlot(destDate, destSlot as MealType, meal);
        }
    };

    // Get start of current week (Monday)
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i);
        return format(date, 'yyyy-MM-dd');
    });

    if (!mounted) {
        return <div className="w-full h-96 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
        </div>;
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={{
                acceleration: 0.01, // Gentle acceleration
                interval: 120, // Slightly slower updates
                threshold: { x: 0.15, y: 0.15 }, // Trigger when close to edge
                layoutShiftCompensation: true
            }}
        >
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                <div className="flex gap-4 min-w-[100%] md:min-w-[1200px] px-4 md:px-2">
                    {days.map((date) => (
                        <div key={date} className="snap-center w-[85vw] md:w-auto flex-shrink-0">
                            <DayColumn
                                date={date}
                                dayPlan={weekPlan[date]}
                                isToday={date === format(today, 'yyyy-MM-dd')}
                                onSlotClick={(slot) => onSlotClick(date, slot)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeMeal ? <MealCard meal={activeMeal} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
};
