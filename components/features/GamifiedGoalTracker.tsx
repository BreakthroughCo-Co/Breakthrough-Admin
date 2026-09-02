import React from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import {
  Trophy,
  Flame,
  Star,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';

export const GamifiedGoalTracker: React.FC = () => {
  const { clients, selectedClientId } = useManagementStore();
  const client = clients.find((c) => c.id === selectedClientId) || clients[0];
  const goals = client?.goals || [];

  const completedGoals = goals.filter((g) => g.progressPercent >= 100 || g.status === 'Achieved');
  const totalGoals = goals.length;
  const streakDays = 14; // Continuous therapy engagement streak

  const badges = [
    { title: 'Consistent Explorer', description: 'Attended 10 consecutive allied health therapy sessions', unlocked: true, icon: Flame, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { title: 'Goal Champion', description: 'Achieved 100% mastery on a primary communication goal', unlocked: completedGoals.length > 0, icon: Trophy, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'Community Generalist', description: 'Successfully applied positive strategies during community outings', unlocked: true, icon: Star, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { title: 'Master of Regulation', description: 'Used sensory regulation toolkit independently for 7 days', unlocked: false, icon: Award, color: 'text-slate-500 bg-slate-800/40 border-slate-700/40' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Participant Milestone & Gamified Goal Tracker
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
                GAS Level +2
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Interactive milestone achievement badges and positive reinforcement rewards for {client?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>{streakDays} Day Therapy Streak!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {badges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                b.unlocked ? b.color : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${b.unlocked ? b.color : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {b.unlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{b.title}</h3>
                <p className="text-xs text-slate-300">{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Attainment Scaling Visualizer */}
      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          Active NDIS Goal Progression ({goals.length} Goals)
        </h3>

        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-white">{g.title}</span>
                <span className="text-amber-400 font-bold">{g.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${g.progressPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
