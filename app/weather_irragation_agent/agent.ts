import { CROP_WATER_THRESHOLD } from "./rules";
import { getWeatherData } from "./weather_service";
import type { agentDto } from "./dto";

import type { WeatherData } from "./weather_service";

export const irrigationAgent = async (input: agentDto, mockWeather?: WeatherData) => {
  const weather = mockWeather ?? await getWeatherData(input.pincode);

  const last7DaysRain = weather.daily
    .slice(0, 7) // Using 0-7 as a proxy for 'recent'
    .reduce((sum, d) => sum + (d.rain || 0), 0);

    
    const next5DaysRain = weather.daily
    .slice(0, 5) // Proxy for 'future'
    .reduce((sum, d) => sum + (d.rain || 0), 0);

  const threshold =
    CROP_WATER_THRESHOLD[input.cropType]?.[input.cropStage] ?? 20;

  if (next5DaysRain >= 10) {
    return {
      decision: "DO_NOT_IRRIGATE",
      confidence: "HIGH",
      reason: "Rain expected in next few days",
      weather_summary: `Next 5 days rain: ${next5DaysRain.toFixed(1)}mm`
    };
  }

  if (last7DaysRain >= threshold) {
    return {
      decision: "DO_NOT_IRRIGATE",
      confidence: "HIGH",
      reason: "Sufficient rainfall received recently",
      weather_summary: `Last 7 days rain: ${last7DaysRain.toFixed(1)}mm`
    };
  }

  if (input.last_irrigation_days_ago < 4) {
    return {
      decision: "DO_NOT_IRRIGATE",
      confidence: "MEDIUM",
      reason: "Recent irrigation still sufficient",
      weather_summary: `Last irrigation ${input.last_irrigation_days_ago} days ago`
    };
  }

  return {
    decision: "IRRIGATE",
    when: "Wednesday evening",
    duration_hours: 4,
    confidence: "HIGH",
    reason: "Low rainfall and dry spell ahead",
    weather_summary: `Last 7 days: ${last7DaysRain.toFixed(
      1
    )}mm, Next 5 days: ${next5DaysRain.toFixed(1)}mm`
  };
};
