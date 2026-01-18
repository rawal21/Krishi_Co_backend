import express, { Request, Response } from 'express';
import { irrigationAgent } from './weather_irragation_agent/agent';
import { loadConfig } from './common/helper/config.helper';
loadConfig();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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


app.listen(PORT,  () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
