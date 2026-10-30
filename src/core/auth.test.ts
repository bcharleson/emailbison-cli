import { afterEach, describe, expect, it } from 'vitest';
import {
  INVALID_BASE_URL_MESSAGE,
  MISSING_API_KEY_MESSAGE,
  MISSING_BASE_URL_MESSAGE,
  normalizeBaseUrl,
  resolveAuth,
} from './auth.js';
import { AuthError, ValidationError } from './errors.js';

const ORIGINAL_ENV = {
  EMAILBISON_API_KEY: process.env.EMAILBISON_API_KEY,
  EMAILBISON_BASE_URL: process.env.EMAILBISON_BASE_URL,
};

afterEach(() => {
  if (ORIGINAL_ENV.EMAILBISON_API_KEY === undefined) delete process.env.EMAILBISON_API_KEY;
  else process.env.EMAILBISON_API_KEY = ORIGINAL_ENV.EMAILBISON_API_KEY;

  if (ORIGINAL_ENV.EMAILBISON_BASE_URL === undefined) delete process.env.EMAILBISON_BASE_URL;
  else process.env.EMAILBISON_BASE_URL = ORIGINAL_ENV.EMAILBISON_BASE_URL;
});

describe('normalizeBaseUrl', () => {
  it('requires https and strips a trailing slash', () => {
    expect(normalizeBaseUrl('https://send.example.com/')).toBe('https://send.example.com');
    expect(normalizeBaseUrl('  https://send.example.com  ')).toBe('https://send.example.com');
  });

  it('rejects missing, http, and unparseable values', () => {
    expect(() => normalizeBaseUrl(undefined)).toThrow(AuthError);
    expect(() => normalizeBaseUrl('')).toThrow(MISSING_BASE_URL_MESSAGE);
    expect(() => normalizeBaseUrl('http://send.example.com')).toThrow(ValidationError);
    expect(() => normalizeBaseUrl('http://send.example.com')).toThrow(INVALID_BASE_URL_MESSAGE);
    expect(() => normalizeBaseUrl('send.example.com')).toThrow(INVALID_BASE_URL_MESSAGE);
  });
});

describe('resolveAuth', () => {
  it('fails with a login/env hint when no base URL is configured', () => {
    delete process.env.EMAILBISON_API_KEY;
    delete process.env.EMAILBISON_BASE_URL;

    expect(() => resolveAuth({ apiKey: 'test-key', config: {} })).toThrow(AuthError);
    expect(() => resolveAuth({ apiKey: 'test-key', config: {} })).toThrow(MISSING_BASE_URL_MESSAGE);
    expect(() => resolveAuth({ apiKey: 'test-key', config: {} })).toThrow(/bison login/);
    expect(() => resolveAuth({ apiKey: 'test-key', config: {} })).toThrow(/EMAILBISON_BASE_URL/);
  });

  it('fails with a login/env hint when no API key is configured', () => {
    delete process.env.EMAILBISON_API_KEY;
    delete process.env.EMAILBISON_BASE_URL;

    expect(() => resolveAuth({ baseUrl: 'https://send.example.com', config: {} })).toThrow(
      MISSING_API_KEY_MESSAGE,
    );
  });

  it('does not fall back to a hardcoded default instance', () => {
    delete process.env.EMAILBISON_BASE_URL;
    expect(() => resolveAuth({ apiKey: 'test-key', config: {} })).toThrow(MISSING_BASE_URL_MESSAGE);
  });

  it('prefers explicit options over env and config, and normalizes the URL', () => {
    process.env.EMAILBISON_API_KEY = 'env-key';
    process.env.EMAILBISON_BASE_URL = 'https://env.example.com';

    const auth = resolveAuth({
      apiKey: 'flag-key',
      baseUrl: 'https://flag.example.com/',
      config: { api_key: 'config-key', base_url: 'https://config.example.com' },
    });

    expect(auth).toEqual({
      apiKey: 'flag-key',
      baseUrl: 'https://flag.example.com',
    });
  });

  it('reads EMAILBISON_BASE_URL when no flag or config is present', () => {
    delete process.env.EMAILBISON_API_KEY;
    process.env.EMAILBISON_BASE_URL = 'https://send.example.com/';

    expect(resolveAuth({ apiKey: 'test-key', config: {} })).toEqual({
      apiKey: 'test-key',
      baseUrl: 'https://send.example.com',
    });
  });
});
