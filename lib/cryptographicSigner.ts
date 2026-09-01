import crypto from 'crypto';

export interface DigitalSignatureCertificate {
  documentId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  documentHash: string;
  signatureChecksum: string;
  isValid: boolean;
}

export class CryptographicSigner {
  /**
   * Generates a SHA-256 fingerprint hash of any string or document payload.
   */
  public static hashDocument(payload: string): string {
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Creates a tamper-evident digital signature certificate.
   */
  public static signDocument(params: {
    documentId: string;
    documentContent: string;
    signerName: string;
    signerEmail: string;
    signerRole: string;
    ipAddress?: string;
    userAgent?: string;
  }): DigitalSignatureCertificate {
    const timestamp = new Date().toISOString();
    const documentHash = this.hashDocument(params.documentContent);
    const signaturePayload = `${params.documentId}|${documentHash}|${params.signerEmail}|${timestamp}`;
    const signatureChecksum = crypto.createHash('sha256').update(signaturePayload, 'utf8').digest('hex');

    return {
      documentId: params.documentId,
      signerName: params.signerName,
      signerEmail: params.signerEmail,
      signerRole: params.signerRole,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Breakthrough OS Secure Client',
      timestamp,
      documentHash,
      signatureChecksum,
      isValid: true,
    };
  }

  /**
   * Verifies that the document content matches the cryptographic certificate.
   */
  public static verifyCertificate(
    documentContent: string,
    certificate: DigitalSignatureCertificate
  ): boolean {
    const recalculatedHash = this.hashDocument(documentContent);
    if (recalculatedHash !== certificate.documentHash) {
      return false;
    }
    const signaturePayload = `${certificate.documentId}|${certificate.documentHash}|${certificate.signerEmail}|${certificate.timestamp}`;
    const recalculatedChecksum = crypto.createHash('sha256').update(signaturePayload, 'utf8').digest('hex');
    return recalculatedChecksum === certificate.signatureChecksum;
  }
}
