import { handleIncomingMessage } from './orchestrator/dispatcher';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.development') });

async function testScheme() {
    console.log("\n--- TESTING SCHEME AGENT ---");
    
    // Test Case 1: Specific National Scheme
    console.log("\nScenario 1: Asking about PM-Kisan Yojana...");
    const resp1 = await handleIncomingMessage("Tell me about PM Kisan scheme and how can I apply?");
    console.log("Response:", resp1);

    // Test Case 3: Missing Location (Should trigger the "need pincode" flow)
    console.log("\nScenario 3: Generic inquiry without location...");
    const resp3 = await handleIncomingMessage("I want to know about agriculture schemes.");
    console.log("Response:", resp3);

    // Test Case 4: With Pincode (Should give priorities State)
    console.log("\nScenario 4: Inquiry with pincode (444001)...");
    const resp4 = await handleIncomingMessage("I am from 444001, tell me about schemes.");
    console.log("Response:", resp4);
}

testScheme();
