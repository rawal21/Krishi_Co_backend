import { getAllAudioUrls } from 'google-tts-api';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import logger from '../helper/logger.helper';

// Configure cloudinary with environment variables
// It expects CLOUDINARY_URL or CLOUDINARY_API_KEY, API_SECRET, CLOUD_NAME to be set

export const generateAndUploadTTS = async (text: string): Promise<string> => {
    try {
        // 1. Generate Audio Stream explicitly for Hindi
        // Use getAllAudioUrls to handle text > 200 chars
        const audioUrls = getAllAudioUrls(text, {
            lang: 'hi', // Hindi language
            slow: false,
            host: 'https://translate.google.com',
        });
        
        // 2. Download all TTS buffers into Memory and concatenate
        const buffers: Buffer[] = [];
        for (const urlObj of audioUrls) {
            const response = await axios.get(urlObj.url, { responseType: 'arraybuffer' });
            buffers.push(Buffer.from(response.data));
        }
        const combinedBuffer = Buffer.concat(buffers);

        // 3. Upload to Cloudinary using Upload Stream
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "video", // Cloudinary treats audio as "video"
                    folder: "krisico_audio",
                    tags: ['audio_reply'],
                    // Configure auto delete if enabled on account level or handled outside.
                    // For direct API requests without a special upload preset, Cloudinary relies on Admin API for deletion later.
                    // But we can add an expiration property if the account supports it.
                },
                (error, result) => {
                    if (error) {
                        logger.error(`Cloudinary Upload Error: ${error.message}`);
                        return reject(error);
                    }
                    if (result && result.secure_url) {
                        logger.info(`Audio uploaded successfully to Cloudinary: ${result.secure_url}`);
                        resolve(result.secure_url);
                    } else {
                        reject(new Error("Unknown error during Cloudinary upload"));
                    }
                }
            );

            // Pipe buffer to stream
            uploadStream.end(combinedBuffer);
        });
    } catch (error: any) {
        logger.error(`TTS Generation Failed: ${error.message}`);
        throw new Error("Text-to-Speech failed");
    }
}
