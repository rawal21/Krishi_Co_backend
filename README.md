# Krishi-Co: Empowering Farmers with AI

**Krishi-Co** is a next-generation agricultural intelligence platform designed to bridge the gap between farmers and critical information. By leveraging advanced AI agents, Krishi-Co provides real-time, actionable insights directly to farmers, helping them make data-driven decisions for better crop yields and increased profitability.

---

## 🌾 The Problem We Solve
Farmers today face a multitude of challenges that impact their livelihood:
- **Information Gap**: Difficulty in accessing real-time market prices, weather forecasts, and government schemes.
- **Pest & Disease Management**: Slow identification and treatment of crop diseases, leading to significant yield loss.
- **Suboptimal Planning**: Lack of personalized crop recommendations based on soil health and budget.
- **Accessibility Barriers**: Many digital tools are complex and not tailored for users who prefer voice-to-voice communication or simple messaging interfaces.

## 🚀 How It Helps Farmers
Krishi-Co addresses these problems through specialized AI-driven tools:
- **📊 Real-time Mandi Insights**: Instant access to current market prices and price trends, ensuring farmers sell their produce at the best time.
- **🦠 AI Pest Doctor**: Quick identification of pests and diseases from descriptions or images, providing immediate treatment advice.
- **🌱 Smart Crop Planning**: Custom crop recommendations based on soil quality, budget, and season.
- **⛅ Weather & Smart Irrigation**: Intelligent irrigation suggestions based on local weather conditions to optimize water usage.
- **📜 Scheme Navigator**: Simplified access to government agricultural schemes tailored to the farmer's profile.
- **🎙️ Voice Interaction**: Multi-lingual support with Voice-to-Text (STT) and Text-to-Voice (TTS) via WhatsApp, making it accessible to all.

## ⚙️ How It Works
1. **User Query**: A farmer sends a text or voice message via WhatsApp or uses the Web App.
2. **AI Orchestration**: The Krishi-Co **Orchestrator** intelligent analyzes the query and routes it to the most relevant specialized agent (Market, Pest, etc.).
3. **Data Retrieval & Analysis**: The selected agent fetches live data (weather, mandi prices) or analyzes specific inputs (soil data, pest descriptions) using state-of-the-art AI models.
4. **Instant Response**: A concise, helpful response is generated. For WhatsApp users, this can also include an audio message for ease of understanding.

---

## 🛠️ Technical Stack & Architecture

### Tech Stack
- **Languages**: TypeScript, Node.js
- **Backend Framework**: Express.js
- **AI Models**: Google Gemini, Hugging Face, Groq
- **Communication**: Twilio (WhatsApp API)
- **Media Management**: Cloudinary
- **Logging**: Winston

### Architecture
Krishi-Co follows a **Distributed Agent Architecture**:
- **Orchestrator**: The central controller that manages request routing and agent coordination.
- **Specialized Agents**: Decoupled agents (Market, Pest, Scheme, Weather, Crop Planning) each focused on a specific domain.
- **Processing Flow**: Incoming Request → STT (if audio) → Orchestrator → Agent LLM → Response Generation → TTS (if audio) → WhatsApp/Web.

---

## 📦 Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up your `.env` file with API keys for Gemini, Groq, Twilio, and Cloudinary.
4. Run the development server: `npm run dev`.
