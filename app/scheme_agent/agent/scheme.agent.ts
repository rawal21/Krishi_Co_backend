import { generateWithAI } from "../../common/service/llm.generic";
import { SchemaType } from "@google/generative-ai";
import { SchemeAgentOutput } from "../types/scheme.types";

const SCHEME_SYSTEM_PROMPT = `
You are the Government Scheme Specialist for 'Krisi Co'.
Your goal is to provide accurate, helpful, and up-to-date information about government agricultural schemes in India.

Guidelines:
1. Identify if the user is asking about a specific scheme (e.g., PM-Kisan) or looking for general help.
2. Provide details for both Central (National) and State-specific schemes.
3. For each scheme, clearly list:
   - Eligibility (Who can apply?)
   - Benefits (What do they get?)
   - How to apply (Step-by-step)
   - Documents needed.
4. If you don't find a specific match, recommend generic relevant schemes.
5. Always include a disclaimer that the user should verify details on the official website.
6. Use simple, helpful language.

Output JSON only.
`;

const SCHEME_SCHEMA = {
  description: "Government scheme information output",
  type: SchemaType.OBJECT,
  properties: {
    schemes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          provider: { type: SchemaType.STRING, enum: ["CENTRAL", "STATE"] },
          briefDescription: { type: SchemaType.STRING },
          eligibility: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          benefits: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          applicationSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          documentsRequired: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          officialWebsite: { type: SchemaType.STRING }
        },
        required: ["name", "provider", "briefDescription", "eligibility", "benefits", "applicationSteps", "documentsRequired"]
      }
    },
    recommendation: { type: SchemaType.STRING },
    disclaimer: { type: SchemaType.STRING }
  },
  required: ["schemes", "disclaimer"]
};

export const schemeAgent = async (userMessage: string, pincode?: number): Promise<SchemeAgentOutput> => {
  const finalPrompt = pincode 
    ? `${userMessage}\n\n[CONTEXT] The farmer is located at pincode: ${pincode}. PRIORITIZE State-level schemes for this region followed by National schemes.`
    : userMessage;

  return await generateWithAI(SCHEME_SYSTEM_PROMPT, finalPrompt, SCHEME_SCHEMA);
};
