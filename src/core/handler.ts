import type { CommandDefinition, BisonClient } from './types.js';

export async function executeCommand(
  cmdDef: CommandDefinition,
  input: Record<string, unknown>,
  client: BisonClient,
): Promise<unknown> {
  let path = cmdDef.endpoint.path;
  const query: Record<string, unknown> = {};
  let body: Record<string, unknown> = {};

  for (const [field, location] of Object.entries(cmdDef.fieldMappings)) {
    const value = input[field];
    if (value === undefined || value === null) continue;

    switch (location) {
      case 'path':
        path = path.replace(`{${field}}`, encodeURIComponent(String(value)));
        break;
      case 'query':
        query[field] = value;
        break;
      case 'body':
        body[field] = value;
        break;
    }
  }

  if (cmdDef.transformBody) body = cmdDef.transformBody(body);

  return client.request({
    method: cmdDef.endpoint.method,
    path,
    query: Object.keys(query).length > 0 ? query : undefined,
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}
