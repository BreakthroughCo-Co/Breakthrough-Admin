'use client';

import React, { useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal, CaseNote, BillingClaim } from '@/types';
import {
  Activity,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Target,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  UserCheck
} from 'lucide-react';

interface NDISActivityFeedProps {
  client: Client;
}

interface ActivityEvent {
  id: string;
  type: 'GOAL_ACHIEVEMENT' | 'CASE_NOTE' | 'SERVICE_DELIVERY' | 'PLAN_MILESTONE';
  title: string;
  description: string;
  date: string;
  badge: string;
  badgeColor: string;
  practitioner?: string;
  meta?: string;
}

export const NDISActivityFeed: React.FC<NDISActivityFeedProps> = ({ client }) => {
  const { caseNotes, billingClaims } = useManagementStore();

  const activities = useMemo(() => {
    const list: ActivityEvent[] = [];

    // 1. Goal Achievements and Milestones
    client.goals?.forEach((goal: ClientGoal) => {
      if (goal.status === 'Achieved') {
        list.push({
          id: `goal-achieved-${goal.id}`,
          type: 'GOAL_ACHIEVEMENT',
          title: `Goal Achieved: ${goal.title}`,
          description: `Participant reached 100% capacity building milestone under ${goal.category}.`,
          date: goal.targetDate || client.planStartDate,
          badge: 'Goal Milestone',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          meta: `GAS Score: +${goal.gasScore ?? 2}`
        });
      } else if (goal.progressPercent >= 50) {
        list.push({
          id: `goal-progress-${goal.id}`,
          type: 'PLAN_MILESTONE',
          title: `Significant Goal Progress: ${goal.title}`,
          description: `Current attainment velocity at ${goal.progressPercent}% (${goal.category}).`,
          date: client.planStartDate,
          badge: 'In Progress',
          badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
          meta: `${goal.progressPercent}% Completed`
        });
      }
    });

    // 2. Case Notes Logged for this Client
    const clientNotes = caseNotes.filter((n: CaseNote) => n.clientId === client.id);
    clientNotes.forEach((note: CaseNote) => {
      list.push({
        id: `note-${note.id}`,
        type: 'CASE_NOTE',
        title: `Clinical Consultation Logged (${note.format})`,
        description: note.assessment || note.objective || 'Session documented with objective observations.',
        date: note.date,
        badge: `${note.sessionDurationMinutes}m Session`,
        badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        practitioner: note.practitionerName,
        meta: `Status: ${note.status}`
      });
    });

    // 3. Service Delivery & Billing Claims
    const clientClaims = billingClaims.filter((c: BillingClaim) => c.clientId === client.id);
    clientClaims.forEach((claim: BillingClaim) => {
      list.push({
        id: `claim-${claim.id}`,
        type: 'SERVICE_DELIVERY',
        title: `Service Delivered: ${claim.supportItemCode}`,
        description: `${claim.hours} hrs provided @ $${claim.unitRate}/hr (${claim.ndisSupportItem})`,
        date: claim.serviceDate,
        badge: `$${claim.totalAmount.toFixed(2)}`,
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        meta: `Invoice: ${claim.invoiceNumber}`
      });
    });

    // Fallback if no specific entries exist
    if (list.length === 0) {
      list.push({
        id: 'plan-start-event',
        type: 'PLAN_MILESTONE',
        title: 'NDIS Plan Activated & Commenced',
        description: `Active plan scheduled from ${client.planStartDate} to ${client.planEndDate} with $${client.totalBudget.toLocaleString()} funding.`,
        date: client.planStartDate || new Date().toISOString().slice(0, 10),
        badge: 'Plan Commenced',
        badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        meta: 'NDIS PACE'
      });
    }

    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client, caseNotes, billingClaims]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">NDIS Activity & Delivery Feed</h3>
            <p className="text-[11px] text-slate-400">
              Chronological log of goal achievements, clinical notes, and service delivery updates for {client.name}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-2.5 py-1 rounded border border-slate-700 font-bold">
          {activities.length} Recorded Events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {activities.map((event) => {
          let Icon = Activity;
          let iconBg = 'bg-teal-500 text-slate-950';

          if (event.type === 'GOAL_ACHIEVEMENT') {
            Icon = CheckCircle2;
            iconBg = 'bg-emerald-500 text-slate-950';
          } else if (event.type === 'CASE_NOTE') {
            Icon = FileText;
            iconBg = 'bg-sky-500 text-slate-950';
          } else if (event.type === 'SERVICE_DELIVERY') {
            Icon = DollarSign;
            iconBg = 'bg-amber-500 text-slate-950';
          }

          return (
            <div key={event.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${iconBg}`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Event Card */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-all space-y-1.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                    {event.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${event.badgeColor}`}
                    >
                      {event.badge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {event.date}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

                {(event.practitioner || event.meta) && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    {event.practitioner ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-teal-400" />
                        <span>Practitioner: {event.practitioner}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {event.meta && (
                      <span className="font-mono text-slate-400 font-semibold">{event.meta}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
