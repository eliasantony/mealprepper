import { generateMealSuggestion } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, context, userPreferences, mode, mealIdea, keywords, timeLimit } = await req.json();


    if (!prompt && !mealIdea && mode !== 'brainstorm' && mode !== 'recalculate') {
      return NextResponse.json({ error: 'Prompt, meal idea, or context is required' }, { status: 400 });
    }

    let systemPrompt = '';

    if (mode === 'brainstorm') {
      const timeLimitStr = timeLimit ? `Time limit: ${timeLimit} minutes` : '';
      const keywordsStr = keywords ? `Keywords/Ingredients: ${keywords}` : '';

      systemPrompt = `
            You are a creative chef. Suggest 3-5 distinct meal ideas based on this request: "${prompt}".
            ${timeLimitStr}
            ${keywordsStr}
            
            User Preferences:
            - Diet: ${userPreferences?.dietaryType || 'Any'}
            - Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
            - Dislikes: ${userPreferences?.dislikes || 'None'}

            Return ONLY a valid JSON array of objects with the following structure, no markdown formatting:
            [
                {
                    "name": "Meal Name",
                    "description": "Very brief description (1 sentence)",
                    "emoji": "🍲",
                    "tags": ["High Protein", "Quick", "Vegetarian"]
                }
            ]
        `;
    } else if (context && mode !== 'recalculate') {
      // Refinement Mode
      systemPrompt = `
                You are a helpful meal planner assistant.
                The user wants to modify an existing meal based on this request: "${prompt}".
                
                Existing Meal:
                ${JSON.stringify(context, null, 2)}
                
                Generate a NEW version of this meal that incorporates the user's change.
                Keep the structure exactly the same.
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

      systemPrompt = `
        You are a professional chef and nutritionist. Create a detailed meal recipe based on the user's request: "${generationPrompt}".
        
        User Preferences:
        - Diet: ${userPreferences?.dietaryType || 'Any'}
        - Allergies: ${userPreferences?.allergies?.join(', ') || 'None'}
        - Dislikes: ${userPreferences?.dislikes || 'None'}
        - Servings: ${userPreferences?.portions || 2}
        - Units: ${userPreferences?.units || 'metric'}

        IMPORTANT: 
        1. Calculate macros (calories, protein, carbs, fats) PER SINGLE SERVING, not for the whole recipe.
        2. Be REALISTIC and ACCURATE with macro estimation. Don't just guess generic numbers.
        3. Provide a relevant emoji that represents the dish.
        3. Adjust ingredient amounts for ${userPreferences?.portions || 2} servings.
        4. Use ${userPreferences?.units === 'imperial' ? 'imperial units (oz, cups, lb)' : 'metric units (g, ml, kg)'} for all measurements.

        Return ONLY a valid JSON object with the following structure, no markdown formatting:
        {
            "name": "Recipe Name",
            "description": "Brief description",
            "emoji": "🍲",
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
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(cleanJson);

    if (mode === 'brainstorm') {
      return NextResponse.json({ ideas: data });
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
