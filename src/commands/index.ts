import { createInterface } from 'node:readline/promises';
import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { resolveAuth } from '../core/auth.js';
import { createClient } from '../core/client.js';
import { saveConfig, deleteConfig, loadConfig, getConfigPath } from '../core/config.js';
import { output, outputError } from '../core/output.js';
import { formatError } from '../core/errors.js';

import { campaignCommands } from './campaigns/index.js';
import { campaignV11Commands } from './campaigns-v1.1/index.js';
import { leadCommands } from './leads/index.js';
import { replyCommands } from './replies/index.js';
import { accountCommands } from './accounts/index.js';
import { emailBlacklistCommands } from './email-blacklist/index.js';
import { domainBlacklistCommands } from './domain-blacklist/index.js';
import { tagCommands } from './tags/index.js';
import { trackingDomainCommands } from './tracking-domains/index.js';
import { webhookCommands } from './webhooks/index.js';
import { webhookEventCommands } from './webhook-events/index.js';
import { campaignEventCommands } from './campaign-events/index.js';
import { customVariableCommands } from './custom-variables/index.js';
import { ignorePhraseCommands } from './ignore-phrases/index.js';
import { replyTemplateCommands } from './reply-templates/index.js';
import { scheduledEmailCommands } from './scheduled-emails/index.js';
import { warmupCommands } from './warmup/index.js';
import { workspaceCommands } from './workspaces/index.js';
import { workspaceV11Commands } from './workspaces-v1.1/index.js';
import { userCommands } from './users/index.js';

export const allCommands: CommandDefinition[] = [
  ...userCommands,
  ...campaignCommands,
  ...campaignV11Commands,
  ...leadCommands,
  ...replyCommands,
  ...accountCommands,
  ...emailBlacklistCommands,
  ...domainBlacklistCommands,
  ...tagCommands,
  ...trackingDomainCommands,
  ...webhookCommands,
  ...webhookEventCommands,
  ...campaignEventCommands,
  ...customVariableCommands,
  ...ignorePhraseCommands,
  ...replyTemplateCommands,
  ...scheduledEmailCommands,
  ...warmupCommands,
  ...workspaceCommands,
  ...workspaceV11Commands,
];

function getGlobalOpts(program: Command): GlobalOptions {
  const opts = program.opts();
  return {
    pretty: opts.pretty,
    quiet: opts.quiet,
    fields: opts.fields,
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl,
    agent: opts.agent,
  };
}

function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Save your API key and base URL to ~/.emailbison/config.json')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);

      // Resolution order: --api-key global flag > EMAILBISON_API_KEY env > interactive prompt
      let apiKey = globalOpts.apiKey ?? process.env.EMAILBISON_API_KEY;
      let baseUrl = globalOpts.baseUrl ?? process.env.EMAILBISON_BASE_URL;

      if (!apiKey || !baseUrl) {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        if (!apiKey) {
          apiKey = (await rl.question('EmailBison API key: ')).trim();
        }
        if (!baseUrl) {
          baseUrl = (await rl.question('Base URL (e.g. https://send.yourinstance.com): ')).trim();
        }
        rl.close();
      }

      if (!apiKey) {
        outputError({ error: 'API key is required.', code: 'VALIDATION_ERROR' }, globalOpts);
        return;
      }
      if (!baseUrl) {
        outputError({ error: 'Base URL is required.', code: 'VALIDATION_ERROR' }, globalOpts);
        return;
      }

      const config: Record<string, string> = { api_key: apiKey };
      if (baseUrl) config.base_url = baseUrl;
      saveConfig(config);
      output({ success: true, message: 'Credentials saved.', config_path: getConfigPath() }, globalOpts);
    });
}

function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials from ~/.emailbison/config.json')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      deleteConfig();
      output({ success: true, message: 'Credentials removed.' }, globalOpts);
    });
}

function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current authentication status and config')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      try {
        const auth = resolveAuth({ apiKey: globalOpts.apiKey, baseUrl: globalOpts.baseUrl });
        const client = createClient(auth);
        const result = await client.request({ method: 'GET', path: '/api/users' });
        output({
          authenticated: true,
          base_url: auth.baseUrl,
          config_path: getConfigPath(),
          user: result,
        }, globalOpts);
      } catch (err) {
        const config = loadConfig();
        output({
          authenticated: false,
          base_url: config.base_url ?? '(not set)',
          api_key: config.api_key ? '***' + config.api_key.slice(-4) : '(not set)',
          config_path: getConfigPath(),
          error: err instanceof Error ? err.message : String(err),
        }, globalOpts);
      }
    });
}

function registerConfigCommand(program: Command): void {
  const configCmd = program.command('config').description('Manage CLI configuration');

  configCmd
    .command('set')
    .description('Set configuration values')
    .option('--api-key <key>', 'EmailBison API key')
    .option('--base-url <url>', 'EmailBison instance base URL')
    .action(async (opts) => {
      const globalOpts = getGlobalOpts(program);
      const updates: Record<string, string> = {};
      if (opts.apiKey) updates.api_key = opts.apiKey;
      if (opts.baseUrl) updates.base_url = opts.baseUrl;
      if (Object.keys(updates).length === 0) {
        outputError({ error: 'Provide at least --api-key or --base-url', code: 'VALIDATION_ERROR' }, globalOpts);
        return;
      }
      saveConfig(updates);
      output({ success: true, message: 'Config updated.', config_path: getConfigPath() }, globalOpts);
    });

  configCmd
    .command('get')
    .description('Show current configuration')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      const config = loadConfig();
      output({
        base_url: config.base_url ?? '(not set)',
        api_key: config.api_key ? '***' + config.api_key.slice(-4) : '(not set)',
        config_path: getConfigPath(),
      }, globalOpts);
    });
}

function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP (Model Context Protocol) server over stdio')
    .action(async () => {
      const { startMcpFromCli } = await import('../mcp-entry.js');
      await startMcpFromCli();
    });
}

function registerCommand(parent: Command, cmdDef: CommandDefinition, program: Command): void {
  const cmd = parent.command(cmdDef.subcommand).description(cmdDef.description);

  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      cmd.argument(arg.required !== false ? `<${arg.name}>` : `[${arg.name}]`, arg.field);
    }
  }

  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  if (cmdDef.examples?.length) {
    cmd.addHelpText(
      'after',
      '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'),
    );
  }

  cmd.action(async (...actionArgs: unknown[]) => {
    const globalOpts = getGlobalOpts(program);

    try {
      const auth = resolveAuth({ apiKey: globalOpts.apiKey, baseUrl: globalOpts.baseUrl });
      const client = createClient(auth);

      const input: Record<string, unknown> = {};

      const cmdOpts = actionArgs[actionArgs.length - 2] as Record<string, unknown>;
      if (cmdOpts && typeof cmdOpts === 'object') {
        // Use cliMappings to map Commander's camelCase keys back to schema field names.
        // --some-flag becomes someFlag in Commander; we need to put it back as some_flag (the schema key).
        if (cmdDef.cliMappings.options) {
          for (const optDef of cmdDef.cliMappings.options) {
            const flagName = optDef.flags.match(/--([a-zA-Z0-9][a-zA-Z0-9-_]*)/)?.[1] ?? optDef.field;
            // Commander converts hyphens to camelCase; underscores stay as-is
            const commanderKey = flagName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            const value = cmdOpts[commanderKey] ?? cmdOpts[flagName] ?? cmdOpts[optDef.field];
            if (value !== undefined) input[optDef.field] = value;
          }
        } else {
          for (const [key, val] of Object.entries(cmdOpts)) {
            if (val !== undefined) input[key] = val;
          }
        }
      }

      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          const argDef = cmdDef.cliMappings.args[i];
          const argVal = actionArgs[i];
          if (argVal !== undefined) input[argDef.field] = argVal;
        }
      }

      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        outputError(
          { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), code: 'VALIDATION_ERROR' },
          globalOpts,
        );
        return;
      }

      const result = await cmdDef.handler(parsed.data, client);
      output(result, globalOpts);
    } catch (err) {
      outputError(formatError(err), globalOpts);
    }
  });
}

export function registerAllCommands(program: Command): void {
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerStatusCommand(program);
  registerConfigCommand(program);
  registerMcpCommand(program);

  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program.command(groupName).description(`Manage ${groupName}`);
    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef, program);
    }
  }
}
