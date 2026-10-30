# bison-schedules — EmailBison Campaign Scheduling

Configure sending schedules for campaigns — set active days, time windows, timezones, and reuse schedule templates.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

### Get current schedule

```bash
bison campaigns schedule-get --campaign_id <id>
bison campaigns schedule-get --campaign_id <id> --pretty
```

### Create a schedule

Boolean day flags enable sending on that day. Times use 24-hour `"HH:MM"` format.

```bash
bison campaigns schedule-create \
  --campaign_id <id> \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "09:00" \
  --end_time "17:00" \
  --timezone "America/New_York"
```

Save as a reusable template with the `--save_as_template` flag:

```bash
bison campaigns schedule-create \
  --campaign_id <id> \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "08:00" \
  --end_time "16:00" \
  --timezone "America/Chicago" \
  --save_as_template
```

### Update a schedule

```bash
bison campaigns schedule-update \
  --campaign_id <id> \
  --saturday --sunday \
  --start_time "10:00" \
  --end_time "14:00" \
  --timezone "Europe/London"
```

### Create from template

```bash
# List available templates
bison campaigns schedule-templates

# Apply a template to a campaign
bison campaigns schedule-from-template --campaign_id <id> --schedule_id <template_id>
```

### List available timezones

```bash
bison campaigns schedule-timezones
```

### List all sending schedules

```bash
bison campaigns sending-schedules
bison campaigns sending-schedules --page 2
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# Show schedule days and times
bison campaigns schedule-get --campaign_id <id> | jq '{monday, tuesday, wednesday, thursday, friday, start_time, end_time, timezone}'

# List template names and IDs
bison campaigns schedule-templates | jq '.data[] | {id, name}'

# Filter timezones by region
bison campaigns schedule-timezones | jq '.data[] | select(startswith("America/"))'
```

## common patterns

```bash
# Create a schedule from scratch — business hours, weekdays only
bison campaigns schedule-create \
  --campaign_id <id> \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "09:00" \
  --end_time "17:00" \
  --timezone "America/New_York"

# Create from an existing template
TMPL_ID=$(bison campaigns schedule-templates | jq -r '.data[0].id')
bison campaigns schedule-from-template --campaign_id <id> --schedule_id "$TMPL_ID"

# Create a schedule and save it as a template for future campaigns
bison campaigns schedule-create \
  --campaign_id <id> \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "07:00" \
  --end_time "15:00" \
  --timezone "America/Los_Angeles" \
  --save_as_template

# Apply the same schedule to multiple campaigns
TMPL=$(bison campaigns schedule-templates | jq -r '.data[] | select(.name | contains("West Coast")) | .id')
for CID in camp1 camp2 camp3; do
  bison campaigns schedule-from-template --campaign_id "$CID" --schedule_id "$TMPL"
done

# Update an existing schedule to add weekend sending
bison campaigns schedule-update \
  --campaign_id <id> \
  --saturday \
  --start_time "10:00" \
  --end_time "13:00"

# Full campaign setup with schedule
CAMPAIGN=$(bison campaigns create --name "EU Outreach" | jq -r '.data.id')
bison campaigns schedule-create \
  --campaign_id "$CAMPAIGN" \
  --monday --tuesday --wednesday --thursday --friday \
  --start_time "08:00" \
  --end_time "16:00" \
  --timezone "Europe/Berlin"
bison campaigns update --id "$CAMPAIGN" --max_emails_per_day 100
bison campaigns resume --campaign_id "$CAMPAIGN"
```
