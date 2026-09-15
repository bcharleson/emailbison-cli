import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';
import { booleanFlag } from '../../core/schema.js';

export const repliesMarkAutomatedCommand: CommandDefinition = {
  name: 'replies_mark-automated',
  group: 'replies',
  subcommand: 'mark-automated',
  description: 'Mark a reply as automated or not automated.',
  examples: [
    'bison replies mark-automated <reply-id> --is-automated true',
    'bison replies mark-automated <reply-id> --is-automated false',
  ],
  inputSchema: z.object({
    reply_id: z.string().describe('Reply ID'),
    is_automated: booleanFlag.describe('Set automated (true) or not automated (false)'),
  }),
  cliMappings: {
    args: [{ field: 'reply_id', name: 'reply-id', required: true }],
    options: [
      { field: 'is_automated', flags: '--is-automated <boolean>', description: 'Set automated (true) or not (false)' },
    ],
  },
  endpoint: { method: 'PATCH', path: '/api/replies/{reply_id}/mark-as-automated-or-not-automated' },
  fieldMappings: { reply_id: 'path', is_automated: 'body' },
  // Same shape as mark-read-unread: the API's field is `automated`, not `is_automated`
  // ("The automated field is required.", verified against the live API 2026-09-02).
  transformBody: ({ is_automated, ...rest }: Record<string, unknown>) => ({ ...rest, automated: is_automated }),
  handler: (input, client) => executeCommand(repliesMarkAutomatedCommand, input, client),
};
