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
    session: /session:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+(?:context|intent|body|response|sig|\[\[END\]\]))/,
    context: /context:\s*([^\s]+(?:\s+[^\s]+)*?)(?=\s+(?:intent|body|response|sig|\[\[END\]\]))/,
    intent: /intent:\s*(QUESTION|STATUS|PATCH|NOTE)/,
    body: /body:\s*\|\s*([^]+?)(?=\s+sig:)/,
    response: /response:\s*\|\s*([^]+?)(?=\s+\[\[END\]\])/,
    footer: /\[\[END\]\]/,
    fullEnvelope: /\[\[.+?→.+?\s+v\d+\]\][^]*?\[\[END\]\]/g
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
    const contextMatch = envelopeText.match(this.patterns.context);
    const intentMatch = envelopeText.match(this.patterns.intent);

    // Determine if it's a request or response based on direction and content
    // Responses FROM other AIs use body: format but are still responses
    if (responseMatch) {
      result.type = 'response';
      result.response = responseMatch[1].replace(/^  /gm, '').trim();
    } else if (bodyMatch) {
      // If it has intent field, it's definitely a request
      if (intentMatch) {
        result.type = 'request';
        result.context = contextMatch ? contextMatch[1].trim() : null;
        result.intent = intentMatch[1].trim();
        result.body = bodyMatch[1].replace(/^  /gm, '').trim();
      } else {
        // No intent = it's a response using body: format (Brother's format)
        result.type = 'response';
        result.response = bodyMatch[1].replace(/^  /gm, '').trim();
      }
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
window.EnvelopeParser = EnvelopeParser;
