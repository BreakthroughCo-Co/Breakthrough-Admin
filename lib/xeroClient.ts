import { XeroClient } from 'xero-node';

let xeroClientInstance: XeroClient | null = null;

export function getXeroClient(): XeroClient {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/auth/xero/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables are required. Please configure them in your settings.'
    );
  }

  if (!xeroClientInstance) {
    xeroClientInstance = new XeroClient({
      clientId,
      clientSecret,
      redirectUris: [redirectUri],
      scopes: 'openid profile email accounting.transactions accounting.contacts offline_access'.split(' '),
    });
  }

  return xeroClientInstance;
}

export function isXeroConfigured(): boolean {
  return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);
}
