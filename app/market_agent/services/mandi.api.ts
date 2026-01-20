import axios from "axios";
import createError from "http-errors";
import { MandiPriceRecord } from "../types/market.types";

/**
 * Fetches real-time mandi prices from data.gov.in API
 * 
 * API Key required: Register at https://data.gov.in and get your API key
 * Add to .env.development: DATA_GOV_API_KEY=your_key_here
 */

const BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

interface DataGovRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

interface DataGovResponse {
  records: DataGovRecord[];
  total: number;
  count: number;
}

/**
 * Fetches mandi prices for given crop and markets
 * @param commodity - Crop name (e.g., "Soyabean", "Cotton")
 * @param mandis - List of mandi names to fetch
 * @param state - Optional state filter (e.g., "Maharashtra")
 */
export async function getMandiPricesFromAPI(
  commodity: string,
  mandis: string[],
  state?: string
): Promise<MandiPriceRecord[]> {
  // Read API key inside function to ensure config is loaded
  const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
  
  if (!DATA_GOV_API_KEY) {
    throw createError(500, "DATA_GOV_API_KEY is not set. Register at data.gov.in to get your API key.");
  }

  try {
    // Build query parameters
    const params: Record<string, string> = {
      "api-key": DATA_GOV_API_KEY,
      format: "json",
      limit: "100",
      "filters[commodity]": commodity.toUpperCase(),
    };

    if (state) {
      params["filters[state]"] = state;
    }

    const response = await axios.get<DataGovResponse>(BASE_URL, {
      params,
      timeout: 15000,
    });

    const records = response.data.records || [];

    // Filter by requested mandis and transform to our format
    const filteredRecords: MandiPriceRecord[] = records
      .filter((r) => {
        const marketLower = r.market.toLowerCase();
        return mandis.some((m) => marketLower.includes(m.toLowerCase()));
      })
      .map((r) => ({
        date: formatDate(r.arrival_date),
        mandi: r.market,
        modalPrice: parseFloat(r.modal_price) || 0,
        arrivalQtls: 0, // Not provided by this API
        minPrice: parseFloat(r.min_price) || 0,
        maxPrice: parseFloat(r.max_price) || 0,
        state: r.state,
        district: r.district,
        variety: r.variety,
      }));

    if (filteredRecords.length === 0) {
      console.warn(`No mandi records found for ${commodity} in ${mandis.join(", ")}`);
    }

    return filteredRecords;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw createError(401, "Invalid DATA_GOV_API_KEY. Please check your API key.");
    }
    console.error("Mandi API Error:", error.message);
    throw createError(error.response?.status || 500, "Failed to fetch mandi prices: " + error.message);
  }
}

/**
 * Converts date from DD/MM/YYYY to YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  // Handle DD/MM/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return dateStr;
}

/**
 * Fallback to mock data if API is not available
 */
export function getMockMandiPrices(mandis: string[]): MandiPriceRecord[] {
  const mockData: MandiPriceRecord[] = [
    { date: "2026-10-01", mandi: "Latur", modalPrice: 7200, arrivalQtls: 340 },
    { date: "2026-10-01", mandi: "Nanded", modalPrice: 7350, arrivalQtls: 280 },
    { date: "2026-09-30", mandi: "Latur", modalPrice: 7100, arrivalQtls: 410 },
    { date: "2026-09-30", mandi: "Nanded", modalPrice: 7300, arrivalQtls: 300 },
  ];
  
  return mockData.filter((r) => mandis.includes(r.mandi));
}
