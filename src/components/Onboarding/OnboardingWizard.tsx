"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { ChevronRight, Check, ChefHat, Flame, Clock, Scale, Users, Wheat, Nut, Milk, Egg, Fish, Bean, Utensils, Sunrise, Sun, Cookie, Moon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveUserPreferences, updateUserData, saveOnboardingData } from '@/services/firestoreService';
import { useAuth } from '@/context/AuthContext';

const steps = [
    { id: 'weight', title: 'Weight Goal', description: 'What do you want to achieve?' },
    { id: 'diet', title: 'Dietary Goals', description: 'What is your primary diet type?' },
    { id: 'allergies', title: 'Allergies', description: 'Do you have any food allergies?' },
    { id: 'targets', title: 'Nutrition Targets', description: 'Set your daily goals.' },
    { id: 'budget', title: 'Budget', description: 'What is your food budget preference?' },
    { id: 'cuisines', title: 'Favorite Cuisines', description: 'What flavors do you love?' },
    { id: 'cooking', title: 'Cooking Style', description: 'How do you like to cook?' },
];

// Preset meal distribution templates
const mealDistributionPresets = [
    {
        id: 'standard',
        label: 'Standard',
        icon: Scale,
        description: 'Balanced meals throughout the day',
        distribution: { breakfast: 0.20, lunch: 0.30, afternoon_snack: 0.10, dinner: 0.30, evening_snack: 0.10 }
    },
    {
        id: 'big_breakfast',
        label: 'Big Breakfast',
        icon: Sunrise,
        description: 'Front-loaded calories for energy',
        distribution: { breakfast: 0.35, lunch: 0.25, afternoon_snack: 0.10, dinner: 0.25, evening_snack: 0.05 }
    },
    {
        id: 'big_dinner',
        label: 'Big Dinner',
        icon: Moon,
        description: 'Main meal in the evening',
        distribution: { breakfast: 0.15, lunch: 0.25, afternoon_snack: 0.10, dinner: 0.40, evening_snack: 0.10 }
    },
    {
        id: 'no_snacks',
        label: 'No Snacks',
        icon: Utensils,
        description: '3 main meals only',
        distribution: { breakfast: 0.30, lunch: 0.35, afternoon_snack: 0.00, dinner: 0.35, evening_snack: 0.00 }
    },
];

const budgetOptions = [
    { id: 'low', label: 'Budget', icon: '💰', description: 'Budget-friendly basics' },
    { id: 'medium', label: 'Standard', icon: '🛒', description: 'Standard supermarket shopping' },
    { id: 'high', label: 'Quality', icon: '🍽️', description: 'Quality ingredients' },
    { id: 'premium', label: 'Premium', icon: '✨', description: 'Gourmet & specialty items' },
];

const dietTypes = [
    { id: 'balanced', label: 'Balanced', icon: '🥗', description: 'Everything in moderation' },
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥦', description: 'No meat' },
    { id: 'vegan', label: 'Vegan', icon: '🌱', description: 'No animal products' },
    { id: 'keto', label: 'Keto', icon: '🥑', description: 'High fat, low carb' },
    { id: 'paleo', label: 'Paleo', icon: '🍖', description: 'Whole foods, no processed' },
    { id: 'pescatarian', label: 'Pescatarian', icon: '🐟', description: 'Vegetarian + Fish' },
    { id: 'low-carb', label: 'Low Carb', icon: '🥩', description: 'Reduced carbohydrates' },
];

const weightGoals = [
    { id: 'lose', label: 'Lose Weight', icon: '📉', description: 'Calorie deficit' },
    { id: 'maintain', label: 'Maintain', icon: '⚖️', description: 'Stay the same' },
    { id: 'gain', label: 'Gain Muscle', icon: '💪', description: 'Calorie surplus' },
];


const commonAllergies = [
    { id: 'Nuts', label: 'Nuts', emoji: '🥜' },
    { id: 'Dairy', label: 'Dairy', emoji: '🥛' },
    { id: 'Gluten', label: 'Gluten', emoji: '🍞' },
    { id: 'Soy', label: 'Soy', emoji: '🫘' },
    { id: 'Eggs', label: 'Eggs', emoji: '🥚' },
    { id: 'Shellfish', label: 'Shellfish', emoji: '🦐' },
];

const cuisineOptions = [
    { id: 'Italian', label: 'Italian', emoji: '🍝' },
    { id: 'Mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'Middle Eastern', label: 'Middle Eastern', emoji: '🥙' },
    { id: 'Mediterranean', label: 'Mediterranean', emoji: '🫒' },
    { id: 'American', label: 'American', emoji: '🍔' },
    { id: 'Asian', label: 'Asian', emoji: '🍜' },
    { id: 'Korean', label: 'Korean', emoji: '🥢' },
    { id: 'Japanese', label: 'Japanese', emoji: '🍣' },
    { id: 'Thai', label: 'Thai', emoji: '🍲' },
    { id: 'Indian', label: 'Indian', emoji: '🍛' },
    { id: 'Spanish', label: 'Spanish', emoji: '🥘' },
    { id: 'French', label: 'French', emoji: '🥐' },
];

export const OnboardingWizard = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const { preferences, setPreferences, completeOnboarding } = useUserStore();
    const router = useRouter();

    // Dynamic Macro Calculation
    useEffect(() => {
        const calories = preferences.calorieGoal;
        let proteinRatio = 0.20; // Lowered default
        let fatRatio = 0.30;
        let carbRatio = 0.50;

        if (preferences.weightGoal === 'gain') {
            proteinRatio = 0.25; // Lowered from 0.30
            carbRatio = 0.55;
            fatRatio = 0.20;
        } else if (preferences.weightGoal === 'lose') {
            proteinRatio = 0.35; // Lowered from 0.40
            carbRatio = 0.35;
            fatRatio = 0.30;
        } else if (preferences.dietaryType === 'keto') {
            proteinRatio = 0.20;
            fatRatio = 0.75;
            carbRatio = 0.05;
        }

        setPreferences({
            proteinGoal: Math.round((calories * proteinRatio) / 4),
            carbsGoal: Math.round((calories * carbRatio) / 4),
            fatsGoal: Math.round((calories * fatRatio) / 9),
        });
    }, [preferences.calorieGoal, preferences.weightGoal, preferences.dietaryType]);

    const { user } = useAuth();

    const handleNext = async () => {
        // Validate calorie distribution on Targets step (case 3)
        if (currentStep === 3) {
            const defaultDist = mealDistributionPresets[0].distribution;
            const currentDist = preferences.calorieDistribution || defaultDist;
            const total = Math.round((currentDist.breakfast + currentDist.lunch + currentDist.afternoon_snack + currentDist.dinner + currentDist.evening_snack) * 100);

            if (total !== 100) {
                alert(`Meal distribution must equal 100% (currently ${total}%)`);
                return;
            }
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            if (user) {
                try {
                    console.log("OnboardingWizard: Saving preferences and completion status for user", user.uid);
                    await saveOnboardingData(user.uid, preferences);
                    console.log("OnboardingWizard: Save successful");
                } catch (error) {
                    console.error("Failed to save preferences:", error);
                    // Continue anyway to let user use the app
                }
            } else {
                console.log("OnboardingWizard: No user found, skipping save");
            }
            completeOnboarding();
            router.push('/');
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Weight Goal
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {weightGoals.map((goal) => (
                            <button
                                key={goal.id}
                                onClick={() => setPreferences({ weightGoal: goal.id as any })}
                                className={cn(
                                    "p-6 rounded-2xl border-2 text-center transition-all hover:scale-[1.02]",
                                    preferences.weightGoal === goal.id
                                        ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                                        : "border-border hover:border-orange-500/50 bg-card"
                                )}
                            >
                                <div className="text-4xl mb-3">{goal.icon}</div>
                                <h3 className="font-semibold text-lg">{goal.label}</h3>
                                <p className="text-sm text-muted-foreground">{goal.description}</p>
                            </button>
                        ))}
                    </div>
                );
            case 1: // Diet
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dietTypes.map((diet) => (
                            <button
                                key={diet.id}
                                onClick={() => setPreferences({ dietaryType: diet.id })}
                                className={cn(
                                    "p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]",
                                    preferences.dietaryType === diet.id
                                        ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                                        : "border-border hover:border-orange-500/50 bg-card"
                                )}
                            >
                                <div className="text-4xl mb-3">{diet.icon}</div>
                                <h3 className="font-semibold text-lg">{diet.label}</h3>
                                <p className="text-sm text-muted-foreground">{diet.description}</p>
                            </button>
                        ))}
                    </div>
                );
            case 2: // Allergies
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {commonAllergies.map((allergy) => {
                                const isSelected = preferences.allergies.includes(allergy.id);
                                return (
                                    <button
                                        key={allergy.id}
                                        onClick={() => {
                                            const newAllergies = isSelected
                                                ? preferences.allergies.filter(a => a !== allergy.id)
                                                : [...preferences.allergies, allergy.id];
                                            setPreferences({ allergies: newAllergies });
                                        }}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                            isSelected
                                                ? "bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400"
                                                : "bg-card border-border hover:border-orange-500/50"
                                        )}
                                    >
                                        <div className="text-2xl">{allergy.emoji}</div>
                                        <span className="font-medium flex-1">{allergy.label}</span>
                                        {isSelected && <Check className="w-5 h-5 text-orange-500" />}
                                    </button>
                                );
                            })}
                        </div>
                        {preferences.allergies.length === 0 && (
                            <div className="p-4 bg-green-500/10 text-green-600 rounded-xl flex items-center gap-2 justify-center">
                                <Check className="w-5 h-5" />
                                <span>No allergies selected. Great!</span>
                            </div>
                        )}
                    </div>
                );
            case 3: // Targets (Nutrition + Meal Distribution)
                return (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="block">
                                <span className="flex justify-between mb-2 font-medium">
                                    <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Daily Calories</span>
                                    <span className="text-orange-500 font-bold text-lg">{preferences.calorieGoal} kcal</span>
                                </span>
                                <input
                                    type="range"
                                    min="1200"
                                    max="4000"
                                    step="50"
                                    value={preferences.calorieGoal}
                                    onChange={(e) => setPreferences({ calorieGoal: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>1200</span>
                                    <span>4000</span>
                                </div>
                            </label>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-card border border-border rounded-xl text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                                    <div className="text-sm text-muted-foreground mb-1">Protein</div>
                                    <div className="font-bold text-xl">{preferences.proteinGoal}g</div>
                                </div>
                                <div className="p-4 bg-card border border-border rounded-xl text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                                    <div className="text-sm text-muted-foreground mb-1">Carbs</div>
                                    <div className="font-bold text-xl">{preferences.carbsGoal}g</div>
                                </div>
                                <div className="p-4 bg-card border border-border rounded-xl text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
                                    <div className="text-sm text-muted-foreground mb-1">Fats</div>
                                    <div className="font-bold text-xl">{preferences.fatsGoal}g</div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center bg-secondary/50 p-3 rounded-lg">
                                *Macros are automatically adjusted based on your goal ({preferences.weightGoal}) and diet ({preferences.dietaryType}).
                            </p>
                        </div>

                        {/* Meal Distribution */}
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <Utensils className="w-4 h-4 text-orange-500" />
                                Meal Distribution
                            </h3>

                            {/* Preset Options - styled like budget cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {mealDistributionPresets.map((preset) => {
                                    const currentDist = preferences.calorieDistribution || mealDistributionPresets[0].distribution;
                                    const isSelected =
                                        Math.abs(currentDist.breakfast - preset.distribution.breakfast) < 0.01 &&
                                        Math.abs(currentDist.lunch - preset.distribution.lunch) < 0.01 &&
                                        Math.abs(currentDist.dinner - preset.distribution.dinner) < 0.01;

                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => setPreferences({ calorieDistribution: preset.distribution })}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]",
                                                isSelected
                                                    ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                                                    : "border-border hover:border-orange-500/50 bg-card"
                                            )}
                                        >
                                            <preset.icon className="w-6 h-6 text-orange-500 mb-2" />
                                            <h4 className="font-semibold">{preset.label}</h4>
                                            <p className="text-xs text-muted-foreground mb-2">{preset.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {Math.round(preset.distribution.breakfast * 100)}% • {Math.round(preset.distribution.lunch * 100)}% • {Math.round(preset.distribution.dinner * 100)}%
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom option */}
                            {(() => {
                                const currentDist = preferences.calorieDistribution || mealDistributionPresets[0].distribution;
                                const isCustom = !mealDistributionPresets.some(preset =>
                                    Math.abs(currentDist.breakfast - preset.distribution.breakfast) < 0.01 &&
                                    Math.abs(currentDist.lunch - preset.distribution.lunch) < 0.01 &&
                                    Math.abs(currentDist.dinner - preset.distribution.dinner) < 0.01
                                );
                                const total = Math.round((currentDist.breakfast + currentDist.lunch + currentDist.afternoon_snack + currentDist.dinner + currentDist.evening_snack) * 100);

                                const mealTypes = [
                                    { key: 'breakfast', label: 'Breakfast', Icon: Sunrise },
                                    { key: 'lunch', label: 'Lunch', Icon: Sun },
                                    { key: 'afternoon_snack', label: 'Snack', Icon: Cookie },
                                    { key: 'dinner', label: 'Dinner', Icon: Moon },
                                    { key: 'evening_snack', label: 'Evening', Icon: Moon },
                                ];

                                return (
                                    <div className={cn(
                                        "p-4 rounded-2xl border-2 transition-all",
                                        isCustom
                                            ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                                            : "border-border bg-card"
                                    )}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Settings className="w-5 h-5 text-orange-500" />
                                                <div>
                                                    <h4 className="font-semibold">Custom</h4>
                                                    <p className="text-xs text-muted-foreground">Set your own distribution</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-sm font-bold",
                                                total === 100
                                                    ? "bg-green-500/20 text-green-500"
                                                    : "bg-red-500/20 text-red-500"
                                            )}>
                                                {total}%
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {mealTypes.map((meal) => {
                                                const value = Math.round(currentDist[meal.key as keyof typeof currentDist] * 100);
                                                const kcal = Math.round(preferences.calorieGoal * value / 100);
                                                return (
                                                    <div key={meal.key} className="space-y-1">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="flex items-center gap-2">
                                                                <meal.Icon className="w-4 h-4 text-muted-foreground" />
                                                                <span className="font-medium">{meal.label}</span>
                                                            </span>
                                                            <span>
                                                                <span className="font-bold text-orange-500">{value}%</span>
                                                                <span className="text-muted-foreground text-xs ml-1">({kcal} kcal)</span>
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="50"
                                                            step="5"
                                                            value={value}
                                                            onChange={(e) => {
                                                                const newDist = { ...currentDist };
                                                                newDist[meal.key as keyof typeof newDist] = parseInt(e.target.value) / 100;
                                                                setPreferences({ calorieDistribution: newDist });
                                                            }}
                                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {total !== 100 && (
                                            <p className="text-xs text-red-500 mt-3 text-center">
                                                ⚠️ Total must equal 100% to continue (currently {total}%)
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                );
            case 4: // Budget
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {budgetOptions.map((budget) => (
                            <button
                                key={budget.id}
                                onClick={() => setPreferences({ budget: budget.id as any })}
                                className={cn(
                                    "p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]",
                                    preferences.budget === budget.id
                                        ? "border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/20"
                                        : "border-border hover:border-orange-500/50 bg-card"
                                )}
                            >
                                <div className="text-4xl mb-3">{budget.icon}</div>
                                <h3 className="font-semibold text-lg">{budget.label}</h3>
                                <p className="text-sm text-muted-foreground">{budget.description}</p>
                            </button>
                        ))}
                    </div>
                );
            case 5: // Cuisines
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {cuisineOptions.map((cuisine) => {
                                const isSelected = preferences.cuisines?.includes(cuisine.id);
                                return (
                                    <button
                                        key={cuisine.id}
                                        onClick={() => {
                                            const currentCuisines = preferences.cuisines || [];
                                            const newCuisines = isSelected
                                                ? currentCuisines.filter(c => c !== cuisine.id)
                                                : [...currentCuisines, cuisine.id];
                                            setPreferences({ cuisines: newCuisines });
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                                            isSelected
                                                ? "bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400 shadow-sm"
                                                : "bg-card border-border hover:border-orange-500/50"
                                        )}
                                    >
                                        <div className="text-2xl">{cuisine.emoji}</div>
                                        <span className="font-medium">{cuisine.label}</span>
                                        {isSelected && <Check className="w-4 h-4 text-orange-500 ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 6: // Cooking
                return (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-orange-500" />
                                Skill Level
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {['beginner', 'intermediate', 'advanced'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setPreferences({ cookingSkill: level as any })}
                                        className={cn(
                                            "p-3 rounded-xl border capitalize text-center transition-all",
                                            preferences.cookingSkill === level
                                                ? "bg-orange-500/10 border-orange-500 text-orange-600 font-medium"
                                                : "bg-card border-border hover:border-orange-500/30"
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" />
                                Servings per Meal
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                How many servings do you typically cook at once?
                            </p>
                            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
                                <button
                                    onClick={() => setPreferences({ portions: Math.max(1, (preferences.portions || 2) - 1) })}
                                    className="w-10 h-10 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-xl font-bold"
                                >
                                    -
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="text-2xl font-bold">{preferences.portions || 2}</span>
                                    <span className="text-muted-foreground ml-2">servings</span>
                                </div>
                                <button
                                    onClick={() => setPreferences({ portions: Math.min(10, (preferences.portions || 2) + 1) })}
                                    className="w-10 h-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center text-xl font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                Max Prep Time
                            </h3>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="15"
                                    max="120"
                                    step="15"
                                    value={preferences.cookingTime}
                                    onChange={(e) => setPreferences({ cookingTime: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                                <span className="font-mono font-medium w-20 text-right">{preferences.cookingTime} min</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                    <span>Step {currentStep + 1} of {steps.length}</span>
                    <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
                <motion.h1
                    key={steps[currentStep].title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-2"
                >
                    {steps[currentStep].title}
                </motion.h1>
                <motion.p
                    key={steps[currentStep].description}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground"
                >
                    {steps[currentStep].description}
                </motion.p>
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border mt-8 -mx-4 flex justify-between z-10">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="px-6 py-2 rounded-xl font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20"
                >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
