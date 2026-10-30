import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../core/errors.js';
import type { BisonClient } from '../../core/types.js';
import {
  buildComposePayload,
  dryRunResult,
  extractReplyDefaults,
  parseRecipients,
} from './compose.js';
import { repliesForwardCommand } from './forward.js';
import { repliesNewCommand } from './new.js';
import { repliesReplyCommand } from './reply.js';

const ORIGINAL_REPLY = {
  data: {
    id: 2520939,
    sender_email_id: 88,
    from_name: 'Cody Smith',
    from_email_address: 'cody@example.com',
    lead: { first_name: 'Cody', last_name: 'Smith', email: 'cody@example.com' },
  },
};

function mockClient(onRequest: (opts: { method: string; path: string; body?: unknown }) => unknown): BisonClient {
  return {
    request: async (opts) => onRequest(opts),
    paginate: async () => ({}),
  };
}

describe('parseRecipients', () => {
  it('parses a bare email, display name, and comma-separated list', () => {
    expect(parseRecipients('cody@example.com')).toEqual([
      { name: null, email_address: 'cody@example.com' },
    ]);
    expect(parseRecipients('Cody Smith <cody@example.com>')).toEqual([
      { name: 'Cody Smith', email_address: 'cody@example.com' },
    ]);
    expect(parseRecipients('a@b.com, Jane <jane@x.com>')).toEqual([
      { name: null, email_address: 'a@b.com' },
      { name: 'Jane', email_address: 'jane@x.com' },
    ]);
  });

  it('parses object and array inputs used by MCP', () => {
    expect(parseRecipients({ name: 'Ada', email: 'ada@example.com' })).toEqual([
      { name: 'Ada', email_address: 'ada@example.com' },
    ]);
    expect(parseRecipients([{ email_address: 'a@b.com' }, 'c@d.com'])).toEqual([
      { name: null, email_address: 'a@b.com' },
      { name: null, email_address: 'c@d.com' },
    ]);
  });
});

describe('extractReplyDefaults', () => {
  it('reads sender inbox and original from-address from GET /api/replies/{id}', () => {
    expect(extractReplyDefaults(ORIGINAL_REPLY)).toEqual({
      sender_email_id: 88,
      to_emails: [{ name: 'Cody Smith', email_address: 'cody@example.com' }],
    });
  });

  it('falls back to the lead email when from_email_address is missing', () => {
    expect(
      extractReplyDefaults({
        data: { sender_email_id: '9', lead: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' } },
      }),
    ).toEqual({
      sender_email_id: 9,
      to_emails: [{ name: 'Ada Lovelace', email_address: 'ada@example.com' }],
    });
  });
});

describe('buildComposePayload', () => {
  it('converts body_text to HTML and uses API field names', () => {
    expect(
      buildComposePayload({
        body_text: 'Hi...\\n\\nPara2',
        sender_email_id: 88,
        to: 'cody@example.com',
      }),
    ).toEqual({
      message: '<p>Hi...</p><p>Para2</p>',
      content_type: 'html',
      sender_email_id: 88,
      to_emails: [{ name: null, email_address: 'cody@example.com' }],
    });
  });

  it('passes body_html through unchanged', () => {
    expect(
      buildComposePayload({
        body_html: '<p>Already <strong>formatted</strong></p>',
        sender_email_id: 1,
        to_email: 'lead@example.com',
      }),
    ).toEqual({
      message: '<p>Already <strong>formatted</strong></p>',
      content_type: 'html',
      sender_email_id: 1,
      to_emails: [{ name: null, email_address: 'lead@example.com' }],
    });
  });

  it('prefers body_html when both bodies are provided', () => {
    const payload = buildComposePayload({
      body_text: 'plain',
      body_html: '<p>html</p>',
      sender_email_id: 1,
      to: 'a@b.com',
    });
    expect(payload.message).toBe('<p>html</p>');
  });

  it('fills sender and to from fetched reply defaults', () => {
    expect(
      buildComposePayload({ body_text: 'Thanks' }, extractReplyDefaults(ORIGINAL_REPLY)),
    ).toEqual({
      message: '<p>Thanks</p>',
      content_type: 'html',
      sender_email_id: 88,
      to_emails: [{ name: 'Cody Smith', email_address: 'cody@example.com' }],
    });
  });

  it('lets explicit overrides win over defaults', () => {
    const payload = buildComposePayload(
      {
        body_text: 'Thanks',
        sender_email_id: 12,
        to: 'other@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
      },
      extractReplyDefaults(ORIGINAL_REPLY),
    );
    expect(payload.sender_email_id).toBe(12);
    expect(payload.to_emails).toEqual([{ name: null, email_address: 'other@example.com' }]);
    expect(payload.cc_emails).toEqual([{ name: null, email_address: 'cc@example.com' }]);
    expect(payload.bcc_emails).toEqual([{ name: null, email_address: 'bcc@example.com' }]);
  });

  it('omits sender and to when reply_all is set without overrides', () => {
    expect(buildComposePayload({ body_text: 'All', reply_all: true })).toEqual({
      message: '<p>All</p>',
      content_type: 'html',
      reply_all: true,
    });
  });

  it('maps new-email aliases onto the API payload', () => {
    expect(
      buildComposePayload({
        body_text: 'Hello',
        from_sender_email_id: 5,
        to_email: 'ross@example.com',
        subject: 'Quick question',
      }),
    ).toEqual({
      message: '<p>Hello</p>',
      content_type: 'html',
      sender_email_id: 5,
      to_emails: [{ name: null, email_address: 'ross@example.com' }],
      subject: 'Quick question',
    });
  });

  it('allows a forward without a message body', () => {
    expect(
      buildComposePayload(
        { to_email: 'teammate@example.com', sender_email_id: 88 },
        {},
        { messageRequired: false },
      ),
    ).toEqual({
      sender_email_id: 88,
      to_emails: [{ name: null, email_address: 'teammate@example.com' }],
    });
  });

  it('requires a message by default', () => {
    expect(() => buildComposePayload({ sender_email_id: 1, to: 'a@b.com' })).toThrow(ValidationError);
  });

  it('requires sender and to unless reply_all is true', () => {
    expect(() => buildComposePayload({ body_text: 'Hi' })).toThrow(/sender_email_id/);
    expect(() => buildComposePayload({ body_text: 'Hi', sender_email_id: 1 })).toThrow(/to_emails/);
  });
});

describe('replies reply/new/forward handlers', () => {
  it('dry-runs a reply after GET defaults and never POSTs', async () => {
    const requests: Array<{ method: string; path: string; body?: unknown }> = [];
    const client = mockClient((opts) => {
      requests.push(opts);
      if (opts.method === 'GET') return ORIGINAL_REPLY;
      throw new Error('should not send email');
    });

    const result = await repliesReplyCommand.handler(
      { reply_id: '2520939', body_text: 'Hi...\\n\\nPara2', dry_run: true },
      client,
    );

    expect(requests).toEqual([{ method: 'GET', path: '/api/replies/2520939' }]);
    expect(result).toEqual(
      dryRunResult('POST', '/api/replies/2520939/reply', {
        message: '<p>Hi...</p><p>Para2</p>',
        content_type: 'html',
        sender_email_id: 88,
        to_emails: [{ name: 'Cody Smith', email_address: 'cody@example.com' }],
      }),
    );
  });

  it('POSTs a reply with overrides and skips GET when nothing is missing', async () => {
    const requests: Array<{ method: string; path: string; body?: unknown }> = [];
    const client = mockClient((opts) => {
      requests.push(opts);
      return { data: { success: true } };
    });

    await repliesReplyCommand.handler(
      {
        reply_id: '2520939',
        body_html: '<p>Thanks</p>',
        sender_email_id: 12,
        to: 'other@example.com',
      },
      client,
    );

    expect(requests).toEqual([
      {
        method: 'POST',
        path: '/api/replies/2520939/reply',
        body: {
          message: '<p>Thanks</p>',
          content_type: 'html',
          sender_email_id: 12,
          to_emails: [{ name: null, email_address: 'other@example.com' }],
        },
      },
    ]);
  });

  it('dry-runs replies new with mapped API fields and no request', async () => {
    const client = mockClient(() => {
      throw new Error('should not send email');
    });

    const result = await repliesNewCommand.handler(
      {
        to_email: 'ross@example.com',
        from_sender_email_id: 5,
        subject: 'Hello',
        body_text: 'Hi there',
        dry_run: true,
      },
      client,
    );

    expect(result).toEqual(
      dryRunResult('POST', '/api/replies/new', {
        message: '<p>Hi there</p>',
        content_type: 'html',
        sender_email_id: 5,
        to_emails: [{ name: null, email_address: 'ross@example.com' }],
        subject: 'Hello',
      }),
    );
  });

  it('dry-runs a forward using fetched sender_email_id and never POSTs', async () => {
    const requests: Array<{ method: string; path: string; body?: unknown }> = [];
    const client = mockClient((opts) => {
      requests.push(opts);
      if (opts.method === 'GET') return ORIGINAL_REPLY;
      throw new Error('should not send email');
    });

    const result = await repliesForwardCommand.handler(
      { reply_id: '45', to_email: 'teammate@example.com', body_text: 'FYI\n\nSee below', dry_run: true },
      client,
    );

    expect(requests).toEqual([{ method: 'GET', path: '/api/replies/45' }]);
    expect(result).toEqual(
      dryRunResult('POST', '/api/replies/45/forward', {
        message: '<p>FYI</p><p>See below</p>',
        content_type: 'html',
        sender_email_id: 88,
        to_emails: [{ name: null, email_address: 'teammate@example.com' }],
      }),
    );
  });
});
