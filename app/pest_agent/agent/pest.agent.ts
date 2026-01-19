import { PestInput, PestOutput } from "../types/pest.types";
import { getCurrentWeather } from "../../common/service/weather.api";
import { analyzePestWithHF } from "../../common/service/llm_hf.service";

export async function pestAgent(input: PestInput): Promise<PestOutput> {
  let weather = input.weather;

  // Dynamic Weather Integration
  if (input.pincode && !weather) {
    try {
      const realWeather = await getCurrentWeather(input.pincode);
      weather = {
        humidityAvg: realWeather.humidity,
        temperatureAvg: realWeather.temp
      };
    } catch (error) {
      console.warn("Failed to fetch dynamic weather for pest agent");
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
    return diagnosis as PestOutput;
  } catch (error: any) {
    console.error("HF AI Error:", error.message);
    return {
      pestDetected: null,
      confidence: 0,
      action: "NO_ACTION",
      reason: "HF AI diagnosis failed: " + error.message
    };
  }
}
