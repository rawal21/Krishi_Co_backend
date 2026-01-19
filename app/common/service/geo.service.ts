import axios from 'axios';
import createError from 'http-errors';

export interface Coordinates {
  lat: number;
  lon: number;
}

export const getCoordinatesByPincode = async (pincode: number): Promise<Coordinates> => {
  const Api_key = process.env.OPENWEATHER_API_KEY;
  if (!Api_key) throw createError(500, "OpenWeather API Key is missing");
  
  if (!pincode) throw createError(400, "Pincode is required");

  const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${pincode},IN&appid=${Api_key}`;
  
  const getGeo = await axios.get(geoUrl);
  const { lat, lon } = getGeo.data;

  if (!lat || !lon) {
    throw createError(404, `Coordinates not found for pincode: ${pincode}`);
  }

  return { lat, lon };
};
