# bison-leads — EmailBison Lead Management

Create, update, import, delete, and manage lead statuses and activity via the `bison` CLI. Covers all 18 lead commands including bulk operations, CSV imports, and activity lookups.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

### List & Get

```bash
# List all leads (paginated)
bison leads list
bison leads list --page 2

# Get a single lead by ID
bison leads get <lead_id>
bison leads get <lead_id> --pretty
```

### Create

```bash
# Create a single lead
bison leads create --email user@example.com
bison leads create \
  --email user@example.com \
  --first-name John \
  --last-name Doe \
  --company-name "Acme Inc" \
  --title "VP Sales" \
  --phone "+15551234567" \
  --website "https://acme.com" \
  --custom-variables '{"industry":"SaaS","employees":"50-200"}'

# Create multiple leads at once
bison leads create-multiple --leads '[
  {"email":"a@example.com","first_name":"Alice","company_name":"Alpha"},
  {"email":"b@example.com","first_name":"Bob","company_name":"Beta"}
]'
```

### Create or Update (upsert)

```bash
# Single upsert by lead ID
bison leads create-or-update <lead_id> \
  --email user@example.com \
  --first-name Jane \
  --company-name "NewCo"

# Bulk upsert
bison leads create-or-update-multiple --leads '[
  {"email":"a@example.com","first_name":"Alice Updated"},
  {"email":"c@example.com","first_name":"Charlie","company_name":"Gamma"}
]'
```

### Update & Replace

```bash
# Partial update (PATCH) — only specified fields change
bison leads update <lead_id> --first-name Jane --title "CTO"

# Full replace (PUT) — replaces the entire lead record
bison leads replace <lead_id> \
  --email user@example.com \
  --first-name Jane \
  --last-name Smith \
  --company-name "NewCo" \
  --title "CTO"
```

### Delete

```bash
# Delete a single lead
bison leads delete <lead_id>

# Bulk delete multiple leads
bison leads bulk-delete --lead-ids '["id1","id2","id3"]'
```

### CSV Import

```bash
# Import leads from a CSV string
bison leads bulk-csv --csv "email,first_name,company_name
a@example.com,Alice,Alpha
b@example.com,Bob,Beta"

# Import and immediately assign to a campaign
bison leads bulk-csv \
  --csv "email,first_name
a@example.com,Alice
b@example.com,Bob" \
  --campaign-id <campaign_id>
```

### Status Management

```bash
# Update status for a single lead
bison leads update-status <lead_id> --status active

# Bulk update status for multiple leads
bison leads bulk-update-status --lead-ids '["id1","id2"]' --status paused
```

### Unsubscribe & Blacklist

```bash
# Unsubscribe a lead (stops future emails)
bison leads unsubscribe <lead_id>

# Blacklist a lead (permanent block)
bison leads blacklist <lead_id>
```

### Activity Lookups

```bash
# Get replies from a lead
bison leads replies <lead_id>
bison leads replies <lead_id> --page 2

# Get sent emails for a lead
bison leads sent-emails <lead_id>
bison leads sent-emails <lead_id> --page 2

# Get scheduled (pending) emails for a lead
bison leads scheduled-emails <lead_id>
bison leads scheduled-emails <lead_id> --page 2
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# List lead emails and companies
bison leads list | jq '.data[] | {email, company_name, status}'

# Count total leads
bison leads list | jq '.total'

# Get all reply subjects for a lead
bison leads replies <lead_id> | jq '.data[] | {subject, received_at}'
```

## common patterns

```bash
# Bulk import from CSV and assign to campaign
CAMPAIGN_ID="<campaign_id>"
bison leads bulk-csv \
  --csv "$(cat leads.csv)" \
  --campaign-id "$CAMPAIGN_ID"

# Upsert a batch of enriched leads
bison leads create-or-update-multiple --leads "$(cat enriched-leads.json)"

# Pause all leads that have bounced
BOUNCED=$(bison leads list | jq -r '[.data[] | select(.status=="bounced") | .id]')
bison leads bulk-update-status --lead-ids "$BOUNCED" --status paused

# Find leads with replies and export
for LID in $(bison leads list | jq -r '.data[].id'); do
  REPLY_COUNT=$(bison leads replies "$LID" | jq '.data | length')
  if [ "$REPLY_COUNT" -gt 0 ]; then
    echo "$LID has $REPLY_COUNT replies"
  fi
done

# Unsubscribe leads in bulk by iterating
for LID in id1 id2 id3; do
  bison leads unsubscribe "$LID"
done

# Full lead lifecycle: create, assign, track
LEAD=$(bison leads create --email prospect@target.com --first-name Sarah --company-name "Target Corp" | jq -r '.data.id')
bison campaigns attach-leads --campaign_id <campaign_id> --lead_ids "[\"$LEAD\"]"
# Later: check activity
bison leads sent-emails "$LEAD"
bison leads replies "$LEAD"
```
