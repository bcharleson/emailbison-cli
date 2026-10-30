import { startMcpFromCli } from './mcp-entry.js';
import { formatError } from './core/errors.js';

startMcpFromCli().catch((err) => {
  const formatted = formatError(err);
  console.error(JSON.stringify(formatted));
  process.exit(1);
});
