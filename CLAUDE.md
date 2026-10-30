# emailbison-cli — Claude Context

## Project

CLI + MCP server for EmailBison. TypeScript, ESM, Node 18+. 157 commands across 20 API groups.

## Stack

- **commander** — CLI framework
- **zod** — input validation (shared between CLI and MCP)
- **@modelcontextprotocol/sdk** — MCP server
- **tsup** — bundler (two entry points: CLI + MCP)
- **tsx** — dev runner

## Code conventions

- ESM with `.js` extensions in imports
- One file per command, exports a `CommandDefinition`
- `executeCommand()` in `core/handler.ts` maps inputs to HTTP requests via `fieldMappings`
- `z.coerce.number()` for numeric CLI inputs
- JSON-first output, `--pretty`/`--quiet`/`--fields` global options

## File structure

```
src/core/          — types, client, auth, config, output, errors, handler
src/commands/*/    — one folder per API group, one file per command + index.ts
src/mcp-entry.ts   — MCP server setup
src/mcp.ts         — MCP entry point
src/index.ts       — CLI entry point
skills/*/SKILL.md  — agent skill documentation
```

## Adding a new command

1. Create `src/commands/<group>/<subcommand>.ts` with a `CommandDefinition`
2. Import and add to the group's `index.ts` array
3. The command is automatically registered in both CLI and MCP

## Testing

```bash
npm run dev -- campaigns list --pretty
npm run build && node dist/index.js campaigns list
npm run typecheck
```

## Auth

Bearer token via `--api-key`, `EMAILBISON_API_KEY`, or `~/.emailbison/config.json`. Base URL is required (no default) via `--base-url`, `EMAILBISON_BASE_URL`, or config — each EmailBison instance has its own `https` URL. Missing either value fails with a message to run `bison login` or set the env var.
