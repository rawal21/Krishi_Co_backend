// ============================================================
// INSTRUCTION GENERATOR - Creates farmer-safe messages
// ============================================================

import {
  AgentOutput,
  PestAgentOutput,
  WeatherAgentOutput,
  MarketAgentOutput,
} from "../types/orchestrator.types";

/**
 * Generates clear, actionable instructions for the farmer
 * Based on the primary agent action
 */
export function generateInstructions(agentOutput: AgentOutput): string[] {
  const instructions: string[] = [];

  switch (agentOutput.agent) {
    case "PEST":
      return generatePestInstructions(agentOutput as PestAgentOutput);
    case "WEATHER":
      return generateWeatherInstructions(agentOutput as WeatherAgentOutput);
    case "MARKET":
      return generateMarketInstructions(agentOutput as MarketAgentOutput);
    default:
      return ["Continue normal farm activities."];
  }
}

function generatePestInstructions(output: PestAgentOutput): string[] {
  const instructions: string[] = [];

  if (output.action === "SPRAY" && output.recommendation) {
    instructions.push(
      `Spray ${output.recommendation.molecule} at ${output.recommendation.dosePerPump} per pump.`
    );
    if (output.recommendation.sprayWindow) {
      instructions.push(`Best time: ${output.recommendation.sprayWindow}`);
    }
    if (output.pestDetected) {
      instructions.push(`Target: ${output.pestDetected}`);
    }
  } else if (output.action === "MONITOR") {
    instructions.push("Check your crop regularly for pest signs.");
    if (output.pestDetected) {
      instructions.push(`Watch for: ${output.pestDetected}`);
    }
  }

  return instructions.length > 0 ? instructions : ["No pest action needed."];
}

function generateWeatherInstructions(output: WeatherAgentOutput): string[] {
  const instructions: string[] = [];

  if (output.action === "IRRIGATE") {
    instructions.push("Water your field today.");
    if (output.details?.temperature) {
      instructions.push(`Current temperature: ${output.details.temperature}°C`);
    }
  } else if (output.action === "DO_NOT_IRRIGATE") {
    instructions.push("Do not irrigate today.");
    if (output.details?.rainExpected) {
      instructions.push("Rain expected - save water.");
    }
  } else if (output.action === "ALERT") {
    instructions.push("Weather alert! Take precautions.");
    instructions.push("Protect your crop from extreme conditions.");
  }

  return instructions.length > 0 ? instructions : ["Weather is normal."];
}

function generateMarketInstructions(output: MarketAgentOutput): string[] {
  const instructions: string[] = [];

  if (output.action === "SELL_NOW") {
    instructions.push("Good time to sell your produce.");
    if (output.suggestedMandi) {
      instructions.push(`Best mandi: ${output.suggestedMandi}`);
    }
  } else if (output.action === "SELL_IN_OTHER_MANDI") {
    instructions.push(`Consider selling at ${output.suggestedMandi || "nearby mandi"} for better price.`);
  } else if (output.action === "WAIT") {
    if (output.suggestedWaitDays) {
      instructions.push(`Wait ${output.suggestedWaitDays} days - prices may improve.`);
    } else {
      instructions.push("Hold your produce for now.");
    }
  }

  return instructions.length > 0 ? instructions : ["No market action needed."];
}

/**
 * Generates simple explanation for the farmer
 */
export function generateExplanation(agentOutput: AgentOutput): string {
  return agentOutput.reason || "Based on current conditions.";
}
