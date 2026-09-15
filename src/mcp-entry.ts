import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allCommands } from './commands/index.js';
import { resolveAuth } from './core/auth.js';
import { createClient } from './core/client.js';
import { formatError } from './core/errors.js';
import { VERSION } from './core/version.js';

export async function startMcpFromCli(): Promise<void> {
  const auth = resolveAuth();
  const client = createClient(auth);

  const server = new McpServer({
    name: 'emailbison',
    version: VERSION,
  });

  for (const cmdDef of allCommands) {
    const zodShape: Record<string, unknown> = {};
    const shape = cmdDef.inputSchema.shape as Record<string, unknown>;
    for (const [key, val] of Object.entries(shape)) {
      zodShape[key] = val;
    }

    server.tool(
      cmdDef.name,
      cmdDef.description,
      zodShape,
      async (args: Record<string, unknown>) => {
        try {
          const parsed = cmdDef.inputSchema.safeParse(args);
          if (!parsed.success) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({ error: parsed.error.message, code: 'VALIDATION_ERROR' }),
                },
              ],
              isError: true,
            };
          }
          const result = await cmdDef.handler(parsed.data, client);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error: unknown) {
          return {
            content: [
              { type: 'text' as const, text: JSON.stringify(formatError(error)) },
            ],
            isError: true,
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
