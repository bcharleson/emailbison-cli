import type { GlobalOptions } from './types.js';
import { exitCodeFor } from './errors.js';

// --agent forces compact JSON; --pretty only applies when not in agent mode.
function prettyEnabled(opts?: GlobalOptions): boolean {
  return Boolean(opts?.pretty) && !opts?.agent;
}

export function output(data: unknown, opts?: GlobalOptions): void {
  if (opts?.quiet) return;

  let result = data;

  if (opts?.fields && typeof data === 'object' && data !== null) {
    result = projectFields(data, opts.fields);
  }

  const json = prettyEnabled(opts)
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result);

  console.log(json);
}

export function outputError(error: { error: string; code: string }, opts?: GlobalOptions): void {
  const exitCode = exitCodeFor(error.code);

  if (opts?.quiet) {
    process.exitCode = exitCode;
    return;
  }

  const json = prettyEnabled(opts)
    ? JSON.stringify(error, null, 2)
    : JSON.stringify(error);

  console.error(json);
  process.exitCode = exitCode;
}

function projectFields(data: unknown, fields: string): unknown {
  const keys = fields.split(',').map((k) => k.trim());

  if (Array.isArray(data)) {
    return data.map((item) => pickKeys(item, keys));
  }

  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) {
      return { ...data as object, data: inner.map((item) => pickKeys(item, keys)) };
    }
  }

  return pickKeys(data, keys);
}

function pickKeys(obj: unknown, keys: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in record) result[key] = record[key];
  }
  return result;
}
