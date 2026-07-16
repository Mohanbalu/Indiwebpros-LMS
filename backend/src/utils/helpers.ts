import { v4 as uuidv4 } from "uuid";

export const DateUtility = {
  formatISO(date = new Date()): string {
    return date.toISOString();
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
};

export const IDGenerator = {
  uuid(): string {
    return uuidv4();
  },
};

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const PaginationUtility = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(queryPage: any, queryLimit: any, defaultLimit = 10): PaginationParams {
    const page = Math.max(1, parseInt(queryPage as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(queryLimit as string) || defaultLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  },
};

export const UserAgentParser = {
  parse(userAgent: string | undefined): {
    deviceName: string;
    deviceType: string;
    browser: string;
    operatingSystem: string;
  } {
    if (!userAgent) {
      return {
        deviceName: "Unknown Device",
        deviceType: "Unknown",
        browser: "Unknown",
        operatingSystem: "Unknown",
      };
    }

    let deviceType = "Desktop";
    let deviceName = "PC";
    let browser = "Unknown";
    let operatingSystem = "Unknown";

    const ua = userAgent.toLowerCase();

    // Device Type & Name
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/.test(ua)) {
      deviceType = "Mobile";
      deviceName = "Smartphone";
    } else if (/ipad|tablet|playbook|silk/.test(ua)) {
      deviceType = "Tablet";
      deviceName = "Tablet";
    }

    if (/iphone/.test(ua)) deviceName = "iPhone";
    if (/ipad/.test(ua)) deviceName = "iPad";
    if (/android/.test(ua)) {
      deviceName = "Android Device";
    }

    // Operating System
    if (/windows/.test(ua)) operatingSystem = "Windows";
    else if (/macintosh|mac os x/.test(ua)) operatingSystem = "macOS";
    else if (/linux/.test(ua)) operatingSystem = "Linux";
    else if (/android/.test(ua)) operatingSystem = "Android";
    else if (/iphone|ipad|ipod/.test(ua)) operatingSystem = "iOS";

    // Browser
    if (/chrome|crios/.test(ua) && !/edge|edg|opr|opera/.test(ua)) browser = "Chrome";
    else if (/safari/.test(ua) && !/chrome|crios|android/.test(ua)) browser = "Safari";
    else if (/firefox|fxios/.test(ua)) browser = "Firefox";
    else if (/edge|edg/.test(ua)) browser = "Edge";
    else if (/opera|opr/.test(ua)) browser = "Opera";

    return { deviceName, deviceType, browser, operatingSystem };
  }
};
