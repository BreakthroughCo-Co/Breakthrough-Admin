'use client';

import React from 'react';
import { Client } from '@/types';
import { Calendar, DollarSign, FileText, CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ClientDashboardWidgetProps {
  client: Client;
  tasks: any[];
}

export const ClientDashboardWidget: React.FC<ClientDashboardWidgetProps> = ({ client, tasks }) => {
  const budget = client.totalBudget || 1;
  const spent = client.spentBudget || 0;
  const remaining = Math.max(0, budget - spent);
  const percentUsed = Math.round((spent / budget) * 100);

  const pieData = [
    { name: 'Spent', value: spent, color: '#f43f5e' }, // rose-500
    { name: 'Remaining', value: remaining, color: '#10b981' } // emerald-500
  ];

  const upcomingTasks = tasks.filter(t => t.relatedClientId === client.id && t.status !== 'Completed').slice(0, 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sparkles className="w-5 h-5 text-teal-400" />
        <h3 className="text-sm font-bold text-white">Client Summary Dashboard</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Appointments / Tasks */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Tasks</span>
          </div>
          {upcomingTasks.length > 0 ? (
            <ul className="space-y-2">
              {upcomingTasks.map((task, idx) => (
                <li key={idx} className="text-[11px] flex flex-col border-l-2 border-sky-500 pl-2">
                  <span className="text-white font-medium">{task.title}</span>
                  <span className="text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-slate-500 italic">No upcoming tasks scheduled.</div>
          )}
        </div>

        {/* Active Support Plans */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Support Plans</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded">
              <span className="text-slate-300">NDIS Plan</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded">
              <span className="text-slate-300">Behaviour Support Plan</span>
              {client.restrictivePracticesActive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="text-slate-500">Not Req.</span>
              )}
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded">
              <span className="text-slate-300">Risk Assessment</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Funding Metrics */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Funding Usage</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono">${(spent).toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">spent of ${(budget).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              {percentUsed > 80 ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <TrendingUp className="w-3 h-3 text-teal-400" />}
              <span className={percentUsed > 80 ? "text-rose-400 font-bold" : "text-teal-400 font-bold"}>{percentUsed}% Utilised</span>
            </div>
          </div>
          
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={35}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', color: '#fff'}} itemStyle={{color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
