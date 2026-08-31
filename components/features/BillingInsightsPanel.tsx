import React, { useMemo } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BillingInsightsPanel: React.FC = () => {
  const { billingClaims, clients } = useManagementStore();

  const claimStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let totalValue = 0;

    billingClaims.forEach(claim => {
      totalValue += claim.totalAmount;
      if (claim.status === 'Approved' || claim.status === 'Paid') approved++;
      else if (claim.status === 'Rejected' || claim.status === 'Failed') rejected++;
      else pending++;
    });

    return [
      { name: 'Approved/Paid', value: approved, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Rejected/Failed', value: rejected, color: '#f43f5e' }
    ];
  }, [billingClaims]);

  const totalFunding = useMemo(() => {
    let total = 0;
    let used = 0;
    clients.forEach(c => {
      if (c.budgetSummary) {
        total += c.budgetSummary.totalFunding;
        used += c.budgetSummary.usedFunding;
      } else if (c.budgetOverview) {
        total += c.budgetOverview.totalBudget;
        used += c.budgetOverview.spentBudget;
      }
    });
    return { total, used, remaining: total - used, percentage: total > 0 ? (used / total) * 100 : 0 };
  }, [clients]);

  const fundingData = [
    { name: 'Used Funding', value: totalFunding.used, fill: '#0ea5e9' },
    { name: 'Remaining', value: totalFunding.remaining, fill: '#1e293b' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Claims Status Pie Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">NDIS Claims Status Breakdown</h3>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={claimStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {claimStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funding Utilization Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Global Funding Utilization</h3>
        </div>
        <div className="h-[200px] flex flex-col justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fundingData}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={70}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#0ea5e9" />
                <Cell fill="#1e293b" />
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-12 pointer-events-none">
            <span className="text-2xl font-black text-white">{totalFunding.percentage.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Utilized</span>
          </div>
        </div>
      </div>
    </div>
  );
};
