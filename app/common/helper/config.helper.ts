import dotenv from "dotenv";
import process from "process";
import path from "path";
import logger from "./logger.helper";

export const loadConfig = () => {
  const env = process.env.NODE_ENV ?? "development";
  const filepath = path.join(process.cwd(), `.env.${env}`);
  logger.info(`Loading config from: ${filepath}`);
  const result = dotenv.config({ path: filepath });
  if (result.error) {
    logger.warn(`Failed to load ${filepath}: ${result.error.message}`);
  } else {
    logger.info(`Successfully loaded ${filepath}`);
  }
};