import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { buildComposePayload, dryRunResult, recipientInputSchema } from './compose.js';

export const repliesNewCommand: CommandDefinition = {
  name: 'replies_new',
  group: 'replies',
  subcommand: 'new',
  description:
    'Send a new one-off email. Maps CLI fields to the EmailBison API (message, sender_email_id, to_emails) and sends plain text as HTML so line breaks render.',
  examples: [
    'bison replies new --to-email user@example.com --from-sender-email-id 123 --subject "Hello" --body-text "Hi there"',
    'bison replies new --to "Jane <jane@example.com>" --sender-email-id 123 --body-html "<p>Hi</p>" --dry-run',
  ],
  inputSchema: z.object({
    to_email: z.string().optional().describe('Recipient email address'),
    to: recipientInputSchema.describe('Recipients as comma-separated emails or {name, email_address} objects'),
    from_sender_email_id: z.coerce.number().optional().describe('Sender email account ID'),
    sender_email_id: z.coerce.number().optional().describe('Sender email account ID (alias of from_sender_email_id)'),
    subject: z.string().optional().describe('Email subject'),
    body_text: z.string().optional().describe('Plain text body. Converted to safe HTML so paragraphs and line breaks render.'),
    body_html: z.string().optional().describe('HTML body, passed through as-is'),
    cc: recipientInputSchema.describe('CC recipients'),
    bcc: recipientInputSchema.describe('BCC recipients'),
    dry_run: z.boolean().optional().describe('Print the exact request payload without sending'),
  }),
  cliMappings: {
    options: [
      { field: 'to_email', flags: '--to-email <email>', description: 'Recipient email address' },
      { field: 'to', flags: '--to <emails>', description: 'Recipients (comma-separated or Name <email>)' },
      { field: 'from_sender_email_id', flags: '--from-sender-email-id <id>', description: 'Sender email account ID' },
      { field: 'sender_email_id', flags: '--sender-email-id <id>', description: 'Sender email account ID' },
      { field: 'subject', flags: '--subject <text>', description: 'Email subject' },
      { field: 'body_text', flags: '--body-text <text>', description: 'Plain text body (converted to HTML)' },
      { field: 'body_html', flags: '--body-html <html>', description: 'HTML body (passed through)' },
      { field: 'cc', flags: '--cc <emails>', description: 'CC recipients' },
      { field: 'bcc', flags: '--bcc <emails>', description: 'BCC recipients' },
      { field: 'dry_run', flags: '--dry-run', description: 'Print the payload without sending' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/replies/new' },
  fieldMappings: {
    to_email: 'body',
    from_sender_email_id: 'body',
    subject: 'body',
  },
  handler: async (input, client) => {
    const path = '/api/replies/new';
    const body = buildComposePayload(input);
    if (input.dry_run) return dryRunResult('POST', path, body);
    return client.request({ method: 'POST', path, body });
  },
};
