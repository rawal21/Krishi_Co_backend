export type SoilType =
  | "sandy"
  | "loamy"
  | "medium_black"
  | "deep_black";

export type WaterHolding =
  | "low"
  | "medium"
  | "high"
  | "very_high";

export interface SoilInfo {
  soilType: SoilType;
  waterHolding: WaterHolding;
  source: "NBSS_LUP" | "SHC";
}
