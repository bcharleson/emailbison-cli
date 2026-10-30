const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

/**
 * Normalize CRLF and interpret common CLI escape sequences so
 * `--body-text "Hi\\n\\nPara2"` becomes real line breaks.
 */
export function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

/**
 * Convert plain text to safe HTML: escape markup, wrap blank-line
 * separated blocks in `<p>`, and turn single newlines into `<br>`.
 */
export function textToSafeHtml(text: string): string {
  const normalized = normalizePlainText(text).replace(/^\uFEFF/, '').trim();
  if (!normalized) return '';

  return normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/^[ \t]+|[ \t]+$/g, ''))
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
