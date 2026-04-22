import { z } from 'zod';
import type { CommandDefinition, BisonClient } from '../../core/types.js';

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
  description: 'Get campaign statistics. Defaults to the last 30 days when no dates are provided.',
  examples: [
    'bison campaigns stats --campaign-id abc123',
    'bison campaigns stats --campaign-id abc123 --start-date 2025-01-01 --end-date 2025-03-31',
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
  fieldMappings: {
    campaign_id: 'path',
    start_date: 'body',
    end_date: 'body',
  },
  handler: async (input: any, client: BisonClient) => {
    return client.request({
      method: 'POST',
      path: `/api/campaigns/${encodeURIComponent(input.campaign_id)}/stats`,
      body: {
        start_date: input.start_date ?? defaultStartDate(),
        end_date: input.end_date ?? defaultEndDate(),
      },
    });
  },
};
