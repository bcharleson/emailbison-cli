# bison-tags — Organize campaigns, leads, and sender emails with custom tags

Tags provide a flexible labeling system to organize and filter campaigns, leads, and sender email accounts. This skill covers all 10 tag commands for full CRUD and association management.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

### CRUD Operations

#### List all tags

```bash
bison tags list
bison tags list --page 2
```

#### Get a specific tag

```bash
bison tags get --id <tag-id>
```

#### Create a tag

```bash
bison tags create --name "Q1 Outbound"
bison tags create --name "Enterprise"
```

#### Delete a tag

```bash
bison tags delete --tag_id <tag-id>
```

### Campaign Associations

#### Attach tags to campaigns

```bash
bison tags attach-to-campaigns --tag_ids '["tag1","tag2"]' --campaign_ids '["camp1","camp2"]'
```

#### Remove tags from campaigns

```bash
bison tags remove-from-campaigns --tag_ids '["tag1"]' --campaign_ids '["camp1"]'
```

### Lead Associations

#### Attach tags to leads

```bash
bison tags attach-to-leads --tag_ids '["tag1"]' --lead_ids '["lead1","lead2"]'
```

#### Remove tags from leads

```bash
bison tags remove-from-leads --tag_ids '["tag1"]' --lead_ids '["lead1"]'
```

### Sender Email Associations

#### Attach tags to sender emails

```bash
bison tags attach-to-sender-emails --tag_ids '["tag1"]' --sender_email_ids '["acc1","acc2"]'
```

#### Remove tags from sender emails

```bash
bison tags remove-from-sender-emails --tag_ids '["tag1"]' --sender_email_ids '["acc1"]'
```

## output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to select specific keys, or `--quiet` for exit-code-only mode.

```bash
bison tags list --pretty
bison tags get --id abc123 --fields "name,id"
```

Pipe to `jq` for processing:

```bash
bison tags list | jq '.data[] | {id: .id, name: .name}'
```

## common patterns

### Organize campaigns by quarter

```bash
TAG_ID=$(bison tags create --name "Q1-2026" | jq -r '.id')

CAMPAIGN_IDS=$(bison campaigns list | jq -c '[.data[] | select(.name | test("Q1")) | .id]')

bison tags attach-to-campaigns --tag_ids "[\"$TAG_ID\"]" --campaign_ids "$CAMPAIGN_IDS"
```

### Tag leads by segment

```bash
ENTERPRISE_TAG=$(bison tags create --name "Enterprise" | jq -r '.id')
SMB_TAG=$(bison tags create --name "SMB" | jq -r '.id')

bison tags attach-to-leads --tag_ids "[\"$ENTERPRISE_TAG\"]" --lead_ids '["lead1","lead2","lead3"]'
bison tags attach-to-leads --tag_ids "[\"$SMB_TAG\"]" --lead_ids '["lead4","lead5"]'
```

### Group sender emails by domain purpose

```bash
WARMUP_TAG=$(bison tags create --name "Warmup Pool" | jq -r '.id')
PRODUCTION_TAG=$(bison tags create --name "Production Senders" | jq -r '.id')

bison tags attach-to-sender-emails --tag_ids "[\"$WARMUP_TAG\"]" --sender_email_ids '["id1","id2"]'
bison tags attach-to-sender-emails --tag_ids "[\"$PRODUCTION_TAG\"]" --sender_email_ids '["id3","id4"]'
```

### Reassign a campaign to a different tag group

```bash
bison tags remove-from-campaigns --tag_ids '["old-tag-id"]' --campaign_ids '["camp1"]'
bison tags attach-to-campaigns --tag_ids '["new-tag-id"]' --campaign_ids '["camp1"]'
```

### List all tags and their IDs for scripting

```bash
bison tags list | jq -r '.data[] | "\(.id)\t\(.name)"'
```

### Clean up unused tags

```bash
TAG_ID="obsolete-tag-id"
bison tags delete --tag_id "$TAG_ID"
```

### Bulk-tag all leads from a campaign

```bash
TAG_ID="responded"
LEAD_IDS=$(bison campaigns leads --campaign_id <camp-id> | jq -c '[.data[] | .id]')
bison tags attach-to-leads --tag_ids "[\"$TAG_ID\"]" --lead_ids "$LEAD_IDS"
```
