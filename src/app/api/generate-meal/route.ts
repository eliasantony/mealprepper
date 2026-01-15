import { generateMealSuggestion } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
});

const RequestSchema = z.object({
  prompt: z.string().optional(),
  context: z.any().optional(),
  userPreferences: UserPreferencesSchema.optional(),
  mode: z.enum(['brainstorm', 'brainstorm_week', 'recipe', 'recalculate']).optional(),
  mealIdea: z.any().optional(),
  keywords: z.string().optional(),
  timeLimit: z.any().optional(), // accepting string or number
});

export async function POST(req: Request) {
  try {
    // 1. Authorization Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For now, we enforce that a token MUST be present, even if we don't fully verify 
      // the signature server-side without a service account.
      // The middleware adds rate limiting based on this token.
      return NextResponse.json({ error: 'Unauthorized', message: 'Missing or invalid token' }, { status: 401 });
    }

    const body = await req.json();

    // 2. Input Validation
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid Input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, context, userPreferences, mode, mealIdea, keywords, timeLimit } = validationResult.data;

    // Additional logic check
    if (!prompt && !mealIdea && mode !== 'brainstorm' && mode !== 'recalculate' && mode !== 'brainstorm_week') {
      return NextResponse.json({ error: 'Prompt, meal idea, or context is required' }, { status: 400 });
    }

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
      const totalMealsRequested = Object.values(typeCounts).reduce((sum, d) => sum + d.count, 0);

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

        CRITICAL INSTRUCTIONS:
        1. For EACH unique meal type requested, provide ONE single recipe idea.
        2. The user will cook this ONE recipe in bulk.
        3. ${regenInstruction}
        4. Tailor calories to support the user's weight goal (${weightGoalContext}).
        5. Return a valid JSON array of objects.
        6. Include an estimate of calories per serving and a short string of key ingredients.

        Return ONLY a valid JSON array of objects with the following structure, no markdown formatting:
        [
            {
                "type": "lunch", // Use the EXACT key provided in the request (e.g. "lunch" or "lunch_1")
                "name": "Meal Name",
                "description": "Brief description of this bulk meal prep dish",
                "emoji": "🍲 ", // Only one most fitting
                "servingsRequired": 3, // The number of meals requested for this type
                "calories": 550, // Estimate per serving
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

      systemPrompt = `
        You are a professional chef and nutritionist. Create a detailed meal recipe based on the user's request: "${generationPrompt}".
        
        User Profile:
        - Diet: ${userPreferences?.dietaryType || 'Any'}
        - Weight Goal: ${weightGoalContext}
        - Daily Calorie Target: ${userPreferences?.calorieGoal || 2000} kcal
        - Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
        - Dislikes: ${userPreferences?.dislikes?.join(', ') || 'None'}
        - Preferred Cuisines: ${userPreferences?.cuisines?.join(', ') || 'Any'}
        - Cooking Skill: ${userPreferences?.cookingSkill || 'intermediate'}
        - Max Cooking Time: ${userPreferences?.cookingTime || 30} minutes
        - Servings: ${userPreferences?.portions || 2}
        - Units: ${userPreferences?.units || 'metric'}

        IMPORTANT: 
        1. Calculate macros (calories, protein, carbs, fats) PER SINGLE SERVING, not for the whole recipe.
        2. Be REALISTIC and ACCURATE with macro estimation. Don't just guess generic numbers.
        3. Tailor the recipe to support the user's weight goal (${weightGoalContext}).
        4. Provide one relevant emoji that represents the dish.
        5. Adjust ingredient amounts for ${userPreferences?.portions || 2} servings.
        6. Use ${userPreferences?.units === 'imperial' ? 'imperial units (oz, cups, lb)' : 'metric units (g, ml, kg)'} for all measurements.
        7. Keep complexity appropriate for ${userPreferences?.cookingSkill || 'intermediate'} skill level.

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
                "calories": 500,
                "protein": 30,
                "carbs": 45,
                "fats": 20
            },
            "tags": ["Tag1", "Tag2"]
        }
        `;
    }

    const responseText = await generateMealSuggestion(systemPrompt);

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
