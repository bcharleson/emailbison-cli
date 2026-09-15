import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function defaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const campaignsStatsCommand: CommandDefinition = {
  name: 'campaigns_stats',
  group: 'campaigns',
  subcommand: 'stats',
  // start_date/end_date are REQUIRED by the API and were missing here, so every call
  // 422'd with "The start date field is required" and the command looked broken.
  // They are BODY fields on a POST, not query params. Defaults to the last 30 days.
  // For the workspace-wide roll-up (what the dashboard shows) use:
  //   bison workspaces-v1.1 stats --start-date ... --end-date ...
  description: 'Get campaign statistics for a date range (defaults to the last 30 days).',
  examples: [
    'bison campaigns stats --campaign-id 270',
    'bison campaigns stats --campaign-id 270 --start-date 2026-06-28 --end-date 2026-08-27',
  ],
  inputSchema: z.object({
    campaign_id: z.string().describe('Campaign ID'),
    start_date: z.string().optional().describe('Start date (YYYY-MM-DD). Defaults to 30 days ago.'),
    end_date: z.string().optional().describe('End date (YYYY-MM-DD). Defaults to today.'),
  }),
  cliMappings: {
    options: [
      { field: 'campaign_id', flags: '--campaign-id <string>', description: 'Campaign ID' },
      { field: 'start_date', flags: '--start-date <string>', description: 'Start date YYYY-MM-DD (default: 30 days ago)' },
      { field: 'end_date', flags: '--end-date <string>', description: 'End date YYYY-MM-DD (default: today)' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/campaigns/{campaign_id}/stats' },
  fieldMappings: { campaign_id: 'path', start_date: 'body', end_date: 'body' },
  handler: (input, client) =>
    executeCommand(campaignsStatsCommand, {
      ...input,
      start_date: input.start_date ?? defaultStartDate(),
      end_date: input.end_date ?? defaultEndDate(),
    }, client),
};
