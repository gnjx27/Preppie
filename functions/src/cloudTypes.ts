// Firestore GDACS Alert Type
export type GdacsAlert = {
  eventid: number;
  episodeid: number;
  eventtype: string;
  name: string;
  description: string;
  htmldescription: string;
  alertlevel: string;
  alertscore: number;
  fromdate: string;
  todate: string;
  datemodified: string;
  affectedcountries: Array<{ iso2: string; countryname: string }>;
  severitydata: {
    severity: number;
    severitytext: string;
    severityunit: string;
  };
  icon?: string;
  url?: {
    report: string;
  };
};

// GDACS Feature Type
export type GdacsFeature = {
  type: string;
  bbox: number[];
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: GdacsAlert;
};

// GDACS Response Type
export type GdacsResponse = {
  type: string;
  features: GdacsFeature[];
};