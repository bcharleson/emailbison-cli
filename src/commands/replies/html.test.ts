import { describe, expect, it } from 'vitest';
import { escapeHtml, normalizePlainText, textToSafeHtml } from './html.js';

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<b>Tom & "Jerry"</b>`)).toBe(
      '&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;',
    );
  });
});

describe('normalizePlainText', () => {
  it('interprets CLI escape sequences and CRLF', () => {
    expect(normalizePlainText('Hi\\n\\nPara2')).toBe('Hi\n\nPara2');
    expect(normalizePlainText('a\r\nb\\tc')).toBe('a\nb\tc');
  });
});

describe('textToSafeHtml', () => {
  it('wraps a single paragraph', () => {
    expect(textToSafeHtml('Hello')).toBe('<p>Hello</p>');
  });

  it('turns blank lines into paragraphs', () => {
    expect(textToSafeHtml('Hi...\n\nPara2')).toBe('<p>Hi...</p><p>Para2</p>');
    expect(textToSafeHtml('Hi...\\n\\nPara2')).toBe('<p>Hi...</p><p>Para2</p>');
  });

  it('turns single newlines into <br> inside a paragraph', () => {
    expect(textToSafeHtml('Line1\nLine2\n\nPara2')).toBe(
      '<p>Line1<br>Line2</p><p>Para2</p>',
    );
  });

  it('escapes HTML before inserting breaks', () => {
    expect(textToSafeHtml('<script>alert(1)</script>\n\nNext')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><p>Next</p>',
    );
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(textToSafeHtml('  \n\n  ')).toBe('');
  });
});
