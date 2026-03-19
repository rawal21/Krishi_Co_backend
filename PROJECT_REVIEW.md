# Krishi-Co Project Review

This document provides a technical deep-dive into the Krishi-Co backend architecture, detailing the agent-based system and its data processing workflows.

---

## 🏗️ System Architecture: The Orchestrator-Agent Pattern

Krishi-Co is built on a modular, agentic architecture where a central **Orchestrator** acts as the brain, routing requests to specialized domain experts (**Agents**).

### 🧠 The Orchestrator (`app/orchestrator`)
The Orchestrator's primary responsibility is **Intent Recognition** and **Routing**.
- **Input**: Natural language (Text or Transcribed Audio).
- **Process**: Uses LLM reasoning (Gemini/Groq) to determine which agent is best suited to handle the user's query.
- **Output**: Dispatches the request to the target agent with the necessary context.

### 🤖 Specialized AI Agents
Each agent is a self-contained module managing its own domain-specific logic and external API integrations.

1. **Market Agent (`app/market_agent`)**
   - **Purpose**: Real-time mandi prices and market intelligence.
   - **Tech**: Integrates with mandi price APIs and uses LLMs to interpret trends (e.g., "should I sell now?").

2. **Pest Agent (`app/pest_agent`)**
   - **Purpose**: Disease and pest identification.
   - **Tech**: Processes image labels or descriptions. Uses Hugging Face/Gemini for visual recognition and diagnosis.

3. **Crop Planning Agent (`app/crop-planning-agent`)**
   - **Purpose**: Soil-based crop recommendations.
   - **Tech**: Uses geo-services to fetch soil data for specific coordinates and generates planning advice based on the farmer's budget and season.

4. **Weather & Irrigation Agent (`app/weather_irragation_agent`)**
   - **Purpose**: Smart agricultural weather advice.
   - **Tech**: Connects to weather APIs to provide irrigation schedules and warnings for extreme weather.

5. **Scheme Agent (`app/scheme_agent`)**
   - **Purpose**: Personalized government scheme lookup.
   - **Tech**: Maps user profiles and agricultural needs to available state and central schemes.

---

## 🔄 Technical Workflow: A Request's Journey

### 1. Ingress & Pre-processing
- **WhatsApp**: Twilio Webhook → STT (Speech-to-Text) module uses Cloudinary/Transcription services to convert audio to text.
- **Web App**: Direct JSON payloads via REST endpoints.

### 2. Processing Phase
- **Orchestration**: The text is passed to the Orchestrator LLM, which identifies the agent.
- **Agent Execution**: The agent performs its task:
  - Fetches soil data.
  - Queries mandi prices via Axios.
  - Generates advice via LLM.

### 3. Egress & Post-processing
- **TTS (Text-to-Speech)**: If the original interaction was audio-based, the text response is converted to speech (using `google-tts-api` or similar) and uploaded to Cloudinary.
- **Delivery**: The final message (Text/Audio URL) is sent back via Twilio or the Web API.

---

## 🧪 Testing & Validation
The project includes several test scripts in the `app/` directory:
- `test_whatsapp_logic.ts`: Specifically tests the sequential message queue and concurrency handling.
- `test_orchestrator.ts`: Validates routing logic between different agents.
- `test_e2e_full.ts`: Simulates a full farmer interaction from input to response.

## 📈 Future Considerations
- **Vector Database Integration**: For storing agricultural knowledge bases and historical data.
- **Multi-lingual Context**: Fine-tuning LLM prompts for better regional language support.
- **Robust Cache Layer**: Using Redis for faster retrieval of weather and market data.
