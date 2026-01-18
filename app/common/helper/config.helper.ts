import dotenv from "dotenv";
import process from "process";
import path from "path";

export const loadConfig = () => {
  const env = process.env.NODE_ENV ?? "development";
  const filepath = path.join(process.cwd(), `.env.${env}`);
  console.log(`[Config] Loading config from: ${filepath}`);
  const result = dotenv.config({ path: filepath });
  if (result.error) {
    console.warn(`[Config] Failed to load ${filepath}:`, result.error.message);
  } else {
    console.log(`[Config] Successfully loaded ${filepath}`);
  }
};