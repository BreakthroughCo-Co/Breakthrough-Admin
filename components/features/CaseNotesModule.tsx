'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal, CaseNote } from '@/types';
import {
  FileText,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  X,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Sparkle,
  Check,
  Target,
  Link2,
  ArrowUpRight,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';

type SoapField = 'subjective' | 'objective' | 'assessment' | 'plan';
type DictationMode = 'FIELD' | 'FULL_STREAM';

export const CaseNotesModule: React.FC = () => {
  const {
    caseNotes,
    clients,
    currentUser,
    addCaseNote,
    deleteCaseNote,
    addBillingClaim,
    addNotification,
    addAuditLog,
    linkCaseNoteToGoal,
    setActiveTab,
    setSelectedClientId,
    isOnline,
    queueOfflineDelta
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [format, setFormat] = useState<'SIMPL' | 'BIRP'>('SIMPL');
  const [autoGenerateClaim, setAutoGenerateClaim] = useState(true);

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  // Selected Goals for Linking
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(() => {
    return selectedClientObj?.goals?.map((g: ClientGoal) => g.id) || [];
  });

  // Sync goals when client changes
  useEffect(() => {
    if (selectedClientObj?.goals) {
      setSelectedGoalIds(selectedClientObj.goals.map((g: ClientGoal) => g.id));
    }
  }, [selectedClient, selectedClientObj?.goals]);

  // Form Fields
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [isAiStructuring, setIsAiStructuring] = useState(false);

  // Web Speech API Dictation State
  const [isListening, setIsListening] = useState(false);
  const [dictationMode, setDictationMode] = useState<DictationMode>('FIELD');
  const [activeSpeechField, setActiveSpeechField] = useState<SoapField>('subjective');
  const [streamTranscript, setStreamTranscript] = useState('');
  const [speechInterimText, setSpeechInterimText] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAutoStructuringStream, setIsAutoStructuringStream] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSpeechSupported(false);
      }
    }
  }, []);

  const startDictation = (field?: SoapField) => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    // Stop existing recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU'; // Australian English for NDIS context

      const isStream = !field;
      setDictationMode(isStream ? 'FULL_STREAM' : 'FIELD');

      recognition.onstart = () => {
        setIsListening(true);
        if (field) setActiveSpeechField(field);
        setSpeechError(null);
        setSpeechInterimText('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interim += transcript;
          }
        }

        setSpeechInterimText(interim);

        if (finalChunk) {
          // Smart Clinical Voice Commands & Punctuation
          let cleaned = finalChunk.trim();
          cleaned = cleaned
            .replace(/\b(full stop|period)\b/gi, '.')
            .replace(/\b(comma)\b/gi, ',')
            .replace(/\b(question mark)\b/gi, '?')
            .replace(/\b(exclamation mark|exclamation point)\b/gi, '!')
            .replace(/\b(new line|next line)\b/gi, '\n')
            .replace(/\b(new paragraph|next paragraph)\b/gi, '\n\n')
            .replace(/\b(bullet point|bullet)\b/gi, '• ');

          if (isStream) {
            setStreamTranscript((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
          } else {
            if (field === 'subjective') {
              setSubjective((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
            } else if (field === 'objective') {
              setObjective((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
            } else if (field === 'assessment') {
              setAssessment((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
            } else if (field === 'plan') {
              setPlan((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
            }
          }
          setSpeechInterimText('');
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
        setSpeechInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterimText('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      setSpeechError(err.message || 'Failed to start microphone speech engine.');
      setIsListening(false);
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
    }
    setIsListening(false);
    setSpeechInterimText('');
  };

  const toggleFieldDictation = (field: SoapField) => {
    if (isListening && dictationMode === 'FIELD' && activeSpeechField === field) {
      stopDictation();
    } else {
      startDictation(field);
    }
  };

  const toggleFullStreamDictation = () => {
    if (isListening && dictationMode === 'FULL_STREAM') {
      stopDictation();
    } else {
      startDictation();
    }
  };

  // Automatically transcribe and structure the full observation dictation stream into formatted progress note sections
  const handleAutoFormatFullObservation = async (textToProcess?: string) => {
    const rawObs = textToProcess || streamTranscript;
    if (!rawObs.trim()) {
      setSpeechError('No speech transcript detected. Speak into the microphone or load a sample observation.');
      return;
    }

    if (isListening) stopDictation();
    setIsAutoStructuringStream(true);

    try {
      const prompt = `You are an expert NDIS Clinical Allied Health Documentation Specialist.
Transcribe and parse the following raw voice observation recording for participant "${selectedClientObj?.name || 'Participant'}" into a structured, audit-compliant ${format} progress note.
Ensure objective, person-centered, neuro-affirming, and professional clinical language.

Raw Observation Transcript:
"""
${rawObs}
"""

Return a clean JSON object strictly matching this format:
{
  "subjective": "detailed situation/subjective observation description",
  "objective": "detailed objective/intervention clinical measurements and activities",
  "assessment": "clinical evaluation of progress against NDIS goals and behaviour regulation",
  "plan": "clear next steps, home practice, and scheduled review date"
}`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an NDIS Allied Health Senior Clinical Auditor. Format the clinical note into clear JSON.',
          responseMimeType: 'application/json',
          model: 'gemini-3.5-flash',
        }),
      });

      const data = await res.json();
      let structured = false;

      if (data.text) {
        try {
          const parsed = JSON.parse(data.text);
          if (parsed.subjective || parsed.objective) {
            if (parsed.subjective) setSubjective(parsed.subjective);
            if (parsed.objective) setObjective(parsed.objective);
            if (parsed.assessment) setAssessment(parsed.assessment);
            if (parsed.plan) setPlan(parsed.plan);
            structured = true;
          }
        } catch {
          const jsonMatch = data.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.subjective) setSubjective(parsed.subjective);
            if (parsed.objective) setObjective(parsed.objective);
            if (parsed.assessment) setAssessment(parsed.assessment);
            if (parsed.plan) setPlan(parsed.plan);
            structured = true;
          }
        }
      }

      // Fallback heuristic parsing if API is offline or returns unstructured output
      if (!structured) {
        const sentences = rawObs.split('. ');
        const sChunk = sentences.slice(0, Math.ceil(sentences.length * 0.3)).join('. ');
        const oChunk = sentences.slice(Math.ceil(sentences.length * 0.3), Math.ceil(sentences.length * 0.6)).join('. ');
        const aChunk = sentences.slice(Math.ceil(sentences.length * 0.6), Math.ceil(sentences.length * 0.8)).join('. ');
        const pChunk = sentences.slice(Math.ceil(sentences.length * 0.8)).join('. ');

        setSubjective(sChunk || `Participant presented in positive engagement for the session.`);
        setObjective(oChunk || `Administered targeted functional capacity intervention exercises.`);
        setAssessment(aChunk || `Observed notable progress towards active NDIS capacity building milestones.`);
        setPlan(pChunk || `Continue weekly allied health service delivery.`);
      }

      addNotification({
        title: 'Voice Observation Transcribed & Formatted',
        message: `Spoken clinical narrative structured into ${format} format for ${selectedClientObj?.name || 'Participant'}.`,
        type: 'clinical',
        severity: 'low',
      });
    } catch (e) {
      console.error('Error auto-formatting voice observation:', e);
      setSubjective(rawObs);
    } finally {
      setIsAutoStructuringStream(false);
    }
  };

  const handleAiRefineNote = async () => {
    setIsAiStructuring(true);
    try {
      const rawText = `Subjective: ${subjective}\nObjective: ${objective}\nAssessment: ${assessment}\nPlan: ${plan}`;
      const prompt = `Refine and format the following NDIS Allied Health clinical session notes for participant ${selectedClientObj?.name || 'Participant'} into professional, audit-compliant ${format} structure. Ensure non-judgmental, objective, neuroaffirming language. Return JSON with keys: subjective, objective, assessment, plan.

Raw Notes:
${rawText}`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an NDIS Allied Health Senior Clinical Auditor. Format the clinical note into clear JSON.',
        }),
      });

      const data = await res.json();
      if (data.text) {
        const jsonMatch = data.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.subjective) setSubjective(parsed.subjective);
          if (parsed.objective) setObjective(parsed.objective);
          if (parsed.assessment) setAssessment(parsed.assessment);
          if (parsed.plan) setPlan(parsed.plan);
        }
      }
    } catch (e) {
      console.error('AI Note structuring error:', e);
    } finally {
      setIsAiStructuring(false);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj) return;

    // Ensure dictation stops before save
    if (isListening) stopDictation();

    const noteDate = new Date().toISOString().slice(0, 10);
    const hours = Math.round((Number(sessionDuration) / 60) * 100) / 100;
    const itemCode = '07_002_0115_8_3';
    const unitRate = 214.41;
    const totalAmount = Math.round(hours * unitRate * 100) / 100;

    const newNote: Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      practitionerId: currentUser.practitionerId || 'prac-2',
      practitionerName: currentUser.name,
      date: noteDate,
      sessionDurationMinutes: Number(sessionDuration),
      format,
      subjective: subjective || 'Participant engaged in routine session.',
      objective: objective || 'Observed interactions and task completion.',
      assessment: assessment || 'Progress noted toward primary NDIS goals.',
      plan: plan || 'Maintain weekly clinical sessions.',
      linkedGoalIds: selectedGoalIds,
      status: 'Approved',
      flaggedForReview: false,
    };

    addCaseNote(newNote);

    // Link each selected goal to this note
    if (selectedGoalIds.length > 0) {
      selectedGoalIds.forEach((gId) => {
        linkCaseNoteToGoal(selectedClientObj.id, gId, (newNote as any).id || `note-latest`);
      });
    }

    if (autoGenerateClaim) {
      const claimPayload = {
        clientId: selectedClientObj.id,
        clientName: selectedClientObj.name,
        ndisNumber: selectedClientObj.ndisNumber,
        serviceDate: noteDate,
        ndisSupportItem: `${itemCode} - Specialist Behavioural Intervention Support`,
        supportItemCode: itemCode,
        hours: hours,
        unitRate: unitRate,
        totalAmount: totalAmount,
        status: 'Approved' as const,
        reconciliationStatus: 'Reconciled' as const,
        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      };

      addBillingClaim(claimPayload);

      addNotification({
        title: 'Billing Claim Auto-Generated',
        message: `Claim for $${totalAmount.toFixed(2)} (${hours}h @ $${unitRate}/h) generated from clinical case note for ${selectedClientObj.name}.`,
        type: 'compliance',
        severity: 'medium',
        linkTab: 'billing',
      });
    }

    addAuditLog('CREATE_CASE_NOTE', 'CASE_NOTE', selectedClientObj.id, `Logged ${format} clinical note for ${selectedClientObj.name}`);

    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Clinical Case Notes & Real-Time Dictation</h2>
              <span className="text-[10px] bg-teal-500/10 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
                Web Speech API Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SIMPL & BIRP formatted Allied Health session recording with real-time speech-to-text dictation and AI structuring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAiRefineNote}
            disabled={isAiStructuring}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-lg border border-teal-500/30 flex items-center gap-2 transition-all shadow-sm"
          >
            {isAiStructuring ? (
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>AI Audit Refine</span>
          </button>
        </div>
      </div>

      {/* Voice Dictation & Speech Streaming Control Strip */}
      {!isViewer && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl transition-all shadow-md ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-400/40 animate-pulse'
                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                }`}
              >
                {isListening ? <Radio className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Web Speech Clinical Dictation Stream</span>
                    {isListening && (
                      <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                        LIVE RECORDING ({dictationMode === 'FULL_STREAM' ? 'Full Observation' : activeSpeechField})
                      </span>
                    )}
                  </h3>
                  {!isSpeechSupported && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                      Browser Dictation Unavailable
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isListening
                    ? 'Dictate your complete clinical observations. When finished, our AI engine automatically parses speech into structured SIMPL/BIRP progress notes.'
                    : 'Record full session observations hands-free or dictate directly into individual SOAP/SIMPL fields.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Primary One-Click Full Stream Dictation Button */}
              <button
                type="button"
                id="full-observation-dictation-btn"
                onClick={toggleFullStreamDictation}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md ${
                  isListening && dictationMode === 'FULL_STREAM'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border border-teal-400/30'
                }`}
              >
                {isListening && dictationMode === 'FULL_STREAM' ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording Observation</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-200" />
                    <span>Start Full Observation Dictation</span>
                  </>
                )}
              </button>

              {/* Quick Field Triggers */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['subjective', 'objective', 'assessment', 'plan'] as SoapField[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFieldDictation(f)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${
                      isListening && dictationMode === 'FIELD' && activeSpeechField === f
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {f.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Continuous Full Observation Transcript Tray */}
          {(streamTranscript || (isListening && dictationMode === 'FULL_STREAM')) && (
            <div className="mt-3.5 p-3.5 bg-slate-950/90 rounded-xl border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-bold text-teal-300">Live Spoken Observation Transcript</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sampleText = `Participant presented alert and motivated for occupational therapy session. Practiced upper extremity motor regulation routines and sensory calming exercises using weighted lap pad. Observed heart rate decline from 88 to 72 bpm with improved emotional regulation. Recommend ongoing bi-weekly capacity building and sensory kit home program.`;
                      setStreamTranscript(sampleText);
                      handleAutoFormatFullObservation(sampleText);
                    }}
                    className="text-[10px] text-slate-400 hover:text-teal-300 underline font-mono"
                  >
                    Load Sample Observation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFormatFullObservation()}
                    disabled={isAutoStructuringStream || !streamTranscript.trim()}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    {isAutoStructuringStream ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Auto-Format Spoken Note ({format})</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-200 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {streamTranscript || (
                  <span className="text-slate-500 italic">
                    Listening to microphone speech input... speak clinical observations naturally...
                  </span>
                )}
                {speechInterimText && (
                  <span className="text-rose-400 font-bold ml-1 italic animate-pulse">
                    &ldquo;{speechInterimText}&rdquo;
                  </span>
                )}
              </p>

              {/* Audio Waveform Equalizer Animation */}
              {isListening && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {[12, 24, 16, 32, 20, 28, 14, 30, 22, 18, 26, 12].map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-teal-500 to-rose-400 rounded-full animate-pulse"
                        style={{
                          height: `${height}px`,
                          animationDelay: `${i * 80}ms`,
                          animationDuration: '600ms'
                        }}
                      />
                    ))}
                    <span className="text-[10px] text-teal-400 font-mono font-bold ml-2">
                      Live Speech Stream Active (en-AU)
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Voice punctuation active: say &ldquo;full stop&rdquo;, &ldquo;comma&rdquo;, &ldquo;next paragraph&rdquo;
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live Interim Transcript for Individual Field */}
          {isListening && dictationMode === 'FIELD' && speechInterimText && (
            <div className="mt-3 p-2.5 bg-slate-950/80 rounded-lg border border-rose-500/30 text-xs text-rose-200 font-mono flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-rose-400 px-1.5 py-0.5 bg-rose-500/10 rounded">
                Interim ({activeSpeechField})
              </span>
              <span className="italic">&ldquo;{speechInterimText}&rdquo;</span>
            </div>
          )}

          {speechError && (
            <div className="mt-2 text-xs text-rose-400 font-mono bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20 flex items-center justify-between">
              <span>{speechError}</span>
              <button onClick={() => setSpeechError(null)} className="text-rose-300 hover:text-white font-bold ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor & Recent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Note Form */}
        <form onSubmit={handleSaveNote} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Participant</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:border-teal-500"
              >
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ndisNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Framework Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-teal-400 font-bold focus:border-teal-500"
              >
                <option value="SIMPL">SIMPL (Situation, Intervention, Measure, Plan)</option>
                <option value="BIRP">BIRP (Behavior, Intervention, Response, Plan)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Subjective / Situation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>{format === 'SIMPL' ? 'Situation / Subjective' : 'Behavior'}</span>
                  {isListening && activeSpeechField === 'subjective' && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      Dictating...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  id="mic-btn-subjective"
                  onClick={() => toggleFieldDictation('subjective')}
                  className={`p-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    isListening && activeSpeechField === 'subjective'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-900/40 animate-pulse'
                      : 'bg-slate-950 text-slate-400 hover:text-teal-300 border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && activeSpeechField === 'subjective' ? 'Listening' : 'Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Participant presentation, expressed concerns, baseline mood..."
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-white focus:outline-none transition-all ${
                  isListening && activeSpeechField === 'subjective'
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus:border-teal-500'
                }`}
              />
            </div>

            {/* Objective / Intervention */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Intervention / Objective</span>
                  {isListening && activeSpeechField === 'objective' && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      Dictating...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  id="mic-btn-objective"
                  onClick={() => toggleFieldDictation('objective')}
                  className={`p-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    isListening && activeSpeechField === 'objective'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-900/40 animate-pulse'
                      : 'bg-slate-950 text-slate-400 hover:text-teal-300 border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && activeSpeechField === 'objective' ? 'Listening' : 'Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Clinical strategies applied, environmental adjustments, sensory tools used..."
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-white focus:outline-none transition-all ${
                  isListening && activeSpeechField === 'objective'
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus:border-teal-500'
                }`}
              />
            </div>

            {/* Assessment / Measurement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>{format === 'SIMPL' ? 'Measurement / Assessment' : 'Response'}</span>
                  {isListening && activeSpeechField === 'assessment' && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      Dictating...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  id="mic-btn-assessment"
                  onClick={() => toggleFieldDictation('assessment')}
                  className={`p-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    isListening && activeSpeechField === 'assessment'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-900/40 animate-pulse'
                      : 'bg-slate-950 text-slate-400 hover:text-teal-300 border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && activeSpeechField === 'assessment' ? 'Listening' : 'Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Participant engagement, goal progression, behavior metrics observed..."
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-white focus:outline-none transition-all ${
                  isListening && activeSpeechField === 'assessment'
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus:border-teal-500'
                }`}
              />
            </div>

            {/* Plan / Next Steps */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Next Steps / Plan</span>
                  {isListening && activeSpeechField === 'plan' && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      Dictating...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  id="mic-btn-plan"
                  onClick={() => toggleFieldDictation('plan')}
                  className={`p-1 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                    isListening && activeSpeechField === 'plan'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-900/40 animate-pulse'
                      : 'bg-slate-950 text-slate-400 hover:text-teal-300 border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && activeSpeechField === 'plan' ? 'Listening' : 'Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Follow-up training, next session targets, support worker guidelines..."
                className={`w-full bg-slate-950 border rounded-lg p-2.5 text-white focus:outline-none transition-all ${
                  isListening && activeSpeechField === 'plan'
                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                    : 'border-slate-800 focus:border-teal-500'
                }`}
              />
            </div>
          </div>

          {/* NDIS Goal Linking Section */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>Link to NDIS Funded Goals ({selectedGoalIds.length} selected)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedClientObj?.goals) {
                    if (selectedGoalIds.length === selectedClientObj.goals.length) {
                      setSelectedGoalIds([]);
                    } else {
                      setSelectedGoalIds(selectedClientObj.goals.map((g) => g.id));
                    }
                  }
                }}
                className="text-[10px] text-teal-400 hover:underline font-semibold"
              >
                {selectedGoalIds.length === (selectedClientObj?.goals?.length || 0)
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {!selectedClientObj?.goals || selectedClientObj.goals.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No goals registered for this participant yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedClientObj.goals.map((g) => {
                  const isChecked = selectedGoalIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-teal-950/20 border-teal-500/40 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedGoalIds(selectedGoalIds.filter((id) => id !== g.id));
                          } else {
                            setSelectedGoalIds([...selectedGoalIds, g.id]);
                          }
                        }}
                        className="mt-0.5 rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-teal-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold truncate">{g.title}</span>
                          <span className="text-[10px] font-mono text-teal-400 font-bold shrink-0">
                            {g.progressPercent}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium block">
                          {g.category} • Target: {g.targetDate}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerateClaim}
                onChange={(e) => setAutoGenerateClaim(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span>Auto-Generate NDIS PRODA Billing Claim</span>
            </label>
            <span className="text-[10px] text-teal-400 font-mono font-bold">$214.41/hr</span>
          </div>

          {isViewer ? (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center text-xs text-slate-500 font-medium">
              Clinical case note creation is disabled for VIEWER role (Read-Only Access)
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sign & Commit Clinical Case Note</span>
            </button>
          )}
        </form>

        {/* Recent Signed Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Recent Signed Clinical Trail
          </h3>

          <div className="space-y-3">
            {caseNotes.map((note: CaseNote) => (
              <div key={note.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{note.clientName}</span>
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono border border-teal-500/20 font-bold">
                    {note.format} • {note.date}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] line-clamp-3">
                  <span className="text-slate-400 font-semibold">Situation:</span> {note.subjective}
                </p>
                {note.linkedGoalIds && note.linkedGoalIds.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] text-slate-500 font-mono">Linked Goals:</span>
                    {note.linkedGoalIds.map((gId) => (
                      <span
                        key={gId}
                        className="text-[9px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded font-mono"
                      >
                        Goal #{gId}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                  <span>Practitioner: {note.practitionerName}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId(note.clientId);
                        setActiveTab('ndis-goals');
                      }}
                      className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Goal Tracker</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    {(!isViewer && (isAdmin || note.practitionerId === currentUser?.id || note.practitionerId === currentUser?.practitionerId || (note as any).authorId === currentUser?.id || (note as any).authorId === currentUser?.uid || note.practitionerName === currentUser?.name)) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete case note for ${note.clientName} (${note.date})?`)) {
                            deleteCaseNote(note.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold"
                        title={isAdmin ? "Delete Case Note (Admin)" : "Delete Case Note (Author Practitioner)"}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Mobile Voice Dictation Quick Dock */}
      {!isViewer && (
        <div className="fixed bottom-16 right-4 sm:right-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullStreamDictation}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2.5 transition-all border ${
              isListening && dictationMode === 'FULL_STREAM'
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-teal-300 border-teal-500/40 hover:border-teal-400'
            }`}
            title="Hands-free mobile voice dictation stream"
          >
            {isListening && dictationMode === 'FULL_STREAM' ? (
              <>
                <MicOff className="w-4 h-4 text-white" />
                <span>Stop Voice Dictation</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-teal-400" />
                <span>Dictate Note (Voice)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
