import { loadConfig } from './config.js';
import { AuthError, ValidationError } from './errors.js';
import type { BisonConfig } from './types.js';

export interface AuthContext {
  apiKey: string;
  baseUrl: string;
}

export const MISSING_API_KEY_MESSAGE =
  'No API key configured. Run "bison login" or set EMAILBISON_API_KEY.';

export const MISSING_BASE_URL_MESSAGE =
  'No base URL configured. Run "bison login" or set EMAILBISON_BASE_URL to your EmailBison instance URL.';

export const INVALID_BASE_URL_MESSAGE =
  'Base URL must be a valid https URL (for example https://send.example.com).';

/**
 * Require an https URL and strip a trailing slash.
 * There is no default instance — callers must supply their own EmailBison URL.
 */
export function normalizeBaseUrl(raw: string | undefined | null): string {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    throw new AuthError(MISSING_BASE_URL_MESSAGE);
  }

  const trimmed = String(raw).trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ValidationError(INVALID_BASE_URL_MESSAGE);
  }

  if (parsed.protocol !== 'https:') {
    throw new ValidationError(INVALID_BASE_URL_MESSAGE);
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${path}${parsed.search}${parsed.hash}`;
}

export function resolveAuth(opts?: {
  apiKey?: string;
  baseUrl?: string;
  config?: BisonConfig;
}): AuthContext {
  const config = opts?.config ?? loadConfig();

  const apiKey =
    opts?.apiKey ??
    process.env.EMAILBISON_API_KEY ??
    config.api_key;

  if (!apiKey || !String(apiKey).trim()) {
    throw new AuthError(MISSING_API_KEY_MESSAGE);
  }

  const baseUrl = normalizeBaseUrl(
    opts?.baseUrl ??
    process.env.EMAILBISON_BASE_URL ??
    config.base_url,
  );

  return { apiKey: String(apiKey).trim(), baseUrl };
}
