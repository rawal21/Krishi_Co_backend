import axios from "axios";
import { OrchestratorInput, AgentOutput } from "./orchestrator/types/orchestrator.types";

const SERVER_URL = "http://localhost:5050"; // Adjust port if needed

const testOrchestrator = async () => {
    console.log("--- START ORCHESTRATOR TEST ---");

    // Scenario 1: Pest EMERGENCY (Should win)
    const scenario1: OrchestratorInput = {
        farmerContext: {
            farmerId: "f1",
            season: "Kharif",
            crop: "Soyabean",
            cropStage: "Flowering",
            lastMessageSentAt: null, // Never sent
            lastActions: { irrigation: null, spray: null, selling: null },
            preferences: { language: "en", maxMessagesPerWeek: 3 }
        },
        agentOutputs: [
            {
                agent: "PEST",
                confidence: 0.9,
                action: "SPRAY",
                recommendation: { molecule: "Chlorantraniliprole", dosePerPump: "10ml" },
                reason: "Stem borer deteced",
                pestDetected: "Stem Borer"
            },
            {
                agent: "WEATHER",
                confidence: "HIGH",
                action: "DO_NOT_IRRIGATE",
                reason: "Rain expected"
            }
        ]
    };

    console.log("\nScenario 1: Pest Spray vs Weather Alert");
    await callOrchestrator(scenario1);

    // Scenario 2: Market Wait vs Weather Irrigation (Weather Irrigation priority is higher than Market Wait)
    const scenario2: OrchestratorInput = {
        farmerContext: { ...scenario1.farmerContext },
        agentOutputs: [
             {
                agent: "MARKET",
                confidence: "HIGH",
                action: "WAIT",
                suggestedWaitDays: 5,
                reason: "Prices rising"
            },
            {
                agent: "WEATHER",
                confidence: "HIGH",
                action: "IRRIGATE",
                details: { temperature: 35 },
                reason: "High temp, no rain"
            }
        ]
    };
    console.log("\nScenario 2: Market Wait vs Weather Irrigate");
    await callOrchestrator(scenario2);

    // Scenario 3: Throttling Check (Sending same urgent message immediately after)
    console.log("\nScenario 3: Throttling Check (Should allow URGENT/SPRAY even if sent recently)");
    // Simulate message sent just now
    const throttledContext = { ...scenario1.farmerContext, lastMessageSentAt: new Date().toISOString() };
    const scenario3: OrchestratorInput = {
        farmerContext: throttledContext,
        agentOutputs: [
             {
                agent: "PEST",
                confidence: 0.9,
                action: "SPRAY",
                recommendation: { molecule: "Chlorantraniliprole", dosePerPump: "10ml" },
                reason: "Stem borer deteced",
                pestDetected: "Stem Borer"
            }
        ]
    };
     await callOrchestrator(scenario3);
     
    // Scenario 4: Throttling Check (Should BLOCK normal advice if sent recently)
    console.log("\nScenario 4: Throttling Check (Should BLOCK normal advice)");
     const scenario4: OrchestratorInput = {
        farmerContext: throttledContext,
        agentOutputs: [
             {
                agent: "WEATHER",
                confidence: "HIGH",
                action: "IRRIGATE",
                reason: "Dry soil"
            }
        ]
    };
     await callOrchestrator(scenario4);

};

async function callOrchestrator(input: OrchestratorInput) {
    try {
        const response = await axios.post(`${SERVER_URL}/orchestrator`, input);
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Data:", error.response.data);
        }
    }
}

testOrchestrator();
