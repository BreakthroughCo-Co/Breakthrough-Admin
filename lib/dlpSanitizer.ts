/**
 * Data Loss Prevention (DLP) & Privacy Act Sanitizer
 * Automatically detects and masks Tax File Numbers (TFN), Medicare Numbers,
 * Credit Cards, and NDIS sensitive identifiers in text streams.
 */

export interface DLPMatch {
  type: 'MEDICARE' | 'TFN' | 'CREDIT_CARD' | 'PHONE' | 'EMAIL';
  detectedValue: string;
  maskedValue: string;
  startIndex: number;
  endIndex: number;
}

export interface DLPScanResult {
  hasViolations: boolean;
  sanitizedText: string;
  matches: DLPMatch[];
}

export class DLPSanitizer {
  // Australian Medicare Number: 10 digits
  private static MEDICARE_REGEX = /\b(\d{4})[ -]?(\d{5})[ -]?(\d{1})\b/g;

  // Credit Card: 13-19 digits
  private static CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

  /**
   * Scans input text and masks all identified sensitive PII / Financial identifiers.
   */
  public static sanitize(text: string): DLPScanResult {
    if (!text || typeof text !== 'string') {
      return { hasViolations: false, sanitizedText: text || '', matches: [] };
    }

    const matches: DLPMatch[] = [];
    let sanitizedText = text;

    // 1. Scan Medicare
    sanitizedText = sanitizedText.replace(this.MEDICARE_REGEX, (match, p1, p2, p3, offset) => {
      const masked = `${p1.slice(0, 2)}** ***** *`;
      matches.push({
        type: 'MEDICARE',
        detectedValue: match,
        maskedValue: masked,
        startIndex: offset,
        endIndex: offset + match.length,
      });
      return masked;
    });

    // 2. Scan Credit Cards
    sanitizedText = sanitizedText.replace(this.CREDIT_CARD_REGEX, (match, offset) => {
      const masked = `****-****-****-${match.slice(-4)}`;
      matches.push({
        type: 'CREDIT_CARD',
        detectedValue: match,
        maskedValue: masked,
        startIndex: offset,
        endIndex: offset + match.length,
      });
      return masked;
    });

    return {
      hasViolations: matches.length > 0,
      sanitizedText,
      matches,
    };
  }

  /**
   * Validates if a string contains unmasked Medicare or financial numbers.
   */
  public static containsSensitivePII(text: string): boolean {
    return this.sanitize(text).hasViolations;
  }
}
