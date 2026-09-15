import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';
import { booleanFlag } from '../../core/schema.js';

export const repliesListCommand: CommandDefinition = {
  name: 'replies_list',
  group: 'replies',
  subcommand: 'list',
  description: 'List all replies in the workspace.',
  examples: [
    'bison replies list',
    'bison replies list --page 2',
    'bison replies list --campaign-id abc123',
  ],
  inputSchema: z.object({
    page: z.coerce.number().optional().describe('Page number for pagination'),
    campaign_id: z.string().optional().describe('Filter by campaign ID'),
    is_read: booleanFlag.optional().describe('Filter by read status'),
  }),
  cliMappings: {
    options: [
      { field: 'page', flags: '--page <number>', description: 'Page number' },
      { field: 'campaign_id', flags: '--campaign-id <id>', description: 'Filter by campaign ID' },
      { field: 'is_read', flags: '--is-read <boolean>', description: 'Filter by read status' },
    ],
  },
  endpoint: { method: 'GET', path: '/api/replies' },
  fieldMappings: { page: 'query', campaign_id: 'query', is_read: 'query' },
  handler: (input, client) => executeCommand(repliesListCommand, input, client),
};
