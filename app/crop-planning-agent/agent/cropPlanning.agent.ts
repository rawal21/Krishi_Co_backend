import { FarmerContext, CropPlanningResult, CropPlan } from "../type/agent.type";
import { getCoordinatesByPincode } from "../../common/service/geo.service";
import { getSoilInfo } from "../soil/soil.api";
import { getClimateInfo } from "../crop/climate.api";
import { CROP_RULES } from "../crop/crop.rules";

function assessRisk(
  waterNeed: "low" | "medium" | "high",
  irrigation: boolean
): "LOW" | "MEDIUM" | "HIGH" {
  if (waterNeed === "high" && !irrigation) return "HIGH";
  if (waterNeed === "high" && irrigation) return "MEDIUM";
  return "LOW";
}

export async function cropPlanningAgent(
  context: FarmerContext
): Promise<CropPlanningResult> {
  const { lat, lon } = await getCoordinatesByPincode(Number(context.location.villageCode) || 452001);
  const soil = await getSoilInfo(lat, lon);
  const climate = await getClimateInfo(lat, lon);

  const plans: CropPlan[] = [];

  // Logic: Only recommend crops that match the real soil and climate
  CROP_RULES.forEach((rule, index) => {
    const isSoilSuitable = rule.suitableSoils.includes(soil.soilType);
    const isSeasonSuitable = rule.seasons.includes(context.season);
    
    // Additional dynamic logic: check if water need matches climate/irrigation
    const isWaterSafe = context.irrigation || (rule.waterNeed === "low") || (climate.avgMonthlyRainfall > 80);

    if (isSoilSuitable && isSeasonSuitable && isWaterSafe) {
      plans.push({
        planId: index + 1,
        crops: [{ name: rule.crop, acres: context.landAcres }],
        risk: assessRisk(rule.waterNeed, context.irrigation),
        reason: `Real Soil (${soil.soilType}) and Climate (Avg Rain: ${climate.avgMonthlyRainfall.toFixed(1)}mm) look good for ${rule.crop}.`
      });
    }
  });

  // Default safe plan if nothing matches
  if (plans.length === 0) {
    plans.push({
      planId: 99,
      crops: [{ name: "Soybean (Fallback)", acres: context.landAcres }],
      risk: "LOW",
      reason: "No optimal match found for this soil/climate. Soybean is recommended as a hardy alternative."
    });
  }

  return {
    soilUsed: {
        soilType: soil.soilType,
        waterHolding: soil.clayContent > 30 ? "high" : "medium",
        source: "SoilGrids Global"
    },
    recommendedPlans: plans
  };
}
