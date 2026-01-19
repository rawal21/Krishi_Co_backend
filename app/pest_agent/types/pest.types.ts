export interface PestInput {
  crop: string;
  cropStage: string;
  symptomsText: string;
  weather?: {
    humidityAvg: number;
    temperatureAvg: number;
  };
  pincode?: number;
  image?: {
    b64: string;
    mime: string;
  };
}

export interface PestOutput {
  pestDetected: string | null;
  confidence: number;
  action: "SPRAY" | "MONITOR" | "NO_ACTION";
  reason: string;
  recommendation?: {
    molecule: string;
    dosePerPump: string;
    sprayWindow: string;
  };
  warning?: string;
}
