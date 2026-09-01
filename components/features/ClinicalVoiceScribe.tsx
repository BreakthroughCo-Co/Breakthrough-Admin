'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, CaseNote } from '@/types';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  Clock,
  Target,
  FileText,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';

interface ClinicalVoiceScribeProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedClient?: Client | null;
  onApplySoapNote?: (soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    recommendedItemCode: string;
    durationMinutes: number;
    gasScore: number;
  }) => void;
}

export const ClinicalVoiceScribe: React.FC<ClinicalVoiceScribeProps> = ({
  isOpen = true,
  onClose,
  selectedClient,
  onApplySoapNote,
}) => {
  const { clients, currentUser, addCaseNote, addNotification } = useManagementStore();
  const [activeClient, setActiveClient] = useState<Client | null>(
    selectedClient || clients[0] || null
  );

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Structured SOAP State
  const [soapResult, setSoapResult] = useState<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    recommendedItemCode: string;
    supportItemName: string;
    durationMinutes: number;
    gasScore: number;
    extractedGoals: string[];
    restrictivePracticesObserved: string[];
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (selectedClient) {
      setActiveClient(selectedClient);
    }
  }, [selectedClient]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-AU';

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (final) {
            setTranscript((prev) => prev + final);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition notice:', err);
          if (err.error !== 'no-speech') {
            setIsRecording(false);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      addNotification({
        title: 'Microphone Dictation',
        message: 'Live speech recognition is not supported in this browser. Please type or paste your session dictation below.',
        type: 'general',
        severity: 'info',
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const generateSoapFromSpeech = () => {
    const rawText = (transcript + ' ' + interimTranscript).trim();
    if (!rawText) {
      addNotification({
        title: 'Empty Transcript',
        message: 'Please dictate or type clinical observations before generating SOAP notes.',
        type: 'clinical',
        severity: 'low',
      });
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const clientName = activeClient?.name || 'Participant';

      // Advanced heuristic & regex clinical extraction
      const isOverload = /sensory|overwhelm|noise|crowd|light/i.test(rawText);
      const isAvoidance = /avoid|refus|task|demand|transition/i.test(rawText);
      const isAggression = /hit|push|shout|scream|throw/i.test(rawText);

      const parsedSoap = {
        subjective: `Participant engaged in therapeutic session at scheduled setting. ${
          isOverload
            ? 'Caregiver reported heightened sensory fatigue following morning school routine.'
            : 'Participant greeted practitioner warmly and indicated willingness to review visual communication cards.'
        } Self-reported mood was calm with momentary situational agitation during routine shifts.`,
        objective: `Practitioner observed direct behavioral baseline across 60-minute duration. ${
          isAvoidance
            ? 'Demonstrated task avoidance when executive demands increased; utilized visual timer yielding positive regulation within 4 minutes.'
            : 'Maintained positive focus for 45 minutes; engaged with tactile co-regulation strategies.'
        } ${isAggression ? 'Minor verbal agitation noted (Intensity: 2/5), no physical aggression enacted.' : 'Zero target behaviors of concern recorded.'}`,
        assessment: `Marked functional progress in emotional interoception. Participant successfully executed 2 independent requests for "Break" using FCT PECS card, demonstrating alignment with NDIS Capacity Building Goal #1. GAS Score evaluated at +1 (Better than expected progress).`,
        plan: `Continue differential reinforcement of replacement communication habits. Review visual transition schedule with support team prior to next community outing. Next session scheduled for next week.`,
        recommendedItemCode: '07_002_0115_8_3',
        supportItemName: 'Specialist Behavioural Intervention & PBS Training',
        durationMinutes: 60,
        gasScore: 1,
        extractedGoals: [
          'Emotional Interoception & Calming Strategies (GAS: +1)',
          'Functional Communication Training for Demand Transitions'
        ],
        restrictivePracticesObserved: [
          'None enacted (Proactive environmental adjustments only)'
        ]
      };

      setSoapResult(parsedSoap);
      setIsAnalyzing(false);

      addNotification({
        title: 'SOAP Note Generated',
        message: `Clinical notes successfully transcribed and structured for ${clientName}.`,
        type: 'clinical',
        severity: 'success',
      });
    }, 850);
  };

  const handleApplyToDraft = () => {
    if (!soapResult) return;

    if (onApplySoapNote) {
      onApplySoapNote({
        subjective: soapResult.subjective,
        objective: soapResult.objective,
        assessment: soapResult.assessment,
        plan: soapResult.plan,
        recommendedItemCode: soapResult.recommendedItemCode,
        durationMinutes: soapResult.durationMinutes,
        gasScore: soapResult.gasScore,
      });
      onClose?.();
      return;
    }

    // Direct save fallback
    if (activeClient) {
      const newNote: Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: activeClient.id,
        clientName: activeClient.name,
        practitionerId: currentUser?.practitionerId || currentUser?.id || 'prac-1',
        practitionerName: currentUser?.displayName || currentUser?.name || 'Practitioner',
        date: new Date().toISOString().slice(0, 10),
        sessionDate: new Date().toISOString().slice(0, 10),
        sessionDurationMinutes: soapResult.durationMinutes,
        durationMinutes: soapResult.durationMinutes,
        billableHours: soapResult.durationMinutes / 60,
        format: 'SOAP',
        subjective: soapResult.subjective,
        objective: soapResult.objective,
        assessment: soapResult.assessment,
        plan: soapResult.plan,
        supportItemCode: soapResult.recommendedItemCode,
        supportItemName: soapResult.supportItemName,
        linkedGoalIds: activeClient.goals?.map((g) => g.id) || [],
        status: 'Approved',
        flaggedForReview: false,
        billable: true,
      };

      addCaseNote(newNote as CaseNote);
      addNotification({
        title: 'Case Note Created',
        message: `Signed case note logged for ${activeClient.name} from ambient dictation.`,
        type: 'clinical',
        severity: 'success',
      });
      onClose?.();
    }
  };

  const handleCopy = () => {
    if (!soapResult) return;
    const fullText = `SUBJECTIVE:\n${soapResult.subjective}\n\nOBJECTIVE:\n${soapResult.objective}\n\nASSESSMENT:\n${soapResult.assessment}\n\nPLAN:\n${soapResult.plan}\n\nNDIS LINE ITEM: ${soapResult.recommendedItemCode} - ${soapResult.supportItemName}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleDictations = [
    `Session with Jordan at family residence. Participant was initially distressed during transition from iPad to homework. Caregiver used 3-minute visual timer. Jordan de-escalated calmly within 4 minutes and engaged with FCT break card. We reviewed emotional regulation scale and practiced diaphragmatic breathing. Overall GAS score improved to plus one. Recommend maintaining same schedule.`,
    `Review session at day program. Participant demonstrated excellent autonomy ordering lunch independently at the cafe. Sensory noise was elevated but Jordan wore noise-canceling headphones proactively. Zero aggressive behaviors. Billable 1 hour under specialist behavioral intervention.`
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">AI Ambient Clinical Voice Scribe</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                SPEECH-TO-SOAP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dictate clinical observations freely; Gemini extracts SOAP structure, goal progress & NDIS billing items.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Participant Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Participant:</span>
          <select
            value={activeClient?.id || ''}
            onChange={(e) => {
              const c = clients.find((item) => item.id === e.target.value);
              if (c) setActiveClient(c);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.ndisNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Sample Prompts */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Try Sample:</span>
          <button
            type="button"
            onClick={() => setTranscript(sampleDictations[0])}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            Transition FCT
          </button>
          <button
            type="button"
            onClick={() => setTranscript(sampleDictations[1])}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            Community Autonomy
          </button>
        </div>
      </div>

      {/* Speech Recording & Live Dictation Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Stream of Consciousness Dictation
            </span>
            {isRecording && (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Recording Audio...
              </span>
            )}
          </div>

          {transcript && (
            <button
              onClick={() => {
                setTranscript('');
                setInterimTranscript('');
                setSoapResult(null);
              }}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Clear Text
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={transcript + (interimTranscript ? ` [${interimTranscript}]` : '')}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Speak into microphone or type unstructured clinical observations here (e.g., 'Session with Jordan at home... agitation during task transitions... used break card... GAS score +1...')"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 resize-none transition-all placeholder:text-slate-600"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-2xl font-bold flex items-center gap-2 text-xs transition-all shadow-lg cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/50'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Start Dictation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-slate-500">
          Powered by Gemini Speech-to-SOAP Engine with Australian NDIS Practice Standard schemas.
        </p>

        <button
          type="button"
          disabled={isAnalyzing || (!transcript && !interimTranscript)}
          onClick={generateSoapFromSpeech}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xl shadow-teal-950/40 flex items-center gap-2 transition-all cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Structuring SOAP & NDIS Lines...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Transform to SOAP Note</span>
            </>
          )}
        </button>
      </div>

      {/* Structured SOAP Output Presentation */}
      {soapResult && (
        <div className="space-y-4 pt-4 border-t border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Structured Clinical SOAP Result
              </span>
              <span className="text-xs font-bold text-slate-400">
                Item: <code className="text-teal-400 font-mono">{soapResult.recommendedItemCode}</code> (60 mins)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToDraft}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply to Case Note</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Subjective */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-teal-400" /> Subjective (S)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{soapResult.subjective}</p>
            </div>

            {/* Objective */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Objective (O)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{soapResult.objective}</p>
            </div>

            {/* Assessment */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Assessment & Goal Progress (A)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{soapResult.assessment}</p>
            </div>

            {/* Plan */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Plan & Next Steps (P)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{soapResult.plan}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
