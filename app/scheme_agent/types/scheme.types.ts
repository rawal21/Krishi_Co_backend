export interface SchemeInfo {
  name: string;
  provider: "CENTRAL" | "STATE";
  briefDescription: string;
  eligibility: string[];
  benefits: string[];
  applicationSteps: string[];
  documentsRequired: string[];
  officialWebsite?: string;
}

export interface SchemeAgentOutput {
  schemes: SchemeInfo[];
  recommendation?: string;
  disclaimer: string;
}
