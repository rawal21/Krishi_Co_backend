export interface PestRule {
  pest: string;
  crops: string[];
  validStages: string[];
  symptomKeywords: string[];
  weatherPreference: {
    minHumidity: number;
    minTemp: number;
    maxTemp: number;
  };
  control?: {
    molecule: string;
    dosePerPump: string;
  };
}

export const PEST_RULES: PestRule[] = [
  {
    pest: "bollworm",
    crops: ["cotton"],
    validStages: ["flowering", "boll_formation"],
    symptomKeywords: ["hole", "boll", "larva", "caterpillar"],
    weatherPreference: {
      minHumidity: 60,
      minTemp: 25,
      maxTemp: 35
    },
    control: {
      molecule: "Emamectin Benzoate",
      dosePerPump: "4 gm"
    }
  },
  {
    pest: "aphids",
    crops: ["soybean"],
    validStages: ["vegetative"],
    symptomKeywords: ["curling", "sticky", "yellow", "honeydew"],
    weatherPreference: {
      minHumidity: 70,
      minTemp: 20,
      maxTemp: 30
    },
    control: {
      molecule: "Imidacloprid",
      dosePerPump: "5 ml"
    }
  }
];
