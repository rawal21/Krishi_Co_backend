export type CropType = 'cotton' | 'soybean';
export type CropStage = 'early_vegetative' | 'flowering' | 'boll_formation' | 'pod_fill';

export const CROP_WATER_THRESHOLD: Record<string, Record<string, number>> = {
  cotton: {
    early_vegetative: 20,
    flowering: 30,
    boll_formation: 35
  },
  soybean: {
    early_vegetative: 15,
    flowering: 25,
    pod_fill: 30
  }
};
