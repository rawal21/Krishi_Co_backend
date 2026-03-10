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
const MessagingResponse = twilio.twiml.MessagingResponse;

const app = express();
const PORT = process.env.PORT || 3000;

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
    console.error("Test Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/irrigation-agent', async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const result = await irrigationAgent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Agent Error:", error.message, error.response?.data);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post('/crop-planning-agent', async (req: Request, res: Response) => {
  try {
    const result = await cropPlanningAgent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Crop Planning Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/weather-data', async (req: Request, res: Response) => {
  try {
    const { pincode } = req.body;
    const result = await getWeatherData(pincode);
    res.json(result);
  } catch (error: any) {
    console.error("Weather Data Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/pest-agent', async (req: Request, res: Response) => {
  try {
    const result = await pestAgent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Pest Agent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/market-agent', async (req: Request, res: Response) => {
  try {
    const result = await marketAgent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Market Agent Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/orchestrator', async (req: Request, res: Response) => {
  try {
    const result = await orchestratorAgent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Orchestrator Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/whatsapp', async (req: Request, res: Response) => {
  const from = req.body.From; // Farmer's number
  const to = process.env.TWILIO_WHATSAPP_NUMBER; // Your sandbox number
  const incomingMsg = req.body.Body || ""; 

  console.log(`[Server] Received /whatsapp request from: ${from}`);
  
  // Return an empty TwiML immediately or eventually
  const twiml = new MessagingResponse();

  try {
    // 1. Process the message (can take > 15 seconds)
    const responseText = await handleIncomingMessage(incomingMsg);
    
    // 2. Send via Twilio API instead of Webhook Response
    console.log(`[Server] Sending direct WhatsApp message to ${from}...`);
    await client.messages.create({
      body: responseText,
      from: to,
      to: from
    });
    console.log("[Server] Message sent successfully via API.");

  } catch (error: any) {
    console.error("WhatsApp Error:", error);
    // If it fails, we can try to send a quick error message
    try {
        await client.messages.create({
            body: "Sorry, I am facing technical difficulties. Please try later.",
            from: to,
            to: from
        });
    } catch (e) {
        console.error("Failed to send error message:", e);
    }
  }

  // We return empty TwiML because we already sent the message via API
  res.type('text/xml').send(twiml.toString());
});

app.listen(PORT,  () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
