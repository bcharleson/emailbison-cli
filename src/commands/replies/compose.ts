import { z } from 'zod';
import { ValidationError } from '../../core/errors.js';
import type { BisonClient } from '../../core/types.js';
import { textToSafeHtml } from './html.js';

export interface EmailRecipient {
  name: string | null;
  email_address: string;
}

export interface ReplyDefaults {
  sender_email_id?: number;
  to_emails?: EmailRecipient[];
}

export interface ComposeInput {
  body_text?: string;
  body_html?: string;
  subject?: string;
  sender_email_id?: number;
  from_sender_email_id?: number;
  to?: unknown;
  to_email?: unknown;
  cc?: unknown;
  bcc?: unknown;
  reply_all?: boolean;
}

export const recipientInputSchema = z
  .union([
    z.string(),
    z.array(
      z.union([
        z.string(),
        z.object({
          name: z.string().nullable().optional(),
          email_address: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
        }),
      ]),
    ),
    z.object({
      name: z.string().nullable().optional(),
      email_address: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
    }),
  ])
  .optional();

export function resolveMessage(
  input: Pick<ComposeInput, 'body_text' | 'body_html'>,
  options: { required?: boolean } = {},
): { message: string; content_type: 'html' } | undefined {
  if (typeof input.body_html === 'string' && input.body_html.length > 0) {
    return { message: input.body_html, content_type: 'html' };
  }

  if (typeof input.body_text === 'string' && input.body_text.length > 0) {
    const html = textToSafeHtml(input.body_text);
    if (html) return { message: html, content_type: 'html' };
  }

  if (options.required !== false) {
    throw new ValidationError('message is required: provide --body-text or --body-html.');
  }
  return undefined;
}

export function hasRecipientInput(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function parseRecipients(value: unknown): EmailRecipient[] | undefined {
  if (!hasRecipientInput(value)) return undefined;

  if (Array.isArray(value)) {
    const recipients: EmailRecipient[] = [];
    for (const item of value) {
      const parsed = parseRecipients(item);
      if (parsed) recipients.push(...parsed);
    }
    return recipients.length > 0 ? recipients : undefined;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const email = firstNonEmptyString(obj.email_address, obj.email, obj.address);
    if (!email) return undefined;
    const name = firstNonEmptyString(obj.name);
    return [{ name: name ?? null, email_address: email }];
  }

  if (typeof value !== 'string') return undefined;

  const recipients = splitRecipientList(value)
    .map(parseRecipientString)
    .filter((item): item is EmailRecipient => item !== undefined);

  return recipients.length > 0 ? recipients : undefined;
}

export function unwrapReplyData(response: unknown): Record<string, unknown> {
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      return record.data as Record<string, unknown>;
    }
    return record;
  }
  throw new ValidationError('Unexpected reply response shape from GET /api/replies/{id}.');
}

export function extractReplyDefaults(response: unknown): ReplyDefaults {
  const reply = unwrapReplyData(response);
  const sender_email_id = asNumber(reply.sender_email_id);

  const lead = isRecord(reply.lead) ? reply.lead : undefined;
  const fromEmail = firstNonEmptyString(reply.from_email_address, lead?.email);
  const fromName =
    firstNonEmptyString(reply.from_name) ??
    joinName(firstNonEmptyString(lead?.first_name), firstNonEmptyString(lead?.last_name));

  return {
    ...(sender_email_id !== undefined ? { sender_email_id } : {}),
    ...(fromEmail ? { to_emails: [{ name: fromName ?? null, email_address: fromEmail }] } : {}),
  };
}

export async function fetchReplyDefaults(
  client: BisonClient,
  replyId: string | number,
): Promise<ReplyDefaults> {
  const response = await client.request({
    method: 'GET',
    path: `/api/replies/${encodeURIComponent(String(replyId))}`,
  });
  return extractReplyDefaults(response);
}

export function buildComposePayload(
  input: ComposeInput,
  defaults: ReplyDefaults = {},
  options: { messageRequired?: boolean } = {},
): Record<string, unknown> {
  const resolved = resolveMessage(input, { required: options.messageRequired });
  const replyAll = input.reply_all === true;
  const senderEmailId = input.sender_email_id ?? input.from_sender_email_id ?? defaults.sender_email_id;
  const toEmails = parseRecipients(hasRecipientInput(input.to) ? input.to : input.to_email)
    ?? (!replyAll ? defaults.to_emails : undefined);
  const ccEmails = parseRecipients(input.cc);
  const bccEmails = parseRecipients(input.bcc);

  if (!replyAll && senderEmailId === undefined) {
    throw new ValidationError('sender_email_id is required unless reply_all is true.');
  }
  if (!replyAll && (!toEmails || toEmails.length === 0)) {
    throw new ValidationError('to_emails is required unless reply_all is true.');
  }

  const body: Record<string, unknown> = {};
  if (resolved) {
    body.message = resolved.message;
    body.content_type = resolved.content_type;
  }
  if (input.subject !== undefined) body.subject = input.subject;
  if (replyAll) body.reply_all = true;
  if (senderEmailId !== undefined) body.sender_email_id = senderEmailId;
  if (toEmails && toEmails.length > 0) body.to_emails = toEmails;
  if (ccEmails && ccEmails.length > 0) body.cc_emails = ccEmails;
  if (bccEmails && bccEmails.length > 0) body.bcc_emails = bccEmails;
  return body;
}

export function dryRunResult(
  method: 'POST',
  path: string,
  body: Record<string, unknown>,
): { dry_run: true; method: 'POST'; path: string; body: Record<string, unknown> } {
  return { dry_run: true, method, path, body };
}

function splitRecipientList(value: string): string[] {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  const merged: string[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev && prev.includes('<') && !prev.includes('>')) {
      merged[merged.length - 1] = `${prev}, ${part}`;
    } else {
      merged.push(part);
    }
  }
  return merged;
}

function parseRecipientString(part: string): EmailRecipient | undefined {
  const angled = part.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (angled) {
    const name = angled[1].replace(/^["']|["']$/g, '').trim();
    const email = angled[2].trim();
    if (!email) return undefined;
    return { name: name || null, email_address: email };
  }

  const email = part.trim();
  if (!email) return undefined;
  return { name: null, email_address: email };
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
}

function joinName(first?: string, last?: string): string | undefined {
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
