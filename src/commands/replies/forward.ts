import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import {
  buildComposePayload,
  dryRunResult,
  fetchReplyDefaults,
  recipientInputSchema,
} from './compose.js';

export const repliesForwardCommand: CommandDefinition = {
  name: 'replies_forward',
  group: 'replies',
  subcommand: 'forward',
  description:
    'Forward a reply. Defaults sender_email_id from the original inbox; maps recipients to to_emails and sends plain text as HTML so line breaks render.',
  examples: [
    'bison replies forward <reply-id> --to-email user@example.com --body-text "FYI"',
    'bison replies forward <reply-id> --to teammate@example.com --dry-run',
  ],
  inputSchema: z.object({
    reply_id: z.coerce.string().describe('Reply ID to forward'),
    to_email: z.string().optional().describe('Recipient email address'),
    to: recipientInputSchema.describe('Recipients as comma-separated emails or {name, email_address} objects'),
    body_text: z.string().optional().describe('Optional additional text. Converted to safe HTML so paragraphs and line breaks render.'),
    body_html: z.string().optional().describe('HTML body, passed through as-is'),
    sender_email_id: z.coerce.number().optional().describe('Sender inbox ID. Defaults to the inbox that received the original reply.'),
    cc: recipientInputSchema.describe('CC recipients'),
    bcc: recipientInputSchema.describe('BCC recipients'),
    reply_all: z.boolean().optional().describe('Let EmailBison choose sender and recipients from the original reply'),
    dry_run: z.boolean().optional().describe('Print the exact request payload without sending'),
  }),
  cliMappings: {
    args: [{ field: 'reply_id', name: 'reply-id', required: true }],
    options: [
      { field: 'to_email', flags: '--to-email <email>', description: 'Recipient email address' },
      { field: 'to', flags: '--to <emails>', description: 'Recipients (comma-separated or Name <email>)' },
      { field: 'body_text', flags: '--body-text <text>', description: 'Optional additional text (converted to HTML)' },
      { field: 'body_html', flags: '--body-html <html>', description: 'HTML body (passed through)' },
      { field: 'sender_email_id', flags: '--sender-email-id <id>', description: 'Sender inbox ID (defaults to the receiving inbox)' },
      { field: 'cc', flags: '--cc <emails>', description: 'CC recipients' },
      { field: 'bcc', flags: '--bcc <emails>', description: 'BCC recipients' },
      { field: 'reply_all', flags: '--reply-all', description: 'Use original recipients' },
      { field: 'dry_run', flags: '--dry-run', description: 'Print the payload without sending' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/replies/{reply_id}/forward' },
  fieldMappings: { reply_id: 'path' },
  handler: async (input, client) => {
    const path = `/api/replies/${encodeURIComponent(String(input.reply_id))}/forward`;
    const needsSender = input.reply_all !== true && input.sender_email_id === undefined;
    const fetched = needsSender ? await fetchReplyDefaults(client, input.reply_id) : undefined;
    const body = buildComposePayload(
      input,
      fetched ? { sender_email_id: fetched.sender_email_id } : undefined,
      { messageRequired: false },
    );
    if (input.dry_run) return dryRunResult('POST', path, body);
    return client.request({ method: 'POST', path, body });
  },
};
