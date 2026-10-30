# bison-accounts — EmailBison Sender Account Management

Add, configure, verify, and manage sender email accounts via the `bison` CLI. Covers all 13 account commands including IMAP/SMTP setup, bulk operations, MX checks, and signature management.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

### List & Get

```bash
# List all sender email accounts (paginated)
bison accounts list
bison accounts list --page 2

# Get a specific account
bison accounts get --senderEmailId <id>
bison accounts get --senderEmailId <id> --pretty
```

### Create via IMAP/SMTP

```bash
bison accounts create-imap-smtp \
  --email outreach@yourdomain.com \
  --from_name "John Smith" \
  --imap_host imap.yourdomain.com \
  --imap_port 993 \
  --imap_username outreach@yourdomain.com \
  --imap_password "<password>" \
  --smtp_host smtp.yourdomain.com \
  --smtp_port 587 \
  --smtp_username outreach@yourdomain.com \
  --smtp_password "<password>"
```

### Bulk Create

```bash
bison accounts bulk-create --sender_emails '[
  {
    "email": "sender1@yourdomain.com",
    "from_name": "Alice",
    "imap_host": "imap.yourdomain.com",
    "imap_port": 993,
    "imap_username": "sender1@yourdomain.com",
    "imap_password": "pass1",
    "smtp_host": "smtp.yourdomain.com",
    "smtp_port": 587,
    "smtp_username": "sender1@yourdomain.com",
    "smtp_password": "pass1"
  },
  {
    "email": "sender2@yourdomain.com",
    "from_name": "Bob",
    "imap_host": "imap.yourdomain.com",
    "imap_port": 993,
    "imap_username": "sender2@yourdomain.com",
    "imap_password": "pass2",
    "smtp_host": "smtp.yourdomain.com",
    "smtp_port": 587,
    "smtp_username": "sender2@yourdomain.com",
    "smtp_password": "pass2"
  }
]'
```

### Update

```bash
# Update display name
bison accounts update --senderEmailId <id> --from_name "Jane Doe"

# Update daily sending limit
bison accounts update --senderEmailId <id> --daily_limit 75

# Update email signature
bison accounts update --senderEmailId <id> --signature "<p>Best regards,<br>Jane</p>"
```

### Delete

```bash
bison accounts delete --senderEmailId <id>
```

### View Associated Campaigns & Replies

```bash
# List campaigns using this sender
bison accounts campaigns --senderEmailId <id>
bison accounts campaigns --senderEmailId <id> --page 2

# List replies received by this sender
bison accounts replies --senderEmailId <id>
bison accounts replies --senderEmailId <id> --page 2
```

### OAuth Token

```bash
# Get the OAuth access token for an account (useful for integrations)
bison accounts oauth-token --senderEmailId <id>
```

### MX Record Checks

```bash
# Check MX records for a single account
bison accounts check-mx --senderEmailId <id>

# Bulk check MX records for all accounts with missing records
bison accounts bulk-check-mx
```

### Bulk Daily Limits

```bash
# Set daily limit for multiple accounts at once
bison accounts bulk-daily-limits \
  --sender_email_ids '["id1","id2","id3"]' \
  --daily_limit 50
```

### Bulk Signatures

```bash
# Apply the same signature to multiple accounts
bison accounts bulk-signatures \
  --sender_email_ids '["id1","id2","id3"]' \
  --signature "<p>Best regards,<br>The Sales Team</p>"
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# List account emails and IDs
bison accounts list | jq '.data[] | {id, email, from_name}'

# Check which accounts have missing MX records
bison accounts list | jq '.data[] | select(.mx_status != "valid") | {email, mx_status}'

# Count campaigns per sender
bison accounts campaigns --senderEmailId <id> | jq '.total'
```

## common patterns

```bash
# Onboard new sending accounts — full workflow
# 1. Create the account
ACCOUNT=$(bison accounts create-imap-smtp \
  --email new@yourdomain.com \
  --from_name "New Sender" \
  --imap_host imap.yourdomain.com \
  --imap_port 993 \
  --imap_username new@yourdomain.com \
  --imap_password "<password>" \
  --smtp_host smtp.yourdomain.com \
  --smtp_port 587 \
  --smtp_username new@yourdomain.com \
  --smtp_password "<password>" | jq -r '.data.id')

# 2. Verify MX records
bison accounts check-mx --senderEmailId "$ACCOUNT"

# 3. Set daily limit
bison accounts update --senderEmailId "$ACCOUNT" --daily_limit 50

# 4. Set signature
bison accounts update --senderEmailId "$ACCOUNT" --signature "<p>Best,<br>New Sender</p>"

# 5. Attach to a campaign
bison campaigns attach-sender-emails --campaign_id <campaign_id> --sender_email_ids "[\"$ACCOUNT\"]"

# Standardize all sender accounts — same limit and signature
ALL_IDS=$(bison accounts list | jq -r '[.data[].id]')
bison accounts bulk-daily-limits --sender_email_ids "$ALL_IDS" --daily_limit 50
bison accounts bulk-signatures --sender_email_ids "$ALL_IDS" --signature "<p>Cheers,<br>The Team</p>"

# Health check — verify MX records for all accounts
bison accounts bulk-check-mx

# Audit: list accounts and their campaign assignments
for AID in $(bison accounts list | jq -r '.data[].id'); do
  EMAIL=$(bison accounts get --senderEmailId "$AID" | jq -r '.data.email')
  CAMP_COUNT=$(bison accounts campaigns --senderEmailId "$AID" | jq '.total')
  echo "$EMAIL: $CAMP_COUNT campaigns"
done
```
