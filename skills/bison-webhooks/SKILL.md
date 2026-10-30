# bison-webhooks — Configure webhooks and test event delivery

Webhooks push real-time notifications to your endpoints when events occur (replies, bounces, opens, etc.). This skill covers webhook CRUD, event type discovery, test firing, and sample payload inspection.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

### Webhook Management

#### List all webhooks

```bash
bison webhooks list
bison webhooks list --page 2
```

#### Get a specific webhook

```bash
bison webhooks get --id <webhook-id>
```

#### Create a webhook

```bash
bison webhooks create --url "https://hooks.example.com/bison"
bison webhooks create --url "https://hooks.example.com/bison" --event_types '["reply","bounce"]'
```

The `--event_types` flag is optional. If omitted, the webhook receives all event types. Pass a JSON string array to subscribe to specific events only.

#### Update a webhook

```bash
bison webhooks update --id <webhook-id> --url "https://hooks.example.com/v2"
bison webhooks update --id <webhook-id> --event_types '["reply","bounce","open"]'
```

Both `--url` and `--event_types` are optional on update.

#### Delete a webhook

```bash
bison webhooks delete --webhook_url_id <webhook-id>
```

### Webhook Events

#### List available event types

```bash
bison webhook-events event-types
```

Returns all event types you can subscribe to (e.g., `reply`, `bounce`, `open`, `click`, `unsubscribe`).

#### Get a sample payload for an event type

```bash
bison webhook-events sample-payload
bison webhook-events sample-payload --event_type "reply"
```

Without `--event_type`, returns sample payloads for all event types. With it, returns a sample for that specific event.

#### Send a test event to a webhook

```bash
bison webhook-events test --webhook_url_id <webhook-id> --event_type "reply"
```

Fires a simulated event to the specified webhook endpoint so you can verify your integration receives and processes it correctly.

## output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to select specific keys, or `--quiet` for exit-code-only mode.

```bash
bison webhooks list --pretty
bison webhook-events event-types --pretty
bison webhook-events sample-payload --event_type "reply" --pretty
```

Pipe to `jq`:

```bash
bison webhook-events event-types | jq '.data[]'
bison webhooks list | jq '.data[] | {id: .id, url: .url}'
```

## common patterns

### Set up reply notifications

Create a webhook that fires only on reply events, inspect the payload format, then test it:

```bash
# 1. See available event types
bison webhook-events event-types --pretty

# 2. Check the reply payload shape
bison webhook-events sample-payload --event_type "reply" --pretty

# 3. Create webhook for replies only
WEBHOOK_ID=$(bison webhooks create \
  --url "https://hooks.example.com/bison-replies" \
  --event_types '["reply"]' | jq -r '.id')

# 4. Fire a test event
bison webhook-events test --webhook_url_id "$WEBHOOK_ID" --event_type "reply"

# 5. Verify it arrived at your endpoint
```

### Subscribe to all engagement events

```bash
bison webhooks create \
  --url "https://hooks.example.com/engagement" \
  --event_types '["reply","open","click","bounce","unsubscribe"]'
```

### Update an existing webhook to add event types

```bash
bison webhooks update --id <webhook-id> --event_types '["reply","bounce","open","click"]'
```

### Audit all configured webhooks

```bash
bison webhooks list --pretty | jq '.data[] | {id: .id, url: .url, events: .event_types}'
```

### Rotate webhook endpoint URL

```bash
bison webhooks update --id <webhook-id> --url "https://new-endpoint.example.com/bison"
```

### Delete and recreate a webhook

```bash
bison webhooks delete --webhook_url_id <old-webhook-id>

bison webhooks create \
  --url "https://hooks.example.com/v2" \
  --event_types '["reply","bounce"]'
```

### Test all event types against a webhook

```bash
WEBHOOK_ID="your-webhook-id"
EVENT_TYPES=$(bison webhook-events event-types | jq -r '.data[]')

for EVENT in $EVENT_TYPES; do
  echo "Testing: $EVENT"
  bison webhook-events test --webhook_url_id "$WEBHOOK_ID" --event_type "$EVENT"
done
```
