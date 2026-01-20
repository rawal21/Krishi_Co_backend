// ============================================================
// MESSAGE THROTTLER - Prevents spam, allows emergencies
// ============================================================

import { FarmerContext, THROTTLE_CONFIG } from "../types/orchestrator.types";

interface ThrottleResult {
  shouldSend: boolean;
  reason?: string;
  isEmergency?: boolean;
}

/**
 * Determines if a message should be sent based on throttling rules
 */
export function checkThrottle(
  farmerContext: FarmerContext,
  action: string,
  messageType: "URGENT" | "NORMAL" | "ADVISORY"
): ThrottleResult {
  const { lastMessageSentAt, preferences } = farmerContext;
  const { minHoursBetweenMessages, emergencyActions } = THROTTLE_CONFIG;

  // Emergency actions ALWAYS go through
  if (emergencyActions.includes(action)) {
    return {
      shouldSend: true,
      isEmergency: true,
      reason: "Emergency action - throttle bypassed",
    };
  }

  // URGENT messages also bypass (but still logged)
  if (messageType === "URGENT") {
    return {
      shouldSend: true,
      isEmergency: true,
      reason: "Urgent message - throttle bypassed",
    };
  }

  // Check time since last message
  if (lastMessageSentAt) {
    const lastSent = new Date(lastMessageSentAt);
    const now = new Date();
    const hoursSinceLastMessage = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastMessage < minHoursBetweenMessages) {
      return {
        shouldSend: false,
        reason: `Too soon since last message (${Math.round(hoursSinceLastMessage)}h ago, min ${minHoursBetweenMessages}h)`,
      };
    }
  }

  // Check weekly limit (simplified - would need message history in production)
  // For now, we just allow if daily check passes
  
  return {
    shouldSend: true,
    reason: "Throttle check passed",
  };
}

/**
 * Determines message tone based on action and agent
 */
export function determineMessageType(
  agent: string,
  action: string
): "URGENT" | "NORMAL" | "ADVISORY" {
  // URGENT: Life/crop threatening
  if (action === "SPRAY") return "URGENT";
  if (action === "ALERT") return "URGENT";
  
  // NORMAL: Action required
  if (action === "IRRIGATE") return "NORMAL";
  if (action === "SELL_NOW") return "NORMAL";
  
  // ADVISORY: Can wait
  if (action === "WAIT") return "ADVISORY";
  if (action === "SELL_IN_OTHER_MANDI") return "ADVISORY";
  if (action === "MONITOR") return "ADVISORY";
  if (action === "DO_NOT_IRRIGATE") return "ADVISORY";
  
  return "ADVISORY";
}
