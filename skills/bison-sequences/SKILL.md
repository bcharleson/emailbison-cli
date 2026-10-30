# bison-sequences — EmailBison Sequence Step Management

Create and manage email sequence steps within campaigns — including multi-step flows, A/B variants, test emails, and activation toggles.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

### List sequence steps

```bash
bison campaigns sequence-steps-list --campaign_id <id>
bison campaigns sequence-steps-list --campaign_id <id> --pretty
```

### Create sequence steps

The `--sequence_steps` flag accepts a JSON array of step objects. Each object supports `subject`, `body`, and optional variant fields.

```bash
bison campaigns sequence-steps-create \
  --campaign_id <id> \
  --title "Initial Outreach" \
  --sequence_steps '[{"subject":"Hi {{first_name}}","body":"<p>Intro email body</p>"}]'
```

### Update a sequence step

```bash
bison campaigns sequence-steps-update \
  --sequence_id <step_id> \
  --email_subject "Updated Subject" \
  --email_body "<p>Updated body</p>"

# Set wait time between steps
bison campaigns sequence-steps-update --sequence_id <step_id> --wait_in_days 3

# Configure as A/B variant
bison campaigns sequence-steps-update \
  --sequence_id <step_id> \
  --variant "B" \
  --variant_from_step <parent_step_id>

# Send as thread reply to previous step
bison campaigns sequence-steps-update --sequence_id <step_id> --thread_reply
```

### Delete a sequence step

```bash
bison campaigns sequence-steps-delete --sequence_step_id <id>
```

### Toggle active / inactive

```bash
bison campaigns sequence-steps-toggle --sequence_step_id <id>
```

### Send test email

```bash
bison campaigns sequence-steps-test-email --sequence_step_id <id> --to_email test@example.com
```

### v1.1 Variants

The `campaigns-v1.1` group provides enhanced sequence step endpoints with additional variant support.

```bash
# List (v1.1)
bison campaigns-v1.1 sequence-steps-list --campaign_id <id>

# Create (v1.1)
bison campaigns-v1.1 sequence-steps-create \
  --campaign_id <id> \
  --title "Step 1" \
  --sequence_steps '[{"subject":"Hi","body":"<p>Hello</p>"}]'

# Update (v1.1) — thread_reply is a string in v1.1
bison campaigns-v1.1 sequence-steps-update \
  --sequence_id <step_id> \
  --email_subject "New Subject" \
  --email_body "<p>New body</p>" \
  --variant "B" \
  --variant_from_step <parent_step_id> \
  --thread_reply "true"
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# List step IDs and subjects
bison campaigns sequence-steps-list --campaign_id <id> | jq '.data[] | {id, subject: .email_subject}'

# Get just the active steps
bison campaigns sequence-steps-list --campaign_id <id> | jq '.data[] | select(.is_active == true)'
```

## common patterns

```bash
# Build a 3-step sequence with follow-ups
CAMP_ID="<campaign_id>"

# Step 1 — Initial outreach
bison campaigns sequence-steps-create \
  --campaign_id "$CAMP_ID" \
  --title "Step 1: Intro" \
  --sequence_steps '[{"subject":"Quick question, {{first_name}}","body":"<p>Hey {{first_name}}, I noticed...</p>"}]'

# Step 2 — Follow-up after 3 days
STEP2=$(bison campaigns sequence-steps-create \
  --campaign_id "$CAMP_ID" \
  --title "Step 2: Follow-up" \
  --sequence_steps '[{"subject":"Re: Quick question","body":"<p>Just following up...</p>"}]' | jq -r '.data[0].id')
bison campaigns sequence-steps-update --sequence_id "$STEP2" --wait_in_days 3 --thread_reply

# Step 3 — Breakup email after 5 days
STEP3=$(bison campaigns sequence-steps-create \
  --campaign_id "$CAMP_ID" \
  --title "Step 3: Breakup" \
  --sequence_steps '[{"subject":"Last try","body":"<p>I will not reach out again...</p>"}]' | jq -r '.data[0].id')
bison campaigns sequence-steps-update --sequence_id "$STEP3" --wait_in_days 5

# A/B test variant for Step 1
STEP1_ID=$(bison campaigns sequence-steps-list --campaign_id "$CAMP_ID" | jq -r '.data[0].id')
bison campaigns sequence-steps-create \
  --campaign_id "$CAMP_ID" \
  --title "Step 1: Variant B" \
  --sequence_steps '[{"subject":"{{first_name}}, quick thought","body":"<p>Alternative intro...</p>"}]'
VARIANT_ID=$(bison campaigns sequence-steps-list --campaign_id "$CAMP_ID" | jq -r '.data[-1].id')
bison campaigns sequence-steps-update --sequence_id "$VARIANT_ID" --variant "B" --variant_from_step "$STEP1_ID"

# Send test emails before launching
for STEP in $(bison campaigns sequence-steps-list --campaign_id "$CAMP_ID" | jq -r '.data[].id'); do
  bison campaigns sequence-steps-test-email --sequence_step_id "$STEP" --to_email review@yourteam.com
done

# Deactivate a specific step without deleting
bison campaigns sequence-steps-toggle --sequence_step_id <id>
```
