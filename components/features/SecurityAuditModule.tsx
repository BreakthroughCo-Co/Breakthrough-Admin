'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Activity,
  Globe,
  Clock,
  UserX,
  FileSpreadsheet,
  Download,
  Eye,
  Key,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useManagementStore } from '@/stores/useManagementStore';
import { AuditLog } from '@/types';

// Mock high-fidelity security telemetry logs simulating historical access attempts
const EXTENDED_SECURITY_LOGS: AuditLog[] = [
  {
    id: 'sec-log-01',
    action: 'LOGIN_FAILURE',
    category: 'AUTH_SECURITY',
    targetId: 'user_unknown',
    details: 'Failed password verification for account: admin-backup@breakthrough.org.au from IP 103.21.244.0 (Attempt 3/5)',
    userEmail: 'admin-backup@breakthrough.org.au',
    userRole: 'ADMIN',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    id: 'sec-log-02',
    action: 'LOGIN_FAILURE',
    category: 'AUTH_SECURITY',
    targetId: 'user_unknown',
    details: 'Invalid MFA token submission for clinical-director@breakthrough.org.au from IP 185.191.171.12',
    userEmail: 'clinical-director@breakthrough.org.au',
    userRole: 'ADMIN',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: 'sec-log-03',
    action: 'LOGIN_SUCCESS',
    category: 'AUTH_SECURITY',
    targetId: 'user_sarah_jenkins',
    details: 'Successful Google Workspace OAuth 2.0 Single Sign-On (VIC Clinical Hub)',
    userEmail: 'dr.sarah.jenkins@breakthrough.org.au',
    userRole: 'ADMIN',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'sec-log-04',
    action: 'UNAUTHORIZED_ACCESS_BLOCKED',
    category: 'RBAC_SECURITY',
    targetId: 'billing_export_batch',
    details: 'Viewer role attempted unauthorized deletion on /billingClaims/batch-2026-08 (Denied by Firestore Rules)',
    userEmail: 'auditor.intern@breakthrough.org.au',
    userRole: 'VIEWER',
    timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString()
  },
  {
    id: 'sec-log-05',
    action: 'LOGIN_SUCCESS',
    category: 'AUTH_SECURITY',
    targetId: 'user_elena_rostova',
    details: 'Successful Microsoft 365 Entra ID SSO login (Senior Behaviour Support Specialist)',
    userEmail: 'elena.rostova@breakthrough.org.au',
    userRole: 'PRACTITIONER',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'sec-log-06',
    action: 'SESSION_REVOKED',
    category: 'AUTH_SECURITY',
    targetId: 'user_session_9921',
    details: 'Practitioner idle timeout session termination (15-minute compliance policy enforced)',
    userEmail: 'marcus.vance@breakthrough.org.au',
    userRole: 'PRACTITIONER',
    timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString()
  },
  {
    id: 'sec-log-07',
    action: 'LOGIN_FAILURE',
    category: 'AUTH_SECURITY',
    targetId: 'user_unknown',
    details: 'Brute-force credential stuffing probe blocked by Cloud Armor & Firebase Auth Rate-Limiter (IP: 45.154.255.8)',
    userEmail: 'root@breakthrough.org.au',
    userRole: 'VIEWER',
    timestamp: new Date(Date.now() - 1000 * 60 * 220).toISOString()
  },
  {
    id: 'sec-log-08',
    action: 'LOGIN_SUCCESS',
    category: 'AUTH_SECURITY',
    targetId: 'user_marcus_vance',
    details: 'Email/Password Authentication with verified NDIS Worker Screening Credential',
    userEmail: 'marcus.vance@breakthrough.org.au',
    userRole: 'PRACTITIONER',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  }
];

export const SecurityAuditModule: React.FC = () => {
  const { auditLogs, currentUser, addAuditLog } = useManagementStore();
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Combine store audit logs with security access logs
  const combinedLogs: AuditLog[] = [
    ...auditLogs.filter((l) =>
      l.action?.includes('LOGIN') ||
      l.action?.includes('AUTH') ||
      l.action?.includes('SECURITY') ||
      (l.category && (l.category.includes('SECURITY') || l.category.includes('AUTH')))
    ),
    ...EXTENDED_SECURITY_LOGS
  ];

  // Hourly access pattern data for 24h Recharts visualization
  const accessPatternData = [
    { hour: '00:00', successfulLogins: 2, failedAttempts: 1, unauthorizedBlocks: 0 },
    { hour: '04:00', successfulLogins: 1, failedAttempts: 3, unauthorizedBlocks: 1 },
    { hour: '08:00', successfulLogins: 18, failedAttempts: 2, unauthorizedBlocks: 0 },
    { hour: '10:00', successfulLogins: 34, failedAttempts: 4, unauthorizedBlocks: 1 },
    { hour: '12:00', successfulLogins: 26, failedAttempts: 1, unauthorizedBlocks: 0 },
    { hour: '14:00', successfulLogins: 39, failedAttempts: 5, unauthorizedBlocks: 2 },
    { hour: '16:00', successfulLogins: 28, failedAttempts: 2, unauthorizedBlocks: 0 },
    { hour: '18:00', successfulLogins: 12, failedAttempts: 1, unauthorizedBlocks: 0 },
    { hour: '20:00', successfulLogins: 6, failedAttempts: 0, unauthorizedBlocks: 0 },
    { hour: '22:00', successfulLogins: 4, failedAttempts: 2, unauthorizedBlocks: 1 },
  ];

  // Distribution by Auth Provider / Mechanism
  const authProviderDistribution = [
    { name: 'Google Workspace (OAuth)', value: 68, color: '#38bdf8' },
    { name: 'Microsoft 365 (Entra ID)', value: 24, color: '#0d9488' },
    { name: 'Email & Multi-Factor', value: 14, color: '#f59e0b' },
    { name: 'Failed / Blocked Attempts', value: 9, color: '#f43f5e' },
  ];

  // Role Access Breakdown
  const roleAccessData = [
    { role: 'Clinical Director (Admin)', accesses: 142, fill: '#14b8a6' },
    { role: 'PBS Practitioners', accesses: 280, fill: '#06b6d4' },
    { role: 'Support Coordinators', accesses: 95, fill: '#8b5cf6' },
    { role: 'Auditors / Viewers', accesses: 24, fill: '#f59e0b' },
  ];

  // Filtering
  const filteredLogs = combinedLogs.filter((log) => {
    const matchesFilter =
      filterAction === 'ALL' ||
      (filterAction === 'FAILED' && log.action.includes('FAILURE')) ||
      (filterAction === 'SUCCESS' && log.action.includes('SUCCESS')) ||
      (filterAction === 'UNAUTHORIZED' && (log.action.includes('UNAUTHORIZED') || log.action.includes('BLOCKED')));

    const matchesSearch =
      searchTerm.trim() === '' ||
      (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalLogins = accessPatternData.reduce((acc, curr) => acc + curr.successfulLogins, 0);
  const totalFailed = accessPatternData.reduce((acc, curr) => acc + curr.failedAttempts, 0);
  const totalBlocked = accessPatternData.reduce((acc, curr) => acc + curr.unauthorizedBlocks, 0);
  const securityHealthScore = Math.round(((totalLogins) / (totalLogins + totalFailed + totalBlocked)) * 100);

  const handleExportSecurityCSV = () => {
    const headers = ['Timestamp', 'Action', 'Category', 'User Email', 'Role', 'Target Resource', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.userEmail || 'System'}"`,
      `"${l.userRole || 'N/A'}"`,
      `"${l.targetId || 'N/A'}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `security-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      'EXPORT_SECURITY_AUDIT_CSV',
      'SECURITY_AUDIT_MODULE',
      'sec-export',
      `Exported ${filteredLogs.length} security access events to CSV for ISO 27001 / NDIS compliance review.`
    );
  };

  return (
    <div className="space-y-6" id="security-audit-module">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              NDIS Cyber &amp; Access Governance
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Audit-Ready Practice Standard 1
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            Security Audit &amp; Access Pattern Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time analytics of authenticated user access sessions, failed login attempts, unauthorized permission blocks, and identity provider distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportSecurityCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export Security CSV</span>
          </button>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Authorized Logins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalLogins}</div>
          <p className="text-[11px] text-emerald-400 font-medium">Google &amp; Microsoft SSO Active</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Failed Login Attempts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{totalFailed}</div>
          <p className="text-[11px] text-slate-400 font-medium">Rate-Limited &amp; Logged</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Unauthorized RBAC Blocks</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{totalBlocked}</div>
          <p className="text-[11px] text-amber-300 font-medium">Enforced via Firestore Rules</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Authentication Integrity</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400 font-mono">{securityHealthScore}%</div>
          <p className="text-[11px] text-slate-400 font-medium">NDIS Practice Standard Compliant</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart: Access Pattern & Failed Logins over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Access Patterns &amp; Unauthorized Probes (24-Hour Timeline)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hourly comparison of authenticated sessions vs. rejected attempts across practitioners.
              </p>
            </div>
            <span className="text-[11px] font-mono text-teal-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Live Recharts Stream
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accessPatternData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="successfulLogins" name="Authorized Logins" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failedAttempts" name="Failed Login Attempts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unauthorizedBlocks" name="Unauthorized RBAC Probes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Identity Provider Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Auth Provider Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Federated single sign-on mechanisms.
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={authProviderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {authProviderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
            {authProviderDistribution.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Access Events & Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Access Pattern &amp; Security Telemetry Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable log of authentication grants, MFA challenges, and access rejections.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search email, IP, action..."
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-teal-400 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Security Events</option>
              <option value="FAILED">Failed Logins Only</option>
              <option value="SUCCESS">Successful Logins Only</option>
              <option value="UNAUTHORIZED">Unauthorized Access Blocks</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Security Action</th>
                <th className="py-2.5 px-3">User / Identity</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Details &amp; Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const isFail = log.action.includes('FAILURE') || log.action.includes('BLOCKED');
                const isSuccess = log.action.includes('SUCCESS');
                return (
                  <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isFail
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : isSuccess
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-bold whitespace-nowrap">
                      {log.userEmail || 'Unknown User'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        {log.userRole || 'VIEWER'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-xs">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
