"use client";

import { useState } from "react";
import { WeekView } from "@/components/Calendar/WeekView";
import { RecipeDetails } from "@/components/Meal/RecipeDetails";
import { AddMealModal } from "@/components/Meal/AddMealModal";
import { useMealStore } from "@/store/mealStore";
import { MealType } from "@/types";

export default function Home() {
  const { selectedMeal, setSelectedMeal } = useMealStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, slot: MealType } | null>(null);

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
