import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';
import { booleanFlag } from '../../core/schema.js';

export const repliesMarkReadUnreadCommand: CommandDefinition = {
  name: 'replies_mark-read-unread',
  group: 'replies',
  subcommand: 'mark-read-unread',
  description: 'Mark a reply as read or unread.',
  examples: [
    'bison replies mark-read-unread <reply-id> --is-read true',
    'bison replies mark-read-unread <reply-id> --is-read false',
  ],
  inputSchema: z.object({
    reply_id: z.string().describe('Reply ID'),
    is_read: booleanFlag.describe('Set read (true) or unread (false)'),
  }),
  cliMappings: {
    args: [{ field: 'reply_id', name: 'reply-id', required: true }],
    options: [
      { field: 'is_read', flags: '--is-read <boolean>', description: 'Set read (true) or unread (false)' },
    ],
  },
  endpoint: { method: 'PATCH', path: '/api/replies/{reply_id}/mark-as-read-or-unread' },
  fieldMappings: { reply_id: 'path', is_read: 'body' },
  // The API's field is `read`, not `is_read`. Sending `is_read` 422s with
  // "The read field is required." (verified against the live API 2026-09-02).
  transformBody: ({ is_read, ...rest }: Record<string, unknown>) => ({ ...rest, read: is_read }),
  handler: (input, client) => executeCommand(repliesMarkReadUnreadCommand, input, client),
};
