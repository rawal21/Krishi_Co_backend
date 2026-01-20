import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const testDataGovAPI = async () => {
  const key = process.env.DATA_GOV_API_KEY;
  console.log("API Key present:", !!key);
  
  const url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
  
  try {
    const response = await axios.get(url, {
      params: {
        "api-key": key,
        format: "json",
        limit: "100",
        "filters[commodity]": "SOYABEAN",
        "filters[state]": "Maharashtra"
      },
      timeout: 15000
    });
    console.log("Total records:", response.data.total);
    
    const markets = response.data.records.map((rec: any) => rec.market);
    const unique = [...new Set(markets)] as string[];
    console.log("Available markets:", unique.join(", "));
    
    const hasLatur = unique.some(m => m.toLowerCase().includes("latur"));
    const hasNanded = unique.some(m => m.toLowerCase().includes("nanded"));
    console.log("Has Latur:", hasLatur);
    console.log("Has Nanded:", hasNanded);
    
    // Show matches
    const laturMatches = unique.filter(m => m.toLowerCase().includes("latur"));
    const nandedMatches = unique.filter(m => m.toLowerCase().includes("nanded"));
    console.log("Latur matches:", laturMatches);
    console.log("Nanded matches:", nandedMatches);
  } catch (e: any) {
    console.error("Error:", e.response?.data || e.message);
  }
};

testDataGovAPI();
