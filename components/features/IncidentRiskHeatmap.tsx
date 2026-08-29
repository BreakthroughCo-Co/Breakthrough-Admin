import React, { useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { ShieldAlert, AlertTriangle, TrendingUp } from 'lucide-react';

export const IncidentRiskHeatmap: React.FC = () => {
  const { incidents, clients } = useManagementStore();

  const matrix = useMemo(() => {
    // Risk Categories (Y-axis)
    const riskCategories = ['High (Complex)', 'Medium (Standard)', 'Low (Basic)'];
    // Severity Levels (X-axis)
    const severities = ['Critical (Reportable)', 'High', 'Medium', 'Low'];

    const data: Record<string, Record<string, number>> = {};
    riskCategories.forEach(cat => {
      data[cat] = {};
      severities.forEach(sev => {
        data[cat][sev] = 0;
      });
    });

    incidents.forEach(inc => {
      const client = clients.find(c => c.name === inc.clientName);
      // Rough risk category estimation for demo
      const clientRisk = client?.riskLevel === 'High' ? 'High (Complex)' : 
                         client?.riskLevel === 'Medium' ? 'Medium (Standard)' : 'Low (Basic)';
      
      const sev = inc.severity === 'Critical (Reportable)' ? 'Critical (Reportable)' :
                  inc.severity === 'High' ? 'High' :
                  inc.severity === 'Medium' ? 'Medium' : 'Low';
                  
      if (data[clientRisk] && data[clientRisk][sev] !== undefined) {
        data[clientRisk][sev]++;
      }
    });

    return { riskCategories, severities, data };
  }, [incidents, clients]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/50 text-slate-500';
    if (count === 1) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (count === 2) return 'bg-orange-500/30 text-orange-200 border-orange-500/40';
    return 'bg-rose-500/40 text-rose-100 border-rose-500/50 font-bold';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Risk Severity Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribution of recent incidents across client risk tiers and incident severity levels.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          {incidents.length} Total Incidents
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-5 gap-2 mb-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-end pb-2">Client Risk Tier</div>
            {matrix.severities.map(sev => (
              <div key={sev} className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                {sev.split(' ')[0]}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            {matrix.riskCategories.map(cat => (
              <div key={cat} className="grid grid-cols-5 gap-2 items-center">
                <div className="text-xs font-bold text-slate-300">{cat}</div>
                {matrix.severities.map(sev => {
                  const count = matrix.data[cat][sev];
                  return (
                    <div 
                      key={`${cat}-${sev}`} 
                      className={`h-12 rounded-lg border flex flex-col items-center justify-center transition-all ${getColor(count)}`}
                    >
                      <span className="text-lg leading-none">{count}</span>
                      {count > 0 && <span className="text-[9px] opacity-70 mt-1 uppercase tracking-wider">Incidents</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
