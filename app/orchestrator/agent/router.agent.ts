import { generateWithAI } from "../../common/service/llm.generic";
import { SchemaType } from "@google/generative-ai";

export interface RouterOutput {
  targetAgent: "MARKET" | "PEST" | "WEATHER" | "CROP_PLANNING" | "GENERAL" | "UNKNOWN";
  parameters: any;
  missingParameters: string[];
  reasoning: string;
}

const ROUTER_SYSTEM_PROMPT = `
You are the central router for 'Krisi Co', an intelligent agricultural assistant.
Your goal is to analyze the user's message and decide which specific expert agent should handle the request.

Available Agents:
1. MARKET:
   - Use for: Crop prices, mandi rates, selling advice, market trends.
   - Required Parameters: 'crop' (e.g., onion, wheat), 'pincode' (optional but preferred), 'state' (optional).

2. PEST:
   - Use for: Plant diseases, bug attacks, symptoms, pest control advice.
   - Required Parameters: 'crop', 'symptomsText' (description of the problem). 
   - Note: If user sends an image description, extract it.

3. WEATHER:
   - Use for: Rain forecast, irrigation advice, temperature, humidty.
   - Required Parameters: 'pincode', 'cropType' (optional), 'cropStage' (optional), 'last_irrigation_days_ago' (optional).

4. CROP_PLANNING:
   - Use for: Deciding what to plant, soil suitability, seasonal planning.
   - Required Parameters: 'landAcres', 'pincode' (for soil/weather lookup), 'irrigation' (boolean).

5. GENERAL:
   - Use for: Greetings, generic questions, or when the user doesn't fit a specific category.

Instructions:
- Extract all relevant parameters from the user's text.
- If a required parameter is missing for the chosen agent, list it in 'missingParameters'.
- If the user provides a location name instead of a pincode, try to infer it or keep it as 'locationName'.
- Default 'pincode' to '452001' (Indore) ONLY if the user asks for exemplary data or purely testing, otherwise leave null.

Output JSON only.
`;

const ROUTER_SCHEMA = {
  description: "Router decision output",
  type: SchemaType.OBJECT,
  properties: {
    targetAgent: {
      type: SchemaType.STRING,
      enum: ["MARKET", "PEST", "WEATHER", "CROP_PLANNING", "GENERAL", "UNKNOWN"],
    },
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        crop: { type: SchemaType.STRING },
        pincode: { type: SchemaType.NUMBER },
        state: { type: SchemaType.STRING },
        symptomsText: { type: SchemaType.STRING },
        landAcres: { type: SchemaType.NUMBER },
        irrigation: { type: SchemaType.BOOLEAN },
        locationName: { type: SchemaType.STRING },
        cropStage: { type: SchemaType.STRING },
        last_irrigation_days_ago: { type: SchemaType.NUMBER }
      },
    },
    missingParameters: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["targetAgent", "parameters", "missingParameters"],
};

export const routerAgent = async (userMessage: string): Promise<RouterOutput> => {
  return await generateWithAI(ROUTER_SYSTEM_PROMPT, userMessage, ROUTER_SCHEMA);
};
