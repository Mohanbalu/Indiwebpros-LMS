export const APP_CONFIG = {
  name: "IndiWebPros LMS",
  shortName: "IWP LMS",
  description: "Enterprise Learning Management System",
  version: "1.0.0",
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
} as const;
