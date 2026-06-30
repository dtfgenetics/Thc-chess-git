// back-end server url
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// public front-end site url used when copying invite/archive links
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

// public application name used for browser titles and future shared metadata
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Kush Kings Chess";
