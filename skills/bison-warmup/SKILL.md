# bison-warmup — Manage email warmup for sender accounts

Warmup gradually increases sending volume on new or cold email accounts to build domain reputation with inbox providers. This skill covers listing, enabling, disabling, and tuning warmup settings via the `bison` CLI.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

### List all warmup sender emails

```bash
bison warmup list
bison warmup list --page 2
```

Returns a paginated list of sender email accounts and their warmup status.

### Get warmup details for a specific sender email

```bash
bison warmup get --senderEmailId <sender-email-id>
```

Returns warmup configuration and current status for a single sender email.

### Enable warmup on sender emails

```bash
bison warmup enable --sender_email_ids '["id1","id2"]'
```

Activates warmup mode for one or more sender email accounts. Pass a JSON string array of sender email IDs.

### Disable warmup on sender emails

```bash
bison warmup disable --sender_email_ids '["id1"]'
```

Deactivates warmup mode for specified sender email accounts.

### Update daily warmup limits

```bash
bison warmup update-limits --sender_email_ids '["id1"]' --daily_warmup_limit 25
bison warmup update-limits --sender_email_ids '["id1","id2","id3"]' --daily_warmup_limit 50
```

Sets the maximum number of warmup emails sent per day for the specified accounts.

## output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to select specific keys, or `--quiet` for exit-code-only mode.

```bash
bison warmup list --pretty
bison warmup list --fields "data.email,data.warmup_status"
bison warmup get --senderEmailId abc123 --pretty
```

Pipe JSON output to `jq` for further processing:

```bash
bison warmup list | jq '.data[] | select(.warmup_status == "active") | .id'
```

## common patterns

### Warm up newly added sender accounts

After adding new IMAP/SMTP accounts, enable warmup and set conservative daily limits before launching campaigns:

```bash
SENDER_IDS=$(bison accounts list | jq -c '[.data[].id]')

bison warmup enable --sender_email_ids "$SENDER_IDS"

bison warmup update-limits --sender_email_ids "$SENDER_IDS" --daily_warmup_limit 15
```

### Ramp up warmup limits over time

Start low and increase daily limits as account reputation builds:

```bash
# Week 1: conservative
bison warmup update-limits --sender_email_ids '["id1"]' --daily_warmup_limit 10

# Week 2: increase
bison warmup update-limits --sender_email_ids '["id1"]' --daily_warmup_limit 25

# Week 3: approach production volume
bison warmup update-limits --sender_email_ids '["id1"]' --daily_warmup_limit 50
```

### Audit warmup status across all accounts

```bash
bison warmup list --pretty | jq '.data[] | {email: .email, status: .warmup_status, limit: .daily_warmup_limit}'
```

### Disable warmup before campaign launch

When accounts are sufficiently warmed (typically 2-4 weeks), disable warmup to free up sending capacity for campaign emails:

```bash
bison warmup disable --sender_email_ids '["id1","id2"]'
```

### Check individual account warmup health

```bash
SENDER_ID=$(bison accounts list | jq -r '.data[] | select(.email == "sales@example.com") | .id')
bison warmup get --senderEmailId "$SENDER_ID" --pretty
```
