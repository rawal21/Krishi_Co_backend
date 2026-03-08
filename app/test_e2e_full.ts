import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.development") });

import { irrigationAgent } from "./weather_irragation_agent/agent";
import { pestAgent } from "./pest_agent/agent/pest.agent";
import { marketAgent } from "./market_agent/agent/index";
import { orchestratorAgent } from "./orchestrator/agent/orchestrator.agent";
import { 
    OrchestratorInput, 
    AgentOutput, 
    WeatherAgentOutput, // Note: Import specific types to cast
    PestAgentOutput,
    MarketAgentOutput
} from "./orchestrator/types/orchestrator.types";

// Helper to normalize Irrigation Output
function normalizeWeatherOutput(raw: any): WeatherAgentOutput {
    return {
        agent: "WEATHER",
        confidence: raw.confidence as any,
        action: raw.decision as any, // "IRRIGATE" | "DO_NOT_IRRIGATE" matches
        reason: raw.reason,
        details: {
            // parsing simplified details from summary string if needed, or just partial
            rainExpected: raw.weather_summary?.includes("rain")
        }
    };
}

// Helper to normalize Pest Output
function normalizePestOutput(raw: any): PestAgentOutput {
    return {
        agent: "PEST",
        confidence: raw.confidence,
        action: raw.action as any,
        reason: raw.reason,
        pestDetected: raw.pestDetected,
        recommendation: raw.recommendation
    };
}

// Helper to normalize Market Output
function normalizeMarketOutput(raw: any): MarketAgentOutput {
    return {
        agent: "MARKET",
        confidence: raw.confidence as any,
        action: raw.recommendation as any, // "SELL_NOW" | "WAIT" matches
        reason: raw.reason,
        suggestedMandi: raw.suggestedMandi,
        suggestedWaitDays: raw.suggestedWaitDays
    };
}

const runEndToEndTest = async () => {
    console.log("\n========================================");
    console.log("   FARM COPILOT - END TO END TEST");
    console.log("========================================\n");

    const FARMER_PINCODE = 444001; // Akola, Maharashtra (Number as per type definition)
    const CROP = "Soyabean";

    // 1. Irrigation Agent
    console.log(`[1/4] Running Irrigation Agent for ${FARMER_PINCODE}...`);
    let irrigationResult;
    try {
        irrigationResult = await irrigationAgent({
            pincode: FARMER_PINCODE,
            cropType: CROP,
            cropStage: "flowering",
            // soilType: "black", // Removed as not in agentDto
            // plantingDate: "2024-06-01",
            last_irrigation_days_ago: 5
        });
        console.log("   -> Decision:", irrigationResult.decision);
    } catch (e: any) {
        console.error("   -> Error:", e.message);
        irrigationResult = { decision: "NO_ACTION", confidence: "LOW", reason: "Error" };
    }

    // 2. Pest Agent (Simulated Image/Text)
    console.log(`\n[2/4] Running Pest Agent (Simulated)...`);
    let pestResult;
    try {
        pestResult = await pestAgent({
            image: undefined, // No image for this test
            symptomsText: "Leaves are yellowing and have small holes",
            crop: CROP,
            cropStage: "Flowering",
            pincode: FARMER_PINCODE
        });
        console.log("   -> Detected:", pestResult.pestDetected || "None");
        console.log("   -> Action:", pestResult.action);
    } catch (e: any) {
        console.error("   -> Error:", e.message);
        pestResult = { action: "NO_ACTION", confidence: 0, reason: "Error" };
    }

    // 3. Market Agent
    console.log(`\n[3/4] Running Market Agent for ${CROP}...`);
    let marketResult;
    try {
        marketResult = await marketAgent({
            crop: CROP.toUpperCase(), // API expects uppercase often
            nearbyMandis: ["Akola", "Nagpur", "Amravati"],
            state: "Maharashtra",
            transportCostPerQuintal: 50,
            storageAvailable: true,
            quantityQuintal: 10,
            harvestWindow: { earliestDate: "2024-10-01", latestDate: "2024-10-15" }
        });
        console.log("   -> Recommendation:", marketResult.recommendation);
    } catch (e: any) {
        console.error("   -> Error:", e.message);
        marketResult = { recommendation: "NO_ACTION", confidence: "LOW", reason: "Error" };
    }

    // 4. Orchestrator
    console.log(`\n[4/4] ORCHESTRATING...`);
    
    const agentOutputs: AgentOutput[] = [
        normalizeWeatherOutput(irrigationResult),
        normalizePestOutput(pestResult),
        normalizeMarketOutput(marketResult)
    ];

    const orchestratorInput: OrchestratorInput = {
        farmerContext: {
            farmerId: "test-farmer",
            season: "Kharif",
            crop: CROP,
            cropStage: "Flowering",
            lastMessageSentAt: null, 
            lastActions: { irrigation: null, spray: null, selling: null },
            preferences: { language: "en", maxMessagesPerWeek: 7 }
        },
        agentOutputs
    };

    const finalDecision = orchestratorAgent(orchestratorInput);

    console.log("\n========================================");
    console.log("   FINAL FARMER SMS / MESSAGE");
    console.log("========================================");
    
    if (finalDecision.sendMessage) {
        console.log(`TYPE: [${finalDecision.messageType}]`);
        console.log("INSTRUCTIONS:");
        finalDecision.instructions.forEach(i => console.log(`- ${i}`));
        console.log("\nEXPLANATION:", finalDecision.explanation);
        if (finalDecision.followUp) {
            console.log("FOLLOW UP:", `In ${finalDecision.followUp.afterDays} days`);
        }
    } else {
        console.log("DECISION: STAY SILENT");
        console.log("REASON:", finalDecision.reason);
    }
    console.log("========================================\n");
};

runEndToEndTest();
