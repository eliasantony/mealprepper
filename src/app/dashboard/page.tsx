"use client";

import { useState, useEffect } from "react";
import { WeekView } from "@/components/Calendar/WeekView";
import { RecipeDetails } from "@/components/Meal/RecipeDetails";
import { AddMealModal } from "@/components/Meal/AddMealModal";
import { useMealStore } from "@/store/mealStore";
import { MealType } from "@/types";

export default function Dashboard() {
    const { selectedMeal, setSelectedMeal } = useMealStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, slot: MealType } | null>(null);

    // Scroll to top on mount/refresh
    useEffect(() => {
        // Disable browser's scroll restoration
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Scroll to top with slight delay to ensure hydration is complete
        const scrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        scrollToTop();
        // Also try after a small delay for hydration
        setTimeout(scrollToTop, 0);
    }, []);

    const handleSlotClick = (date: string, slot: MealType) => {
        setSelectedSlot({ date, slot });
        setIsAddModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Weekly Plan</h1>
            </div>

            <WeekView onSlotClick={handleSlotClick} />

            <RecipeDetails
                meal={selectedMeal}
                onClose={() => setSelectedMeal(null)}
            />

            {selectedSlot && (
                <AddMealModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    date={selectedSlot.date}
                    slotType={selectedSlot.slot}
                />
            )}
        </div>
    );
}
