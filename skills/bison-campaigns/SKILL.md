# bison-campaigns — EmailBison Campaign Management

Create, configure, launch, pause, resume, archive, and duplicate email campaigns via the `bison` CLI.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

```bash
# List all campaigns
bison campaigns list
bison campaigns list --page 2 --pretty

# Get campaign details
bison campaigns get --id <campaign_id> --pretty

# Create a campaign
bison campaigns create --name "Q2 SaaS Outreach"

# Update campaign settings
bison campaigns update --id <campaign_id> --max_emails_per_day 500 --open_tracking

# Duplicate a campaign
bison campaigns duplicate --campaign_id <id>

# Pause / Resume / Archive
bison campaigns pause --campaign_id <id>
bison campaigns resume --campaign_id <id>
bison campaigns archive --campaign_id <id>

# Delete
bison campaigns delete --campaign_id <id>
bison campaigns bulk-delete --campaign_ids '["id1","id2"]'

# Campaign stats
bison campaigns stats --campaign_id <id> --pretty
bison campaigns line-area-chart-stats --campaign_id <id>

# Manage sender emails on a campaign
bison campaigns sender-emails --campaign_id <id>
bison campaigns attach-sender-emails --campaign_id <id> --sender_email_ids '["se1","se2"]'
bison campaigns remove-sender-emails --campaign_id <id> --sender_email_ids '["se1"]'

# Manage leads on a campaign
bison campaigns leads --campaign_id <id>
bison campaigns attach-leads --campaign_id <id> --lead_ids '["l1","l2"]'
bison campaigns attach-lead-list --campaign_id <id> --lead_list_id <list_id>
bison campaigns remove-leads --campaign_id <id> --lead_ids '["l1"]'
bison campaigns move-leads --campaign_id <id> --lead_ids '["l1"]' --to_campaign_id <target_id>
bison campaigns stop-future-emails --campaign_id <id> --lead_ids '["l1"]'

# View campaign replies and scheduled emails
bison campaigns replies --campaign_id <id> --pretty
bison campaigns scheduled-emails --campaign_id <id>
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
bison campaigns list | jq '.data[] | {id, name, status}'
bison campaigns stats --campaign_id <id> | jq '.data'
```

## common patterns

```bash
# Full campaign launch workflow
CAMPAIGN=$(bison campaigns create --name "Q2 Outreach" | jq -r '.data.id')
bison campaigns update --id "$CAMPAIGN" --max_emails_per_day 200 --open_tracking
bison campaigns attach-sender-emails --campaign_id "$CAMPAIGN" --sender_email_ids '["se1","se2"]'
bison campaigns attach-leads --campaign_id "$CAMPAIGN" --lead_ids '["l1","l2","l3"]'
bison campaigns resume --campaign_id "$CAMPAIGN"

# Pause all active campaigns and check stats
for CID in $(bison campaigns list | jq -r '.data[] | select(.status=="active") | .id'); do
  bison campaigns pause --campaign_id "$CID"
  bison campaigns stats --campaign_id "$CID" | jq '{id: .data.id, sent: .data.sent, replies: .data.replies}'
done

# Duplicate a campaign and reassign to new leads
NEW=$(bison campaigns duplicate --campaign_id <source_id> | jq -r '.data.id')
bison campaigns remove-leads --campaign_id "$NEW" --lead_ids '["old1","old2"]'
bison campaigns attach-leads --campaign_id "$NEW" --lead_ids '["new1","new2"]'
bison campaigns resume --campaign_id "$NEW"

# Move unresponsive leads to a nurture campaign
bison campaigns move-leads --campaign_id <source_id> --lead_ids '["l1","l2"]' --to_campaign_id <nurture_id>

# Stop future emails for a lead who replied out-of-band
bison campaigns stop-future-emails --campaign_id <id> --lead_ids '["l1"]'
```
