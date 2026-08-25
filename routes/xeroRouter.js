import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

export const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID || 'unconfigured_client_id',
  clientSecret: process.env.XERO_CLIENT_SECRET || 'unconfigured_client_secret',
  redirectUris: [process.env.XERO_REDIRECT_URI || 'http://localhost:3000/callback'],
  scopes: 'openid profile email accounting.transactions accounting.contacts offline_access'.split(' '),
});

// Redirect user to Xero authorization URL
router.get('/auth/xero', async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (err) {
    res.status(500).json({ error: 'Failed to build consent URL', details: err.message });
  }
});

// OAuth Callback: Exchange code for tokens
router.get('/callback', async (req, res) => {
  try {
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants();
    // Store tokenSet and active tenant in session or database
    req.session = req.session || {};
    req.session.tokenSet = tokenSet;
    req.session.activeTenantId = xero.tenants[0]?.tenantId;
    res.status(200).json({ status: 'authenticated', tenantId: xero.tenants[0]?.tenantId });
  } catch (err) {
    res.status(500).json({ error: 'OAuth Callback Failed', details: err.message });
  }
});

export default router;
