# bison-blacklist — Manage email and domain suppression lists

Blacklists prevent outreach to specific email addresses or entire domains. Use this skill to manage suppression lists that protect sender reputation and ensure compliance before launching campaigns.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

### Email Blacklist

#### List all blacklisted emails

```bash
bison email-blacklist list
bison email-blacklist list --page 2
```

#### Get a specific blacklisted email by ID

```bash
bison email-blacklist get --blacklisted_email_id <id>
```

#### Blacklist a single email

```bash
bison email-blacklist create --email "spam@example.com"
```

#### Bulk blacklist multiple emails

```bash
bison email-blacklist bulk-create --emails '["a@b.com","c@d.com","e@f.com"]'
```

#### Remove an email from the blacklist

```bash
bison email-blacklist delete --blacklisted_email_id <id>
```

### Domain Blacklist

#### List all blacklisted domains

```bash
bison domain-blacklist list
bison domain-blacklist list --page 2
```

#### Get a specific blacklisted domain by ID

```bash
bison domain-blacklist get --blacklisted_domain_id <id>
```

#### Blacklist a single domain

```bash
bison domain-blacklist create --domain "competitor.com"
```

#### Bulk blacklist multiple domains

```bash
bison domain-blacklist bulk-create --domains '["spam.com","block.com","junk.net"]'
```

#### Remove a domain from the blacklist

```bash
bison domain-blacklist delete --blacklisted_domain_id <id>
```

## output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to select specific keys, or `--quiet` for exit-code-only mode.

```bash
bison email-blacklist list --pretty
bison domain-blacklist list --fields "data.domain"
```

Pipe to `jq` for processing:

```bash
bison email-blacklist list | jq '.data[] | .email'
bison domain-blacklist list | jq '[.data[] | .domain]'
```

## common patterns

### Pre-campaign suppression list setup

Before launching a campaign, block known bad addresses and competitor domains:

```bash
# Block competitor domains
bison domain-blacklist bulk-create --domains '["competitor1.com","competitor2.com","partner-do-not-contact.com"]'

# Block known bounces / unsubscribes from external sources
bison email-blacklist bulk-create --emails '["bounce1@example.com","unsub@oldlist.com","complaint@isp.com"]'
```

### Export current blacklist for audit

```bash
bison email-blacklist list --pretty | jq '[.data[] | .email]' > blacklisted-emails.json
bison domain-blacklist list --pretty | jq '[.data[] | .domain]' > blacklisted-domains.json
```

### Import suppression list from a file

```bash
EMAILS=$(cat suppression-list.json)
bison email-blacklist bulk-create --emails "$EMAILS"
```

Where `suppression-list.json` contains `["addr1@example.com","addr2@example.com"]`.

### Block an entire domain after a complaint

```bash
bison domain-blacklist create --domain "complained-company.com"
```

### Clean up stale blacklist entries

Find and remove a specific entry:

```bash
# Find the blacklist entry ID
ENTRY_ID=$(bison email-blacklist list | jq -r '.data[] | select(.email == "old@example.com") | .id')

# Remove it
bison email-blacklist delete --blacklisted_email_id "$ENTRY_ID"
```

### Bulk-block free email providers for B2B campaigns

```bash
bison domain-blacklist bulk-create --domains '["gmail.com","yahoo.com","hotmail.com","outlook.com","aol.com"]'
```

### Verify a domain is blacklisted

```bash
bison domain-blacklist list | jq '.data[] | select(.domain == "competitor.com")'
```
