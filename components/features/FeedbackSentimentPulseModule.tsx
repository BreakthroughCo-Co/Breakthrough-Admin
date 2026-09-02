import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { FeedbackSentimentEngine, FeedbackPulse } from '../../lib/feedbackSentimentEngine';
import {
  Heart,
  Smile,
  Frown,
  Meh,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export const FeedbackSentimentPulseModule: React.FC = () => {
  const { clients, addNotification } = useManagementStore();
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [npsScore, setNpsScore] = useState(10);
  const [comments, setComments] = useState(
    'The positive behaviour support plan has transformed our mornings. Jordan is so much calmer and communication is great.'
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || { id: 'c-1', name: 'Participant' };

  const pulse: FeedbackPulse = FeedbackSentimentEngine.analyzeFeedback(
    selectedClient as any,
    npsScore,
    comments
  );

  const handleSubmitFeedback = () => {
    addNotification({
      title: 'Participant Feedback Recorded',
      message: `Recorded ${pulse.ratingCategory} NPS response (${pulse.sentimentLabel}).`,
      type: 'client',
      severity: pulse.directorReviewRequired ? 'high' : 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-400">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Participant & Family Feedback Sentiment Pulse
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                Real-Time NLP
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              NPS pulse tracking, sentiment analysis, and proactive dissatisfaction early warning triggers
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmitFeedback}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-pink-900/30 transition-all"
        >
          <Send className="w-4 h-4" />
          Record Feedback Pulse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Select Participant</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-slate-300">Net Promoter Score (0-10)</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setNpsScore(num)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  npsScore === num
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-300">Participant / Carer Comments</label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
          />
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Real-Time NLP Sentiment Analysis
          </span>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Rating Category:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pulse.ratingCategory === 'PROMOTER'
                ? 'bg-emerald-500/20 text-emerald-300'
                : pulse.ratingCategory === 'DETRACTOR'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {pulse.ratingCategory}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Sentiment Classification:</span>
            <span className="text-xs font-bold text-white">{pulse.sentimentLabel}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Executive Director Review:</span>
            <span className={pulse.directorReviewRequired ? 'text-xs text-rose-400 font-bold' : 'text-xs text-emerald-400'}>
              {pulse.directorReviewRequired ? 'TRIGGERED (Complaint Early Warning)' : 'Not Required'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
