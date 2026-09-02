import React from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { CredentialComplianceEngine, CredentialAuditItem } from '../../lib/credentialComplianceEngine';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Lock,
  UserCheck,
  Calendar
} from 'lucide-react';

export const PractitionerCredentialVault: React.FC = () => {
  const { practitioners } = useManagementStore();

  const audits: CredentialAuditItem[] = practitioners.map((p) =>
    CredentialComplianceEngine.auditPractitioner(p)
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Practitioner Credential & NDIS Screening Vault
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                NWSC Active
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Worker screening compliance checks, PBS accreditation level tracking, and automated shift-assignment gating
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audits.map((item) => (
          <div
            key={item.practitionerId}
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              item.isEligibleForShiftAssignment
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-sm">{item.practitionerName}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  item.isEligibleForShiftAssignment
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {item.isEligibleForShiftAssignment ? 'ELIGIBLE' : 'BLOCKED'}
                </span>
              </div>

              <div className="space-y-1.5 my-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>PBS Level:</span>
                  <span className="text-violet-300 font-semibold">{item.pbsLevel}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>NWSC Expiry:</span>
                  <span className={item.daysUntilScreeningExpiry <= 30 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    {item.daysUntilScreeningExpiry} days remaining
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Police Check:</span>
                  <span className={item.daysUntilPoliceExpiry <= 30 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    {item.daysUntilPoliceExpiry} days remaining
                  </span>
                </div>
              </div>

              {item.warnings.length > 0 && (
                <div className="mt-2 p-2 bg-rose-900/30 rounded-lg text-[11px] text-rose-300">
                  {item.warnings[0]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
