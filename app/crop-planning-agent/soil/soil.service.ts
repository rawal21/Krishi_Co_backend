import soilMap from "./soil.data.json";
import { SoilInfo } from "./soil.type";

export function getSoilByVillage(
  villageCode: string
): SoilInfo {
  const soil = (soilMap as Record<string, SoilInfo>)[villageCode];

  if (!soil) {
    throw new Error(
      `❌ Soil data not found for village: ${villageCode}`
    );
  }

  return soil;
}
