import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const listModels = async () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  try {
    const models = await genAI.listModels();
    console.log(models);
  } catch (e: any) {
    console.error(e.message);
  }
};

listModels();
