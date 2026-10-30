# bison-outbound-prep — Full outbound campaign workflow from zero to sending

This is the meta-skill that orchestrates a complete cold outbound campaign using the `bison` CLI. It walks through every step: creating a campaign, configuring schedules and sequences, importing leads, attaching sender emails, launching, and monitoring replies. Reference this as a step-by-step playbook.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

This skill references commands across the full CLI. See the individual skills for deep dives:

| Skill | Covers |
|---|---|
| bison-warmup | Sender email warmup management |
| bison-blacklist | Email and domain suppression lists |
| bison-tags | Organizing resources with custom tags |
| bison-webhooks | Real-time event notifications |
| bison-workspaces | Workspace, team, and analytics management |

## the complete outbound workflow

### Step 0: Pre-flight — Suppression & Warmup

Before creating any campaign, set up blacklists and verify sender warmup status.

```bash
# Block competitor domains and known bad addresses
bison domain-blacklist bulk-create --domains '["competitor1.com","competitor2.com"]'
bison email-blacklist bulk-create --emails '["do-not-email@example.com","bounced@old.com"]'

# Check warmup status of sender accounts
bison warmup list --pretty

# Enable warmup on any new accounts (if not already running)
bison warmup enable --sender_email_ids '["sender-id-1","sender-id-2"]'
bison warmup update-limits --sender_email_ids '["sender-id-1","sender-id-2"]' --daily_warmup_limit 25
```

### Step 1: Create the Campaign

```bash
CAMPAIGN_ID=$(bison campaigns create --name "Q1 Outbound - Enterprise" | jq -r '.id')
echo "Campaign created: $CAMPAIGN_ID"
```

### Step 2: Create a Sending Schedule

Define which days and hours the campaign sends emails.

```bash
bison campaigns schedule-create \
  --campaign_id "$CAMPAIGN_ID" \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "09:00" \
  --end_time "17:00" \
  --timezone "America/New_York"
```

### Step 3: Create Sequence Steps

Define the email sequence (initial email + follow-ups). Pass a JSON array of step objects.

```bash
bison campaigns sequence-steps-create \
  --campaign_id "$CAMPAIGN_ID" \
  --title "3-Step Enterprise Sequence" \
  --sequence_steps '[
    {
      "subject": "Quick question about {{company_name}}",
      "body": "<p>Hi {{first_name}},</p><p>I noticed {{company_name}} is scaling fast. We help companies like yours with [value prop].</p><p>Worth a quick chat?</p><p>Best,<br/>{{sender_name}}</p>"
    },
    {
      "subject": "Re: Quick question about {{company_name}}",
      "body": "<p>Hi {{first_name}},</p><p>Just circling back on my last note. Would love to share how we helped [similar company] achieve [result].</p><p>Open to a 15-min call this week?</p>"
    },
    {
      "subject": "Last note from me",
      "body": "<p>Hi {{first_name}},</p><p>I know you are busy so I will keep this short. If now is not the right time, no worries at all.</p><p>But if [pain point] is on your radar, I would love to help.</p><p>Either way, wishing you and the {{company_name}} team all the best.</p>"
    }
  ]'
```

### Step 4: Import Leads

Create leads and attach them to the campaign. You can create individual leads or use bulk import.

```bash
# Create leads individually
LEAD1=$(bison leads create \
  --email "prospect1@target.com" \
  --first-name "Jane" \
  --last-name "Smith" \
  --company-name "TargetCo" | jq -r '.id')

LEAD2=$(bison leads create \
  --email "prospect2@bigcorp.com" \
  --first-name "John" \
  --last-name "Doe" \
  --company-name "BigCorp" | jq -r '.id')

# Or create multiple at once
bison leads create-multiple --leads '[
  {"email":"prospect3@acme.com","first_name":"Alice","last_name":"Lee","company_name":"Acme"},
  {"email":"prospect4@globex.com","first_name":"Bob","last_name":"Chen","company_name":"Globex"}
]'

# Attach leads to the campaign
bison campaigns attach-leads \
  --campaign_id "$CAMPAIGN_ID" \
  --lead_ids "[\"$LEAD1\",\"$LEAD2\"]"
```

For larger lists, use the bulk CSV import:

```bash
bison leads bulk-csv --campaign_id "$CAMPAIGN_ID" --file ./leads.csv
```

### Step 5: Attach Sender Emails

Connect warmed-up sender accounts to the campaign. The platform rotates across attached senders automatically.

```bash
# List available sender accounts
bison accounts list --pretty | jq '.data[] | {id: .id, email: .email}'

# Attach senders to the campaign
bison campaigns attach-sender-emails \
  --campaign_id "$CAMPAIGN_ID" \
  --sender_email_ids '["sender-id-1","sender-id-2"]'
```

### Step 6: Set Up Webhooks (Optional)

Configure real-time notifications for replies and engagement events before launch.

```bash
# Create a webhook for reply events
WEBHOOK_ID=$(bison webhooks create \
  --url "https://hooks.example.com/bison-replies" \
  --event_types '["reply"]' | jq -r '.id')

# Test it
bison webhook-events test --webhook_url_id "$WEBHOOK_ID" --event_type "reply"
```

### Step 7: Tag the Campaign (Optional)

Organize the campaign with tags for filtering and reporting.

```bash
TAG_ID=$(bison tags create --name "Q1-2026-Enterprise" | jq -r '.id')
bison tags attach-to-campaigns --tag_ids "[\"$TAG_ID\"]" --campaign_ids "[\"$CAMPAIGN_ID\"]"
```

### Step 8: Launch the Campaign

Resume (activate) the campaign to start sending on the configured schedule.

```bash
bison campaigns resume --campaign_id "$CAMPAIGN_ID"
```

### Step 9: Monitor Performance

Track campaign delivery and engagement after launch.

```bash
# Overall stats
bison campaigns stats --campaign_id "$CAMPAIGN_ID" --pretty

# Check replies
bison campaigns replies --campaign_id "$CAMPAIGN_ID" --pretty

# Workspace-level aggregate stats
bison workspaces-v1.1 stats --start_date "$(date +%Y-%m-%d)" --end_date "$(date +%Y-%m-%d)" --pretty
```

## output

All commands return JSON. Chain them with `jq` for scripting:

```bash
# Get campaign ID by name
CAMPAIGN_ID=$(bison campaigns list | jq -r '.data[] | select(.name | test("Enterprise")) | .id')

# Count replies
bison campaigns replies --campaign_id "$CAMPAIGN_ID" | jq '.data | length'

# Extract reply emails
bison campaigns replies --campaign_id "$CAMPAIGN_ID" | jq -r '.data[] | .lead_email'
```

Use `--pretty` for human-readable output. Use `--quiet` when chaining commands where only the exit code matters.

## common patterns

### Full automated launch script

Combine all steps into one executable script:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Pre-flight
bison domain-blacklist bulk-create --domains '["competitor.com"]'

# Create campaign
CAMPAIGN_ID=$(bison campaigns create --name "Auto Campaign $(date +%Y-%m-%d)" | jq -r '.id')

# Schedule: weekdays 9-5 ET
bison campaigns schedule-create \
  --campaign_id "$CAMPAIGN_ID" \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "09:00" --end_time "17:00" --timezone "America/New_York"

# Sequence
bison campaigns sequence-steps-create \
  --campaign_id "$CAMPAIGN_ID" \
  --title "Auto Sequence" \
  --sequence_steps '[{"subject":"Hi {{first_name}}","body":"<p>Hello from our team.</p>"}]'

# Attach leads (assumes leads already exist)
LEAD_IDS=$(bison leads list | jq -c '[.data[0:50][] | .id]')
bison campaigns attach-leads --campaign_id "$CAMPAIGN_ID" --lead_ids "$LEAD_IDS"

# Attach senders
SENDER_IDS=$(bison accounts list | jq -c '[.data[0:3][] | .id]')
bison campaigns attach-sender-emails --campaign_id "$CAMPAIGN_ID" --sender_email_ids "$SENDER_IDS"

# Launch
bison campaigns resume --campaign_id "$CAMPAIGN_ID"

echo "Campaign $CAMPAIGN_ID is live."
```

### Daily monitoring cron

```bash
#!/usr/bin/env bash
CAMPAIGN_ID="your-campaign-id"

echo "=== Stats $(date) ==="
bison campaigns stats --campaign_id "$CAMPAIGN_ID" --pretty

REPLY_COUNT=$(bison campaigns replies --campaign_id "$CAMPAIGN_ID" | jq '.data | length')
echo "Total replies: $REPLY_COUNT"
```

### Pause and iterate on underperforming campaigns

```bash
# Pause
bison campaigns pause --campaign_id "$CAMPAIGN_ID"

# Update sequence copy
bison campaigns sequence-steps-update \
  --campaign_id "$CAMPAIGN_ID" \
  --step_id <step-id> \
  --subject "New subject line" \
  --body "<p>Revised copy.</p>"

# Resume
bison campaigns resume --campaign_id "$CAMPAIGN_ID"
```
