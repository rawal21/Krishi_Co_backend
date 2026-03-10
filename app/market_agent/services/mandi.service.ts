import { MandiPriceRecord } from "../types/market.types";
import { getMandiPricesFromAPI, getMockMandiPrices } from "./mandi.api";
import logger from "../../common/helper/logger.helper";

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
      logger.info(`Fetching real mandi prices for ${commodity}`);
      const records = await getMandiPricesFromAPI(commodity, mandis, state);
      logger.debug(`Found ${records.length} records for ${commodity}`);
      if (records.length > 0) {
        return records;
      }
      logger.warn("No records from API, falling back to mock data");
    } catch (error: any) {
      logger.warn(`API failed, falling back to mock: ${error.message}`);
    }
  } else {
    logger.warn("DATA_GOV_API_KEY not set, using mock data");
  }
  
  return getMockMandiPrices(mandis);
}
