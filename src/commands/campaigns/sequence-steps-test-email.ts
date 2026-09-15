import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsSequenceStepsTestEmailCommand: CommandDefinition = {
  name: 'campaigns_sequence-steps-test-email',
  group: 'campaigns',
  subcommand: 'sequence-steps-test-email',
  description: 'Send a test email for a sequence step.',
  examples: ['bison campaigns sequence-steps-test-email --sequence-step_id step123 --to-email test@example.com'],
  inputSchema: z.object({
    sequence_step_id: z.string().describe('Sequence step ID'),
    to_email: z.string().describe('Email address to send test to'),
    sender_email_id: z.string().optional().describe('Sender email account ID to send FROM (REQUIRED by the API)'),
  }),
  cliMappings: {
    options: [
      { field: 'sequence_step_id', flags: '--sequence-step-id <string>', description: 'Sequence step ID' },
      { field: 'to_email', flags: '--to-email <string>', description: 'Recipient email address' },
      { field: 'sender_email_id', flags: '--sender-email-id <string>', description: 'Sender email account ID (REQUIRED by the API)' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/campaigns/sequence-steps/{sequence_step_id}/test-email' },
  fieldMappings: { sequence_step_id: 'path', to_email: 'body', sender_email_id: 'body' },
  handler: (input, client) => executeCommand(campaignsSequenceStepsTestEmailCommand, input, client),
};
