import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';
import { VERSION } from './core/version.js';

const program = new Command();

program
  .name('bison')
  .description(
    'EmailBison CLI — manage campaigns, leads, replies, sender accounts, warmup, and more from your terminal.',
  )
  .version(VERSION)
  .option('--pretty', 'Pretty-print JSON output')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated fields to include in output')
  .option('--api-key <key>', 'EmailBison API key')
  .option('--base-url <url>', 'EmailBison instance base URL');

registerAllCommands(program);

program.parse();
