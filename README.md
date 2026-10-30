# emailbison-cli

**EmailBison in your terminal.** Manage campaigns, leads, replies, sender accounts, warmup, blacklists, webhooks, and workspaces — from a single command line.

157 commands across 20 API groups. Full coverage of the EmailBison API. Built for humans, scripts, CI/CD pipelines, and AI agents.

```
npm install -g emailbison-cli
```

---

## What This CLI Enables

EmailBison is a cold email and outbound sales platform. It handles email infrastructure, campaign sequencing, lead management, warmup, and a unified reply inbox.

**emailbison-cli** wraps the entire API into a scriptable interface:

* **Campaign management** — create, configure, launch, pause, resume, archive, and duplicate campaigns
* **Sequence authoring** — create multi-step email sequences with A/B variants
* **Lead lifecycle** — import, update, bulk CSV upload, status management, blacklisting
* **Master inbox** — read, reply, forward, classify interest, manage conversation threads
* **Sender accounts** — connect IMAP/SMTP accounts, MX checks, bulk daily limits, signatures
* **Warmup** — enable/disable warmup, manage daily warmup limits
* **Blacklists** — email and domain blacklist management
* **Tags** — organize campaigns, leads, and sender emails with custom tags
* **Webhooks** — subscribe to real-time events, test payloads
* **Workspaces** — multi-workspace management, members, API tokens, stats
* **MCP server** — every command is an AI tool for Claude, Cursor, or any MCP client

---

## Setup

### Step 1 — Install

```bash
npm install -g emailbison-cli
```

### Step 2 — Login

Get your API key from your EmailBison dashboard (Settings → Developer API → New API Token).

Pass `--api-key` and `--base-url` on `login` (or as global flags / env vars):

```bash
bison login --api-key 'your-api-key' --base-url 'https://send.example.com'
```

Or use environment variables (works with any key format including `|`):

```bash
export EMAILBISON_API_KEY='your-api-key'
export EMAILBISON_BASE_URL='https://send.example.com'
bison login
```

The base URL is **your** EmailBison instance URL (`https`, no trailing slash). There is no default host — every deployment has its own URL. If neither a flag, `EMAILBISON_BASE_URL`, nor saved config provides one, every command (and the MCP server) fails and tells you to run `bison login` or set the env var.

### Step 3 — Verify

```bash
bison status --pretty
```

---

## Authentication

Three ways to authenticate, checked in this order:

1. **`--api-key` flag** — pass on any command: `bison campaigns list --api-key <key>`
2. **Environment variable** — `export EMAILBISON_API_KEY=your-key`
3. **Stored config** — run `bison login` to save to `~/.emailbison/config.json`

The base URL is resolved the same way:

1. `--base-url` flag
2. `EMAILBISON_BASE_URL` env var
3. Stored config

Both values are required — there is **no default base URL**. The URL must be `https` (a trailing slash is stripped). Running any command or starting `bison mcp` without a configured base URL fails with: run `bison login` or set `EMAILBISON_BASE_URL`.

---

## Quick Start

```bash
# Authenticate
bison login --api-key <key> --base-url https://send.example.com

# List campaigns
bison campaigns list --pretty

# Create a campaign
bison campaigns create --name "Q2 Outreach"

# Create a schedule
bison campaigns schedule-create --campaign-id <id> \
  --monday true --tuesday true --wednesday true --thursday true --friday true \
  --start-time "09:00" --end-time "17:00" --timezone "America/New_York"

# Create sequence steps
bison campaigns sequence-steps-create --campaign-id <id> \
  --title "Main Sequence" \
  --sequence-steps '[{"email_subject":"Hey {FIRST_NAME}","email_body":"Check this out!","wait_in_days":1,"order":1}]'

# Import leads
bison leads create --email "cto@startup.com" --first-name "Alex"

# Attach leads and sender emails
bison campaigns attach-leads --campaign-id <id> --lead-ids '["lead1"]'
bison campaigns attach-sender-emails --campaign-id <id> --sender-email-ids '["se1"]'

# Launch
bison campaigns resume --campaign-id <id>

# Check replies
bison replies list --pretty
```

---

## Commands

### Auth & Config

```
bison login --api-key <key> --base-url <https-url>
bison logout
bison status
bison config set [--api-key <key>] [--base-url <https-url>]
bison config get
```

### Account Management (4)

```
bison users get
bison users update-password --current-password <pw> --password <new> --password-confirmation <new>
bison users update-profile-picture --photo <path>
bison users headless-ui-token
```

### Campaigns (36)

```
bison campaigns list [--page <n>]
bison campaigns get --id <id>
bison campaigns create --name <name>
bison campaigns update --id <id> [--max-emails-per-day <n>] [--open-tracking <bool>] ...
bison campaigns duplicate --campaign-id <id>
bison campaigns pause --campaign-id <id>
bison campaigns resume --campaign-id <id>
bison campaigns archive --campaign-id <id>
bison campaigns delete --campaign-id <id>
bison campaigns bulk-delete --campaign-ids '<json>'
bison campaigns stats --campaign-id <id>
bison campaigns line-area-chart-stats --campaign-id <id>
bison campaigns sender-emails --campaign-id <id>
bison campaigns attach-sender-emails --campaign-id <id> --sender-email-ids '<json>'
bison campaigns remove-sender-emails --campaign-id <id> --sender-email-ids '<json>'
bison campaigns leads --campaign-id <id>
bison campaigns attach-leads --campaign-id <id> --lead-ids '<json>'
bison campaigns attach-lead-list --campaign-id <id> --lead-list-id <id>
bison campaigns remove-leads --campaign-id <id> --lead-ids '<json>'
bison campaigns move-leads --campaign-id <id> --lead-ids '<json>' --to-campaign-id <id>
bison campaigns stop-future-emails --campaign-id <id> --lead-ids '<json>'
bison campaigns replies --campaign-id <id>
bison campaigns scheduled-emails --campaign-id <id>
bison campaigns sequence-steps-list --campaign-id <id>
bison campaigns sequence-steps-create --campaign-id <id> --title <title> --sequence-steps '<json>'
bison campaigns sequence-steps-update --sequence-id <id> [--email-subject <s>] [--email-body <s>]
bison campaigns sequence-steps-delete --sequence-step-id <id>
bison campaigns sequence-steps-toggle --sequence-step-id <id>
bison campaigns sequence-steps-test-email --sequence-step-id <id> --to-email <email>
bison campaigns schedule-get --campaign-id <id>
bison campaigns schedule-create --campaign-id <id> --monday <bool> ... --start-time <HH:MM> --end-time <HH:MM> --timezone <tz>
bison campaigns schedule-update --campaign-id <id> ...
bison campaigns schedule-from-template --campaign-id <id> --schedule-id <id>
bison campaigns schedule-templates
bison campaigns schedule-timezones
bison campaigns sending-schedules
```

### Campaigns v1.1 (3)

```
bison campaigns-v1.1 sequence-steps-list --campaign-id <id>
bison campaigns-v1.1 sequence-steps-create --campaign-id <id> --title <t> --sequence-steps '<json>'
bison campaigns-v1.1 sequence-steps-update --sequence-id <id> [options]
```

### Leads (18)

```
bison leads list [--page <n>]
bison leads get --lead-id <id>
bison leads create --email <email> [--first-name <n>] [--last-name <n>] ...
bison leads create-multiple --leads '<json>'
bison leads create-or-update --lead-id <id> [--email <e>] ...
bison leads create-or-update-multiple --leads '<json>'
bison leads update --lead-id <id> [--first-name <n>] ...
bison leads replace --lead-id <id> --email <email> ...
bison leads delete --lead-id <id>
bison leads bulk-delete --lead-ids '<json>'
bison leads bulk-csv --csv <csv-content> [--campaign-id <id>]
bison leads update-status --lead-id <id> --status <status>
bison leads bulk-update-status --lead-ids '<json>' --status <status>
bison leads unsubscribe --lead-id <id>
bison leads blacklist --lead-id <id>
bison leads replies --lead-id <id>
bison leads sent-emails --lead-id <id>
bison leads scheduled-emails --lead-id <id>
```

### Replies (14)

```
bison replies list [--page <n>] [--campaign-id <id>] [--is-read <bool>]
bison replies get --id <id>
bison replies new --to-email <e> --from-sender-email-id <id> --subject <s> --body-text <t>
bison replies reply --reply-id <id> --body-text <t>
bison replies forward --reply-id <id> --to-email <e>
bison replies mark-interested --reply-id <id>
bison replies mark-not-interested --reply-id <id>
bison replies mark-read-unread --reply-id <id> --is-read <bool>
bison replies mark-automated --reply-id <id> --is-automated <bool>
bison replies unsubscribe --reply-id <id>
bison replies conversation-thread --reply-id <id>
bison replies attach-scheduled-email --reply-id <id> --scheduled-email-id <id>
bison replies push-to-followup --reply-id <id> --campaign-id <id>
bison replies delete --reply-id <id>
```

### Email Accounts (13)

```
bison accounts list [--page <n>]
bison accounts get --senderEmailId <id>
bison accounts update --senderEmailId <id> [--from-name <n>] [--daily-limit <n>]
bison accounts delete --senderEmailId <id>
bison accounts create-imap-smtp --email <e> --imap-host <h> --imap-port <p> --smtp-host <h> --smtp-port <p> ...
bison accounts bulk-create --sender-emails '<json>'
bison accounts campaigns --senderEmailId <id>
bison accounts replies --senderEmailId <id>
bison accounts oauth-token --senderEmailId <id>
bison accounts check-mx --senderEmailId <id>
bison accounts bulk-check-mx
bison accounts bulk-daily-limits --sender-email-ids '<json>' --daily-limit <n>
bison accounts bulk-signatures --sender-email-ids '<json>' --signature <html>
```

### Email Blacklist (5)

```
bison email-blacklist list
bison email-blacklist get --blacklisted-email-id <id>
bison email-blacklist create --email <email>
bison email-blacklist bulk-create --emails '<json>'
bison email-blacklist delete --blacklisted-email-id <id>
```

### Domain Blacklist (5)

```
bison domain-blacklist list
bison domain-blacklist get --blacklisted-domain-id <id>
bison domain-blacklist create --domain <domain>
bison domain-blacklist bulk-create --domains '<json>'
bison domain-blacklist delete --blacklisted-domain-id <id>
```

### Custom Tags (10)

```
bison tags list
bison tags get --id <id>
bison tags create --name <name>
bison tags delete --tag-id <id>
bison tags attach-to-campaigns --tag-ids '<json>' --campaign-ids '<json>'
bison tags remove-from-campaigns --tag-ids '<json>' --campaign-ids '<json>'
bison tags attach-to-leads --tag-ids '<json>' --lead-ids '<json>'
bison tags remove-from-leads --tag-ids '<json>' --lead-ids '<json>'
bison tags attach-to-sender-emails --tag-ids '<json>' --sender-email-ids '<json>'
bison tags remove-from-sender-emails --tag-ids '<json>' --sender-email-ids '<json>'
```

### Custom Tracking Domains (4)

```
bison tracking-domains list
bison tracking-domains get --id <id>
bison tracking-domains create --domain <domain>
bison tracking-domains delete --custom-tracking-domain-id <id>
```

### Webhooks (5)

```
bison webhooks list
bison webhooks get --id <id>
bison webhooks create --url <url> [--event-types '<json>']
bison webhooks update --id <id> [--url <url>]
bison webhooks delete --webhook-url-id <id>
```

### Webhook Events (3)

```
bison webhook-events event-types
bison webhook-events sample-payload [--event-type <type>]
bison webhook-events test --webhook-url-id <id> --event-type <type>
```

### Campaign Events (1)

```
bison campaign-events stats [--campaign-id <id>] [--start-date <date>] [--end-date <date>]
```

### Custom Lead Variables (2)

```
bison custom-variables list
bison custom-variables create --name <name>
```

### Ignore Phrases (4)

```
bison ignore-phrases list
bison ignore-phrases get --ignore-phrase-id <id>
bison ignore-phrases create --phrase <phrase>
bison ignore-phrases delete --ignore-phrase-id <id>
```

### Reply Templates (5)

```
bison reply-templates list
bison reply-templates get --id <id>
bison reply-templates create --name <name> [--body-text <t>] [--body-html <h>]
bison reply-templates update --id <id> [--name <n>]
bison reply-templates delete --reply-template-id <id>
```

### Scheduled Emails (2)

```
bison scheduled-emails list
bison scheduled-emails get --id <id>
```

### Warmup (5)

```
bison warmup list
bison warmup get --senderEmailId <id>
bison warmup enable --sender-email-ids '<json>'
bison warmup disable --sender-email-ids '<json>'
bison warmup update-limits --sender-email-ids '<json>' --daily-warmup-limit <n>
```

### Workspaces v1.1 (15)

```
bison workspaces-v1.1 list
bison workspaces-v1.1 get --team-id <id>
bison workspaces-v1.1 create --name <name>
bison workspaces-v1.1 update --team-id <id> --name <name>
bison workspaces-v1.1 delete --team-id <id>
bison workspaces-v1.1 switch --team-id <id>
bison workspaces-v1.1 create-user --name <n> --email <e> --password <p>
bison workspaces-v1.1 invite-members --emails '<json>'
bison workspaces-v1.1 accept-invite --team-invitation-id <id>
bison workspaces-v1.1 remove-member --user-id <id>
bison workspaces-v1.1 create-api-token --team-id <id> --name <name>
bison workspaces-v1.1 stats [--start-date <d>] [--end-date <d>]
bison workspaces-v1.1 line-area-chart-stats [--start-date <d>] [--end-date <d>]
bison workspaces-v1.1 master-inbox-settings
bison workspaces-v1.1 update-master-inbox-settings --settings '<json>'
```

---

## Output

All commands output JSON. Pipe to `jq`, save to files, or feed to other tools.

```bash
# Pretty print
bison campaigns list --pretty

# Select fields
bison campaigns list --fields "id,name"

# Quiet mode (exit code only)
bison campaigns resume --campaign-id <id> --quiet
```

---

## MCP Server

Every command is available as an MCP tool for AI assistants.

`bison mcp` uses the same auth as the CLI. Set `EMAILBISON_API_KEY` and `EMAILBISON_BASE_URL` (or run `bison login` first). The server will not start without both.

```bash
bison mcp
```

### Configure in Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "emailbison": {
      "command": "npx",
      "args": ["emailbison-cli", "mcp"],
      "env": {
        "EMAILBISON_API_KEY": "your-api-key",
        "EMAILBISON_BASE_URL": "https://send.example.com"
      }
    }
  }
}
```

157 tools registered across 20 groups: users, campaigns, campaigns-v1.1, leads, replies, accounts, email-blacklist, domain-blacklist, tags, tracking-domains, webhooks, webhook-events, campaign-events, custom-variables, ignore-phrases, reply-templates, scheduled-emails, warmup, workspaces, workspaces-v1.1.

---

## Agent Skills

The repo ships 12 agent skills (`SKILL.md` files) covering every area of the platform:

| Skill | Use Case |
|---|---|
| skills/bison-campaigns/ | Create, configure, launch, pause, resume campaigns |
| skills/bison-sequences/ | Email sequence steps, A/B variants, test emails |
| skills/bison-schedules/ | Campaign scheduling, templates, timezones |
| skills/bison-leads/ | Lead import, update, bulk CSV, status management |
| skills/bison-replies/ | Master inbox, reply, forward, interest classification |
| skills/bison-accounts/ | Sender email accounts, IMAP/SMTP, MX checks |
| skills/bison-warmup/ | Warmup enable/disable, daily limits |
| skills/bison-blacklist/ | Email and domain blacklist management |
| skills/bison-tags/ | Custom tags for campaigns, leads, sender emails |
| skills/bison-webhooks/ | Webhook management, event types, test payloads |
| skills/bison-workspaces/ | Workspace management, members, API tokens, stats |
| skills/bison-outbound-prep/ | Full workflow: campaign creation through launch |

### Install all skills at once

```bash
npx skills add https://github.com/bcharleson/emailbison-cli
```

### Install a specific skill

```bash
npx skills add https://github.com/bcharleson/emailbison-cli/tree/main/skills/bison-outbound-prep
```

---

## Architecture

Every command is a `CommandDefinition` — one source of truth powering both the CLI subcommand and the MCP tool:

```
src/
├── core/
│   ├── types.ts      # CommandDefinition interfaces
│   ├── client.ts     # HTTP client (retry, rate limit, pagination)
│   ├── auth.ts       # API key resolution
│   ├── config.ts     # ~/.emailbison/ config management
│   ├── errors.ts     # Typed error classes
│   ├── output.ts     # JSON output formatting
│   └── handler.ts    # Request builder from CommandDefinition
├── commands/
│   ├── campaigns/          # 36 commands
│   ├── campaigns-v1.1/     # 3 commands
│   ├── leads/              # 18 commands
│   ├── replies/            # 14 commands
│   ├── accounts/           # 13 commands
│   ├── email-blacklist/    # 5 commands
│   ├── domain-blacklist/   # 5 commands
│   ├── tags/               # 10 commands
│   ├── tracking-domains/   # 4 commands
│   ├── webhooks/           # 5 commands
│   ├── webhook-events/     # 3 commands
│   ├── campaign-events/    # 1 command
│   ├── custom-variables/   # 2 commands
│   ├── ignore-phrases/     # 4 commands
│   ├── reply-templates/    # 5 commands
│   ├── scheduled-emails/   # 2 commands
│   ├── warmup/             # 5 commands
│   ├── users/              # 4 commands
│   ├── workspaces/         # 9 commands
│   └── workspaces-v1.1/    # 15 commands
├── mcp-entry.ts    # MCP server (auto-registers all commands)
└── index.ts        # CLI entry point
```

Adding a new command = one new file. It's automatically available in both CLI and MCP.

---

## Development

```bash
git clone https://github.com/bcharleson/emailbison-cli.git
cd emailbison-cli
npm install
npm run dev -- campaigns list    # Run in dev mode
npm run build                    # Build with tsup
npm run typecheck                # Type-check
```

---

## License

MIT

## Inspired by

* bcharleson/instantly-cli — architecture pattern
* bcharleson/ms365-cli — CommandDefinition pattern
* googleworkspace/cli — agent-native CLI design
