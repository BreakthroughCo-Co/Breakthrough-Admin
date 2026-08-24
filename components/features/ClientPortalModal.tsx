'use client';

import React, { useState } from 'react';
import { Client, ClientGoal } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  Share2,
  Lock,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Shield,
  Copy,
  Mail,
  Smartphone,
  Printer,
  Download,
  X,
  Target,
  FileText,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ClientPortalModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({ client, isOpen, onClose }) => {
  const { addAuditLog, addNotification } = useManagementStore();

  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'SETTINGS' | 'FEEDBACK'>('PREVIEW');
  const [copiedLink, setCopiedLink] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientRole, setRecipientRole] = useState<'Family Member' | 'Support Coordinator' | 'Plan Nominee'>('Family Member');
  const [feedbackNotes, setFeedbackNotes] = useState<string[]>([]);
  const [newFeedbackText, setNewFeedbackText] = useState('');

  // Access permissions
  const [permGoals, setPermGoals] = useState(true);
  const [permProgress, setPermProgress] = useState(true);
  const [permBudget, setPermBudget] = useState(true);
  const [permMaskSensitive, setPermMaskSensitive] = useState(true);

  if (!isOpen || !client) return null;

  const shareToken = `ndis_sec_${client.id.replace('cli-', '')}_${client.ndisNumber.slice(-4)}`;
  const portalUrl = `https://portal.breakthrough.org.au/participant/${client.id}?token=${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);

    addAuditLog(
      'CLIENT_PORTAL_LINK_COPIED',
      'CLIENT_PORTAL',
      client.id,
      `Generated and copied secure portal access link for ${client.name} (Role: ${recipientRole}).`
    );
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    addNotification({
      title: `Client Portal Invite Sent: ${client.name}`,
      message: `Secure access link sent to ${recipientEmail} (${recipientRole}) with customized permissions.`,
      type: 'client',
      severity: 'info',
      linkTab: 'clients',
    });

    addAuditLog(
      'CLIENT_PORTAL_INVITE_SENT',
      'CLIENT_PORTAL',
      client.id,
      `Sent portal invite to ${recipientEmail} (${recipientRole}) with permissions [Goals: ${permGoals}, Progress: ${permProgress}, Budget: ${permBudget}].`
    );

    setRecipientEmail('');
    alert(`Secure Portal invitation sent to ${recipientEmail}!`);
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackText.trim()) return;

    setFeedbackNotes([...feedbackNotes, newFeedbackText.trim()]);
    setNewFeedbackText('');

    addAuditLog(
      'CLIENT_PORTAL_NOTE_ADDED',
      'CLIENT_PORTAL',
      client.id,
      `Support Coordinator / Family note recorded in portal for ${client.name}.`
    );
  };

  const handlePrintFamilyReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Participant Goal & Progress Summary - ${client.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; padding: 24px; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { font-size: 20pt; margin: 0; color: #0f172a; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 9pt; font-weight: bold; background: #ccfbf1; color: #0f766e; border-radius: 4px; }
            .goal-box { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 10px; background: #f8fafc; }
            .progress-bar-bg { background: #e2e8f0; border-radius: 4px; height: 10px; overflow: hidden; margin-top: 6px; }
            .progress-bar-fill { background: #0d9488; height: 100%; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">Breakthrough Coaching Client Portal</span>
            <h1>${client.name} - NDIS Goal & Progress Report</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 10pt;">
              NDIS #: <strong>${permMaskSensitive ? '•••• ' + client.ndisNumber.slice(-4) : client.ndisNumber}</strong> | 
              Primary Practitioner: <strong>${client.primaryPractitionerName}</strong> | 
              Generated: <strong>${reportDate}</strong>
            </p>
          </div>

          <h2>NDIS Goals & Attainment Progress</h2>
          ${client.goals
            .map(
              (g) => `
            <div class="goal-box">
              <div style="font-weight: bold; font-size: 11pt;">${g.title}</div>
              <div style="font-size: 9pt; color: #64748b; margin-top: 2px;">
                Category: ${g.category} | Target: ${g.targetDate} | Status: <strong>${g.status}</strong>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${g.progressPercent}%;"></div>
              </div>
              <div style="font-size: 8.5pt; text-align: right; margin-top: 2px; font-weight: bold; color: #0d9488;">
                ${g.progressPercent}% Achieved ${g.gasScore !== undefined ? `(GAS Level: ${g.gasScore >= 0 ? '+' : ''}${g.gasScore})` : ''}
              </div>
            </div>
          `
            )
            .join('')}

          ${
            permBudget
              ? `
          <h2 style="margin-top: 24px;">Budget Utilization Summary</h2>
          <div style="padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc;">
            <div>Total Allocated NDIS Plan Funding: <strong>$${client.totalBudget.toLocaleString()}</strong></div>
            <div>Utilized to Date: <strong>$${client.spentBudget.toLocaleString()}</strong> (${Math.round((client.spentBudget / (client.totalBudget || 1)) * 100)}%)</div>
            <div>Remaining Capacity: <strong>$${(client.totalBudget - client.spentBudget).toLocaleString()}</strong></div>
          </div>`
              : ''
          }

          <div style="margin-top: 30px; font-size: 8.5pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Securely generated from Breakthrough Coaching OS Client Portal for authorized families & support coordinators.
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Client Portal & Family Sharing</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Securely share real-time NDIS goal tracking and clinical updates with family members or Support Coordinators.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'PREVIEW'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Family Portal Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'SETTINGS'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Access Link & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'FEEDBACK'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Support Coordinator Notes ({feedbackNotes.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'PREVIEW' && (
            <div className="space-y-4">
              {/* Participant Portal Header Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-950 to-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-black text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{client.name}</h4>
                    <p className="text-xs text-slate-400">
                      NDIS #{permMaskSensitive ? '•••• ' + client.ndisNumber.slice(-4) : client.ndisNumber} • {client.primaryDisability}
                    </p>
                    <p className="text-[11px] text-teal-400 font-mono mt-0.5">
                      Practitioner: <strong>{client.primaryPractitionerName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    onClick={handlePrintFamilyReport}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-lg border border-teal-500/30 flex items-center gap-1.5 transition-all text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Family Summary</span>
                  </button>
                </div>
              </div>

              {/* Goal Tracking Section */}
              {permGoals && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                      <Target className="w-4 h-4 text-teal-400" />
                      NDIS Goal Attainment Scaling (GAS) Tracking
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {client.goals.filter((g) => g.status === 'Achieved').length} of {client.goals.length} Goals Achieved
                    </span>
                  </div>

                  <div className="space-y-2">
                    {client.goals.map((goal: ClientGoal) => (
                      <div key={goal.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs">{goal.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              goal.status === 'Achieved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                            }`}
                          >
                            {goal.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Category: {goal.category}</span>
                            <span className="text-teal-400 font-bold">{goal.progressPercent}% Achieved</span>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${goal.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {goal.gasScore !== undefined && (
                          <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400 border-t border-slate-900">
                            <span>Goal Attainment Scale:</span>
                            <span className="font-bold text-teal-300 font-mono">
                              GAS Score: {goal.gasScore >= 0 ? `+${goal.gasScore}` : goal.gasScore}{' '}
                              {goal.gasScore === 2
                                ? '(Much Better Than Expected)'
                                : goal.gasScore === 1
                                ? '(Better Than Expected)'
                                : goal.gasScore === 0
                                ? '(Expected Outcome Met)'
                                : '(Below Expected)'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Transparency Section */}
              {permBudget && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      NDIS Funding & Budget Transparency
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      ${client.spentBudget.toLocaleString()} / ${client.totalBudget.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Total Plan Funding</span>
                      <span className="text-sm font-bold text-white">${client.totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Utilized (Approved Claims)</span>
                      <span className="text-sm font-bold text-teal-400">${client.spentBudget.toLocaleString()}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Remaining Funding</span>
                      <span className="text-sm font-bold text-emerald-400">
                        ${(client.totalBudget - client.spentBudget).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="space-y-5">
              {/* Secure Link Generator */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  Secure Family & Coordinator Access Link
                </h4>
                <p className="text-slate-400 text-xs">
                  This encrypted token allows authorized carers and Support Coordinators to view live goal updates without full system login.
                </p>

                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="bg-transparent text-xs text-teal-300 font-mono flex-1 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-md flex items-center gap-1 shrink-0 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Invite Dispatch Form */}
              <form onSubmit={handleSendInvite} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Send Direct Portal Invitation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Recipient Email</label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="coordinator@partner-ndis.com.au"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Access Role</label>
                    <select
                      value={recipientRole}
                      onChange={(e) => setRecipientRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-teal-300 text-xs font-bold"
                    >
                      <option value="Family Member">Family Member / Primary Carer</option>
                      <option value="Support Coordinator">NDIS Support Coordinator</option>
                      <option value="Plan Nominee">Legal Plan Nominee / Guardian</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 text-xs transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Secure Portal Invite</span>
                  </button>
                </div>
              </form>

              {/* Granular Permission Toggles */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">Granular Portal View Permissions</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-white font-semibold block">Goal Tracking & GAS Scores</span>
                      <span className="text-slate-400 text-[11px]">Display active NDIS goals and attainment percentage</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permGoals}
                      onChange={(e) => setPermGoals(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-white font-semibold block">Clinical Progress Updates</span>
                      <span className="text-slate-400 text-[11px]">Allow viewing synthesized progress summaries</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permProgress}
                      onChange={(e) => setPermProgress(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-white font-semibold block">NDIS Funding & Budget Breakdown</span>
                      <span className="text-slate-400 text-[11px]">Show overall plan budget utilization and remaining balance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permBudget}
                      onChange={(e) => setPermBudget(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <div>
                      <span className="text-white font-semibold block">Mask Sensitive Identifiers</span>
                      <span className="text-slate-400 text-[11px]">Partially mask NDIS number and hide restrictive practice details</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={permMaskSensitive}
                      onChange={(e) => setPermMaskSensitive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FEEDBACK' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  Support Coordinator & Carer Feedback Channel
                </h4>
                <p className="text-slate-400 text-xs">
                  Direct communication feed between the clinical team, family members, and the participant&apos;s Support Coordinator.
                </p>

                <form onSubmit={handleAddFeedback} className="space-y-2">
                  <textarea
                    rows={3}
                    value={newFeedbackText}
                    onChange={(e) => setNewFeedbackText(e.target.value)}
                    placeholder="Log coordinator notes, home observations, or upcoming review requests..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs placeholder-slate-600 focus:border-teal-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newFeedbackText.trim()}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Note to Participant Portal</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-900">
                  {feedbackNotes.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      No portal notes logged yet. Notes posted here are logged into the audit ledger and visible to the clinical team.
                    </div>
                  ) : (
                    feedbackNotes.map((note, index) => (
                      <div key={index} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span className="font-bold text-teal-300 font-mono">Coordinator / Carer Note #{index + 1}</span>
                          <span>Just now</span>
                        </div>
                        <p className="text-slate-200">{note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-slate-400 text-xs font-mono">
            Active Participant: <strong>{client.name}</strong> (#{client.ndisNumber})
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
