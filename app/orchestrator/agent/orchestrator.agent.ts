// ============================================================
// ORCHESTRATOR AGENT - The Brain of Farm Copilot
// ============================================================

import {
  OrchestratorInput,
  OrchestratorOutput,
  OrchestratorMessageOutput,
  OrchestratorSilentOutput,
} from "../types/orchestrator.types";

import { resolvePriority, shouldStaySilent } from "../logic/priority.logic";
import { resolveConflicts, getSecondaryInstruction } from "../logic/conflict.logic";
import { checkThrottle, determineMessageType } from "../logic/throttle.logic";
import { generateInstructions, generateExplanation } from "../logic/instruction.logic";

/**
 * ORCHESTRATOR AGENT
 * 
 * Role: Decide which agent's advice matters NOW, resolve conflicts,
 * and produce ONE clear, calm instruction for the farmer.
 * 
 * The farmer must never feel overwhelmed.
 */
export function orchestratorAgent(input: OrchestratorInput): OrchestratorOutput {
  const { farmerContext, agentOutputs } = input;

  // ============================================================
  // STEP 1: Check if we should stay silent
  // ============================================================
  if (shouldStaySilent(agentOutputs)) {
    return createSilentOutput("No high-confidence action required");
  }

  // ============================================================
  // STEP 2: Resolve priority - which agent matters NOW?
  // ============================================================
  const priorityResult = resolvePriority(agentOutputs);
  
  if (!priorityResult) {
    return createSilentOutput("No actionable advice from any agent");
  }

  const { primaryAgent, primaryAction, agentOutput } = priorityResult;

  // ============================================================
  // STEP 3: Determine message type based on urgency
  // ============================================================
  const messageType = determineMessageType(primaryAgent, primaryAction);

  // ============================================================
  // STEP 4: Check throttling (unless emergency)
  // ============================================================
  const throttleResult = checkThrottle(farmerContext, primaryAction, messageType);
  
  if (!throttleResult.shouldSend) {
    return createSilentOutput(throttleResult.reason || "Throttled");
  }

  // ============================================================
  // STEP 5: Resolve conflicts between agents
  // ============================================================
  const conflictResolution = resolveConflicts(primaryAgent, primaryAction, agentOutputs);

  // ============================================================
  // STEP 6: Generate instructions
  // ============================================================
  let instructions = generateInstructions(agentOutput);

  // Add conflict caution if applicable (max 2 instructions rule)
  if (conflictResolution.caution && instructions.length < 2) {
    instructions.push(conflictResolution.caution);
  }

  // Check for secondary instruction (respect max 2 rule)
  if (instructions.length < 2) {
    const secondary = getSecondaryInstruction(primaryAgent, agentOutputs);
    if (secondary) {
      instructions.push(secondary);
    }
  }

  // Enforce max 2 instructions
  instructions = instructions.slice(0, 2);

  // ============================================================
  // STEP 7: Generate explanation
  // ============================================================
  const explanation = generateExplanation(agentOutput);

  // ============================================================
  // STEP 8: Determine follow-up
  // ============================================================
  const followUp = determineFollowUp(primaryAgent, primaryAction);

  // ============================================================
  // FINAL: Return orchestrated output
  // ============================================================
  return createMessageOutput(
    messageType,
    primaryAgent,
    instructions,
    explanation,
    followUp
  );
}

// --- Helper Functions ---

function createSilentOutput(reason: string): OrchestratorSilentOutput {
  return {
    sendMessage: false,
    reason,
  };
}

function createMessageOutput(
  messageType: "URGENT" | "NORMAL" | "ADVISORY",
  primaryAgent: string,
  instructions: string[],
  explanation: string,
  followUp?: { afterDays: number; condition: string }
): OrchestratorMessageOutput {
  return {
    sendMessage: true,
    messageType,
    primaryAgent,
    instructions,
    explanation,
    followUp,
  };
}

function determineFollowUp(
  agent: string,
  action: string
): { afterDays: number; condition: string } | undefined {
  // Pest spray: follow up in 3 days
  if (agent === "PEST" && action === "SPRAY") {
    return { afterDays: 3, condition: "Check if pest infestation reduced" };
  }

  // Market wait: follow up after suggested days
  if (agent === "MARKET" && action === "WAIT") {
    return { afterDays: 5, condition: "Check updated market prices" };
  }

  // Weather alert: follow up next day
  if (agent === "WEATHER" && action === "ALERT") {
    return { afterDays: 1, condition: "Check weather update" };
  }

  // Irrigation: follow up in 2 days
  if (agent === "WEATHER" && action === "IRRIGATE") {
    return { afterDays: 2, condition: "Check soil moisture" };
  }

  return undefined;
}
