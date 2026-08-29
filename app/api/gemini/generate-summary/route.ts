import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Using the correct environment variable and Next.js setup constraints.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { client, caseNotes, incidents } = await req.json();

    const prompt = `You are a clinical AI assistant embedded within an NDIS Practice Management System.
    Please generate a succinct, clinical overview summary of the following client data. The summary should:
    - Briefly overview the client's current status and support plan.
    - Highlight key progress from recent case notes.
    - Identify any critical risks or incidents reported.
    - Be formatted nicely (e.g., in a short bulleted list or 2-3 concise paragraphs).
    - MUST NOT invent information outside of the provided data.

    Data:
    Client Profile: ${JSON.stringify(client)}
    Recent Case Notes: ${JSON.stringify(caseNotes)}
    Recent Incidents: ${JSON.stringify(incidents)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text });
  } catch (error: any) {
    console.error("AI Summary generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate summary.", details: error.message },
      { status: 500 }
    );
  }
}
