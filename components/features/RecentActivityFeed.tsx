'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import {
  Activity,
  FileText,
  ShieldAlert,
  DollarSign,
  Lock,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  Calendar,
  User,
  Sparkles,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';

export type ActivityCategory = 'ALL' | 'CLINICAL' | 'INCIDENT' | 'BILLING' | 'COMPLIANCE' | 'AUDIT';

export interface UnifiedActivityItem {
  id: string;
  category: 'CLINICAL' | 'INCIDENT' | 'BILLING' | 'COMPLIANCE' | 'AUDIT';
  categoryLabel: string;
  categoryColor: string;
  categoryBg: string;
  categoryBorder: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  actor: string;
  actorRole?: string;
  participantName?: string;
  clientId?: string;
  timestamp: string;
  rawDate: number;
  statusBadge: string;
  statusBadgeColor: string;
  amount?: number;
  targetTab: TabType;
}

export const RecentActivityFeed: React.FC = () => {
  const {
    caseNotes,
    incidents,
    billingClaims,
    restrictivePractices,
    auditLogs,
    clients,
    practitioners,
    setActiveTab,
    addAuditLog
  } = useManagementStore();

  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(8);

  // Helper to resolve client name by ID
  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  // Aggregate and normalize all operational events
  const allActivities = useMemo(() => {
    const list: UnifiedActivityItem[] = [];

    // 1. Clinical Case Notes
    caseNotes.forEach((note) => {
      const pName = clientMap.get(note.clientId) || note.clientName || 'Participant';
      const dateVal = note.date ? new Date(note.date).getTime() : Date.now() - 3600000;
      list.push({
        id: `note-${note.id}`,
        category: 'CLINICAL',
        categoryLabel: 'Clinical Note',
        categoryColor: 'text-sky-400',
        categoryBg: 'bg-sky-500/10',
        categoryBorder: 'border-sky-500/20',
        icon: FileText,
        title: `${note.format || 'SOAP'} Progress Note: ${pName}`,
        summary: note.assessment || note.objective || note.plan || 'Clinical progress and capacity building session documented.',
        actor: note.practitionerName || 'Allied Health Clinician',
        participantName: pName,
        clientId: note.clientId,
        timestamp: note.date || new Date().toISOString().slice(0, 10),
        rawDate: isNaN(dateVal) ? Date.now() : dateVal,
        statusBadge: `${note.sessionDurationMinutes || 60}m • ${note.status || 'Finalized'}`,
        statusBadgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        targetTab: 'case-notes'
      });
    });

    // 2. Incidents & Hazards
    incidents.forEach((inc) => {
      const pName = clientMap.get(inc.clientId) || inc.clientName || 'Participant';
      const rawDateStr = inc.incidentDate || inc.date || '';
      const dateVal = rawDateStr ? new Date(rawDateStr).getTime() : Date.now() - 7200000;
      const isCritical = inc.severity === 'Critical / Reportable';
      list.push({
        id: `inc-${inc.id}`,
        category: 'INCIDENT',
        categoryLabel: 'Incident Report',
        categoryColor: isCritical ? 'text-rose-400' : 'text-amber-400',
        categoryBg: isCritical ? 'bg-rose-500/10' : 'bg-amber-500/10',
        categoryBorder: isCritical ? 'border-rose-500/20' : 'border-amber-500/20',
        icon: ShieldAlert,
        title: `Incident: ${inc.title || inc.category || 'Clinical Incident'}`,
        summary: inc.description || 'Incident report logged with NDIS Commission notification review.',
        actor: inc.reportedByName || inc.reportedBy || 'Staff Member',
        participantName: pName,
        clientId: inc.clientId,
        timestamp: rawDateStr || new Date().toISOString().slice(0, 10),
        rawDate: isNaN(dateVal) ? Date.now() : dateVal,
        statusBadge: `${inc.severity} • ${inc.status}`,
        statusBadgeColor: isCritical
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
          : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        targetTab: 'incidents'
      });
    });

    // 3. Billing & PRODA PACE Claims
    billingClaims.forEach((claim) => {
      const pName = clientMap.get(claim.clientId) || claim.clientName || 'Participant';
      const dateVal = claim.serviceDate ? new Date(claim.serviceDate).getTime() : Date.now() - 14400000;
      list.push({
        id: `claim-${claim.id}`,
        category: 'BILLING',
        categoryLabel: 'NDIS Claim',
        categoryColor: 'text-emerald-400',
        categoryBg: 'bg-emerald-500/10',
        categoryBorder: 'border-emerald-500/20',
        icon: DollarSign,
        title: `Billing Claim: ${claim.supportItemCode || 'NDIS Support'}`,
        summary: `${claim.hours || 1} hrs @ $${claim.unitRate || claim.totalAmount} (${claim.claimType || 'Plan Managed'})`,
        actor: claim.practitionerName || 'Finance Coordinator',
        participantName: pName,
        clientId: claim.clientId,
        timestamp: claim.serviceDate || new Date().toISOString().slice(0, 10),
        rawDate: isNaN(dateVal) ? Date.now() : dateVal,
        statusBadge: `$${(claim.totalAmount || 0).toFixed(2)} • ${claim.status || 'Processed'}`,
        statusBadgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
        amount: claim.totalAmount,
        targetTab: 'billing'
      });
    });

    // 4. Restrictive Practices & Behaviour Support
    restrictivePractices.forEach((rp) => {
      const pName = clientMap.get(rp.clientId) || 'Participant';
      const dateVal = rp.authorizationDate ? new Date(rp.authorizationDate).getTime() : Date.now() - 86400000;
      list.push({
        id: `rp-${rp.id}`,
        category: 'COMPLIANCE',
        categoryLabel: 'Restrictive Practice',
        categoryColor: 'text-amber-400',
        categoryBg: 'bg-amber-500/10',
        categoryBorder: 'border-amber-500/20',
        icon: Lock,
        title: `BSP Practice Protocol: ${rp.type || 'Regulated Practice'}`,
        summary: rp.rationale || `Practice recorded under BSP protocol with statutory reporting requirements.`,
        actor: 'Clinical Director',
        participantName: pName,
        clientId: rp.clientId,
        timestamp: rp.authorizationDate || new Date().toISOString().slice(0, 10),
        rawDate: isNaN(dateVal) ? Date.now() : dateVal,
        statusBadge: rp.status || 'Active',
        statusBadgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        targetTab: 'restrictive-practices'
      });
    });

    // 5. System Audit Trail & Security
    auditLogs.slice(0, 10).forEach((log) => {
      const dateVal = log.timestamp ? new Date(log.timestamp).getTime() : Date.now() - 172800000;
      list.push({
        id: `audit-${log.id}`,
        category: 'AUDIT',
        categoryLabel: 'Audit Event',
        categoryColor: 'text-teal-400',
        categoryBg: 'bg-teal-500/10',
        categoryBorder: 'border-teal-500/20',
        icon: CheckCircle2,
        title: `Audit: ${log.action.replace(/_/g, ' ')}`,
        summary: log.details || `Governance ledger event recorded in compliance with NDIS Practice Standards.`,
        actor: log.actorName || 'System Admin',
        timestamp: log.timestamp ? new Date(log.timestamp).toLocaleDateString() : new Date().toISOString().slice(0, 10),
        rawDate: isNaN(dateVal) ? Date.now() : dateVal,
        statusBadge: log.entity || 'Security',
        statusBadgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        targetTab: 'audit-logs'
      });
    });

    // Sort chronologically (newest first)
    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [caseNotes, incidents, billingClaims, restrictivePractices, auditLogs, clientMap]);

  // Filter and search
  const filteredActivities = useMemo(() => {
    return allActivities.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesActor = item.actor.toLowerCase().includes(q);
        const matchesParticipant = item.participantName?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesSummary || matchesActor || matchesParticipant;
      }
      return true;
    });
  }, [allActivities, selectedCategory, searchTerm]);

  // Aggregate quick metrics
  const metrics = useMemo(() => {
    const clinicalCount = caseNotes.length;
    const openIncidents = incidents.filter((i) => i.status !== 'Closed' && (i.status as string) !== 'Resolved').length;
    const totalClaimed = billingClaims.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    return {
      total: allActivities.length,
      clinicalCount,
      openIncidents,
      totalClaimed
    };
  }, [allActivities, caseNotes, incidents, billingClaims]);

  // Export filtered feed to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Category', 'Title', 'Participant', 'Actor', 'Summary', 'Status_Badge'];
    const rows = filteredActivities.map((a) => [
      `"${a.timestamp}"`,
      `"${a.categoryLabel}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${(a.participantName || 'N/A').replace(/"/g, '""')}"`,
      `"${a.actor.replace(/"/g, '""')}"`,
      `"${a.summary.replace(/"/g, '""')}"`,
      `"${a.statusBadge.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Breakthrough_Operational_Activity_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      'EXPORT_ACTIVITY_FEED_CSV',
      'COMMAND_CENTER',
      'recent-activity-feed',
      `Exported ${filteredActivities.length} operational activity feed entries to CSV.`
    );
  };

  const visibleItems = filteredActivities.slice(0, displayLimit);

  return (
    <div id="recent-activity-feed-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Recent Activity & Operational Feed
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unified cross-subsystem chronological log of case notes, incident reports, claims, and governance actions
              </p>
            </div>
          </div>
        </div>

        {/* Quick Operational Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 flex items-center gap-1.5">
            <span className="text-sky-400 font-bold">{metrics.clinicalCount}</span>
            <span className="text-slate-500">Notes</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">{metrics.openIncidents}</span>
            <span className="text-slate-500">Open Incidents</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">${metrics.totalClaimed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="text-slate-500">Claimed</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export Activity Feed to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({allActivities.length})
          </button>

          <button
            onClick={() => setSelectedCategory('CLINICAL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'CLINICAL'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-sky-300 border border-slate-800'
            }`}
          >
            Clinical Notes ({caseNotes.length})
          </button>

          <button
            onClick={() => setSelectedCategory('INCIDENT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'INCIDENT'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            Incidents ({incidents.length})
          </button>

          <button
            onClick={() => setSelectedCategory('BILLING')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'BILLING'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            Billing Claims ({billingClaims.length})
          </button>

          <button
            onClick={() => setSelectedCategory('COMPLIANCE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'COMPLIANCE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            BSP & RP ({restrictivePractices.length})
          </button>

          <button
            onClick={() => setSelectedCategory('AUDIT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'AUDIT'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-teal-300 border border-slate-800'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity, participant, actor..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-teal-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
              <Activity className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No operational activities matching criteria</p>
              <p className="text-xs text-slate-500">Try adjusting your category filter or search query.</p>
            </div>
          ) : (
            visibleItems.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon Badge */}
                    <div className={`p-2.5 rounded-xl ${item.categoryBg} ${item.categoryColor} border ${item.categoryBorder} shrink-0 mt-0.5`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors truncate">
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.statusBadgeColor}`}>
                          {item.statusBadge}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-400">
                          <User className="w-3 h-3 text-slate-500" />
                          {item.actor}
                        </span>
                        {item.participantName && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Tag className="w-3 h-3 text-teal-500/70" />
                            {item.participantName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-mono text-slate-500">
                          <Clock className="w-3 h-3 text-slate-600" />
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jump to Module CTA */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setActiveTab(item.targetTab)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-teal-950/60 hover:text-teal-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-teal-500/40 transition-all flex items-center gap-1 cursor-pointer"
                      title={`Navigate to ${item.targetTab}`}
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination / Expand Control */}
      {filteredActivities.length > displayLimit && (
        <div className="pt-2 flex justify-center border-t border-slate-800/80">
          <button
            onClick={() => setDisplayLimit((prev) => prev + 10)}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl border border-slate-800 hover:border-teal-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Show More Activities ({filteredActivities.length - displayLimit} remaining)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
