import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Must use gemini-2.5-flash, as gemini-1.5-flash is not supported anymore
export const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateMealSuggestion(prompt: string) {
    if (!apiKey) {
        throw new Error('Gemini API key is not set');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
}
