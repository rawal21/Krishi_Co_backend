import { routerAgent } from "./agent/router.agent";
import { marketAgent } from "../market_agent/agent/index";
import { pestAgent } from "../pest_agent/agent/pest.agent";
import { irrigationAgent } from "../weather_irragation_agent/agent";
import { cropPlanningAgent } from "../crop-planning-agent/agent/cropPlanning.agent";
import { schemeAgent } from "../scheme_agent/agent/scheme.agent";
import { generalAgent } from "./agent/general.agent";
import { generateWithAI } from "../common/service/llm.generic";
import { SchemaType } from "@google/generative-ai";
import logger from "../common/helper/logger.helper";
import { getProfile, updateProfile, UserProfile } from "../common/service/profile.service";

/**
 * The Humanizer: Converts raw JSON agent outputs into friendly WhatsApp messages.
 */
async function humanizeResponse(agentName: string, data: any, profile: UserProfile): Promise<string> {
  const contextText = profile.name || profile.locationName 
    ? `\nUser Context: Name is ${profile.name || "Unknown"}, Location is ${profile.locationName || "Unknown"}. Use this to personalize the message.`
    : "\nUser context is unknown. If the user hasn't introduced themselves, you can briefly mention that you'd love to know their name or location to help them better.";

  const systemPrompt = `
    You are a friendly agricultural assistant "Krisi Co".
    You have received raw data from the ${agentName} system.
    Convert this into a helpful, easy-to-read WhatsApp message for an Indian farmer.
    ${contextText}
    
    Rules:
    - Use emojis 🌾🚜
    - Keep it concise but informative.
    - If it's a warning, make it clear!
    - If the user asks for a language change, acknowledge it and switch to that language.
    - For SCHEMES: Clearly list eligibility and application steps.
    - Use Hindi/English mix (Hinglish) if appropriate, or simple English.
    - Always reply in the same language as the user.
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
    logger.debug(`Humanized result: ${JSON.stringify(result)}`);
    return result.message;
  } catch (error) {
    return JSON.stringify(data, null, 2); // Fallback
  }
}

export const handleIncomingMessage = async (userMessage: string, userId: string = "default"): Promise<string> => {
  try {
    logger.info(`Received: "${userMessage}" from ${userId}`);
    
    // --- Web Application Handshake ---
    if (userMessage.startsWith("LINK_WEB_ACCOUNT_")) {
      const webUserId = userMessage.replace("LINK_WEB_ACCOUNT_", "").trim();
     logger.warn("info",webUserId)
      const webProfile = getProfile(webUserId);
      
      if (webProfile.name) {
        updateProfile(userId, { 
          name: webProfile.name, 
          location: webProfile.location, 
          locationName: webProfile.locationName,
          pincode: webProfile.pincode 
        });
        logger.info(`Successfully linked web account for ${webProfile.name} to WhatsApp number ${userId}`);
        return `Namaste ${webProfile.name}! 🎉 Your web account has been successfully linked. I see you are from ${webProfile.locationName || "your saved location"}. How can I help you with your farming today?`;
      } else {
        logger.warn(`Failed to link account, profile not found for ID: ${webUserId}`);
        return "I tried to link your web dashboard, but your profile seems to be empty. Please complete the setup on the website first.";
      }
    }
    // --- End Handshake ---

    const profile = getProfile(userId);

    // 1. Route the message
    const decision = await routerAgent(userMessage);
    logger.info(`Routed to: ${decision.targetAgent}`);

    // 2. Check for missing parameters against profile
    if (decision.missingParameters && decision.missingParameters.length > 0) {
      // Try to backfill from profile
      const stillMissing: string[] = [];
      for (const param of decision.missingParameters) {
        if (param === 'pincode' && profile.pincode) {
           decision.parameters.pincode = profile.pincode;
        } else if ((param === 'state' || param === 'location') && (profile.locationName || profile.location)) {
           decision.parameters.state = profile.locationName || "Your Region";
        } else {
           stillMissing.push(param);
        }
      }

      if (stillMissing.length > 0 && decision.targetAgent !== "GENERAL") {
         const msg = `I can help with your ${decision.targetAgent} request, but I need your ${stillMissing.join(', ')} (e.g., 444001) to provide accurate local information.`;
         logger.warn(`Missing parameters: ${stillMissing.join(', ')}`);
         return msg;
      }
    }

    // 3. Dispatch to Agent
    let result: any;
    switch (decision.targetAgent) {
      case "MARKET":
        result = await marketAgent({
            crop: decision.parameters.crop,
            nearbyMandis: [], 
            state: decision.parameters.state || profile.locationName || "Maharashtra", 
            transportCostPerQuintal: 50, 
            storageAvailable: true,
            quantityQuintal: 10,
            harvestWindow: {
              earliestDate: new Date().toISOString().split('T')[0],
              latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        });
        logger.info(`Market Agent call complete. State used: ${decision.parameters.state || profile.locationName || 'Maharashtra'}`);
        break;

      case "PEST":
        result = await pestAgent({
            crop: decision.parameters.crop || "Unknown",
            cropStage: decision.parameters.cropStage || "Growth",
            symptomsText: decision.parameters.symptomsText || userMessage,
            pincode: decision.parameters.pincode
        });
        logger.info("Pest Agent call complete.");
        break;

      case "WEATHER":
        // irrigationAgent handles weather logic
        result = await irrigationAgent({
            pincode: decision.parameters.pincode || 452001,
            cropType: decision.parameters.crop || "wheat",
            cropStage: decision.parameters.cropStage || "growth",
            last_irrigation_days_ago: decision.parameters.last_irrigation_days_ago || 5
        });
        logger.info("Weather/Irrigation Agent call complete.");
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
        logger.info("Crop Planning Agent call complete.");
        break;

      case "SCHEME":
        result = await schemeAgent(userMessage, decision.parameters.pincode);
        logger.info(`Scheme Agent call complete.`);
        break;

      case "GENERAL":
        result = await generalAgent(userMessage, profile);
        logger.info(`General Agent Result: ${JSON.stringify(result)}`);
        
        // Update profile if AI detected new info (simple heuristic for now)
        // In a more complex app, the router/general agent would return structured updates
        if (userMessage.toLowerCase().includes("i am") || userMessage.toLowerCase().includes("mera naam")) {
            const nameMatch = userMessage.match(/(?:i am|my name is|mera naam|main hoon)\s+([a-zA-Z]+)/i);
            if (nameMatch) updateProfile(userId, { name: nameMatch[1] });
        }
        if (userMessage.toLowerCase().includes("from") || userMessage.toLowerCase().includes("rehne wala")) {
             const locMatch = userMessage.match(/(?:from|in|rehne wala|rajasthan|maharashtra)\s+([a-zA-Z]+)/i);
             if (locMatch) updateProfile(userId, { locationName: locMatch[1] });
        }
        break;

      default:
        logger.warn(`UNKNOWN intent for message: "${userMessage}"`);
        return "I am sorry, I did not understand that. Could you ask about market prices, weather, schemes, or crops?";
    }

    // 4. Humanize the output
    if(decision.targetAgent=== "GENERAL"){
      logger.info(`Final Response (General): ${result.message}`);
      return result.message;
    }
    else
    {
      const finalResponse = await humanizeResponse(decision.targetAgent, result, profile);
      logger.info(`Final Response : ${JSON.stringify(finalResponse)}`);
      return finalResponse;
    }

  } catch (error: any) {
    logger.error(`Dispatcher Error: ${error.message}`);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
};

