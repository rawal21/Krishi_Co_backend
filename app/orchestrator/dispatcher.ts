import { routerAgent } from "./agent/router.agent";
import { marketAgent } from "../market_agent/agent/index";
import { pestAgent } from "../pest_agent/agent/pest.agent";
import { irrigationAgent } from "../weather_irragation_agent/agent";
import { cropPlanningAgent } from "../crop-planning-agent/agent/cropPlanning.agent";
import { schemeAgent } from "../scheme_agent/agent/scheme.agent";
import { generateWithAI } from "../common/service/llm.generic";
import { SchemaType } from "@google/generative-ai";

/**
 * The Humanizer: Converts raw JSON agent outputs into friendly WhatsApp messages.
 */
async function humanizeResponse(agentName: string, data: any): Promise<string> {
  const systemPrompt = `
    You are a friendly agricultural assistant "Krisi Co".
    You have received raw data from the ${agentName} system.
    Convert this into a helpful, easy-to-read WhatsApp message for an Indian farmer.
    
    Rules:
    - Use emojis 🌾🚜
    - Keep it concise but informative.
    - If it's a warning, make it clear!
    - For SCHEMES: Clearly list eligibility and application steps.
    - Use Hindi/English mix (Hinglish) if appropriate, or simple English.
  `;
  
  const schema = {
    description: "WhatsApp message",
    type: SchemaType.OBJECT,
    properties: {
      message: { type: SchemaType.STRING, description: "The formatted text message" }
    },
    required: ["message"]
  };

  try {
    const result = await generateWithAI(systemPrompt, JSON.stringify(data), schema);
    console.log("[Dispatcher] Humanized result:", result);
    return result.message;
  } catch (error) {
    return JSON.stringify(data, null, 2); // Fallback
  }
}

export const handleIncomingMessage = async (userMessage: string): Promise<string> => {
  try {
    console.log(`[Dispatcher] Received: "${userMessage}"`);

    // 1. Route the message
    const decision = await routerAgent(userMessage);
    console.log(`[Dispatcher] Routed to: ${decision.targetAgent}`);

    // 2. Check for missing parameters
    if (decision.missingParameters && decision.missingParameters.length > 0) {
      if (decision.targetAgent !== "GENERAL") {
         return `I can help with ${decision.targetAgent}, but I need your pincode to find relevant local/state schemes for you.`;
      }
    }

    // 3. Dispatch to Agent
    let result: any;
    switch (decision.targetAgent) {
      case "MARKET":
        result = await marketAgent({
            crop: decision.parameters.crop,
            nearbyMandis: [], 
            state: decision.parameters.state || "Maharashtra", 
            transportCostPerQuintal: 50, 
            storageAvailable: true,
            quantityQuintal: 10,
            harvestWindow: {
              earliestDate: new Date().toISOString().split('T')[0],
              latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        });
        console.log("[Dispatcher] market result" , result);
        break;

      case "PEST":
        result = await pestAgent({
            crop: decision.parameters.crop || "Unknown",
            cropStage: decision.parameters.cropStage || "Growth",
            symptomsText: decision.parameters.symptomsText || userMessage,
            pincode: decision.parameters.pincode
        });
        console.log("[Dispatcher] Pest result:", result);
        break;

      case "WEATHER":
        // irrigationAgent handles weather logic
        result = await irrigationAgent({
            pincode: decision.parameters.pincode || 452001,
            cropType: decision.parameters.crop || "wheat",
            cropStage: decision.parameters.cropStage || "growth",
            last_irrigation_days_ago: decision.parameters.last_irrigation_days_ago || 5
        });
        console.log("[Dispatcher] Weather result:", result);
        break;

      case "CROP_PLANNING":
        result = await cropPlanningAgent({
            landAcres: decision.parameters.landAcres || 2,
            location: { 
                villageCode: decision.parameters.pincode ? String(decision.parameters.pincode) : "452001",
                districtCode: "999", // Mock
                stateCode: "27"     // Mock (Maharashtra)
            },
            irrigation: decision.parameters.irrigation || false,
            season: "Rabi",
            budgetLevel: "medium" // Changed from budget: 50000 to budgetLevel
        });
        console.log("[Dispatcher] Crop Planning result:", result);
        break;

      case "SCHEME":
        result = await schemeAgent(userMessage, decision.parameters.pincode);
        console.log("[Dispatcher] Scheme result:", result);
        break;

      case "GENERAL":
        return "Namaste! I am Krisi Co, your AI Farm Assistant. I can help with Market Prices 💰, Pest Control 🐛, Weather 🌦️, Crop Planning 🌱, and Government Schemes 🏛️. What allows me to help you today?";

      default:
        return "I am sorry, I did not understand that. Could you ask about market prices, weather, schemes, or crops?";
    }

    // 4. Humanize the output
    return await humanizeResponse(decision.targetAgent, result);

  } catch (error: any) {
    console.error("Dispatcher Error:", error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
};

