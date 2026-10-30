# emailbison-cli — Agent Context

## What this is

CLI and MCP server for the EmailBison cold email platform. 157 commands across 20 API groups. Every command works as both a CLI subcommand and an MCP tool.

## Binary

`bison` — installed via `npm install -g emailbison-cli`

## Authentication

There is **no default instance URL**. Every EmailBison deployment has its own host. Commands and the MCP server fail until both an API key and a base URL are set.

```bash
bison login --api-key <key> --base-url https://send.example.com
```

Or set environment variables:
```bash
export EMAILBISON_API_KEY=your-key
export EMAILBISON_BASE_URL=https://send.example.com
```

The base URL must be `https` (trailing slash is stripped). Resolution order: flag > env (`EMAILBISON_API_KEY` / `EMAILBISON_BASE_URL`) > `~/.emailbison/config.json`.

## Key concepts

- **Campaigns** — email sequences sent to leads via sender accounts on a schedule
- **Leads** — contacts/prospects targeted by campaigns
- **Sender Emails** — email accounts used to send campaigns (IMAP/SMTP or OAuth)
- **Sequence Steps** — individual emails in a campaign sequence, supports A/B variants
- **Replies** — incoming responses from leads, managed in the master inbox
- **Warmup** — gradual sending ramp-up for new sender accounts
- **Tags** — organizational labels for campaigns, leads, and sender emails
- **Workspaces** — isolated tenants, each with their own campaigns, leads, and accounts

## Output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to project specific fields, `--quiet` for exit-code-only.

## Architecture

One `CommandDefinition` per endpoint. The definition drives both CLI registration and MCP tool generation. Adding a command = one file.

## Development

```bash
npm run dev -- <command>     # tsx for development
npm run build                # tsup build
npm run typecheck            # tsc --noEmit
```

## Command groups

users (4), campaigns (36), campaigns-v1.1 (3), leads (18), replies (14), accounts (13), email-blacklist (5), domain-blacklist (5), tags (10), tracking-domains (4), webhooks (5), webhook-events (3), campaign-events (1), custom-variables (2), ignore-phrases (4), reply-templates (5), scheduled-emails (2), warmup (5), workspaces (9), workspaces-v1.1 (15)
