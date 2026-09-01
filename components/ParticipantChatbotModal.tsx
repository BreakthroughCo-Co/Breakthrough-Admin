'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  HelpCircle,
  Clock,
  DollarSign,
  Target,
  HeartHandshake
} from 'lucide-react';
import { runParticipantChatbot } from '@/lib/ai-assistant';
import { Client, ScheduledShift } from '@/types';
import { useManagementStore } from '@/stores/useManagementStore';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isCrisis?: boolean;
  isEscalated?: boolean;
}

interface ParticipantChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  appointments?: ScheduledShift[];
}

export const ParticipantChatbotModal: React.FC<ParticipantChatbotModalProps> = ({
  isOpen,
  onClose,
  client,
  appointments = []
}) => {
  const { addNotification, addAuditLog } = useManagementStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'bot',
      text: `Hello ${client?.name || 'there'}! I am your Breakthrough OS assistant. I can help you check your upcoming sessions, your active NDIS plan goals, and your remaining plan budget. What would you like to know today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Execute guardrailed participant chatbot logic
      const result = runParticipantChatbot(textToSend, {
        client,
        appointments,
        goals: client?.goals || []
      });

      // If crisis flagged, dispatch high priority alert to practitioner
      if (result.isCrisis) {
        addNotification({
          title: `CRISIS ALERT: ${client?.name || 'Participant'} In Distress`,
          message: `Participant triggered crisis hotline response in AI chatbot. Escalated to ${result.escalatedTo || 'Clinical Lead'}.`,
          type: 'clinical',
          severity: 'high',
          linkTab: 'incidents'
        });

        addAuditLog(
          'PARTICIPANT_CHATBOT_CRISIS_DETECTED',
          'PARTICIPANT_PORTAL',
          client?.id || 'anonymous',
          `Crisis safety protocol activated in participant chatbot. Query contained acute distress indicators. Escalated to ${result.escalatedTo}.`
        );
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCrisis: result.isCrisis,
        isEscalated: result.isEscalated
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'I apologize, but I am currently unable to process your request. Please contact your practitioner directly or phone 000 if this is an emergency.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'When is my next session?', icon: Clock, prompt: 'When is my next scheduled appointment?' },
    { label: 'How much budget is remaining?', icon: DollarSign, prompt: 'What is my remaining NDIS plan budget balance?' },
    { label: 'What are my goals?', icon: Target, prompt: 'What are my active goals and progress?' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Breakthrough Participant Assistant</h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">
                  Clinical Guardrails Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Plan updates, appointments & goals for {client?.name || 'Participant'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Strip */}
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>
            Non-medical assistant. For emergencies call <strong>000</strong> or Lifeline <strong>13 11 14</strong>.
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 leading-relaxed space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : msg.isCrisis
                    ? 'bg-rose-950/80 border border-rose-500/50 text-rose-100 rounded-tl-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.isCrisis && (
                  <div className="flex items-center gap-1.5 font-bold text-rose-300 pb-1 border-b border-rose-500/30 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency Crisis Helpline Notice</span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`text-[9px] block text-right font-mono ${
                    msg.sender === 'user' ? 'text-teal-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[11px] flex items-center gap-1.5 whitespace-nowrap transition-all disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-teal-400" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your budget, sessions, or goals..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
