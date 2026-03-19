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
import { getCoordinatesByPincode } from './common/service/geo.service';
import { downloadTwilioMedia, transcribeAudio } from './common/service/stt.service';
import { generateAndUploadTTS } from './common/service/tts.service';
import { getSoilInfo } from './crop-planning-agent/soil/soil.api';

const MessagingResponse = twilio.twiml.MessagingResponse;

const app = express();
const PORT = process.env.PORT || 3000;



app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    console.log("pincode", pincode);
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

app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const userData = getProfile(req.params.userId as string);
    const pincode = parseInt(userData.pincode as string);
    
    let weatherData = null;
    let soilData = null;
    let cropPlanning = null;

    if (!isNaN(pincode)) {
      weatherData = await getCurrentWeather(pincode);
      
      // Use saved coordinates if available, otherwise geocode from pincode
      let lat = userData.location?.lat;
      let lon = userData.location?.lon;

      if (lat === undefined || lon === undefined) {
        const coords = await getCoordinatesByPincode(pincode);
        lat = coords.lat;
        lon = coords.lon;
        // Optionally update profile with these coordinates if missing
        updateProfile(userData.userId, { location: { lat, lon } });
      }

      soilData = await getSoilInfo(lat, lon);

      // --- New: Crop Planning Integration ---
      const month = new Date().getMonth();
      const season = (month >= 5 && month <= 10) ? "Kharif" : "Rabi";
      
      let budgetLevel: "low" | "medium" | "high" = "medium";
      if (userData.AnnualIncome) {
        if (userData.AnnualIncome < 100000) budgetLevel = "low";
        else if (userData.AnnualIncome > 500000) budgetLevel = "high";
      }

      cropPlanning = await cropPlanningAgent({
        location: {
          villageCode: userData.pincode || "452001",
          districtCode: "999",
          stateCode: "27"
        },
        season: season,
        landAcres: 2, // Standard default for analysis
        irrigation: !!userData.irrigationType && userData.irrigationType.toLowerCase() !== 'none',
        budgetLevel: budgetLevel
      });
    }
     
    res.json({ weatherData, soilData, cropPlanning, profile: userData });
  } catch (error: any) {
    logger.error(`Profile GET Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', async (req: Request, res: Response) => {
  try {
    logger.info(`Profile Update Request: ${JSON.stringify(req.body)}`);
    const { userId, updates } = req.body;
    
    // If pincode is updated, auto-geocode it
    if (updates.pincode) {
      const pincode = parseInt(updates.pincode);
      if (!isNaN(pincode)) {
        const coords = await getCoordinatesByPincode(pincode);
        updates.location = coords; // Save coordinates to location field
      }
    }

    const updatedProfile = updateProfile(userId as string, updates);
    let weatherData = null;
    if (updatedProfile.pincode) {
      weatherData = await getCurrentWeather(parseInt(updatedProfile.pincode));
    }
    
    res.json({ weatherData, profile: updatedProfile });
  } catch (error: any) {
    logger.error(`Profile POST Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// --- End Web App REST Endpoints ---

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
logger.info(`Twilio Client Initialized: ${process.env.TWILIO_ACCOUNT_SID}`);

// --- Sequential Message Queue & Worker ---
interface WhatsAppTask {
  from: string;
  to: string;
  body: string;
  numMedia: number;
  mediaContentType: string;
  mediaUrl: string;
  requestId: string;
}

const messageQueue: WhatsAppTask[] = [];
let isProcessing = false;

const processQueue = async () => {
    if (isProcessing || messageQueue.length === 0) return;
    isProcessing = true;

    const task = messageQueue.shift()!;
    const { from, to, requestId } = task;
    let { body: incomingMsg, numMedia, mediaContentType, mediaUrl } = task;

    logger.info(`[${requestId}] [START] Processing message from ${from}`);
    let isAudioInteraction = false;

    try {
        // [PHASE 1] Handle Incoming Audio (STT)
        if (numMedia > 0 && mediaContentType.startsWith('audio/')) {
            logger.info(`[${requestId}] [PHASE 1] Audio detected. Downloading from Twilio...`);
            isAudioInteraction = true;
            const audioBuffer = await downloadTwilioMedia(mediaUrl);
            logger.info(`[${requestId}] [PHASE 1] Download complete (${audioBuffer.length} bytes). Transcribing...`);
            incomingMsg = await transcribeAudio(audioBuffer);
            logger.info(`[${requestId}] [PHASE 1] Transcription SUCCESS: "${incomingMsg}"`);
        } else {
            logger.info(`[${requestId}] [PHASE 1] No audio detected, using text body.`);
        }

        if (!incomingMsg.trim()) {
            throw new Error("Empty message after processing.");
        }

        // [PHASE 2] Routing & LLM Processing
        logger.info(`[${requestId}] [PHASE 2] Routing to agents...`);
        const responseText = await handleIncomingMessage(incomingMsg, from);
        logger.info(`[${requestId}] [PHASE 2] LLM Response SUCCESS.`);

        // [PHASE 3] Outgoing Audio (TTS)
        let outgoingMediaUrl: string | undefined = undefined;
        if (isAudioInteraction) {
            try {
                logger.info(`[${requestId}] [PHASE 3] Generating TTS for response (${responseText.length} chars)...`);
                outgoingMediaUrl = await generateAndUploadTTS(responseText);
                logger.info(`[${requestId}] [PHASE 3] TTS & Cloudinary SUCCESS: ${outgoingMediaUrl}`);
            } catch (ttsError: any) {
                logger.error(`[${requestId}] [PHASE 3] TTS Failed: ${ttsError.message}. Falling back to text-only.`);
            }
        }

        // [PHASE 4] Sending Final Response
        logger.info(`[${requestId}] [PHASE 4] Sending WhatsApp message...`);
        logger.info(`[${requestId}] [PHASE 4] From (Twilio): ${to}, To (User): ${from}`);
        
        await client.messages.create({
            body: responseText,
            from: to,
            to: from,
            ...(outgoingMediaUrl && { mediaUrl: [outgoingMediaUrl] })
        });
        logger.info(`[${requestId}] [COMPLETE] Successfully handled request.`);

    } catch (error: any) {
        logger.error(`[${requestId}] [FAILED] Background Processing Error: ${error.message}`);
        try {
            logger.info(`[${requestId}] [ERROR-REPLY] Sending error message to ${from} from ${to}`);
            await client.messages.create({
                body: "Sorry, I am facing technical difficulties. Please try later.",
                from: to,
                to: from
            });
        } catch (e: any) {
            logger.error(`[${requestId}] Critical: Failed to send error message to user. Error: ${e.message}`);
        }
    } finally {
        isProcessing = false;
        // Check for next message immediately
        setImmediate(processQueue);
    }
};

app.post('/whatsapp',   (req: Request, res: Response) => {
    const from = req.body.From;
    const to = process.env.TWILIO_WHATSAPP_NUMBER || "";

    logger.debug(`[RECEIVE] RAW REQ BODY: ${JSON.stringify(req.body)}`);

    // 1. Check for status callbacks (delivery reports) and ignore them
    // Note: Actual incoming messages have SmsStatus: "received". 
    // We only want to ignore status updates like "sent", "delivered", "read", etc.
    const isStatusUpdate = 
        (req.body.SmsStatus && req.body.SmsStatus !== 'received') || 
        (req.body.MessageStatus && req.body.MessageStatus !== 'received') || 
        req.body.CallStatus;

    if (isStatusUpdate) {
        logger.debug(`[RECEIVE] Ignoring status callback (${req.body.SmsStatus || req.body.MessageStatus}). SID: ${req.body.MessageSid}`);
        return res.status(200).send('OK');
    }

    // 2. Prevent self-messaging loop
    if (from === to) {
        logger.warn(`[RECEIVE] Ignoring message from self: ${from}`);
        return res.status(200).send('OK');
    }

    logger.info("WhatsApp request received", { from, to, body: req.body.Body });
    
    const body = req.body.Body || "";
    const numMedia = parseInt(req.body.NumMedia || '0');

    // 3. Ensure there is content to process
    if (!body.trim() && numMedia === 0) {
        logger.info(`[RECEIVE] Ignoring empty request from ${from}`);
        return res.status(200).send('OK');
    }

    
    logger.warn("NumMedia from client" ,numMedia);
    const mediaContentType = req.body.MediaContentType0 || "";
    const mediaUrl = req.body.MediaUrl0 || "";
    const requestId = Math.random().toString(36).substring(7).toUpperCase();

    logger.info(`[${requestId}] [RECEIVE] New request from ${from}. Queuing...`);

    // 1. Instantly return 200 OK
    res.set('Content-Type', 'text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

    // 2. Add to Queue
    messageQueue.push({
        from, to, body, numMedia, mediaContentType, mediaUrl, requestId
    });

    // 3. Start processing if not already
    processQueue();
});

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: any) => {
    logger.error(`[FATAL ERROR] ${err.stack || err.message}`);
    res.status(200).send('OK'); // Always send 200 to Twilio to stop retries if it's a fatal crash
});

app.listen(PORT,  () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
