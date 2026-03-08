import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import createError from "http-errors";

/**
 * Generic function to call an LLM (Gemini or Groq) with a prompt and a response schema.
 */
export const generateWithAI = async (
  systemInstruction: string,
  userPrompt: string,
  schema: any
) => {
  const provider = process.env.LLM_PROVIDER || "GROQ"; // Default to GROQ now

  if (provider === "GROQ") {
    return await generateWithGroq(systemInstruction, userPrompt, schema);
  } else {
    return await generateWithGemini(systemInstruction, userPrompt, schema);
  }
};

/**
 * Groq / Llama 3.1 Implementation (Ultra-fast, High Quota)
 */
async function generateWithGroq(systemInstruction: string, userPrompt: string, schema: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw createError(500, "GROQ_API_KEY missing");

  const groq = new Groq({ apiKey });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction + "\nOutput MUST be valid JSON matching this schema: " + JSON.stringify(schema) },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Groq Error:", error);
    // If Groq fails, try Gemini as a final fallback
    return await generateWithGemini(systemInstruction, userPrompt, schema);
  }
}

/**
 * Original Gemini Implementation (Safe Fallback)
 */
async function generateWithGemini(systemInstruction: string, userPrompt: string, schema: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createError(500, "GEMINI_API_KEY missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction,
    generationConfig: { 
        responseMimeType: "application/json", 
        responseSchema: schema 
    },
  });

  try {
    const result = await model.generateContent(userPrompt);
    return JSON.parse(result.response.text());
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw createError(500, "All AI providers failed");
  }
}
