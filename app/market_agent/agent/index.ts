import {
  MarketInput,
  MarketOutput,
  MandiPriceRecord
} from "../types/market.types";
import { getRecentMandiPrices } from "../services/mandi.service";
import { analyzeTrend } from "../logic/trend.logic";
import logger from "../../common/helper/logger.helper";

export async function marketAgent(
  input: MarketInput
): Promise<MarketOutput> {
  // Fetch mandi prices (real API or mock fallback)
  logger.debug(`Market Agent input: ${JSON.stringify(input)}`);
  const records = await getRecentMandiPrices(
    input.crop,
    input.nearbyMandis,
    input.state
  );

  logger.debug(`Fetched ${records.length} records for market analysis.`);

  

  if (records.length === 0) {
    return {
      recommendation: "SELL_NOW",
      confidence: "LOW",
      priceSummary: [],
      reason: "No mandi price data available for the selected mandis."
    };
  }

  let priceSummary;

  if (input.nearbyMandis.length === 0) {
    // THE FIX: If no mandis specified, use the best price from the entire record set
    const sortedByPrice = [...records].sort((a, b) => b.modalPrice - a.modalPrice);
    const bestRecord = sortedByPrice[0];
    
    priceSummary = [{
      mandi: `${bestRecord.mandi} (Best in ${input.state || 'Region'})`,
      modalPrice: bestRecord.modalPrice,
      netPriceAfterTransport: bestRecord.modalPrice - input.transportCostPerQuintal
    }];
  } else {
    priceSummary = input.nearbyMandis.map(mandi => {
      const mandiRecords = records.filter((r: MandiPriceRecord) => 
        r.mandi.toLowerCase().includes(mandi.toLowerCase())
      );
      
      if (mandiRecords.length === 0) {
        return {
          mandi,
          modalPrice: 0,
          netPriceAfterTransport: 0
        };
      }

      const latest = mandiRecords.sort(
        (a: MandiPriceRecord, b: MandiPriceRecord) => b.date.localeCompare(a.date)
      )[0];

      const net = latest.modalPrice - input.transportCostPerQuintal;

      return {
        mandi,
        modalPrice: latest.modalPrice,
        netPriceAfterTransport: net
      };
    }).filter(p => p.modalPrice > 0);
  }

  if (priceSummary.length === 0) {
    return {
      recommendation: "SELL_NOW",
      confidence: "LOW",
      priceSummary: [],
      reason: "No valid price data could be summarized from the available records."
    };
  }

  const best = priceSummary.sort(
    (a, b) => b.netPriceAfterTransport - a.netPriceAfterTransport
  )[0];

  const trend = analyzeTrend(
    records.filter((r: MandiPriceRecord) => 
      r.mandi.toLowerCase().includes(best.mandi.toLowerCase())
    )
  );

  // Decision logic
  if (trend === "FALLING") {
    return {
      recommendation: "SELL_NOW",
      confidence: "HIGH",
      priceSummary,
      reason:
        "Prices are falling and arrivals are high. Selling now reduces risk."
    };
  }

  if (trend === "RISING" && input.storageAvailable) {
    return {
      recommendation: "WAIT",
      suggestedWaitDays: 5,
      confidence: "MEDIUM",
      priceSummary,
      reason:
        "Prices show rising trend and storage is available."
    };
  }

  logger.info("Market Agent analysis complete.");
  return {
    recommendation: "SELL_IN_OTHER_MANDI",
    suggestedMandi: best.mandi,
    confidence: "MEDIUM",
    priceSummary,
    reason:
      "Another nearby mandi offers better net price after transport."
  };
}
