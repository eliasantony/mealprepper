import { generateMealSuggestion } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let systemPrompt = '';

    if (context) {
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
                    }
                }
            `;
    } else {
      // Generation Mode
      systemPrompt = `
                You are a helpful meal planner assistant. 
                Generate a single meal suggestion based on the user's request: "${prompt}".
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
                    }
                }
            `;
    }

    const responseText = await generateMealSuggestion(systemPrompt);

    // Clean up the response if it contains markdown code blocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const meal = JSON.parse(cleanJson);

    // Add a real unique ID
    meal.id = crypto.randomUUID();

    return NextResponse.json({ meal });
  } catch (error) {
    console.error('Error generating meal:', error);
    return NextResponse.json({ error: 'Failed to generate meal' }, { status: 500 });
  }
}
