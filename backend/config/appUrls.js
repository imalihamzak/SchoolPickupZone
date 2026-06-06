const path = require('path');

require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const trimTrailingSlash = (value = '') => String(value).trim().replace(/\/+$/, '');

const splitList = (value = '') => String(value)
  .split(',')
  .map((item) => trimTrailingSlash(item))
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const CLIENT_URL = trimTrailingSlash(
  (isProduction
    ? process.env.PRODUCTION_CLIENT_URL
    : process.env.LOCAL_CLIENT_URL) ||
  process.env.CLIENT_URL ||
  process.env.APP_URL ||
  process.env.FRONTEND_URL ||
  process.env.PRODUCTION_CLIENT_URL ||
  process.env.LOCAL_CLIENT_URL ||
  ''
);
const SERVER_PUBLIC_URL = trimTrailingSlash(
  (isProduction
    ? process.env.PRODUCTION_SERVER_PUBLIC_URL
    : process.env.LOCAL_SERVER_PUBLIC_URL) ||
  process.env.SERVER_PUBLIC_URL ||
  process.env.API_PUBLIC_URL ||
  process.env.PRODUCTION_SERVER_PUBLIC_URL ||
  process.env.LOCAL_SERVER_PUBLIC_URL ||
  ''
);

const CORS_ORIGINS = Array.from(new Set([
  ...splitList(process.env.CORS_ORIGINS),
  CLIENT_URL,
  trimTrailingSlash(process.env.APP_URL || ''),
  trimTrailingSlash(process.env.FRONTEND_URL || ''),
  trimTrailingSlash(process.env.LOCAL_CLIENT_URL || ''),
  trimTrailingSlash(process.env.PRODUCTION_CLIENT_URL || ''),
].filter(Boolean)));

const buildClientUrl = (path = '') => {
  if (!CLIENT_URL) {
    throw new Error('CLIENT_URL, APP_URL, FRONTEND_URL, LOCAL_CLIENT_URL, or PRODUCTION_CLIENT_URL must be configured in environment');
  }

  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;
  return `${CLIENT_URL}${normalizedPath}`;
};

const getRequestOrigin = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get?.('host');
  return host ? `${protocol}://${host}` : '';
};

const buildPublicFileUrl = (filePath, req) => {
  const baseUrl = SERVER_PUBLIC_URL || getRequestOrigin(req);
  const normalizedPath = String(filePath || '').replace(/^\/+/, '');
  return baseUrl ? `${trimTrailingSlash(baseUrl)}/${normalizedPath}` : `/${normalizedPath}`;
};

module.exports = {
  CLIENT_URL,
  SERVER_PUBLIC_URL,
  CORS_ORIGINS,
  buildClientUrl,
  buildPublicFileUrl,
};
