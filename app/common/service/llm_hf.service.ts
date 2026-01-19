import axios from "axios";
import createError from "http-errors";

export const analyzePestWithHF = async (
  prompt: string,
  image?: { b64: string; mime: string }
) => {
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
  if (!HF_TOKEN) {
    throw createError(500, "HUGGINGFACE_API_KEY is not set in environment variables");
  }

  // Model Selection
  let model = "Qwen/Qwen2.5-72B-Instruct";
  if (image) {
    model = "meta-llama/Llama-3.2-11B-Vision-Instruct";
  }

  // Using the router chat completions endpoint
  const url = `https://router.huggingface.co/v1/chat/completions`;

  try {
    const response = await axios.post(url, {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
    }, {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      timeout: 30000 
    });

    let textResult = response.data.choices?.[0]?.message?.content || JSON.stringify(response.data);

    // Extract JSON
    try {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
          pestDetected: "Unknown",
          confidence: 0.5,
          action: "MONITOR",
          reason: "Model returned text: " + textResult.substring(0, 300)
      };
    } catch (e) {
      return {
        pestDetected: "Unknown",
        confidence: 0.5,
        action: "MONITOR",
        reason: "Could not parse JSON from: " + textResult.substring(0, 100)
      };
    }
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("HF Error Data:", JSON.stringify(errorData, null, 2));
    const errorMessage = errorData?.error || errorData?.message || error.message;
    throw createError(error.response?.status || 500, "HF Inference Failed: " + errorMessage);
  }
};
