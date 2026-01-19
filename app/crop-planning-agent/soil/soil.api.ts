import axios from 'axios';

export interface SoilProperties {
  soilType: string;
  clayContent: number;
  sandContent: number;
  organicCarbon: number;
}

export const getSoilInfo = async (lat: number, lon: number): Promise<SoilProperties> => {
  // SoilGrids REST API V2.0
  // Fetching clay, sand, and organic carbon (soc) at 0-5cm and 5-15cm depths
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}&property=clay&property=sand&property=soc&depth=0-5cm&depth=5-15cm&value=mean`;

  try {
    const response = await axios.get(url);
    const properties = response.data.properties.layers;

    const clay = properties.find((l: any) => l.name === 'clay')?.depths[0]?.values?.mean / 10 || 0;
    const sand = properties.find((l: any) => l.name === 'sand')?.depths[0]?.values?.mean / 10 || 0;
    const soc = properties.find((l: any) => l.name === 'soc')?.depths[0]?.values?.mean / 10 || 0;

    // Simplified classification
    let soilType = "loamy";
    if (clay > 35) soilType = "deep_black"; // Proxy for Heavy Clay
    else if (clay > 25) soilType = "medium_black";
    else if (sand > 50) soilType = "sandy";

    return {
      soilType,
      clayContent: clay,
      sandContent: sand,
      organicCarbon: soc
    };
  } catch (error) {
    console.error("SoilGrids API Error:", error);
    // Fallback to a safe default
    return {
      soilType: "loamy",
      clayContent: 20,
      sandContent: 40,
      organicCarbon: 10
    };
  }
};
