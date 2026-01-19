import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const testHF = async () => {
  const key = process.env.HUGGINGFACE_API_KEY;
  const url = "https://router.huggingface.co";
  
  try {
    const response = await axios.post(url, {
      inputs: "Identify the pest for Cotton with holes in bolls.",
    }, {
      headers: { Authorization: `Bearer ${key}` }
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (e: any) {
    console.error(e.response?.data || e.message);
  }
};

testHF();
