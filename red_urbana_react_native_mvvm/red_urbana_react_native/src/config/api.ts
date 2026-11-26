declare const process: {
  env: Record<string, string | undefined>;
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.88:3000";

export const API_URL = `${API_BASE_URL}/api`;
