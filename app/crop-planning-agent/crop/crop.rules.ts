export interface CropRule {
  crop: string;
  seasons: ("Kharif" | "Rabi")[];
  suitableSoils: string[];
  waterNeed: "low" | "medium" | "high";
  approxCostPerAcre: number;
}

export const CROP_RULES: CropRule[] = [
  {
    crop: "cotton",
    seasons: ["Kharif"],
    suitableSoils: ["medium_black", "deep_black"],
    waterNeed: "high",
    approxCostPerAcre: 8000
  },
  {
    crop: "soybean",
    seasons: ["Kharif"],
    suitableSoils: ["medium_black", "loamy"],
    waterNeed: "medium",
    approxCostPerAcre: 5000
  }
];
