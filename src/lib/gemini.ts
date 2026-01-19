import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
    apiKey,
});

const config = {
    thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
    },
};

const model = 'gemini-3-flash-preview';

export async function generateMealSuggestion(prompt: string) {
    if (!apiKey) {
        throw new Error('Gemini API key is not set');
    }

    const contents = [
        {
            role: 'user' as const,
            parts: [
                {
                    text: prompt,
                },
            ],
        },
    ];

    const response = await ai.models.generateContent({
        model,
        config,
        contents,
    });

    // Extract text from response
    const text = response.text || '';
    return text;
}
