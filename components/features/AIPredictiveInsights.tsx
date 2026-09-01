'use client';

import React, { useState } from 'react';
import { Sparkles, Activity, FileText, Mic, CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { motion } from 'motion/react';

export const AIPredictiveInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bsp' | 'incidents' | 'telehealth' | 'invoices'>('bsp');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBSP, setGeneratedBSP] = useState<string | null>(null);

  const handleGenerateBSP = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedBSP("Based on recent case notes and incident reports, we recommend focusing on 'Emotional Self-Regulation' techniques. Triggers identified: Loud environments, unexpected schedule changes. Suggested strategies: Deep breathing exercises, visual schedules, designated quiet zones.");
      setIsGenerating(false);
    }, 2000);
  };

  const incidentData = [
    { month: 'Mar', predicted: 4, actual: 3 },
    { month: 'Apr', predicted: 3, actual: 4 },
    { month: 'May', predicted: 5, actual: 5 },
    { month: 'Jun', predicted: 6, actual: 2 },
    { month: 'Jul', predicted: 3, actual: 3 },
    { month: 'Aug', predicted: 4, actual: null },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">AI Predictive Insights</h2>
            <p className="text-xs text-slate-400">Powered by Gemini - Analytics & Automation for Business Growth</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
          <button onClick={() => setActiveTab('bsp')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bsp' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-300'}`}>
            <FileText className="w-4 h-4" /> BSP Recommendations
          </button>
          <button onClick={() => setActiveTab('incidents')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'incidents' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-300'}`}>
            <Activity className="w-4 h-4" /> Incident Trends
          </button>
          <button onClick={() => setActiveTab('telehealth')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'telehealth' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-300'}`}>
            <Mic className="w-4 h-4" /> Telehealth Transcription
          </button>
          <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-slate-300'}`}>
            <DollarSign className="w-4 h-4" /> Invoice Reconciliation
          </button>
        </div>

        {activeTab === 'bsp' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Generative BSP Recommendations
            </h3>
            <p className="text-xs text-slate-400">Synthesize client case notes to generate proactive Behaviour Support Plan strategies.</p>
            
            <button 
              onClick={handleGenerateBSP}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-md"
            >
              {isGenerating ? 'Analyzing Case Notes...' : 'Generate AI Recommendations'}
            </button>

            {generatedBSP && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Insights Generated Successfully
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{generatedBSP}</p>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Predictive Incident Trigger Detection
            </h3>
            <p className="text-xs text-slate-400">Anticipate potential incident escalations based on historical data patterns.</p>
            
            <div className="h-64 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incidentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  <Line type="monotone" dataKey="actual" name="Actual Incidents" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="predicted" name="AI Predicted" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-200">
                <strong>AI Alert:</strong> Based on historical trends and current environmental factors (weather changes), we predict a slight increase in incident likelihood for August. Preventative check-ins recommended for high-risk participants.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'telehealth' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" /> Real-Time Telehealth Transcription
            </h3>
            <p className="text-xs text-slate-400">Connect Google Meet for automated session transcription and NLP-based case note generation.</p>
            
            <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center space-y-3 bg-slate-950">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mic className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-300 font-bold">Start a Telehealth Session</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Click below to launch a simulated Meet call with live AI transcription and automatic HIPAA-compliant redaction.</p>
              <button className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-all">
                Launch Session
              </button>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-400" /> Auto NDIS Line-Item Reconciliation
            </h3>
            <p className="text-xs text-slate-400">Match delivered shift hours to NDIA Support Catalogue line items with 99% accuracy using AI.</p>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-3">Shift Date</th>
                    <th className="p-3">Support Provided</th>
                    <th className="p-3">AI Suggested Line Item</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-300">
                  <tr className="border-b border-slate-800/50 hover:bg-slate-950/50">
                    <td className="p-3">2026-08-25</td>
                    <td className="p-3">2hr Community Access (Saturday)</td>
                    <td className="p-3 font-mono text-indigo-400">04_105_0125_6_1</td>
                    <td className="p-3"><span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Matched</span></td>
                  </tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-950/50">
                    <td className="p-3">2026-08-26</td>
                    <td className="p-3">1hr Psychology Telehealth</td>
                    <td className="p-3 font-mono text-indigo-400">15_054_0128_1_3</td>
                    <td className="p-3"><span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Matched</span></td>
                  </tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-950/50">
                    <td className="p-3">2026-08-27</td>
                    <td className="p-3">4hr Sleepover Support</td>
                    <td className="p-3 font-mono text-indigo-400">01_010_0107_1_1</td>
                    <td className="p-3"><span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Verify</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-md">
                Approve Matches & Sync to Xero
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
