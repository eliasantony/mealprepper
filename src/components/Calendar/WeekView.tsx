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

        const activeMeal = active.data.current?.meal as Meal;
        const overData = over.data.current;

        if (!activeMeal || !overData) return;

        // Dropped on a slot
        if (overData.type === 'slot') {
            const { date, slotType } = overData;
            setMealForSlot(date, slotType as MealType, activeMeal);
        }
    };

    // Get start of current week (Monday)
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i);
        return format(date, 'yyyy-MM-dd');
    });

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
