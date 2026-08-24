import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { prompt, systemInstruction, model, responseMimeType } = body;
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { text: 'Note: GEMINI_API_KEY is not configured yet in .env.example.' },
        { status: 200 }
      );
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const config: Record<string, any> = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (responseMimeType) config.responseMimeType = responseMimeType;

    let selectedModel = model || 'gemini-3.5-flash';
    if (selectedModel.includes('gemini-2.5')) {
      selectedModel = 'gemini-3.5-flash';
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Error generating Gemini content:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

