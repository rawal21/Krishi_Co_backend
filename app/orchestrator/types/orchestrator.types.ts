// ============================================================
// ORCHESTRATOR TYPES - Farm Copilot Brain
// ============================================================

// --- Farmer Context ---
export interface FarmerContext {
  farmerId: string;
  season: "Kharif" | "Rabi";
  crop: string;
  cropStage: string;
  lastMessageSentAt: string | null;  // ISO timestamp
  lastActions: {
    irrigation: string | null;
    spray: string | null;
    selling: string | null;
  };
  preferences: {
    language: "mr" | "hi" | "en";
    maxMessagesPerWeek: number;
  };
}

// --- Agent Output Types ---
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface WeatherAgentOutput {
  agent: "WEATHER";
  confidence: ConfidenceLevel;
  action: "IRRIGATE" | "DO_NOT_IRRIGATE" | "ALERT" | "NO_ACTION";
  reason: string;
  details?: {
    rainExpected?: boolean;
    temperature?: number;
    humidity?: number;
  };
}

export interface PestAgentOutput {
  agent: "PEST";
  confidence: number;  // 0 to 1
  action: "SPRAY" | "MONITOR" | "NO_ACTION";
  recommendation?: {
    molecule: string;
    dosePerPump: string;
    sprayWindow?: string;
  };
  reason: string;
  pestDetected?: string | null;
}

export interface MarketAgentOutput {
  agent: "MARKET";
  confidence: ConfidenceLevel;
  action: "SELL_NOW" | "WAIT" | "SELL_IN_OTHER_MANDI" | "NO_ACTION";
  suggestedMandi?: string | null;
  suggestedWaitDays?: number | null;
  reason: string;
}

export type AgentOutput = WeatherAgentOutput | PestAgentOutput | MarketAgentOutput;

// --- Orchestrator Input ---
export interface OrchestratorInput {
  farmerContext: FarmerContext;
  agentOutputs: AgentOutput[];
}

// --- Orchestrator Output ---
export type MessageType = "URGENT" | "NORMAL" | "ADVISORY";

export interface OrchestratorMessageOutput {
  sendMessage: true;
  messageType: MessageType;
  primaryAgent: string;
  instructions: string[];
  explanation: string;
  followUp?: {
    afterDays: number;
    condition: string;
  };
}

export interface OrchestratorSilentOutput {
  sendMessage: false;
  reason: string;
}

export type OrchestratorOutput = OrchestratorMessageOutput | OrchestratorSilentOutput;

// --- Priority Ladder (DO NOT CHANGE ORDER) ---
export const PRIORITY_LADDER = [
  { agent: "PEST", action: "SPRAY", priority: 1 },
  { agent: "WEATHER", action: "ALERT", priority: 2 },
  { agent: "WEATHER", action: "IRRIGATE", priority: 3 },
  { agent: "MARKET", action: "SELL_NOW", priority: 4 },
  { agent: "MARKET", action: "SELL_IN_OTHER_MANDI", priority: 5 },
  { agent: "MARKET", action: "WAIT", priority: 6 },
  { agent: "PEST", action: "MONITOR", priority: 7 },
  { agent: "WEATHER", action: "DO_NOT_IRRIGATE", priority: 8 },
] as const;

// --- Message Throttling Config ---
export const THROTTLE_CONFIG = {
  minHoursBetweenMessages: 24,
  emergencyActions: ["SPRAY", "ALERT"] as string[],
};
