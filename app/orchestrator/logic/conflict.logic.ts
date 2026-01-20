// ============================================================
// CONFLICT RESOLVER - Handles conflicts between agents
// ============================================================

import {
  AgentOutput,
  WeatherAgentOutput,
  PestAgentOutput,
  MarketAgentOutput,
} from "../types/orchestrator.types";

interface ConflictResolution {
  hasConflict: boolean;
  resolution?: string;
  suppressedAgent?: string;
  caution?: string;
}

/**
 * Resolves conflicts between agent outputs
 * Returns cautions to append to the primary instruction
 */
export function resolveConflicts(
  primaryAgent: string,
  primaryAction: string,
  agentOutputs: AgentOutput[]
): ConflictResolution {
  const weatherOutput = agentOutputs.find((o) => o.agent === "WEATHER") as WeatherAgentOutput | undefined;
  const pestOutput = agentOutputs.find((o) => o.agent === "PEST") as PestAgentOutput | undefined;
  const marketOutput = agentOutputs.find((o) => o.agent === "MARKET") as MarketAgentOutput | undefined;

  // Conflict 1: Pest SPRAY + Weather DO_NOT_IRRIGATE
  // → Pest wins, append irrigation caution
  if (primaryAgent === "PEST" && primaryAction === "SPRAY") {
    if (weatherOutput?.action === "DO_NOT_IRRIGATE" || weatherOutput?.details?.rainExpected) {
      return {
        hasConflict: true,
        resolution: "Pest spray takes priority over irrigation advice",
        suppressedAgent: "WEATHER",
        caution: "Do not irrigate after spraying. Rain may be expected.",
      };
    }
  }

  // Conflict 2: Market WAIT + Weather ALERT
  // → Weather wins, Market advice delayed
  if (primaryAgent === "WEATHER" && primaryAction === "ALERT") {
    if (marketOutput?.action === "WAIT" || marketOutput?.action === "SELL_NOW") {
      return {
        hasConflict: true,
        resolution: "Weather alert takes priority over market advice",
        suppressedAgent: "MARKET",
        caution: "Market decision postponed due to weather conditions.",
      };
    }
  }

  // Conflict 3: Irrigation + Rain Expected
  // → Rain warning takes priority
  if (primaryAgent === "WEATHER" && primaryAction === "IRRIGATE") {
    if (weatherOutput?.details?.rainExpected) {
      return {
        hasConflict: true,
        resolution: "Rain expected, irrigation may not be needed",
        caution: "Light rain expected. Monitor before irrigating.",
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Gets secondary instructions from non-primary agents
 * Only returns if confidence is HIGH and action is significant
 */
export function getSecondaryInstruction(
  primaryAgent: string,
  agentOutputs: AgentOutput[]
): string | null {
  // Only allow one secondary instruction
  for (const output of agentOutputs) {
    if (output.agent === primaryAgent) continue;
    if (output.action === "NO_ACTION") continue;

    // Only high-confidence secondary actions
    const isHighConfidence = 
      (typeof output.confidence === "number" && output.confidence >= 0.8) ||
      output.confidence === "HIGH";

    if (!isHighConfidence) continue;

    // Generate brief secondary instruction
    if (output.agent === "MARKET" && output.action === "SELL_NOW") {
      return "Consider selling soon - prices are favorable.";
    }
    if (output.agent === "PEST" && output.action === "MONITOR") {
      return "Keep watching for pest signs.";
    }
  }

  return null;
}
