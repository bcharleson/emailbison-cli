import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const workspacesV11InviteMembersCommand: CommandDefinition = {
  name: 'workspaces-v1.1_invite-members',
  group: 'workspaces-v1.1',
  subcommand: 'invite-members',
  description: 'Invite members to a workspace (v1.1).',
  examples: ['bison workspaces-v1.1 invite-members --email user@example.com --role reseller'],
  inputSchema: z.object({
    email: z.string().describe('Email address to invite'),
    role: z.string().describe('Role for the invited member, e.g. reseller, admin'),
  }),
  cliMappings: {
    options: [
      { field: 'email', flags: '--email <string>', description: 'Email address to invite' },
      { field: 'role', flags: '--role <string>', description: 'Role for the invited member, e.g. reseller, admin' },
    ],
  },
  endpoint: { method: 'POST', path: '/api/workspaces/invite-members' },
  fieldMappings: { email: 'body', role: 'body' },
  handler: (input, client) => executeCommand(workspacesV11InviteMembersCommand, input, client),
};
