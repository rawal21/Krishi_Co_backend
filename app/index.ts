import { loadConfig } from './common/helper/config.helper';
loadConfig();

import express, { Request, Response } from 'express';
import { irrigationAgent } from './weather_irragation_agent/agent';
import { getWeatherData } from './weather_irragation_agent/weather_service';
import { cropPlanningAgent } from './crop-planning-agent/agent/cropPlanning.agent';
import { pestAgent } from './pest_agent/agent/pest.agent';
import { marketAgent } from './market_agent/agent/index';
import { orchestratorAgent } from './orchestrator/agent/orchestrator.agent';
import { handleIncomingMessage } from './orchestrator/dispatcher';
import twilio from 'twilio';
import logger from './common/helper/logger.helper';
import cors from 'cors';
import { getProfile, updateProfile } from './common/service/profile.service';
import { getRecentMandiPrices } from './market_agent/services/mandi.service';
import { getCurrentWeather } from './common/service/weather.api';

const MessagingResponse = twilio.twiml.MessagingResponse;

const app = express();
const PORT =  5050;

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio Webhooks

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});

app.post('/test/irrigation-agent', async (req: Request, res: Response) => {
  try {
    const { input, mockWeather } = req.body;
    const result = await irrigationAgent(input, mockWeather);
    res.json(result);
  } catch (error: any) {
    logger.error(`Test Error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/irrigation-agent', async (req: Request, res: Response) => {
  try {
    logger.http(`Irrigation Agent Request: ${JSON.stringify(req.body)}`);
    const result = await irrigationAgent(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error(`Agent Error: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/crop-planning-agent', async (req: Request, res: Response) => {
  try {
    const result = await cropPlanningAgent(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error(`Crop Planning Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/weather-data', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.body;
    const result = await getWeatherData(pincode);
    res.json(result);
  } catch (error: any) {
    logger.error(`Weather Data Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/pest-agent', async (req: Request, res: Response) => {
  try {
    const result = await pestAgent(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error(`Pest Agent Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/market-agent', async (req: Request, res: Response) => {
  try {
    const result = await marketAgent(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error(`Market Agent Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/orchestrator', async (req: Request, res: Response) => {
  try {
    const result = await orchestratorAgent(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error(`Orchestrator Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});
// --- Web App REST Endpoints ---

app.get('/api/weather/:pincode', async (req: Request, res: Response) => {
  try {
    const pc = req.params.pincode;
    if (!pc) return res.status(400).json({ error: "Pincode required" });
    const data = await getCurrentWeather(parseInt(pc as string));
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/prices', async (req: Request, res: Response) => {
  try {
    const crop = req.query.crop as string;
    const mandisString = req.query.mandis as string;
    const mandiList = mandisString ? mandisString.split(',') : [];
    const data = await getRecentMandiPrices(crop, mandiList);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profile/:userId', (req: Request, res: Response) => {
  res.json(getProfile(req.params.userId as string));
});

app.post('/api/profile', (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  res.json(updateProfile(userId as string, updates));
});

// --- End Web App REST Endpoints ---

function sanitizeWhatsAppNumber(num: string): string {
  if (!num) return num;
  let formatted = num.trim();
  if (formatted.startsWith('whatsapp:')) {
    const part = formatted.substring('whatsapp:'.length).trim();
    const withPlus = part.startsWith('+') ? part : '+' + part;
    return `whatsapp:${withPlus}`;
  }
  const withPlus = formatted.startsWith('+') ? formatted : '+' + formatted;
  return `whatsapp:${withPlus}`;
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/whatsapp', async (req: Request, res: Response) => {
  const rawFrom = req.body.From || "";
  const from = sanitizeWhatsAppNumber(rawFrom);
  const to = process.env.TWILIO_WHATSAPP_NUMBER; 
  const incomingMsg = req.body.Body || ""; 

  logger.info(`Received /whatsapp request from: ${from} (raw: ${rawFrom})`);
  
  const twiml = new MessagingResponse();

  try {
    const responseText = await handleIncomingMessage(incomingMsg, from);
    
    logger.info(`Replying via TwiML to ${from}...`);
    twiml.message(responseText);
    logger.info(`Message prepared successfully.`);

  } catch (error: any) {
    logger.error(`WhatsApp Error: ${error.message}`);
    twiml.message("Sorry, I am facing technical difficulties. Please try later.");
  }

  res.type('text/xml').send(twiml.toString());
});

app.listen(5050,  () => {
  logger.info(`Server is running on http://localhost:${5050}`);
});
