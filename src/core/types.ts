import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  name: string;
  group: string;
  subcommand: string;
  description: string;
  examples?: string[];
  inputSchema: TInput;
  cliMappings: CliMapping;
  endpoint: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
  };
  fieldMappings: Record<string, 'path' | 'query' | 'body'>;
  /** Optional reshape of the assembled body before sending (e.g. rename a field the API spells differently). */
  transformBody?: (body: Record<string, unknown>) => Record<string, unknown>;
  handler: (input: z.infer<TInput>, client: BisonClient) => Promise<unknown>;
}

export interface BisonRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface BisonClient {
  request(opts: BisonRequestOptions): Promise<unknown>;
  paginate(opts: BisonRequestOptions, maxPages?: number): Promise<unknown>;
}

export interface BisonConfig {
  base_url?: string;
  api_key?: string;
}

export interface GlobalOptions {
  pretty?: boolean;
  quiet?: boolean;
  fields?: string;
  apiKey?: string;
  baseUrl?: string;
}
