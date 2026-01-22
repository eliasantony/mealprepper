import { generateMealSuggestion } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/firebase-admin';
import { checkAndIncrementAiUsage } from '@/lib/rateLimiter';
import { sanitizeUserPreference, containsInjectionAttempt } from '@/lib/sanitizeInput';

// Toggle for AI prompt/response logging (set to true for debugging)
const DEBUG_LOGGING = false;

// Define Validation Schemas
const UserPreferencesSchema = z.object({
  dietaryType: z.string().optional(),
  weightGoal: z.enum(['lose', 'maintain', 'gain']).optional(),
  allergies: z.array(z.string()).optional(),
  calorieGoal: z.number().optional(),
  proteinGoal: z.number().optional(),
  carbsGoal: z.number().optional(),
  fatsGoal: z.number().optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  cookingTime: z.number().optional(),
  dislikes: z.array(z.string()).optional(),
  cuisines: z.array(z.string()).optional(),
  portions: z.number().optional(),
  units: z.string().optional(),
  // New preferences for AI optimization
  region: z.string().optional(),
  budget: z.enum(['low', 'medium', 'high', 'premium']).optional(),
  tasteProfile: z.string().optional(),
  additionalNotes: z.string().optional(),
  calorieDistribution: z.object({
    breakfast: z.number(),
    lunch: z.number(),
    afternoon_snack: z.number(),
    dinner: z.number(),
    evening_snack: z.number(),
  }).optional(),
});

const RequestSchema = z.object({
  prompt: z.string().optional(),
  context: z.any().optional(),
  userPreferences: UserPreferencesSchema.optional(),
  mode: z.enum(['brainstorm', 'brainstorm_week', 'recipe', 'recalculate']).optional(),
  mealIdea: z.any().optional(),
  keywords: z.string().optional(),
  timeLimit: z.any().optional(), // accepting string or number
  mealType: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Authorization Check & User Identification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string | null = null;

    // Try to verify token and extract userId (for rate limiting)
    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (tokenError) {
        // Token verification failed - still allow request but log it
        console.warn('Token verification failed:', tokenError);
      }
    }

    const body = await req.json();

    // 2. Rate Limit Check (if userId available)
    if (userId) {
      const rateLimitResult = await checkAndIncrementAiUsage(userId, body.mode || 'generate');

      if (!rateLimitResult.allowed) {
        return NextResponse.json({
          error: 'Daily Limit Reached',
          message: `You've used all ${rateLimitResult.limit} AI calls for today. Your limit resets at midnight.`,
          usage: rateLimitResult
        }, { status: 429 });
      }
    }

    // 2. Input Validation
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid Input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, context, userPreferences, mode, mealIdea, keywords, timeLimit, mealType } = validationResult.data;

    // Additional logic check
    if (!prompt && !mealIdea && mode !== 'brainstorm' && mode !== 'recalculate' && mode !== 'brainstorm_week') {
      return NextResponse.json({ error: 'Prompt, meal idea, or context is required' }, { status: 400 });
    }

    // === HELPER FUNCTIONS FOR AI PROMPT OPTIMIZATION ===

    // Budget guidance mapping
    const getBudgetContext = (budget?: string): string => {
      const budgetMap: Record<string, string> = {
        low: 'BUDGET: Low - Use ONLY common, affordable staples (rice, pasta, potatoes, eggs, chicken thighs, seasonal vegetables, legumes). Avoid specialty items.',
        medium: 'BUDGET: Medium - Use standard supermarket ingredients. Occasional premium items are okay but keep it practical.',
        high: 'BUDGET: High - You can include quality ingredients like fresh fish, good cuts of meat, and specialty cheeses.',
        premium: 'BUDGET: Premium - Feel free to use gourmet ingredients, specialty items, and premium cuts.',
      };
      return budgetMap[budget || 'medium'] || budgetMap.medium;
    };

    // Calorie distribution by meal type - uses user's custom settings if available
    const getMealCalorieTarget = (mealType: string, dailyCalories: number): number => {
      // Default distributions (used as fallback)
      const defaultDistributions: Record<string, number> = {
        breakfast: 0.20,
        lunch: 0.30,
        afternoon_snack: 0.10,
        dinner: 0.30,
        evening_snack: 0.10,
        // Legacy/alternative keys
        brunch: 0.25,
        snack: 0.10,
        dessert: 0.10,
      };

      // Use user's custom distribution if available
      const userDist = userPreferences?.calorieDistribution;
      const distributions: Record<string, number> = userDist ? {
        breakfast: userDist.breakfast,
        lunch: userDist.lunch,
        afternoon_snack: userDist.afternoon_snack,
        dinner: userDist.dinner,
        evening_snack: userDist.evening_snack,
        // Legacy keys always use defaults
        brunch: 0.25,
        snack: 0.10,
        dessert: 0.10,
      } : defaultDistributions;

      // Extract base meal type (e.g., "lunch_1" -> "lunch")
      const baseMealType = mealType.toLowerCase().split('_')[0];
      const ratio = distributions[baseMealType] || 0.30; // Default to 30% if unknown
      return Math.round(dailyCalories * ratio);
    };

    // Region and ingredient context
    const getRegionContext = (region?: string): string => {
      if (!region || region === 'Austria') {
        return `
REGION: User is based in Austria/Germany.
- Use ingredients commonly available in Austrian/German supermarkets (Billa, Spar, Hofer/Aldi).
- Prefer European measurement conventions (metric).`;
      }
      return `REGION: User is based in ${region}. Prefer locally available ingredients.`;
    };

    // Ingredient simplification instruction
    const INGREDIENT_INSTRUCTION = `
INGREDIENT GUIDELINES:
- Use COMMON ingredients only.
- AVOID specialty items like "low-sodium salt", "aged balsamic vinegar", "truffle oil", or niche products.
- Stick to staples found in any standard supermarket.
- Use simple ingredient names (e.g., "salt" not "Himalayan pink salt", "olive oil" not "extra virgin cold-pressed olive oil").`;

    // Taste profile and notes context - WITH SANITIZATION
    const getTasteProfileContext = (tasteProfile?: string, additionalNotes?: string): string => {
      // Log potential injection attempts for monitoring
      if (containsInjectionAttempt(tasteProfile) || containsInjectionAttempt(additionalNotes)) {
        console.warn('[SECURITY] Potential prompt injection attempt detected in user preferences');
      }

      // Sanitize inputs to prevent prompt injection
      const safeTasteProfile = sanitizeUserPreference(tasteProfile);
      const safeAdditionalNotes = sanitizeUserPreference(additionalNotes);

      let context = '';
      if (safeTasteProfile) {
        context += `\nTASTE PROFILE: ${safeTasteProfile}`;
      }
      if (safeAdditionalNotes) {
        context += `\nUSER NOTES: ${safeAdditionalNotes}`;
      }
      return context;
    };

    let systemPrompt = '';


    if (mode === 'brainstorm') {
      const timeLimitStr = timeLimit ? `Time limit: ${timeLimit} minutes` : '';
      const keywordsStr = keywords ? `Keywords/Ingredients: ${keywords}` : '';

      // Map weight goal to helpful context
      const weightGoalMap: Record<string, string> = {
        lose: 'lower calorie, high protein meals to support fat loss',
        maintain: 'balanced meals to maintain current weight',
        gain: 'higher calorie, protein-rich meals to support muscle gain'
      };
      const userWeightGoal = userPreferences?.weightGoal as string;
      const weightGoalContext = userWeightGoal ? weightGoalMap[userWeightGoal] || 'balanced meals' : 'balanced meals';

      systemPrompt = `
You are a creative chef and nutritionist. Suggest 3-5 distinct meal ideas based on this request: "${prompt}".
${timeLimitStr}
${keywordsStr}

User Profile:
- Diet: ${userPreferences?.dietaryType || 'Any'}
- Weight Goal: ${weightGoalContext}
- Daily Calorie Target: ${userPreferences?.calorieGoal || 2000} kcal
- Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
- Dislikes: ${userPreferences?.dislikes?.join(', ') || 'None'}
- Preferred Cuisines: ${userPreferences?.cuisines?.join(', ') || 'Any'}
- Cooking Skill: ${userPreferences?.cookingSkill || 'intermediate'}
- Max Cooking Time: ${userPreferences?.cookingTime || 30} minutes

${getRegionContext(userPreferences?.region)}
${getBudgetContext(userPreferences?.budget)}
${INGREDIENT_INSTRUCTION}
${getTasteProfileContext(userPreferences?.tasteProfile, userPreferences?.additionalNotes)}

IMPORTANT: Tailor your suggestions to the user's weight goal and calorie target.

Return ONLY a valid JSON array of objects with the following structure, no markdown formatting:
[
    {
        "name": "Meal Name",
        "description": "Very brief description (1 sentence)",
        "emoji": "🍲 (Only one most fitting)",
        "tags": ["High Protein", "Quick", "Vegetarian"]
    }
]
        `;
    } else if (mode === 'brainstorm_week') {
      const typeCounts = context as Record<string, { count: number; dates: string[] }>;
      const keywordsStr = prompt ? `User Intent/Keywords: "${prompt}"` : '';

      // Determine if this is a single-slot regeneration (context has 1 key)
      const isRegeneration = Object.keys(typeCounts).length === 1;
      const regenInstruction = isRegeneration
        ? "Ignore previous suggestions. Provide a FRESH, NEW option for this slot."
        : "Make sure the ideas are distinct from each other.";

      // Map weight goal to helpful context
      const weightGoalMap: Record<string, string> = {
        lose: 'lower calorie, high protein meals to support fat loss',
        maintain: 'balanced meals to maintain current weight',
        gain: 'higher calorie, protein-rich meals to support muscle gain'
      };
      const weightGoal = userPreferences?.weightGoal as string;
      const weightGoalContext = weightGoal ? weightGoalMap[weightGoal] || 'balanced meals' : 'balanced meals';

      // Calculate approximate per-meal calorie target based on meal type
      const dailyCalories = userPreferences?.calorieGoal || 2000;

      // Create calorie targets for each meal type requested
      const mealTypeCalorieTargets = Object.keys(typeCounts).map(type => {
        const target = getMealCalorieTarget(type, dailyCalories);
        return `- ${type}: Target ~${target} kcal per serving`;
      }).join('\n');

      systemPrompt = `
You are an efficient Meal Prep Pro and nutritionist.
The user has selected slots for their week and wants recipes.
The grouping is as follows (Type -> Number of meals needed):
${Object.entries(typeCounts).map(([type, data]) => `- ${type}: ${data.count} meals`).join('\n')}

${keywordsStr}

User Profile:
- Diet: ${userPreferences?.dietaryType || 'Any'}
- Weight Goal: ${weightGoalContext}
- Daily Calorie Target: ${dailyCalories} kcal
- Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
- Dislikes: ${userPreferences?.dislikes?.join(', ') || 'None'}
- Preferred Cuisines: ${userPreferences?.cuisines?.join(', ') || 'Any'}
- Cooking Skill: ${userPreferences?.cookingSkill || 'intermediate'}
- Max Cooking Time: ${userPreferences?.cookingTime || 30} minutes

${getRegionContext(userPreferences?.region)}
${getBudgetContext(userPreferences?.budget)}
${INGREDIENT_INSTRUCTION}
${getTasteProfileContext(userPreferences?.tasteProfile, userPreferences?.additionalNotes)}

CALORIE TARGETS PER MEAL TYPE (IMPORTANT - DO NOT EXCEED):
${mealTypeCalorieTargets}

CRITICAL INSTRUCTIONS:
1. For EACH unique meal type requested, provide ONE single recipe idea.
2. The user will cook this ONE recipe in bulk.
3. ${regenInstruction}
4. STRICTLY adhere to the calorie targets above. A lunch should be ~${getMealCalorieTarget('lunch', dailyCalories)} kcal, NOT 1000+ kcal.
5. Tailor recipes to support the user's weight goal (${weightGoalContext}).
6. Return a valid JSON array of objects.
7. Include an estimate of calories per serving and a short string of key ingredients.

Return ONLY a valid JSON array of objects with the following structure, no markdown formatting:
[
    {
        "type": "lunch", // Use the EXACT key provided in the request (e.g. "lunch" or "lunch_1")
        "name": "Meal Name",
        "description": "Brief description of this bulk meal prep dish",
        "emoji": "🍲 ", // Only one most fitting
        "servingsRequired": 3, // The number of meals requested for this type
        "calories": ${getMealCalorieTarget('lunch', dailyCalories)}, // Estimate per serving - MUST match target!
        "keyIngredients": "Chicken, Rice, Broccoli"
    }
]
      `;

    } else if (context && mode !== 'recalculate') {
      // Refinement Mode

      // Map weight goal to helpful context
      const weightGoalMap: Record<string, string> = {
        lose: 'lower calorie, high protein meals to support fat loss',
        maintain: 'balanced meals to maintain current weight',
        gain: 'higher calorie, protein-rich meals to support muscle gain'
      };
      const userWeightGoal = userPreferences?.weightGoal as string;
      const weightGoalContext = userWeightGoal ? weightGoalMap[userWeightGoal] || 'balanced meals' : 'balanced meals';

      systemPrompt = `
                You are a helpful meal planner assistant and nutritionist.
                The user wants to modify an existing meal based on this request: "${prompt}".
                
                Existing Meal:
                ${JSON.stringify(context, null, 2)}
                
                User Profile:
                - Diet: ${userPreferences?.dietaryType || 'Any'}
                - Weight Goal: ${weightGoalContext}
                - Daily Calorie Target: ${userPreferences?.calorieGoal || 2000} kcal
                - Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
                - Dislikes: ${userPreferences?.dislikes?.join(', ') || 'None'}
                - Preferred Cuisines: ${userPreferences?.cuisines?.join(', ') || 'Any'}
                - Cooking Skill: ${userPreferences?.cookingSkill || 'intermediate'}
                - Max Cooking Time: ${userPreferences?.cookingTime || 30} minutes
                
                Generate a NEW version of this meal that incorporates the user's change.
                Keep the structure exactly the same. Consider the user's weight goal and calorie target.
                Return ONLY a valid JSON object with the following structure, no markdown formatting:
                {
                    "id": "generate-unique-id",
                    "name": "Meal Name",
                    "description": "Short description",
                    "ingredients": [
                        { "name": "Ingredient 1", "amount": "1 cup" }
                    ],
                    "instructions": ["Step 1", "Step 2"],
                    "macros": {
                        "calories": 500,
                        "protein": 30,
                        "carbs": 40,
                        "fats": 20
                    },
                    "tags": ["Tag1", "Tag2"]
                }
            `;
    } else if (mode === 'recalculate') {
      // Recalculate Macros Mode
      systemPrompt = `
                You are a precise nutritionist.
                Calculate the nutritional macros (calories, protein, carbs, fats) for the following meal based on its ingredients and amounts.
                
                Meal:
                ${JSON.stringify(context, null, 2)}
                
                IMPORTANT:
                1. Estimate the macros for the ENTIRE meal as described by the ingredients.
                2. If the amounts are vague (e.g. "some salt"), assume negligible calories.
                3. Be as accurate as possible with standard nutritional data.
                4. Return NUMBERS only. Do NOT return null. If a value is unknown or negligible, return 0.
                
                Return ONLY a valid JSON object with the following structure, no markdown formatting:
                {
                    "calories": 500,
                    "protein": 30,
                    "carbs": 40,
                    "fats": 20
                }
            `;
    } else {
      // Generation Mode (Direct or from Idea)
      const generationPrompt = mealIdea
        ? `Create a detailed recipe for "${mealIdea.name}" - ${mealIdea.description}. Context: ${prompt || ''}`
        : prompt;

      // Map weight goal to helpful context
      const weightGoalMap: Record<string, string> = {
        lose: 'lower calorie, high protein meals to support fat loss',
        maintain: 'balanced meals to maintain current weight',
        gain: 'higher calorie, protein-rich meals to support muscle gain'
      };
      const userWeightGoal = userPreferences?.weightGoal as string;
      const weightGoalContext = userWeightGoal ? weightGoalMap[userWeightGoal] || 'balanced meals' : 'balanced meals';

      // Determine calorie target based on meal type from the idea, passed mealType, or default
      const dailyCalories = userPreferences?.calorieGoal || 2000;
      const mealTypeToUse = mealType || mealIdea?.type || 'lunch';
      const targetCalories = getMealCalorieTarget(mealTypeToUse, dailyCalories);

      systemPrompt = `
You are a professional chef and nutritionist. Create a detailed meal recipe based on the user's request: "${generationPrompt}".

User Profile:
- Diet: ${userPreferences?.dietaryType || 'Any'}
- Weight Goal: ${weightGoalContext}
- Daily Calorie Target: ${dailyCalories} kcal
- Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
- Dislikes: ${userPreferences?.dislikes?.join(', ') || 'None'}
- Preferred Cuisines: ${userPreferences?.cuisines?.join(', ') || 'Any'}
- Cooking Skill: ${userPreferences?.cookingSkill || 'intermediate'}
- Max Cooking Time: ${userPreferences?.cookingTime || 30} minutes
- Servings: ${userPreferences?.portions || 2}
- Units: ${userPreferences?.units || 'metric'}

${getRegionContext(userPreferences?.region)}
${getBudgetContext(userPreferences?.budget)}
${INGREDIENT_INSTRUCTION}
${getTasteProfileContext(userPreferences?.tasteProfile, userPreferences?.additionalNotes)}

TARGET CALORIES: This is a ${mealTypeToUse}. Target approximately ${targetCalories} kcal per serving.

IMPORTANT: 
1. Calculate macros (calories, protein, carbs, fats) PER SINGLE SERVING, not for the whole recipe.
2. Be REALISTIC and ACCURATE with macro estimation. Don't just guess generic numbers.
3. TARGET ${targetCalories} kcal per serving for this ${mealTypeToUse}. Do NOT significantly exceed this.
4. Tailor the recipe to support the user's weight goal (${weightGoalContext}).
5. Provide one relevant emoji that represents the dish.
6. Adjust ingredient amounts for ${userPreferences?.portions || 2} servings.
7. Use ${userPreferences?.units === 'imperial' ? 'imperial units (oz, cups, lb)' : 'metric units (g, ml, kg)'} for all measurements.
8. Keep complexity appropriate for ${userPreferences?.cookingSkill || 'intermediate'} skill level.

Return ONLY a valid JSON object with the following structure, no markdown formatting:
{
    "name": "Recipe Name",
    "description": "Brief description",
    "emoji": "🍲", // Only one most fitting
    "servings": 2,
    "ingredients": [
        { "name": "Ingredient 1", "amount": "100g" },
        { "name": "Ingredient 2", "amount": "2 tbsp" }
    ],
    "instructions": ["Step 1", "Step 2", "..."],
    "macros": {
        "calories": ${targetCalories},
        "protein": 30,
        "carbs": 45,
        "fats": 20
    },
    "tags": ["Tag1", "Tag2"]
}
        `;
    }

    // === PROMPT LOGGING FOR PERFORMANCE TESTING ===
    if (DEBUG_LOGGING) {
      console.log('\n=== AI PROMPT (Mode: ' + mode + ') ===');
      console.log('Prompt length:', systemPrompt.length, 'characters');
      console.log('--- START PROMPT ---');
      console.log(systemPrompt);
      console.log('--- END PROMPT ---\n');
    }

    const startTime = Date.now();
    const responseText = await generateMealSuggestion(systemPrompt);
    const endTime = Date.now();

    if (DEBUG_LOGGING) {
      console.log(`=== AI RESPONSE TIME: ${endTime - startTime}ms (${((endTime - startTime) / 1000).toFixed(2)}s) ===`);
      console.log('Response length:', responseText.length, 'characters\n');
    }

    // Clean up the response if it contains markdown code blocks
    let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Helper function to extract JSON from potentially malformed response
    const extractJson = (text: string): any => {
      // First, try direct parse
      try {
        return JSON.parse(text);
      } catch {
        // Try to find JSON array or object in the text
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        const objectMatch = text.match(/\{[\s\S]*\}/);

        if (arrayMatch) {
          try {
            return JSON.parse(arrayMatch[0]);
          } catch {
            // If array parse fails, try with basic cleanup
            const cleaned = arrayMatch[0]
              .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
              .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
            return JSON.parse(cleaned);
          }
        }

        if (objectMatch) {
          try {
            return JSON.parse(objectMatch[0]);
          } catch {
            const cleaned = objectMatch[0]
              .replace(/,\s*([}\]])/g, '$1')
              .replace(/[\x00-\x1F\x7F]/g, '');
            return JSON.parse(cleaned);
          }
        }

        throw new Error('Could not extract valid JSON from response');
      }
    };

    const data = extractJson(cleanJson);

    if (mode === 'brainstorm' || mode === 'brainstorm_week') {
      // Ensure we always return an array for ideas
      const ideas = Array.isArray(data) ? data : (data.ideas || []);
      return NextResponse.json({ ideas });
    }

    if (mode === 'recalculate') {
      let macros = data;

      // Handle case where AI wraps response in "macros" key
      if (data.macros) {
        macros = data.macros;
      }

      // Ensure values are numbers and handle strings with units (e.g. "500g")
      for (const key of ['calories', 'protein', 'carbs', 'fats']) {
        if (typeof macros[key] === 'string') {
          macros[key] = parseFloat(macros[key]) || 0;
        }
      }

      return NextResponse.json({ macros });
    }

    const meal = data;

    // Add a real unique ID
    meal.id = crypto.randomUUID();

    // Default to public visibility
    meal.visibility = 'public';

    // Ensure servings is set
    if (!meal.servings) {
      meal.servings = userPreferences?.portions || 2;
    }

    // Preserve tags if they came from an idea, or use generated ones
    if (mealIdea?.tags) {
      meal.tags = [...new Set([...(meal.tags || []), ...mealIdea.tags])];
    }

    return NextResponse.json({ meal });
  } catch (error) {
    console.error('Error generating meal:', error);
    return NextResponse.json({ error: 'Failed to generate meal' }, { status: 500 });
  }
}
