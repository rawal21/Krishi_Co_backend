import axios from 'axios';
import Groq from 'groq-sdk';
import { toFile } from 'groq-sdk/uploads';
import logger from '../helper/logger.helper';
import FormData from 'form-data';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Downloads a media file from Twilio into a Buffer using Basic Auth
 */
export const downloadTwilioMedia = async (mediaUrl: string): Promise<Buffer> => {
  try {
    const authHeaders = {
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')}`,
    };

    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      headers: authHeaders,
    });

    logger.info(`Downloaded media from Twilio: ${response.data}`);

    return Buffer.from(response.data);
  } catch (error: any) {
    logger.error(`Failed to download media from Twilio: ${error.message}`);
    throw new Error('Media download failed');
  }
};

/**
 * Transcribes audio buffer to text using Groq Whisper model
 * Note: Groq expects a readable stream with a filename property.
 */
export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
    try {
        // Create a File object that groq-sdk can handle correctly
        const file = await toFile(audioBuffer, "audio.ogg", { type: "audio/ogg" });
        
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            prompt: "The audio might be in Hindi, English, or Hinglish.", // Helps the model
            response_format: "json",
            language: "hi", // Whisper usually detects it, but 'hi' is a good hint for our demographic
            temperature: 0.0,
        });

        logger.info(`Transcribed audio successfully: "${transcription.text}"`);
        return transcription.text;
    } catch (error: any) {
        logger.error(`Groq Transcription failed: ${error.message}`);
        throw new Error('Transcription failed');
    }
}
