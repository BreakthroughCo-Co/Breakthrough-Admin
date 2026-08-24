'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Check,
  Copy,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  Radio,
  FileText
} from 'lucide-react';
import { useManagementStore } from '@/stores/useManagementStore';

interface VoiceDictationProps {
  onTranscriptInsert?: (text: string) => void;
  floating?: boolean;
  compact?: boolean;
}

export const VoiceDictationBar: React.FC<VoiceDictationProps> = ({
  onTranscriptInsert,
  floating = false,
  compact = false
}) => {
  const { addNotification } = useManagementStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(!compact && !floating);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    setErrorMessage(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech Recognition API is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      setIsSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU'; // Australian English for NDIS context

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
          setTranscript((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser bar.');
        } else if (event.error === 'no-speech') {
          // Keep listening or ignore
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsOpen(true);
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(err.message || 'Could not start microphone dictation.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleInsert = () => {
    const fullText = `${transcript} ${interimTranscript}`.trim();
    if (!fullText) return;

    if (onTranscriptInsert) {
      onTranscriptInsert(fullText);
    } else {
      // Find active focused element or first textarea/input
      const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        const start = activeEl.selectionStart || 0;
        const end = activeEl.selectionEnd || 0;
        const currentVal = activeEl.value || '';
        const newVal = currentVal.substring(0, start) + (start > 0 ? ' ' : '') + fullText + currentVal.substring(end);
        activeEl.value = newVal;

        // Dispatch input event to trigger React state updates
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));

        addNotification({
          title: 'Voice Dictation Inserted',
          message: `Transcribed text inserted into active input field.`,
          type: 'clinical',
          severity: 'low'
        });
      } else {
        // Copy to clipboard fallback
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        addNotification({
          title: 'Transcribed Text Copied',
          message: `Copied to clipboard. Paste directly into your case note or form.`,
          type: 'clinical',
          severity: 'low'
        });
      }
    }

    setTranscript('');
    setInterimTranscript('');
  };

  const handleCopy = () => {
    const fullText = `${transcript} ${interimTranscript}`.trim();
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shadow-sm ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border-teal-500/30'
          }`}
          title={isListening ? 'Stop Voice Dictation' : 'Start Speech-to-Text Voice Dictation'}
          aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
        >
          {isListening ? (
            <>
              <Radio className="w-3.5 h-3.5 text-white animate-spin" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-teal-400" />
              <span>Dictate Voice</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      id="voice-dictation-control"
      className={`${
        floating
          ? 'fixed bottom-6 right-6 z-40 max-w-md w-[92vw] sm:w-96 shadow-2xl'
          : 'w-full'
      }`}
    >
      {!isOpen && floating ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            startListening();
          }}
          className="ml-auto flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-xs shadow-2xl border border-teal-400/30 hover:scale-105 transition-all"
        >
          <Mic className="w-4 h-4 text-white" />
          <span>Voice Case Note Entry</span>
        </button>
      ) : (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isListening ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/20 text-teal-400'}`}>
                {isListening ? <Radio className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-bold text-white text-xs block">
                  NDIS Voice-to-Text Dictation
                </span>
                <span className="text-[10px] text-slate-400">
                  {isListening ? 'Listening via browser SpeechRecognition (en-AU)...' : 'Ready for clinical notes'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {floating && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-2 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-[11px]">
              {errorMessage}
            </div>
          )}

          {/* Transcript Display Area */}
          <div className="min-h-[60px] max-h-[140px] overflow-y-auto p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
            {transcript || interimTranscript ? (
              <p>
                <span>{transcript}</span>
                {interimTranscript && (
                  <span className="text-teal-400 italic"> {interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-slate-500 text-[11px] italic">
                {isListening
                  ? 'Speak clearly into your microphone... (e.g., "Participant demonstrated improved emotional regulation during sensory transition...")'
                  : 'Click Start Dictation below to begin transcribing clinical observations directly.'}
              </p>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="voice-dictation-toggle-btn"
                onClick={handleToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Start Dictation</span>
                  </>
                )}
              </button>

              {(transcript || interimTranscript) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Clear transcript"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {(transcript || interimTranscript) && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700"
                    title="Copy transcript to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    id="insert-voice-transcript-btn"
                    onClick={handleInsert}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-md transition-all"
                    title="Insert text into the currently active case note or input field"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Insert into Field</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
