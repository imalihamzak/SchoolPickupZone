const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

const isProductionBuild = import.meta.env.PROD;

const configuredApiBase = isProductionBuild
  ? import.meta.env.VITE_PRODUCTION_API_BASE_URL || import.meta.env.VITE_API_BASE_URL
  : import.meta.env.VITE_LOCAL_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;

const configuredApiOrigin = isProductionBuild
  ? import.meta.env.VITE_PRODUCTION_API_ORIGIN || import.meta.env.VITE_API_ORIGIN
  : import.meta.env.VITE_LOCAL_API_ORIGIN || import.meta.env.VITE_API_ORIGIN;

const API_BASE_URL = trimTrailingSlash(configuredApiBase || "/api");
const LOCAL_BASE = trimTrailingSlash(
  configuredApiOrigin || API_BASE_URL.replace(/\/api$/, "")
);
const LAN_API_BASE = API_BASE_URL;

export { API_BASE_URL, LOCAL_BASE, LAN_API_BASE };
