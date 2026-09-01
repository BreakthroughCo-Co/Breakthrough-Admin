import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_AI_MODEL } from "@/lib/ai-assistant";
import { requireAuth } from "@/lib/auth/verifySession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeForPrompt(val: unknown): string {
  if (val == null) return "None provided";
  const str = typeof val === "string" ? val : JSON.stringify(val);
  return str
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .slice(0, 10000);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, ["ADMIN", "PRACTITIONER", "SUPPORT_COORDINATOR", "VIEWER"]);
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "INVALID_JSON: Failed to parse request body" }, { status: 400 });
    }

    const { client, caseNotes, incidents } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { summary: "Note: GEMINI_API_KEY is not configured yet in environment settings." },
        { status: 200 }
      );
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a clinical AI assistant embedded within an NDIS Practice Management System.
Please generate a succinct, clinical overview summary of the following client data. The summary should:
- Briefly overview the client's current status and support plan.
- Highlight key progress from recent case notes.
- Identify any critical risks or incidents reported.
- Be formatted nicely (e.g., in a short bulleted list or 2-3 concise paragraphs).
- MUST NOT invent information outside of the provided data.

Data:
Client Profile: ${sanitizeForPrompt(client)}
Recent Case Notes: ${sanitizeForPrompt(caseNotes)}
Recent Incidents: ${sanitizeForPrompt(incidents)}
`;

    const response = await ai.models.generateContent({
      model: DEFAULT_AI_MODEL,
      contents: prompt,
    });

    return NextResponse.json({ summary: response.text || "No summary generated." });
  } catch (error: any) {
    console.error("AI Summary generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate summary.", details: error.message },
      { status: 500 }
    );
  }
}
