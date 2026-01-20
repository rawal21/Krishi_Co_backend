import { MandiPriceRecord } from "../types/market.types";
import { getMandiPricesFromAPI, getMockMandiPrices } from "./mandi.api";

/**
 * Fetches mandi prices - uses real API if available, falls back to mock
 */
export async function getRecentMandiPrices(
  commodity: string,
  mandis: string[],
  state?: string
): Promise<MandiPriceRecord[]> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  
  if (apiKey) {
    try {
      console.log(`[Mandi] Fetching real prices for ${commodity} from ${mandis.join(", ")}`);
      const records = await getMandiPricesFromAPI(commodity, mandis, state);
      if (records.length > 0) {
        return records;
      }
      console.warn("[Mandi] No records from API, falling back to mock data");
    } catch (error: any) {
      console.warn("[Mandi] API failed, falling back to mock:", error.message);
    }
  } else {
    console.warn("[Mandi] DATA_GOV_API_KEY not set, using mock data");
  }
  
  return getMockMandiPrices(mandis);
}
