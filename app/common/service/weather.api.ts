import axios from 'axios';
import createError from 'http-errors';
import { getCoordinatesByPincode } from './geo.service';

export interface CurrentWeather {
  temp: number;
  humidity: number;
}

export const getCurrentWeather = async (pincode: number): Promise<CurrentWeather> => {
  const Api_key = process.env.OPENWEATHER_API_KEY;
  if (!Api_key) throw createError(500, "OpenWeather API Key is missing");

  const { lat, lon } = await getCoordinatesByPincode(pincode);

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${Api_key}&units=metric`;
  
  try {
    const response = await axios.get(url);
    return {
      temp: response.data.main.temp,
      humidity: response.data.main.humidity
    };
  } catch (error: any) {
    console.error("Weather API Error:", error.message);
    throw createError(error.response?.status || 500, error.message);
  }
};
