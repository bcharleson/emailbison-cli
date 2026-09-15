import { z } from 'zod';

/**
 * Boolean flag parser for CLI/MCP input.
 *
 * `z.coerce.boolean()` is WRONG for flag values: it runs JS `Boolean(value)`, and every
 * non-empty string is truthy, so "false" and "0" both parse as TRUE. That silently turned
 * `--is-read false` into a request to mark the reply READ, and the same for every other
 * boolean flag in the CLI. Verified 2026-09-02: "true"|"false"|"0"|"1" all parsed true.
 *
 * Accepts the shapes a user or an MCP client actually sends, and REJECTS anything else
 * rather than guessing, so a typo fails loudly instead of defaulting to true.
 */
export const booleanFlag = z.preprocess((v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return v;
}, z.boolean());
