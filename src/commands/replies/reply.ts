import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import {
  buildComposePayload,
  dryRunResult,
  fetchReplyDefaults,
  hasRecipientInput,
  recipientInputSchema,
} from './compose.js';

export const repliesReplyCommand: CommandDefinition = {
  name: 'replies_reply',
  group: 'replies',
  subcommand: 'reply',
  description:
    'Reply to a specific reply thread. Defaults sender and recipients from the original message; plain text is sent as HTML so line breaks render.',
  examples: [
    'bison replies reply <reply-id> --body-text "Thanks for your email"',
    'bison replies reply <reply-id> --body-text "Hi...\\n\\nPara2" --dry-run',
    'bison replies reply <reply-id> --body-html "<p>Thanks</p>" --reply-all',
    'bison replies reply <reply-id> --body-text "Following up" --to "Jane <jane@example.com>" --cc teammate@example.com',
  ],
  inputSchema: z.object({
    reply_id: z.coerce.string().describe('Reply ID to respond to'),
    body_text: z.string().optional().describe('Plain text body. Converted to safe HTML so paragraphs and line breaks render.'),
    body_html: z.string().optional().describe('HTML body, passed through as-is'),
    sender_email_id: z.coerce.number().optional().describe('Sender inbox ID. Defaults to the inbox that received the original reply.'),
    to: recipientInputSchema.describe('Recipients. Defaults to the original sender. Comma-separated emails or {name, email_address}.'),
    cc: recipientInputSchema.describe('CC recipients'),
    bcc: recipientInputSchema.describe('BCC recipients'),
    reply_all: z.boolean().optional().describe('Let EmailBison choose sender and recipients from the original reply'),
    dry_run: z.boolean().optional().describe('Print the exact request payload without sending'),
  }),
  cliMappings: {
    args: [{ field: 'reply_id', name: 'reply-id', required: true }],
    options: [
      { field: 'body_text', flags: '--body-text <text>', description: 'Plain text body (converted to HTML)' },
      { field: 'body_html', flags: '--body-html <html>', description: 'HTML body (passed through)' },
      { field: 'sender_email_id', flags: '--sender-email-id <id>', description: 'Sender inbox ID (defaults to the receiving inbox)' },
      { field: 'to', flags: '--to <emails>', description: 'Recipients (defaults to the original sender)' },
      { field: 'cc', flags: '--cc <emails>', description: 'CC recipients' },
      { field: 'bcc', flags: '--bcc <emails>', description: 'BCC recipients' },
      { field: 'reply_all', flags: '--reply-all', description: 'Reply to all original recipients' },
      { field: 'dry_run', flags: '--dry-run', description: 'Print the payload without sending' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/replies/{reply_id}/reply' },
  fieldMappings: { reply_id: 'path' },
  handler: async (input, client) => {
    const path = `/api/replies/${encodeURIComponent(String(input.reply_id))}/reply`;
    const needsDefaults =
      input.reply_all !== true && (input.sender_email_id === undefined || !hasRecipientInput(input.to));
    const defaults = needsDefaults ? await fetchReplyDefaults(client, input.reply_id) : undefined;
    const body = buildComposePayload(input, defaults);
    if (input.dry_run) return dryRunResult('POST', path, body);
    return client.request({ method: 'POST', path, body });
  },
};
