export interface FarmerContext {
  location: {
    stateCode: string;
    districtCode: string;
    villageCode: string;
  };
  season: "Kharif" | "Rabi";
  landAcres: number;
  irrigation: boolean;
  budgetLevel: "low" | "medium" | "high";
}

export interface CropPlan {
  planId: number;
  crops: {
    name: string;
    acres: number;
  }[];
  risk: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export interface CropPlanningResult {
  soilUsed: {
    soilType: string;
    waterHolding: string;
    source: string;
  };
  recommendedPlans: CropPlan[];
}
