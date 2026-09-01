'use client';

import React, { useState } from 'react';
import {
  Globe,
  Key,
  ExternalLink,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const OAuthCredentialsGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'google' | 'microsoft'>('google');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/callback`
    : 'https://ais-dev-fvcq32sizwox6fa7chplbk-322108119867.asia-southeast1.run.app';

  return (
    <div
      id="oauth-credentials-setup-guide"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              OAuth 2.0 Client Secret Generation Guide
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Step-by-step instructions for practitioners and system admins to generate enterprise API credentials for Google Workspace &amp; Microsoft 365.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
            </svg>
            <span>Google Cloud Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('microsoft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'microsoft'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span>Microsoft Entra ID (Azure)</span>
          </button>
        </div>
      </div>

      {/* Google Step-by-Step Instructions */}
      {activeTab === 'google' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-start gap-2.5 text-xs text-sky-200">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Google OAuth credentials grant secure Single Sign-On and permit calendar synchronization, Google Keep note updates, and Drive clinical document storage.
            </span>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-sky-500/30">
                1
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white">Open Google Cloud Console Credentials</strong>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>console.cloud.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-400">
                  Select or create your NDIS Practice project (e.g., <em>Breakthrough-Allied-Health</em>).
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-sky-500/30">
                2
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Configure the OAuth Consent Screen</strong>
                <p className="text-slate-400">
                  Navigate to <strong>APIs &amp; Services &rarr; OAuth consent screen</strong>. Select <strong>Internal</strong> (for Google Workspace organizations) or <strong>External</strong>, enter your App Name (<em>Breakthrough OS</em>) and support email.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-sky-500/30">
                3
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Create Web Application OAuth Client ID</strong>
                <p className="text-slate-400">
                  Click <strong>+ CREATE CREDENTIALS &rarr; OAuth client ID</strong>. Set Application Type to <strong>Web application</strong>.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1 font-semibold">
                    Authorized JavaScript Origins:
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-900 px-2.5 py-1 rounded text-[11px] text-teal-300 font-mono border border-slate-800 flex-1 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-fvcq32sizwox6fa7chplbk-322108119867.asia-southeast1.run.app'}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(typeof window !== 'undefined' ? window.location.origin : 'https://breakthrough.org.au', 'g-origin')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === 'g-origin' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-sky-500/30">
                4
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Copy Credentials to Settings / Secrets</strong>
                <p className="text-slate-400">
                  Google will display your <strong>Client ID</strong> and <strong>Client Secret</strong>. Enter them in the platform Settings menu under Secrets.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Microsoft Step-by-Step Instructions */}
      {activeTab === 'microsoft' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl flex items-start gap-2.5 text-xs text-teal-200">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              Microsoft Entra ID (Azure AD) enables Microsoft 365 Single Sign-On, Outlook calendar sync, and practitioner user authentication.
            </span>
          </div>

          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-teal-500/30">
                1
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white">Open Microsoft Entra ID App Registrations</strong>
                  <a
                    href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>portal.azure.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-400">
                  Log into Azure Portal and navigate to <strong>Microsoft Entra ID &rarr; App registrations</strong>.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-teal-500/30">
                2
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Register a New Application</strong>
                <p className="text-slate-400">
                  Click <strong>+ New registration</strong>. Name it <em>Breakthrough Allied Health OS</em>. Under Supported Account Types, choose <strong>Accounts in this organizational directory only</strong> or <strong>Multitenant</strong>.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-teal-500/30">
                3
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Generate Client Secret (Certificates &amp; Secrets)</strong>
                <p className="text-slate-400">
                  In your new app blade, go to <strong>Certificates &amp; secrets &rarr; + New client secret</strong>. Set Description to <em>Production API Secret</em>, choose expiration (e.g. 180 days), and click <strong>Add</strong>.
                </p>
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
                  ⚠️ <strong>Important</strong>: Copy the secret <strong>Value</strong> immediately (it will only be shown once).
                </div>
              </div>
            </li>

            <li className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold font-mono flex items-center justify-center shrink-0 text-[11px] border border-teal-500/30">
                4
              </span>
              <div className="flex-1 space-y-1">
                <strong className="text-white">Enable Microsoft Provider in Firebase Console</strong>
                <p className="text-slate-400">
                  Paste the <strong>Application (client) ID</strong> and <strong>Secret Value</strong> into Firebase Console under <strong>Authentication &rarr; Sign-in method &rarr; Microsoft</strong>.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
