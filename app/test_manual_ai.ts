import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const testManual = async () => {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
  
  try {
    const response = await axios.get(url);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
};

testManual();
