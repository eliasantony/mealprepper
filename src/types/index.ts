export type MealType = 'breakfast' | 'lunch' | 'snack-afternoon' | 'dinner' | 'snack-evening';

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions?: string[];
  macros: Macros;
  type?: MealType; // Optional because a meal might not be assigned to a specific slot yet
  rating?: number;
  image?: string; // URL or base64
  emoji?: string;
  tags?: string[];
  servings?: number;
  visibility?: 'public' | 'private';
  userId?: string;
  author?: string;
  createdAt?: string;
  timeLimit?: number;
  bookmarkedAt?: string; // Set when this is a bookmarked recipe
}

export interface DayPlan {
  date: string; // ISO date string YYYY-MM-DD
  meals: {
    [key in MealType]?: Meal;
  };
}

export interface WeekPlan {
  [date: string]: DayPlan;
}

// Firestore storage types (slimmed down - stores IDs only)
export interface DayPlanFirestore {
  date: string;
  meals: {
    [key in MealType]?: string; // Recipe ID only
  };
}

export interface WeekPlanFirestore {
  [date: string]: DayPlanFirestore;
}
