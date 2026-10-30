# bison-replies — EmailBison Reply & Inbox Management

Manage your master inbox — list, read, reply, forward, triage, and classify email replies via the `bison` CLI. Covers all 14 reply commands.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
```

## commands

### List & Get

```bash
# List all replies (paginated)
bison replies list
bison replies list --page 2

# Filter by campaign
bison replies list --campaign-id <campaign_id>

# Filter by read status
bison replies list --is-read false

# Get a specific reply
bison replies get <reply_id>
bison replies get <reply_id> --pretty
```

### Compose & Respond

```bash
# Send a brand-new email (not a reply to an existing thread)
bison replies new \
  --to-email prospect@example.com \
  --from-sender-email-id <sender_id> \
  --subject "Quick question" \
  --body-text "Hi, I wanted to reach out about..."

# Reply to an existing thread
bison replies reply <reply_id> --body-text "Thanks for getting back to me!"

# Reply with HTML
bison replies reply <reply_id> --body-html "<p>Thanks for getting back!</p>"

# Forward a reply to someone else
bison replies forward <reply_id> --to-email colleague@yourteam.com
bison replies forward <reply_id> --to-email colleague@yourteam.com --body-text "FYI — see thread below"
```

### Classification & Triage

```bash
# Mark as interested (positive reply)
bison replies mark-interested <reply_id>

# Mark as not interested
bison replies mark-not-interested <reply_id>

# Mark as read
bison replies mark-read-unread <reply_id> --is-read true

# Mark as unread
bison replies mark-read-unread <reply_id> --is-read false

# Mark as automated (out-of-office, auto-reply, etc.)
bison replies mark-automated <reply_id> --is-automated true

# Unmark automated
bison replies mark-automated <reply_id> --is-automated false
```

### Unsubscribe

```bash
# Unsubscribe the contact who sent this reply
bison replies unsubscribe <reply_id>
```

### Conversation Thread

```bash
# Get the full conversation thread for a reply
bison replies conversation-thread <reply_id>
bison replies conversation-thread <reply_id> --pretty
```

### Scheduled Emails & Follow-ups

```bash
# Attach a scheduled email to a reply thread
bison replies attach-scheduled-email <reply_id> --scheduled-email-id <scheduled_id>

# Push a reply's lead into a follow-up campaign
bison replies push-to-followup <reply_id> --campaign-id <followup_campaign_id>
```

### Delete

```bash
bison replies delete <reply_id>
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# List unread reply summaries
bison replies list --is-read false | jq '.data[] | {id, from_email, subject, received_at}'

# Count replies per campaign
bison replies list --campaign-id <id> | jq '.total'

# Extract conversation thread messages
bison replies conversation-thread <reply_id> | jq '.data[] | {from, subject, body_text, timestamp}'
```

## common patterns

```bash
# Inbox triage workflow — process all unread replies
for RID in $(bison replies list --is-read false | jq -r '.data[].id'); do
  echo "--- Reply: $RID ---"
  bison replies get "$RID" --pretty

  # Read the full thread for context
  bison replies conversation-thread "$RID" --pretty

  # Mark as read after reviewing
  bison replies mark-read-unread "$RID" --is-read true
done

# Auto-classify out-of-office replies as automated
for RID in $(bison replies list --is-read false | jq -r '.data[] | select(.subject | test("out of office|OOO|auto.reply"; "i")) | .id'); do
  bison replies mark-automated "$RID" --is-automated true
  bison replies mark-read-unread "$RID" --is-read true
done

# Route interested replies to a follow-up campaign
FOLLOWUP_ID="<followup_campaign_id>"
for RID in $(bison replies list --is-read false | jq -r '.data[].id'); do
  BODY=$(bison replies get "$RID" | jq -r '.data.body_text // ""')
  # Mark interested if reply contains positive signals
  bison replies mark-interested "$RID"
  bison replies push-to-followup "$RID" --campaign-id "$FOLLOWUP_ID"
  bison replies mark-read-unread "$RID" --is-read true
done

# Quick reply to a specific thread
bison replies reply <reply_id> --body-text "Great to hear! Let me send over some times to chat."

# Forward a hot lead to the sales team
bison replies forward <reply_id> --to-email sales@yourteam.com --body-text "Hot lead — replied interested, see thread."

# Unsubscribe someone who asked to be removed
bison replies unsubscribe <reply_id>
```
