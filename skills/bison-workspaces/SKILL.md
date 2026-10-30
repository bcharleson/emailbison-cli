# bison-workspaces — Manage workspaces, members, and analytics

Workspaces isolate campaigns, leads, and sender accounts for different teams or clients. This skill covers the v1.1 workspace API including CRUD, team management, API tokens, stats, and master inbox settings.

## install

```bash
npm install -g emailbison-cli
bison login --api-key <key> --base-url https://send.example.com
bison status
```

## commands

### Workspace CRUD

#### List all workspaces

```bash
bison workspaces-v1.1 list
bison workspaces-v1.1 list --page 2
```

#### Get a specific workspace

```bash
bison workspaces-v1.1 get --team_id <team-id>
```

#### Create a workspace

```bash
bison workspaces-v1.1 create --name "Client A"
```

#### Update a workspace

```bash
bison workspaces-v1.1 update --team_id <team-id> --name "Client A - Renamed"
```

#### Delete a workspace

```bash
bison workspaces-v1.1 delete --team_id <team-id>
```

### Workspace Switching

#### Switch active workspace

```bash
bison workspaces-v1.1 switch --team_id <team-id>
```

All subsequent commands operate against the switched workspace context.

### Team Management

#### Create a user in the workspace

```bash
bison workspaces-v1.1 create-user --name "John Doe" --email john@example.com --password "securepass123"
```

#### Invite members by email

```bash
bison workspaces-v1.1 invite-members --emails '["alice@example.com","bob@example.com"]'
```

#### Accept a workspace invitation

```bash
bison workspaces-v1.1 accept-invite --team_invitation_id <invitation-id>
```

#### Remove a member

```bash
bison workspaces-v1.1 remove-member --user_id <user-id>
```

### API Tokens

#### Create an API token for a workspace

```bash
bison workspaces-v1.1 create-api-token --team_id <team-id> --name "CI/CD Token"
```

### Analytics

#### Get workspace statistics

```bash
bison workspaces-v1.1 stats
bison workspaces-v1.1 stats --start_date 2026-01-01 --end_date 2026-03-31
```

#### Get time-series chart data

```bash
bison workspaces-v1.1 line-area-chart-stats
bison workspaces-v1.1 line-area-chart-stats --start_date 2026-01-01 --end_date 2026-03-31
```

### Master Inbox Settings

#### Get master inbox settings

```bash
bison workspaces-v1.1 master-inbox-settings
```

#### Update master inbox settings

```bash
bison workspaces-v1.1 update-master-inbox-settings --settings '{"key":"value"}'
```

## output

All commands return JSON. Use `--pretty` for formatted output, `--fields` to select specific keys, or `--quiet` for exit-code-only mode.

```bash
bison workspaces-v1.1 list --pretty
bison workspaces-v1.1 stats --pretty --fields "total_sent,total_replies,total_bounces"
```

Pipe to `jq`:

```bash
bison workspaces-v1.1 list | jq '.data[] | {id: .id, name: .name}'
bison workspaces-v1.1 stats --start_date 2026-01-01 --end_date 2026-03-31 | jq '.data'
```

## common patterns

### Multi-workspace setup for agency/multi-client use

Create isolated workspaces per client and generate dedicated API tokens:

```bash
# Create client workspaces
CLIENT_A=$(bison workspaces-v1.1 create --name "Client A" | jq -r '.id')
CLIENT_B=$(bison workspaces-v1.1 create --name "Client B" | jq -r '.id')

# Generate API tokens per workspace
bison workspaces-v1.1 create-api-token --team_id "$CLIENT_A" --name "Client A Automation"
bison workspaces-v1.1 create-api-token --team_id "$CLIENT_B" --name "Client B Automation"

# Invite team members to specific workspaces
bison workspaces-v1.1 switch --team_id "$CLIENT_A"
bison workspaces-v1.1 invite-members --emails '["am@agency.com"]'
```

### Pull stats across all workspaces

```bash
WORKSPACES=$(bison workspaces-v1.1 list | jq -r '.data[] | .id')

for WS_ID in $WORKSPACES; do
  echo "=== Workspace: $WS_ID ==="
  bison workspaces-v1.1 switch --team_id "$WS_ID"
  bison workspaces-v1.1 stats --start_date 2026-01-01 --end_date 2026-03-31 --pretty
done
```

### Weekly performance report

```bash
bison workspaces-v1.1 stats \
  --start_date "$(date -v-7d +%Y-%m-%d)" \
  --end_date "$(date +%Y-%m-%d)" --pretty

bison workspaces-v1.1 line-area-chart-stats \
  --start_date "$(date -v-7d +%Y-%m-%d)" \
  --end_date "$(date +%Y-%m-%d)" --pretty
```

### Onboard a new team member

```bash
bison workspaces-v1.1 create-user --name "New Hire" --email newhire@company.com --password "temppass123"
bison workspaces-v1.1 invite-members --emails '["newhire@company.com"]'
```

### Offboard a team member

```bash
bison workspaces-v1.1 remove-member --user_id <user-id>
```

### Audit workspace list

```bash
bison workspaces-v1.1 list | jq -r '.data[] | "\(.id)\t\(.name)"'
```
