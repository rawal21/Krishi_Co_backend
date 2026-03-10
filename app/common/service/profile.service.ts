import fs from 'fs';
import path from 'path';
import logger from '../helper/logger.helper';

const PROFILES_FILE = path.join(process.cwd(), 'user_profiles.json');

export interface UserProfile {
  userId: string;
  name?: string;
  location?: string;
  pincode?: string;
  preferredLanguage?: string;
}

export const getProfile = (userId: string): UserProfile => {
  try {
    if (!fs.existsSync(PROFILES_FILE)) {
      return { userId };
    }
    const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
    const profiles = JSON.parse(data);
    return profiles[userId] || { userId };
  } catch (error) {
    logger.error(`Error reading profiles: ${error}`);
    return { userId };
  }
};

export const updateProfile = (userId: string, updates: Partial<UserProfile>): UserProfile => {
  try {
    let profiles: Record<string, UserProfile> = {};
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
      profiles = JSON.parse(data);
    }

    const current = profiles[userId] || { userId };
    const updated = { ...current, ...updates };
    profiles[userId] = updated;

    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2));
    logger.info(`Profile updated for ${userId}: ${JSON.stringify(updates)}`);
    return updated;
  } catch (error) {
    logger.error(`Error updating profile: ${error}`);
    return { userId };
  }
};
