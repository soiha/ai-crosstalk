/**
 * Envelope Parser Utility
 * Shared module for detecting, parsing, and validating AI Crosstalk envelopes
 */

const EnvelopeParser = {
  /**
   * Regex patterns for envelope detection
   */
  patterns: {
    header: /\[\[(.+?)→(.+?)\s+v(\d+)\]\]/,
    session: /session:\s*(.+)/,
    context: /context:\s*(.+)/,
    intent: /intent:\s*(QUESTION|STATUS|PATCH|NOTE)/,
    body: /body:\s*\|\n([\s\S]*?)(?=\nsig:)/,
    response: /response:\s*\|\n([\s\S]*?)(?=\n\[\[END\]\])/,
    footer: /\[\[END\]\]/,
    fullEnvelope: /\[\[.+?→.+?\s+v\d+\]\][\s\S]*?\[\[END\]\]/g
  },

  /**
   * Check if text contains an envelope
   */
  hasEnvelope(text) {
    return this.patterns.fullEnvelope.test(text);
  },

  /**
   * Extract all envelopes from text
   */
  extractEnvelopes(text) {
    const matches = text.match(this.patterns.fullEnvelope);
    return matches || [];
  },

  /**
   * Parse a single envelope into structured data
   */
  parse(envelopeText) {
    const headerMatch = envelopeText.match(this.patterns.header);
    const sessionMatch = envelopeText.match(this.patterns.session);
    const footerMatch = envelopeText.match(this.patterns.footer);

    if (!headerMatch || !sessionMatch || !footerMatch) {
      return { valid: false, error: 'Invalid envelope format' };
    }

    const result = {
      valid: true,
      from: headerMatch[1],
      to: headerMatch[2],
      version: headerMatch[3],
      session: sessionMatch[1].trim(),
      raw: envelopeText
    };

    // Check if it's a request (has body) or response (has response)
    const bodyMatch = envelopeText.match(this.patterns.body);
    const responseMatch = envelopeText.match(this.patterns.response);

    if (bodyMatch) {
      const contextMatch = envelopeText.match(this.patterns.context);
      const intentMatch = envelopeText.match(this.patterns.intent);

      result.type = 'request';
      result.context = contextMatch ? contextMatch[1].trim() : null;
      result.intent = intentMatch ? intentMatch[1].trim() : null;
      result.body = bodyMatch[1].replace(/^  /gm, '').trim();
    } else if (responseMatch) {
      result.type = 'response';
      result.response = responseMatch[1].replace(/^  /gm, '').trim();
    } else {
      result.valid = false;
      result.error = 'Envelope has neither body nor response';
    }

    return result;
  },

  /**
   * Detect the last envelope in text (most recent response)
   */
  findLastEnvelope(text) {
    const envelopes = this.extractEnvelopes(text);
    if (envelopes.length === 0) return null;

    const lastEnvelope = envelopes[envelopes.length - 1];
    return this.parse(lastEnvelope);
  },

  /**
   * Validate that an envelope is properly formatted
   */
  validate(envelopeText) {
    const parsed = this.parse(envelopeText);

    if (!parsed.valid) {
      return { valid: false, errors: [parsed.error] };
    }

    const errors = [];

    // Check required fields based on type
    if (parsed.type === 'request') {
      if (!parsed.context) errors.push('Missing context field');
      if (!parsed.intent) errors.push('Missing intent field');
      if (!parsed.body) errors.push('Missing body content');
    } else if (parsed.type === 'response') {
      if (!parsed.response) errors.push('Missing response content');
    }

    return {
      valid: errors.length === 0,
      errors,
      parsed
    };
  },

  /**
   * Create a response envelope from a request
   */
  createResponse(requestEnvelope, responseText) {
    const parsed = this.parse(requestEnvelope);
    if (!parsed.valid || parsed.type !== 'request') {
      throw new Error('Invalid request envelope');
    }

    return `[[${parsed.to}→${parsed.from} v${parsed.version}]]
session: ${parsed.session}
response: |
  ${responseText.split('\n').map(line => '  ' + line).join('\n').trim()}
[[END]]`;
  }
};

// Make available globally for content scripts
console.log('[AI Crosstalk] Exposing EnvelopeParser to global scope');
window.EnvelopeParser = EnvelopeParser;
console.log('[AI Crosstalk] EnvelopeParser exposed:', typeof window.EnvelopeParser);
