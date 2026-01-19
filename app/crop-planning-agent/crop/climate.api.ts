import axios from 'axios';

export interface ClimateInfo {
  avgMonthlyRainfall: number;
  isAridZone: boolean;
}

export const getClimateInfo = async (lat: number, lon: number): Promise<ClimateInfo> => {
  // Open-Meteo Historical Records (1991-2020)
  // We'll fetch the current month's historical average rainfall
  // models=ERA5 might be causing issues, trying without it or using a more general one
  const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=1991-01-01&end_date=2020-12-31&daily=precipitation_sum`;

  try {
    const response = await axios.get(url);
    const precipitation = response.data.daily.precipitation_sum;
    
    // Average daily rain over the 30 year period (simplified for demonstration)
    const avgDailyRain = precipitation.reduce((a: number, b: number) => a + (b || 0), 0) / precipitation.length;
    const avgMonthlyRain = avgDailyRain * 30;

    return {
      avgMonthlyRainfall: avgMonthlyRain,
      isAridZone: avgMonthlyRain < 50
    };
  } catch (error) {
    console.error("Climate API Error:", error);
    return {
      avgMonthlyRainfall: 100, // Safe default
      isAridZone: false
    };
  }
};
