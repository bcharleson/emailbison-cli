// Single source of truth for the CLI version: package.json.
// It was hardcoded in src/index.ts and src/mcp-entry.ts and drifted to 0.1.0
// while package.json said 0.1.2, so `bison --version` lied about what was running.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function read(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const rel of ['../package.json', '../../package.json']) {
      try {
        return JSON.parse(readFileSync(join(here, rel), 'utf8')).version as string;
      } catch { /* try next */ }
    }
  } catch { /* fall through */ }
  return '0.0.0-unknown';
}

export const VERSION = read();
