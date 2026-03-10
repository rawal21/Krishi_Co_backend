import { PestInput, PestOutput } from "../types/pest.types";
import { getCurrentWeather } from "../../common/service/weather.api";
import { analyzePestWithHF } from "../../common/service/llm_hf.service";
import logger from "../../common/helper/logger.helper";

export async function pestAgent(input: PestInput): Promise<PestOutput> {
  let weather = input.weather;
  logger.debug(`Pest Agent input: ${JSON.stringify(input)}`);

  // Dynamic Weather Integration
  if (input.pincode && !weather) {
    try {
      const realWeather = await getCurrentWeather(input.pincode);
      logger.debug(`Fetched weather: ${JSON.stringify(realWeather)}`);
      weather = {
        humidityAvg: realWeather.humidity,
        temperatureAvg: realWeather.temp
      };
    } catch (error) {
      logger.warn(`Failed to fetch dynamic weather for pest agent at ${input.pincode}`);
    }
  }

  // Fallback if still no weather
  const finalWeather = weather || { humidityAvg: 50, temperatureAvg: 25 };

  // Construct the prompt for Hugging Face
  const prompt = `
    You are an expert agricultural pest scientist. 
    Task: Identify the pest and provide a structured JSON response.
    
    Context:
    - Crop: ${input.crop}
    - Crop Stage: ${input.cropStage}
    - User Observed Symptoms: "${input.symptomsText}"
    - Current Local Weather: ${finalWeather.temperatureAvg}°C, ${finalWeather.humidityAvg}% humidity.

    Mandatory JSON Output Format:
    {
      "pestDetected": "Name of the pest",
      "confidence": 0.9,
      "action": "SPRAY",
      "reason": "Detailed scientific reason",
      "recommendation": {
        "molecule": "Active ingredient",
        "dosePerPump": "Dosage",
        "sprayWindow": "Best time to spray"
      },
      "warning": "Safety warning"
    }

    Return ONLY the raw JSON object.
  `;

  try {
    const diagnosis = await analyzePestWithHF(prompt, input.image);
    logger.info("Pest Agent diagnosis complete.");
    return diagnosis as PestOutput;
  } catch (error: any) {
    logger.error(`HF AI Error: ${error.message}`);
    return {
      pestDetected: null,
      confidence: 0,
      action: "NO_ACTION",
      reason: "HF AI diagnosis failed: " + error.message
    };
  }
}
