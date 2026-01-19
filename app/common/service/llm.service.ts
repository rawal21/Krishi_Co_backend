import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import createError from "http-errors";

export const analyzePestWithAI = async (
  prompt: string,
  imageData?: { b64: string; mime: string }
) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw createError(500, "GEMINI_API_KEY is not set in environment variables");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Define structured output schema to ensure AI returns valid JSON
  const schema: any = {
    description: "Pest diagnosis output",
    type: SchemaType.OBJECT,
    properties: {
      pestDetected: { type: SchemaType.STRING, description: "Name of the pest" },
      confidence: { type: SchemaType.NUMBER, description: "Confidence score 0-1" },
      action: { type: SchemaType.STRING, description: "SPRAY, MONITOR, or NO_ACTION" },
      reason: { type: SchemaType.STRING, description: "Detailed reason for diagnosis" },
      recommendation: {
        type: SchemaType.OBJECT,
        properties: {
          molecule: { type: SchemaType.STRING },
          dosePerPump: { type: SchemaType.STRING },
          sprayWindow: { type: SchemaType.STRING }
        }
      },
      warning: { type: SchemaType.STRING }
    },
    required: ["pestDetected", "confidence", "action", "reason"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const contentParts: any[] = [prompt];
  
  if (imageData) {
    contentParts.push({
      inlineData: {
        data: imageData.b64,
        mimeType: imageData.mime
      }
    });
  }

  const result = await model.generateContent(contentParts);
  const response = result.response;
  return JSON.parse(response.text());
};
