export type MarketRecommendation =
  | "SELL_NOW"
  | "WAIT"
  | "SELL_IN_OTHER_MANDI";

export interface MandiPriceRecord {
  date: string;            // YYYY-MM-DD
  mandi: string;
  modalPrice: number;      // ₹ per quintal
  arrivalQtls: number;
}

export interface MarketInput {
  crop: "cotton" | "soybean" | string;
  quantityQuintal: number;
  harvestWindow: {
    earliestDate: string;
    latestDate: string;
  };
  nearbyMandis: string[];
  transportCostPerQuintal: number;
  storageAvailable: boolean;
  state?: string;  // Optional state filter for API
}

export interface MarketOutput {
  recommendation: MarketRecommendation;
  suggestedMandi?: string;
  suggestedWaitDays?: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  priceSummary: {
    mandi: string;
    modalPrice: number;
    netPriceAfterTransport: number;
  }[];
  reason: string;
  warning?: string;
}
