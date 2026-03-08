
import { handleIncomingMessage } from './app/orchestrator/dispatcher';
require('dotenv').config({ path: '.env.development' });

async function test() {
  console.log("--- TEST 1: General Greeting ---");
  console.log(await handleIncomingMessage("Hi, I am a farmer."));

  console.log("\n--- TEST 2: Market Query ---");
  console.log(await handleIncomingMessage("What is the price of Onions in Nasik?"));

  console.log("\n--- TEST 3: Pest Query ---");
  console.log(await handleIncomingMessage("My tomatoes represent yellow spots on leaves."));
}

test();
