// ============================================================
// PRIORITY RESOLVER - Determines which agent action matters NOW
// ============================================================

import {
  AgentOutput,
  PRIORITY_LADDER,
  ConfidenceLevel,
} from "../types/orchestrator.types";

interface PriorityResult {
  primaryAgent: string;
  primaryAction: string;
  priority: number;
  agentOutput: AgentOutput;
}

/**
 * Finds the highest priority action from all agent outputs
 * Uses the PRIORITY_LADDER which is ordered by urgency
 */
export function resolvePriority(agentOutputs: AgentOutput[]): PriorityResult | null {
  let bestMatch: PriorityResult | null = null;

  for (const output of agentOutputs) {
    // Skip NO_ACTION outputs
    if (output.action === "NO_ACTION") continue;

    // Find this agent+action in the priority ladder
    const ladderEntry = PRIORITY_LADDER.find(
      (entry) => entry.agent === output.agent && entry.action === output.action
    );

    if (ladderEntry) {
      // Lower priority number = higher urgency
      if (!bestMatch || ladderEntry.priority < bestMatch.priority) {
        bestMatch = {
          primaryAgent: output.agent,
          primaryAction: output.action,
          priority: ladderEntry.priority,
          agentOutput: output,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Checks if all agents have low confidence or NO_ACTION
 */
export function shouldStaySilent(agentOutputs: AgentOutput[]): boolean {
  const hasAction = agentOutputs.some((output) => output.action !== "NO_ACTION");
  if (!hasAction) return true;

  // Check if all non-NO_ACTION outputs have low confidence
  const actionableOutputs = agentOutputs.filter((o) => o.action !== "NO_ACTION");
  const allLowConfidence = actionableOutputs.every((output) => {
    if (typeof output.confidence === "number") {
      return output.confidence < 0.5;
    }
    return output.confidence === "LOW";
  });

  return allLowConfidence;
}

/**
 * Converts numeric confidence to level
 */
export function getConfidenceLevel(confidence: number | ConfidenceLevel): ConfidenceLevel {
  if (typeof confidence === "string") return confidence;
  if (confidence >= 0.7) return "HIGH";
  if (confidence >= 0.4) return "MEDIUM";
  return "LOW";
}
