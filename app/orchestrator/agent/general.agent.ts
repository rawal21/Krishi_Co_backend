import { generateWithAI } from "../../common/service/llm.generic";
import { SchemaType } from "@google/generative-ai";
import { UserProfile } from "../../common/service/profile.service";

export const generalAgent = async (userMessage: string, profile?: UserProfile): Promise<{ message: string }> => {
  const contextText = profile && (profile.name || profile.location)
    ? `\nUser Context: Name is ${profile.name || "Unknown"}, Location is ${profile.location || "Unknown"}. Acknowledge this context if they ask who they are.`
    : "\nUser context is unknown. If the user hasn't introduced themselves, you can briefly ask for their name or location to personalze future interactions.";

  const GENERAL_SYSTEM_PROMPT = `
You are 'Krisi Co', an intelligent and friendly agricultural assistant.
Your goal is to handle greetings, farewells, and general conversation.
${contextText}

Guidelines:
1. Respond in the SAME LANGUAGE as the user (e.g., if they speak Hindi, respond in Hindi).
2. Be helpful, concise, and polite.
3. If the user asks for a language change, acknowledge it and switch to that language.
4. If they ask who you are, mention you are Krisi Co, a farm assistant helps with Prices, Pests, Weather, and Schemes.

Output JSON only.
`;

  const GENERAL_SCHEMA = {
    description: "General conversation output",
    type: SchemaType.OBJECT,
    properties: {
      message: { type: SchemaType.STRING, description: "The response message to the user" }
    },
    required: ["message"]
  };

  return await generateWithAI(GENERAL_SYSTEM_PROMPT, userMessage, GENERAL_SCHEMA);
};
