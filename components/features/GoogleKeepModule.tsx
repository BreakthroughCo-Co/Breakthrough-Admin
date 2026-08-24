'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  StickyNote,
  Pin,
  CheckSquare,
  Plus,
  Trash2,
  Search,
  Tag,
  Palette,
  ExternalLink,
  Check,
  RotateCcw,
  Sparkles,
  Share2,
  Copy,
  FolderOpen,
  Filter,
  Grid,
  List,
  Flame,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  DollarSign,
  ShieldCheck,
  Users,
  HeartPulse,
  UserPlus,
  ArrowRight,
  Calendar,
  Layers,
  SlidersHorizontal,
  X,
  Send,
  Mic,
  MicOff,
  FileText,
  Printer,
  ChevronDown,
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
  Loader2,
  CheckCheck,
  Database
} from 'lucide-react';
import { NoteCategory, TaskPriority, Client } from '@/types';
import {
  getLocalCachedNotes,
  setLocalCachedNotes,
  enqueueOfflineMutation,
  flushOfflineKeepQueue,
  registerKeepServiceWorker,
  getOfflineMutationQueue,
  getAllNotesFromIndexedDB,
  saveNoteToIndexedDB,
  saveAllNotesToIndexedDB,
  deleteNoteFromIndexedDB,
  getIndexedDBStorageStats,
  IndexedDBStats
} from '@/lib/keepOfflineStorage';
import { NDISKeepPDFExportModal } from './NDISKeepPDFExportModal';

export interface KeepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KeepNoteItem {
  id: string;
  userId: string;
  title: string;
  text: string;
  color: string;
  category: NoteCategory;
  isPinned: boolean;
  isArchived: boolean;
  labels: string[];
  checklist: KeepChecklistItem[];
  clientId?: string;
  clientName?: string;
  executiveSummary?: string;
  syncedToCrmCount?: number;
  lastSyncedToCrm?: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_CONFIG: Record<
  NoteCategory,
  { label: string; badge: string; border: string; bg: string; text: string; dot: string; icon: any }
> = {
  Clinical: {
    label: 'Clinical',
    badge: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/40',
    bg: 'bg-teal-950/40',
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    icon: Stethoscope
  },
  Financial: {
    label: 'Financial',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    icon: DollarSign
  },
  Compliance: {
    label: 'Compliance',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    icon: ShieldCheck
  },
  HR: {
    label: 'HR & Roster',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/40',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
    icon: Users
  },
  'BSP & Safety': {
    label: 'BSP & Safety',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/40',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    icon: HeartPulse
  },
  Intake: {
    label: 'Intake',
    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    border: 'border-sky-500/40',
    bg: 'bg-sky-950/40',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    icon: UserPlus
  },
  General: {
    label: 'General',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    border: 'border-slate-700',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    icon: Tag
  }
};

const COLOR_PALETTES = [
  { id: 'default', name: 'Default Dark', bg: 'bg-slate-900', border: 'border-slate-800', badge: 'bg-slate-800 text-slate-300' },
  { id: 'sage', name: 'Clinical Teal', bg: 'bg-teal-950/60', border: 'border-teal-800/60', badge: 'bg-teal-900/60 text-teal-200' },
  { id: 'coral', name: 'Safety Rose', bg: 'bg-rose-950/60', border: 'border-rose-800/60', badge: 'bg-rose-900/60 text-rose-200' },
  { id: 'peach', name: 'Compliance Amber', bg: 'bg-amber-950/60', border: 'border-amber-800/60', badge: 'bg-amber-900/60 text-amber-200' },
  { id: 'mint', name: 'Financial Emerald', bg: 'bg-emerald-950/60', border: 'border-emerald-800/60', badge: 'bg-emerald-900/60 text-emerald-200' },
  { id: 'fog', name: 'Intake Sky', bg: 'bg-sky-950/60', border: 'border-sky-800/60', badge: 'bg-sky-900/60 text-sky-200' },
  { id: 'storm', name: 'HR Indigo', bg: 'bg-indigo-950/60', border: 'border-indigo-800/60', badge: 'bg-indigo-900/60 text-indigo-200' },
  { id: 'blossom', name: 'Lavender', bg: 'bg-purple-950/60', border: 'border-purple-800/60', badge: 'bg-purple-900/60 text-purple-200' },
  { id: 'clay', name: 'Terracotta', bg: 'bg-stone-900/90', border: 'border-stone-700/60', badge: 'bg-stone-800 text-stone-300' },
];

const PRESET_LABELS = [
  'Clinical Observations',
  'NDIS Client Tasks',
  'BSP Milestones',
  'Urgent Reminders',
  'Compliance Safeguards',
  'Billing & Claims',
  'Worker Credentials',
  'Medication Alerts',
  'Team Meeting Notes',
  'Intake Follow-ups'
];

const INITIAL_KEEP_NOTES: KeepNoteItem[] = [
  {
    id: 'keep-1',
    userId: 'default-user',
    title: 'Jordan Miller - Sensory De-escalation Protocol',
    text: 'Check noise-dampening headphone battery levels every morning before school transit. Participant responded positively to visual countdown cards during Tuesday session with #CID-101. Monitor transition spikes closely.',
    color: 'sage',
    category: 'Clinical',
    isPinned: true,
    isArchived: false,
    labels: ['Clinical Observations', 'BSP Milestones'],
    clientId: 'cli-101',
    clientName: 'Jordan Miller',
    executiveSummary: '• Key Clinical Finding: Sensory auditory triggers mitigated by 75% when active noise cancellation headphones are deployed.\n• Intervention Taken: Visual 5-minute cue countdown cards implemented for school transit transitions.\n• Care Review Recommendation: Advance Goal G-101 and maintain sensory break schedule in next quarterly NDIS review.',
    syncedToCrmCount: 1,
    lastSyncedToCrm: '2026-08-15T09:15:00Z',
    checklist: [
      { id: 'c1', text: 'Pack noise-canceling headphones in transit bag for #CID-101', completed: true },
      { id: 'c2', text: 'Check 5-minute visual timer cue card', completed: true },
      { id: 'c3', text: 'Review afternoon de-escalation log with support team', completed: false }
    ],
    createdAt: '2026-08-15T08:30:00Z',
    updatedAt: '2026-08-15T09:15:00Z'
  },
  {
    id: 'keep-2',
    userId: 'default-user',
    title: 'NDIS Commission Monthly Submission Checklist',
    text: 'Prepare restrictive practice summary reports for Senior Practitioner audit review before the 28th. Verify chemical restriction consent logs for #CID-103 with paediatrician.',
    color: 'peach',
    category: 'Compliance',
    isPinned: true,
    isArchived: false,
    labels: ['NDIS Client Tasks', 'Compliance Safeguards', 'Urgent Reminders'],
    clientId: 'cli-103',
    clientName: 'Liam O’Connor',
    executiveSummary: '• Key Compliance Finding: Monthly PR logs for Liam O\'Connor (#CID-103) require statutory 24-hr sign-off.\n• Action Taken: Chemical restriction logs audited and queued for Senior Practitioner review.\n• Next Step: Lodge formal monthly restrictive practice data to PRODA portal by the 28th.',
    syncedToCrmCount: 1,
    lastSyncedToCrm: '2026-08-14T11:00:00Z',
    checklist: [
      { id: 'c4', text: 'Verify chemical restriction consent logs for #CID-103 with paediatrician', completed: true },
      { id: 'c5', text: 'Generate monthly incident trend graph for Senior Practitioner', completed: false },
      { id: 'c6', text: 'Lodge 24hr notification record for transition incident', completed: true }
    ],
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z'
  },
  {
    id: 'keep-3',
    userId: 'default-user',
    title: 'Supervision Session Agenda with Principal Specialist',
    text: 'Discuss complex behaviour support strategy for high-risk participant #CID-102 transition and review positive reinforcement reward schedule with Dr. Sarah Jenkins.',
    color: 'fog',
    category: 'Clinical',
    isPinned: false,
    isArchived: false,
    labels: ['Team Meeting Notes'],
    clientId: 'cli-102',
    clientName: 'Samantha Reed',
    checklist: [
      { id: 'c7', text: 'Present ABC scatterplot analysis for #CID-102', completed: true },
      { id: 'c8', text: 'Sign off on interim BSP v2.1 with Principal Specialist', completed: false },
      { id: 'c9', text: 'Schedule parent feedback videoconference', completed: false }
    ],
    syncedToCrmCount: 1,
    lastSyncedToCrm: '2026-08-13T14:20:00Z',
    createdAt: '2026-08-13T14:20:00Z',
    updatedAt: '2026-08-14T16:00:00Z'
  },
  {
    id: 'keep-4',
    userId: 'default-user',
    title: 'NDIS Pricing Guide 2026 Indexation Audit',
    text: 'Audit line items 07_002_0115_8_3 ($214.41/hr) and 15_056_0128_1_3 ($193.99/hr) against active Service Agreements for #CID-101 and #CID-103.',
    color: 'mint',
    category: 'Financial',
    isPinned: false,
    isArchived: false,
    labels: ['Billing & Claims', 'NDIS Client Tasks'],
    checklist: [
      { id: 'c10', text: 'Cross-reference PRODA claims batch against invoice register', completed: false },
      { id: 'c11', text: 'Recalculate travel cap deductions for regional visits', completed: true }
    ],
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-08-12T09:00:00Z'
  },
  {
    id: 'keep-5',
    userId: 'default-user',
    title: 'PBS Practitioner Credential & WWCC Renewal Roster',
    text: 'Quarterly compliance audit of worker screening clearances for all behavior support specialists.',
    color: 'storm',
    category: 'HR',
    isPinned: false,
    isArchived: false,
    labels: ['Worker Credentials', 'Compliance Safeguards'],
    checklist: [
      { id: 'c12', text: 'Verify WWCC expiry dates for Marcus Vance & Dr. Sarah Jenkins', completed: true },
      { id: 'c13', text: 'Schedule annual NDIS Quality & Safeguards Commission refresher', completed: false }
    ],
    createdAt: '2026-08-10T14:15:00Z',
    updatedAt: '2026-08-10T14:15:00Z'
  }
];

/**
 * Smart Component that detects Client IDs (e.g. #CID-1234, #CID-101, #cli-101, #430891245)
 * and renders them as clickable interactive badges that navigate to the client's dashboard.
 */
export const SmartTextWithClientLinks: React.FC<{
  text: string;
  clients: Client[];
  onNavigateClient: (id: string) => void;
  className?: string;
}> = ({ text, clients, onNavigateClient, className = '' }) => {
  if (!text) return null;

  // Regex to match #CID-1234, #CID-101, #cli-101, #client-101, #430891245, etc.
  const regex = /(#(?:CID-|cli-|client-)?[a-zA-Z0-9_-]+|\bCID-[0-9]{3,6}\b)/gi;
  const parts: (string | { isLink: boolean; token: string; clientName?: string })[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    const cleanId = token.replace(/^[#\[\]]+|[#\[\]]+$/g, '').trim().toLowerCase();
    const cleanNum = cleanId.replace(/^cid-|^cli-|^client-/, '');

    const matchedClient = clients.find((c) => {
      const cId = c.id.toLowerCase();
      const cNum = cId.replace(/^cli-|^cid-/, '');
      const cNdis = c.ndisNumber.toLowerCase();
      const cName = c.name.toLowerCase();

      return (
        cId === cleanId ||
        cNum === cleanNum ||
        cNdis === cleanId ||
        cNdis === cleanNum ||
        cName.includes(cleanId) ||
        `cli-${cleanNum}` === cId ||
        `cid-${cleanNum}` === cId
      );
    });

    parts.push({
      isLink: true,
      token,
      clientName: matchedClient?.name
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }

        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateClient(part.token);
            }}
            className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-teal-500/20 text-teal-300 hover:text-white border border-teal-500/40 hover:border-teal-400 px-1.5 py-0.5 rounded cursor-pointer transition shadow-sm hover:scale-[1.03] mx-0.5"
            title={
              part.clientName
                ? `Click to navigate to ${part.clientName}'s Dashboard`
                : `Click to open Client Dashboard for ${part.token}`
            }
          >
            <FolderOpen className="w-2.5 h-2.5 text-teal-400" />
            <span>{part.token}</span>
            {part.clientName && (
              <span className="text-[10px] text-teal-200/80 font-sans font-medium">
                ({part.clientName})
              </span>
            )}
          </button>
        );
      })}
    </span>
  );
};

export const GoogleKeepModule: React.FC = () => {
  const { clients, addCaseNote, addNotification, syncKeepNoteToCRMTasks, setActiveTab, navigateToClient } =
    useManagementStore();

  // Load from local storage cache initially, and hydrate from IndexedDB
  const [notes, setNotes] = useState<KeepNoteItem[]>(() => {
    const cached = getLocalCachedNotes();
    return cached.length > 0 ? cached : INITIAL_KEEP_NOTES;
  });

  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isFlushingOffline, setIsFlushingOffline] = useState(false);
  const [idbStats, setIdbStats] = useState<IndexedDBStats | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'ALL'>('ALL');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'with-checklists' | 'pending-actions' | 'pinned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-Selection for PDF Export
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [notesToExport, setNotesToExport] = useState<KeepNoteItem[]>([]);

  // Note Creator State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newColor, setNewColor] = useState('default');
  const [newCategory, setNewCategory] = useState<NoteCategory>('Clinical');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [newClientId, setNewClientId] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [clientTagPickerOpen, setClientTagPickerOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Voice Dictation (Web Speech API) State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // AI Summarization Loading State
  const [summarizingNoteId, setSummarizingNoteId] = useState<string | null>(null);
  const [isSummarizingCreator, setIsSummarizingCreator] = useState(false);

  // Sync Modal State
  const [syncingNote, setSyncingNote] = useState<KeepNoteItem | null>(null);
  const [syncPriority, setSyncPriority] = useState<TaskPriority>('High');
  const [syncDueDate, setSyncDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [syncAssignee, setSyncAssignee] = useState<string>('Marcus Vance');
  const [syncSuccessToast, setSyncSuccessToast] = useState<{ noteTitle: string; count: number } | null>(null);

  // Hydrate from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;
    getAllNotesFromIndexedDB()
      .then((idbNotes) => {
        if (isMounted && idbNotes && idbNotes.length > 0) {
          setNotes(idbNotes);
          setLocalCachedNotes(idbNotes);
        } else if (isMounted) {
          setNotes((currentNotes) => {
            if (currentNotes.length > 0) {
              saveAllNotesToIndexedDB(currentNotes).catch(() => {});
            }
            return currentNotes;
          });
        }
      })
      .catch((err) => {
        console.warn('IndexedDB initial notes hydration note:', err);
      });

    getIndexedDBStorageStats().then((st) => {
      if (isMounted) setIdbStats(st);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Service Worker and Online/Offline Listeners
  useEffect(() => {
    registerKeepServiceWorker();

    const handleOnline = async () => {
      setIsOnline(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        setIsFlushingOffline(true);
        const res = await flushOfflineKeepQueue(currentUser.uid);
        setIsFlushingOffline(false);
        setPendingOfflineCount(getOfflineMutationQueue().length);
        const st = await getIndexedDBStorageStats();
        setIdbStats(st);
        if (res.syncedCount > 0) {
          addNotification({
            title: 'Field Notes Cloud Synced',
            message: `Synchronized ${res.syncedCount} field observations with the cloud ledger.`,
            type: 'clinical',
            severity: 'low'
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        title: 'Operating in Field Offline Mode',
        message: 'Clinical notes and voice transcripts will be safely preserved in IndexedDB offline storage.',
        type: 'clinical',
        severity: 'medium'
      });
    };

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setPendingOfflineCount(getOfflineMutationQueue().length);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [addNotification]);

  // Sync notes to local cache & IndexedDB on changes
  useEffect(() => {
    if (notes.length > 0) {
      setLocalCachedNotes(notes);
      saveAllNotesToIndexedDB(notes).catch(() => {});
      getIndexedDBStorageStats().then(setIdbStats).catch(() => {});
    }
  }, [notes]);

  // Timer for voice dictation
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Firestore Real-time synchronization
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsFirebaseSynced(false);
      return;
    }

    const userId = currentUser.uid;

    const unsubscribe = onSnapshot(
      collection(db, 'users', userId, 'keepNotes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudNotes: KeepNoteItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            cloudNotes.push({
              ...data,
              category: data.category || 'Clinical'
            });
          });
          cloudNotes.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          setNotes(cloudNotes);
          setLocalCachedNotes(cloudNotes);
          saveAllNotesToIndexedDB(cloudNotes).catch(() => {});
        }
        setIsFirebaseSynced(true);
      },
      (error) => {
        console.warn('Firestore Keep notes sync listener note:', error);
        setIsFirebaseSynced(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Web Speech API Handlers with intelligent punctuation and formatting commands
  const startSpeechRecognition = () => {
    setSpeechError(null);
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Please type observations manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Apply comprehensive voice formatting commands
            const formatted = transcriptChunk
              .replace(/\bnew paragraph\b/gi, '\n\n')
              .replace(/\bnew line\b/gi, '\n')
              .replace(/\bperiod\b|\bfull stop\b/gi, '.')
              .replace(/\bcomma\b/gi, ',')
              .replace(/\bquestion mark\b/gi, '?')
              .replace(/\bexclamation mark\b|\bexclamation point\b/gi, '!')
              .replace(/\bbullet point\b|\bbullet\b/gi, '\n• ');

            setNewText((prev) => (prev ? `${prev} ${formatted.trim()}` : formatted.trim()));
            setSpeechTranscript('');
          } else {
            currentTranscript += transcriptChunk;
          }
        }
        setSpeechTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech input error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('Could not initialize speech recognition:', err);
      setSpeechError('Failed to start voice dictation.');
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
      setSpeechTranscript('');
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim() && !newText.trim() && newChecklistItems.length === 0) {
      setIsExpanded(false);
      return;
    }

    const currentUser = auth.currentUser;
    const userId = currentUser?.uid || 'local-user';
    const noteId = `keep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const linkedClient = clients.find((c) => c.id === newClientId);

    const newNote: KeepNoteItem = {
      id: noteId,
      userId,
      title: newTitle.trim() || 'Untitled Clinical Note',
      text: newText.trim(),
      color: newColor,
      category: newCategory,
      isPinned: newIsPinned,
      isArchived: false,
      labels: newLabels,
      checklist: newChecklistItems,
      clientId: newClientId || undefined,
      clientName: linkedClient?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setLocalCachedNotes(updated);
    await saveNoteToIndexedDB(newNote).catch(() => {});

    if (currentUser && navigator.onLine) {
      try {
        await setDoc(doc(db, 'users', userId, 'keepNotes', noteId), newNote);
      } catch (err) {
        console.warn('Could not save note to Firestore, enqueued for offline sync:', err);
        enqueueOfflineMutation({ type: 'CREATE', noteId, payload: newNote });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    } else {
      enqueueOfflineMutation({ type: 'CREATE', noteId, payload: newNote });
      setPendingOfflineCount(getOfflineMutationQueue().length);
    }

    // Reset Form
    setNewTitle('');
    setNewText('');
    setNewColor('default');
    setNewCategory('Clinical');
    setNewIsPinned(false);
    setNewLabels([]);
    setNewClientId('');
    setNewChecklistItems([]);
    setNewChecklistInput('');
    setIsExpanded(false);
    setIsChecklistMode(false);
    setColorPickerOpen(false);
    setLabelPickerOpen(false);
    setClientTagPickerOpen(false);
    if (isRecording) stopSpeechRecognition();

    addNotification({
      title: 'Google Keep Note Created',
      message: `Note "${newNote.title}" saved in ${newCategory} category and stored in IndexedDB.`,
      type: 'clinical',
      severity: 'low'
    });
  };

  const handleTogglePin = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updatedPinned = !target.isPinned;
    const updatedNote = { ...target, isPinned: updatedPinned, updatedAt: new Date().toISOString() };
    const updatedNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));

    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);
    await saveNoteToIndexedDB(updatedNote).catch(() => {});

    const currentUser = auth.currentUser;
    if (currentUser && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'keepNotes', noteId),
          { ...target, isPinned: updatedPinned, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        enqueueOfflineMutation({
          type: 'UPDATE',
          noteId,
          payload: { isPinned: updatedPinned, updatedAt: new Date().toISOString() }
        });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    } else {
      enqueueOfflineMutation({
        type: 'UPDATE',
        noteId,
        payload: { isPinned: updatedPinned, updatedAt: new Date().toISOString() }
      });
      setPendingOfflineCount(getOfflineMutationQueue().length);
    }
  };

  const handleToggleChecklistItem = async (noteId: string, itemId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updatedChecklist = target.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedNote = { ...target, checklist: updatedChecklist, updatedAt: new Date().toISOString() };
    const updatedNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));

    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);
    await saveNoteToIndexedDB(updatedNote).catch(() => {});

    const currentUser = auth.currentUser;
    if (currentUser && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'keepNotes', noteId),
          { ...target, checklist: updatedChecklist, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        enqueueOfflineMutation({
          type: 'UPDATE',
          noteId,
          payload: { checklist: updatedChecklist, updatedAt: new Date().toISOString() }
        });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    } else {
      enqueueOfflineMutation({
        type: 'UPDATE',
        noteId,
        payload: { checklist: updatedChecklist, updatedAt: new Date().toISOString() }
      });
      setPendingOfflineCount(getOfflineMutationQueue().length);
    }
  };

  const handleChangeNoteColor = async (noteId: string, color: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updatedNote = { ...target, color, updatedAt: new Date().toISOString() };
    const updatedNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);
    await saveNoteToIndexedDB(updatedNote).catch(() => {});

    const currentUser = auth.currentUser;
    if (currentUser && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'keepNotes', noteId),
          { ...target, color, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        enqueueOfflineMutation({ type: 'UPDATE', noteId, payload: { color, updatedAt: new Date().toISOString() } });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    }
  };

  const handleChangeCategory = async (noteId: string, category: NoteCategory) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const updatedNote = { ...target, category, updatedAt: new Date().toISOString() };
    const updatedNotes = notes.map((n) => (n.id === noteId ? updatedNote : n));
    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);
    await saveNoteToIndexedDB(updatedNote).catch(() => {});

    const currentUser = auth.currentUser;
    if (currentUser && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'keepNotes', noteId),
          { ...target, category, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        enqueueOfflineMutation({
          type: 'UPDATE',
          noteId,
          payload: { category, updatedAt: new Date().toISOString() }
        });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    const confirmed = window.confirm(`Permanently delete Google Keep note "${target.title}"?`);
    if (!confirmed) return;

    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);
    await deleteNoteFromIndexedDB(noteId).catch(() => {});

    const currentUser = auth.currentUser;
    if (currentUser && navigator.onLine) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'keepNotes', noteId));
      } catch (err) {
        enqueueOfflineMutation({ type: 'DELETE', noteId });
        setPendingOfflineCount(getOfflineMutationQueue().length);
      }
    } else {
      enqueueOfflineMutation({ type: 'DELETE', noteId });
      setPendingOfflineCount(getOfflineMutationQueue().length);
    }

    addNotification({
      title: 'Google Keep Note Deleted',
      message: `Note "${target.title}" was removed.`,
      type: 'compliance',
      severity: 'low'
    });
  };

  // Summarize Note Creator Draft directly before saving
  const handleSummarizeCreatorDraft = async () => {
    if (!newText.trim() && newChecklistItems.length === 0) {
      alert('Please enter clinical observation text or checklist items before summarizing.');
      return;
    }
    setIsSummarizingCreator(true);
    try {
      const client = clients.find((c) => c.id === newClientId);
      const prompt = `You are a Senior NDIS Positive Behaviour Support Lead. Summarize the following clinical observation draft into a concise, structured bullet-point executive summary for client file reviews and care team audits:
Title: ${newTitle || 'Clinical Observation Draft'}
Domain: ${newCategory}
Client: ${client ? `${client.name} (NDIS: ${client.ndisNumber})` : 'General Participant'}
Clinical Narrative: ${newText}
Checklist items: ${newChecklistItems.map((c) => `${c.completed ? '[DONE]' : '[PENDING]'} ${c.text}`).join('; ')}

Format strictly with clear bullet points:
• Key Clinical Finding: <one concise sentence>
• Immediate Intervention/Safeguard Applied: <one concise sentence>
• Actionable Next Step/Review Recommendation: <one concise sentence>
• NDIS Goal Alignment: <one concise sentence>`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.7-flash'
        })
      });

      const data = await response.json();
      if (data.text) {
        setNewText((prev) =>
          prev
            ? `${prev}\n\n--- EXECUTIVE AI CLINICAL SUMMARY ---\n${data.text}`
            : `--- EXECUTIVE AI CLINICAL SUMMARY ---\n${data.text}`
        );
        addNotification({
          title: 'Executive AI Summary Appended',
          message: 'Structured clinical synthesis generated and added to your draft note.',
          type: 'clinical',
          severity: 'low'
        });
      }
    } catch (err) {
      console.error('Error generating creator draft summary:', err);
      alert('Failed to synthesize summary with Gemini. Please check connection.');
    } finally {
      setIsSummarizingCreator(false);
    }
  };

  // Gemini API Note Summarization Feature for existing notes
  const handleSummarizeNote = async (note: KeepNoteItem) => {
    setSummarizingNoteId(note.id);
    try {
      const client = clients.find((c) => c.id === note.clientId);
      const prompt = `You are a Senior NDIS Positive Behaviour Support Lead. Summarize the following long clinical observation and field note into a concise, high-impact bullet-point executive summary for client file reviews and care team audits:
Title: ${note.title}
Domain: ${note.category}
Client: ${client ? `${client.name} (NDIS: ${client.ndisNumber})` : note.clientName || 'General Participant'}
Clinical Narrative: ${note.text}
Checklist items: ${note.checklist?.map((c) => `${c.completed ? '[DONE]' : '[PENDING]'} ${c.text}`).join('; ')}

Format strictly with clear bullet points covering:
• Key Clinical Finding: <one concise sentence>
• Immediate Intervention/Safeguard Applied: <one concise sentence>
• Actionable Next Step/Review Recommendation: <one concise sentence>
• NDIS Goal Alignment: <one concise sentence>`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.7-flash'
        })
      });

      const data = await response.json();
      if (data.text) {
        const updatedNote = { ...note, executiveSummary: data.text, updatedAt: new Date().toISOString() };
        const updatedNotes = notes.map((n) => (n.id === note.id ? updatedNote : n));
        setNotes(updatedNotes);
        setLocalCachedNotes(updatedNotes);
        await saveNoteToIndexedDB(updatedNote).catch(() => {});

        const currentUser = auth.currentUser;
        if (currentUser && navigator.onLine) {
          await setDoc(
            doc(db, 'users', currentUser.uid, 'keepNotes', note.id),
            { ...note, executiveSummary: data.text, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }

        addNotification({
          title: 'Executive AI Summary Ready',
          message: `Clinical summary synthesized for "${note.title}".`,
          type: 'clinical',
          severity: 'low'
        });
      }
    } catch (err) {
      console.error('Error generating note summary:', err);
      alert('Failed to generate summary with Gemini. Please verify connection.');
    } finally {
      setSummarizingNoteId(null);
    }
  };

  const handleExportSingleNotePDF = (note: KeepNoteItem) => {
    setNotesToExport([note]);
    setPdfExportModalOpen(true);
  };

  const handleExportSelectedNotesPDF = () => {
    const selected = notes.filter((n) => selectedNoteIds.has(n.id));
    if (selected.length === 0) {
      alert('Please select at least one note to export as an NDIS PDF document.');
      return;
    }
    setNotesToExport(selected);
    setPdfExportModalOpen(true);
  };

  const toggleSelectNote = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === filteredNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(filteredNotes.map((n) => n.id)));
    }
  };

  const handleManualSyncOfflineQueue = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsFlushingOffline(true);
    const res = await flushOfflineKeepQueue(currentUser.uid);
    setIsFlushingOffline(false);
    setPendingOfflineCount(getOfflineMutationQueue().length);
    addNotification({
      title: 'Manual Sync Complete',
      message: `Synchronized ${res.syncedCount} queued field changes.`,
      type: 'clinical',
      severity: 'low'
    });
  };

  const handleExportToCaseNote = (note: KeepNoteItem) => {
    if (!note.clientId) {
      alert('Please link this note to an NDIS Client to export it to Clinical Case Notes.');
      return;
    }
    const client = clients.find((c) => c.id === note.clientId);
    const checklistText =
      note.checklist.length > 0
        ? `\nChecklist Actions:\n` +
          note.checklist.map((c) => `- [${c.completed ? 'X' : ' '}] ${c.text}`).join('\n')
        : '';
    const summaryText = note.executiveSummary ? `\n\nExecutive Synthesis:\n${note.executiveSummary}` : '';

    addCaseNote({
      clientId: note.clientId,
      clientName: client?.name || 'NDIS Participant',
      practitionerId: 'prac-202',
      practitionerName: 'Marcus Vance',
      date: new Date().toISOString().split('T')[0],
      sessionDurationMinutes: 45,
      format: 'Standard',
      subjective: `Google Keep Observation (${note.category}): ${note.title}`,
      objective: `${note.text}${checklistText}${summaryText}`,
      assessment: 'Synthesized from daily field observations in Google Keep.',
      plan: 'Continue monitoring progress during next scheduled session.',
      linkedGoalIds: [],
      status: 'Draft',
      flaggedForReview: false
    });

    addNotification({
      title: 'Transferred to Clinical Case Notes',
      message: `Note "${note.title}" converted into clinical draft for ${client?.name}.`,
      type: 'clinical',
      severity: 'low'
    });
  };

  const handleCopyToClipboard = (note: KeepNoteItem) => {
    const checklistText =
      note.checklist.length > 0
        ? `\nChecklist:\n` + note.checklist.map((c) => `- [${c.completed ? 'X' : ' '}] ${c.text}`).join('\n')
        : '';
    const summaryText = note.executiveSummary ? `\n\nExecutive AI Summary:\n${note.executiveSummary}` : '';
    const fullText = `[${note.category.toUpperCase()}] ${note.title}\n\n${note.text}${summaryText}${checklistText}`;
    navigator.clipboard.writeText(fullText);
    setCopyFeedback(note.id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleQuickSyncToCRM = (note: KeepNoteItem) => {
    const res = syncKeepNoteToCRMTasks(note, {
      priority: note.labels?.some((l) => /urgent|critical/i.test(l)) ? 'Critical' : 'High',
      defaultCategory: note.category,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'Marcus Vance'
    });

    const updatedNotes = notes.map((n) =>
      n.id === note.id
        ? {
            ...n,
            syncedToCrmCount: (n.syncedToCrmCount || 0) + res.count,
            lastSyncedToCrm: new Date().toISOString()
          }
        : n
    );
    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);

    setSyncSuccessToast({ noteTitle: note.title, count: res.count });
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  const handleExecuteSyncModal = () => {
    if (!syncingNote) return;

    const res = syncKeepNoteToCRMTasks(syncingNote, {
      priority: syncPriority,
      defaultCategory: syncingNote.category,
      dueDate: syncDueDate,
      assignedTo: syncAssignee
    });

    const updatedNotes = notes.map((n) =>
      n.id === syncingNote.id
        ? {
            ...n,
            syncedToCrmCount: (n.syncedToCrmCount || 0) + res.count,
            lastSyncedToCrm: new Date().toISOString()
          }
        : n
    );
    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);

    setSyncSuccessToast({ noteTitle: syncingNote.title, count: res.count });
    setSyncingNote(null);
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  const handleBatchSyncAllActionItems = () => {
    const actionableNotes = notes.filter(
      (n) => n.checklist && n.checklist.some((it) => !it.completed)
    );

    if (actionableNotes.length === 0) {
      alert('No notes with pending action checklist items found to sync.');
      return;
    }

    let totalSynced = 0;
    actionableNotes.forEach((n) => {
      const res = syncKeepNoteToCRMTasks(n, {
        priority: 'High',
        defaultCategory: n.category
      });
      totalSynced += res.count;
    });

    const updatedNotes = notes.map((n) => {
      if (actionableNotes.some((an) => an.id === n.id)) {
        return {
          ...n,
          syncedToCrmCount: (n.syncedToCrmCount || 0) + 1,
          lastSyncedToCrm: new Date().toISOString()
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    setLocalCachedNotes(updatedNotes);

    setSyncSuccessToast({ noteTitle: 'All Prioritized Notes', count: totalSynced });
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  const addChecklistItem = () => {
    if (!newChecklistInput.trim()) return;
    setNewChecklistItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, text: newChecklistInput.trim(), completed: false }
    ]);
    setNewChecklistInput('');
  };

  const toggleNewItemCompleted = (itemId: string) => {
    setNewChecklistItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, completed: !it.completed } : it))
    );
  };

  const removeNewItem = (itemId: string) => {
    setNewChecklistItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const toggleLabel = (label: string) => {
    setNewLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const insertClientTagIntoText = (client: Client) => {
    const tag = `#CID-${client.id.replace(/^cli-|^cid-/, '')}`;
    setNewText((prev) => (prev ? `${prev} ${tag}` : tag));
    setClientTagPickerOpen(false);
  };

  // Keyword & Category Filter Logic
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.text.toLowerCase().includes(query) ||
        note.category.toLowerCase().includes(query) ||
        note.labels.some((l) => l.toLowerCase().includes(query)) ||
        (note.clientName && note.clientName.toLowerCase().includes(query)) ||
        (note.executiveSummary && note.executiveSummary.toLowerCase().includes(query)) ||
        note.checklist.some((item) => item.text.toLowerCase().includes(query));

      const matchesCategory = selectedCategory === 'ALL' || note.category === selectedCategory;
      const matchesLabel = !selectedLabel || note.labels.includes(selectedLabel);

      let matchesFilterMode = true;
      if (filterMode === 'with-checklists') {
        matchesFilterMode = note.checklist && note.checklist.length > 0;
      } else if (filterMode === 'pending-actions') {
        matchesFilterMode = note.checklist && note.checklist.some((it) => !it.completed);
      } else if (filterMode === 'pinned') {
        matchesFilterMode = note.isPinned;
      }

      return matchesSearch && matchesCategory && matchesLabel && matchesFilterMode;
    });
  }, [notes, searchQuery, selectedCategory, selectedLabel, filterMode]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  const getColorConfig = (colorId: string) => {
    return COLOR_PALETTES.find((p) => p.id === colorId) || COLOR_PALETTES[0];
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: notes.length };
    (Object.keys(CATEGORY_CONFIG) as NoteCategory[]).forEach((cat) => {
      counts[cat] = notes.filter((n) => n.category === cat).length;
    });
    return counts;
  }, [notes]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert for Successful CRM Sync */}
      {syncSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-950 border border-teal-500 text-teal-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">NDIS Action Items Synced to CRM!</p>
            <p className="text-teal-200/80 mt-0.5">
              Pushed {syncSuccessToast.count} action item(s) from &ldquo;{syncSuccessToast.noteTitle}&rdquo; to the CRM Task Management System.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('crm')}
            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] rounded-lg shrink-0 transition"
          >
            View in CRM &rarr;
          </button>
        </div>
      )}

      {/* Header Banner with Real-time Persistence & Export Tools */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Google Keep Clinical & Governance Hub</h1>
              <span className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/20">
                Workspace Sync
              </span>

              {/* Real-time Field Persistence State Badge */}
              {isOnline ? (
                isFirebaseSynced ? (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    <Cloud className="w-3 h-3" /> Cloud & IndexedDB Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-teal-500/10 text-teal-400 text-[11px] px-2.5 py-0.5 rounded-full border border-teal-500/20 font-medium">
                    <Database className="w-3 h-3" /> IndexedDB Active ({idbStats?.notesCount || notes.length} notes)
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 text-[11px] px-2.5 py-0.5 rounded-full border border-rose-500/20 font-bold animate-pulse">
                  <WifiOff className="w-3 h-3" /> Field Offline Mode (IndexedDB Active)
                </span>
              )}

              {pendingOfflineCount > 0 && (
                <button
                  onClick={handleManualSyncOfflineQueue}
                  disabled={isFlushingOffline || !isOnline}
                  className="flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 font-bold hover:bg-amber-500/30 transition"
                  title="Click to flush pending offline changes to cloud"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isFlushingOffline ? 'animate-spin' : ''}`} />
                  <span>{pendingOfflineCount} Field Change{pendingOfflineCount === 1 ? '' : 's'} Queued</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clinical checklists, voice-dictated field observations, Gemini executive summaries, and formal NDIS compliance PDF export filings.
            </p>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* NDIS PDF Export Tool Button */}
          <button
            onClick={() => {
              if (selectedNoteIds.size > 0) {
                handleExportSelectedNotesPDF();
              } else {
                setNotesToExport(filteredNotes);
                setPdfExportModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
            title="Export Selected Notes as Formal NDIS Compliance & Progress Report PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {selectedNoteIds.size > 0
                ? `Export NDIS PDF (${selectedNoteIds.size})`
                : 'Export NDIS Report PDF'}
            </span>
          </button>

          {/* Toggle Multi-Select Mode */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedNoteIds(new Set());
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSelectionMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Selection Mode for Batch PDF Export"
          >
            <CheckSquare className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
            <span>{isSelectionMode ? 'Cancel Selection' : 'Select for Filing'}</span>
          </button>

          <button
            onClick={handleBatchSyncAllActionItems}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Batch Push All Pending Action Items into CRM Task Management"
          >
            <Send className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Sync Actions to CRM</span>
          </button>

          <a
            href="https://keep.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">keep.google.com</span>
          </a>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Multi-Select Floating / Action Bar when Selection Mode is Active */}
      {isSelectionMode && (
        <div className="bg-amber-950/70 border border-amber-500/40 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-3 text-amber-200">
            <CheckCheck className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">
              {selectedNoteIds.size} of {filteredNotes.length} note(s) selected for NDIS Filing
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 rounded-lg font-semibold transition"
            >
              {selectedNoteIds.size === filteredNotes.length ? 'Deselect All' : 'Select All Filtered'}
            </button>
            <button
              onClick={handleExportSelectedNotesPDF}
              disabled={selectedNoteIds.size === 0}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate Filing PDF ({selectedNoteIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Category Navigation & Metrics Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Domain Categorization System
          </span>
          <span className="text-[11px] text-slate-500">
            Showing {filteredNotes.length} of {notes.length} notes
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedCategory === 'ALL' ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {categoryCounts.ALL || 0}
            </span>
          </button>

          {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((catKey) => {
            const cfg = CATEGORY_CONFIG[catKey];
            const Icon = cfg.icon;
            const isSelected = selectedCategory === catKey;
            const count = categoryCounts[catKey] || 0;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? `${cfg.badge} shadow-sm font-bold scale-[1.02]`
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-slate-900/80 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Creator Bar with Web Speech API Dictation & Smart Client Tagging */}
      <div className="max-w-2xl mx-auto">
        <div
          className={`bg-slate-900 border ${
            isExpanded
              ? 'border-amber-500/50 shadow-xl ring-2 ring-amber-500/10'
              : 'border-slate-800 hover:border-slate-700'
          } rounded-2xl transition-all duration-200 overflow-hidden`}
        >
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="px-4 py-3.5 flex items-center justify-between cursor-text text-slate-400"
            >
              <span className="text-sm font-medium">
                Take clinical notes, record speech dictation, or tag client (#CID-101)...
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                    startSpeechRecognition();
                  }}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                  title="Hands-free Voice Dictation"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                    setIsChecklistMode(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                  title="New checklist"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Title & Pin & Dictation Action */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Note Title (e.g. Jordan Miller - Sensory Protocol #CID-101)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-slate-500 text-base font-semibold focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center gap-1 shrink-0">
                  {/* Hands-free Voice Dictation Toggle Button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                    className={`p-1.5 rounded-lg transition ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-400/50'
                        : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                    }`}
                    title={isRecording ? 'Stop Voice Dictation' : 'Start Hands-Free Voice Dictation (Web Speech API)'}
                  >
                    {isRecording ? <Radio className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewIsPinned(!newIsPinned)}
                    className={`p-1.5 rounded-lg transition ${
                      newIsPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={newIsPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Voice Dictation Status & Live Banner */}
              {isRecording && (
                <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="font-bold">Hands-Free Dictation Active</span>
                      <span className="font-mono bg-rose-900/60 px-1.5 py-0.5 rounded text-[10px] text-rose-200 border border-rose-700/50 font-bold">
                        {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-rose-200/90 italic text-[11px]">
                      {speechTranscript ? `"${speechTranscript}"` : 'Listening... Speak observations hands-free. Voice commands: "new line", "period", "bullet point"'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={stopSpeechRecognition}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shrink-0 self-start sm:self-auto"
                  >
                    Done Dictating
                  </button>
                </div>
              )}

              {speechError && (
                <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl p-2 text-xs text-amber-300 flex items-center justify-between gap-2">
                  <span className="text-[11px]">{speechError}</span>
                  <button
                    type="button"
                    onClick={() => setSpeechError(null)}
                    className="text-amber-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Category Selector in Note Creator */}
              <div className="flex items-center gap-2 py-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((catKey) => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const Icon = cfg.icon;
                    const isSelected = newCategory === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setNewCategory(catKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border transition ${
                          isSelected
                            ? `${cfg.badge} font-bold`
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isChecklistMode ? (
                <div className="space-y-2">
                  <textarea
                    placeholder="Take detailed clinical observations, dictate speech, or tag client (#CID-101)..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-sm focus:outline-none resize-none font-sans"
                  />
                  {/* Live preview with smart client links */}
                  {newText && (newText.includes('#') || /CID-/i.test(newText)) && (
                    <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Detected Interactive Client Link Preview:
                      </span>
                      <SmartTextWithClientLinks
                        text={newText}
                        clients={clients}
                        onNavigateClient={navigateToClient}
                        className="text-slate-300 text-xs leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {newChecklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => toggleNewItemCompleted(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                            item.completed
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'border-slate-600 hover:border-amber-400'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span
                          className={`text-xs flex-1 text-slate-200 ${
                            item.completed ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          <SmartTextWithClientLinks
                            text={item.text}
                            clients={clients}
                            onNavigateClient={navigateToClient}
                          />
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <Plus className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Add actionable checklist task (e.g. review with #CID-101)..."
                      value={newChecklistInput}
                      onChange={(e) => setNewChecklistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                      className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Labels & Client */}
              {(newLabels.length > 0 || newClientId) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {newClientId && (
                    <span className="bg-teal-950/80 text-teal-300 border border-teal-800/60 text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {clients.find((c) => c.id === newClientId)?.name || 'Participant'}
                    </span>
                  )}
                  {newLabels.map((lbl) => (
                    <span
                      key={lbl}
                      className="bg-slate-800 text-amber-300 border border-slate-700 text-[11px] px-2 py-0.5 rounded-full font-medium"
                    >
                      #{lbl}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 relative flex-wrap">
                  {/* Color Picker Toggle */}
                  <button
                    type="button"
                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                    title="Change note background color"
                  >
                    <Palette className="w-4 h-4" />
                  </button>

                  {/* Label Picker Toggle */}
                  <button
                    type="button"
                    onClick={() => setLabelPickerOpen(!labelPickerOpen)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                    title="Add preset labels"
                  >
                    <Tag className="w-4 h-4" />
                  </button>

                  {/* Quick Insert Client ID Tag Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setClientTagPickerOpen(!clientTagPickerOpen)}
                      className="px-2 py-1 text-slate-400 hover:text-teal-300 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                      title="Insert #CID client tag into note"
                    >
                      <FolderOpen className="w-3 h-3 text-teal-400" />
                      <span>Tag #CID</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {clientTagPickerOpen && (
                      <div className="absolute top-9 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-1 w-64 max-h-56 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Insert Client ID Tag
                        </p>
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => insertClientTagIntoText(c)}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left hover:bg-slate-800 text-slate-200 transition"
                          >
                            <span className="font-bold font-mono text-teal-300">
                              #CID-{c.id.replace(/^cli-|^cid-/, '')}
                            </span>
                            <span className="text-slate-400 truncate max-w-[120px] text-[11px]">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Client Select */}
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="bg-slate-800 text-slate-300 text-[11px] border border-slate-700 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="">Link NDIS Participant...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ndisNumber})
                      </option>
                    ))}
                  </select>

                  {/* Color Palette Popover */}
                  {colorPickerOpen && (
                    <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 flex gap-1.5 flex-wrap w-48">
                      {COLOR_PALETTES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setNewColor(p.id);
                            setColorPickerOpen(false);
                          }}
                          className={`w-6 h-6 rounded-full border ${p.border} ${p.bg} flex items-center justify-center hover:scale-110 transition`}
                          title={p.name}
                        >
                          {newColor === p.id && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Label Popover */}
                  {labelPickerOpen && (
                    <div className="absolute top-10 left-10 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-1 w-56">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Select Labels
                      </p>
                      {PRESET_LABELS.map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => toggleLabel(lbl)}
                          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left hover:bg-slate-800 transition text-slate-200"
                        >
                          <span>{lbl}</span>
                          {newLabels.includes(lbl) && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSummarizeCreatorDraft}
                    disabled={isSummarizingCreator || (!newText.trim() && newChecklistItems.length === 0)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
                    title="Generate structured bullet-point executive summary of this draft with Gemini API"
                  >
                    {isSummarizingCreator ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isSummarizingCreator ? 'Synthesizing...' : 'Summarize with Gemini'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      setIsChecklistMode(false);
                      if (isRecording) stopSpeechRecognition();
                    }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Keyword Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Keyword Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keyword, #CID-101, clinical notes, checklist tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Keyword Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 hidden sm:inline">
              Quick Filter:
            </span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterMode === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => setFilterMode('pending-actions')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterMode === 'pending-actions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Action Items</span>
            </button>
            <button
              onClick={() => setFilterMode('with-checklists')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterMode === 'with-checklists'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5 text-teal-400" />
              <span>Checklists</span>
            </button>
            <button
              onClick={() => setFilterMode('pinned')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterMode === 'pinned'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-rose-400" />
              <span>Pinned</span>
            </button>
          </div>
        </div>

        {/* Preset Label Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/60 pb-1 scrollbar-thin">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Tags:</span>
          {PRESET_LABELS.map((lbl) => {
            const count = notes.filter((n) => n.labels.includes(lbl)).length;
            if (count === 0) return null;
            const isSelected = selectedLabel === lbl;
            return (
              <button
                key={lbl}
                onClick={() => setSelectedLabel(isSelected ? null : lbl)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                #{lbl} ({count})
              </button>
            );
          })}
          {(selectedLabel || searchQuery || selectedCategory !== 'ALL' || filterMode !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLabel(null);
                setFilterMode('all');
              }}
              className="text-[11px] text-rose-400 hover:underline px-2 shrink-0 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-amber-400" /> Pinned Notes ({pinnedNotes.length})
          </h2>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            }
          >
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                clients={clients}
                getColorConfig={getColorConfig}
                onTogglePin={handleTogglePin}
                onToggleChecklist={handleToggleChecklistItem}
                onChangeColor={handleChangeNoteColor}
                onChangeCategory={handleChangeCategory}
                onDelete={handleDeleteNote}
                onExportCaseNote={handleExportToCaseNote}
                onExportSinglePDF={handleExportSingleNotePDF}
                onSummarizeWithGemini={handleSummarizeNote}
                isSummarizing={summarizingNoteId === note.id}
                onCopy={handleCopyToClipboard}
                onQuickSyncToCRM={handleQuickSyncToCRM}
                onOpenSyncModal={(n) => setSyncingNote(n)}
                onViewInCRM={() => setActiveTab('crm')}
                onNavigateClient={navigateToClient}
                isCopied={copyFeedback === note.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedNoteIds.has(note.id)}
                onToggleSelect={() => toggleSelectNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && (
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Other Notes ({otherNotes.length})
          </h2>
        )}
        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <StickyNote className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No notes match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your keyword search or category filter above, or create a new clinical note.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLabel(null);
                setFilterMode('all');
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            }
          >
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                clients={clients}
                getColorConfig={getColorConfig}
                onTogglePin={handleTogglePin}
                onToggleChecklist={handleToggleChecklistItem}
                onChangeColor={handleChangeNoteColor}
                onChangeCategory={handleChangeCategory}
                onDelete={handleDeleteNote}
                onExportCaseNote={handleExportToCaseNote}
                onExportSinglePDF={handleExportSingleNotePDF}
                onSummarizeWithGemini={handleSummarizeNote}
                isSummarizing={summarizingNoteId === note.id}
                onCopy={handleCopyToClipboard}
                onQuickSyncToCRM={handleQuickSyncToCRM}
                onOpenSyncModal={(n) => setSyncingNote(n)}
                onViewInCRM={() => setActiveTab('crm')}
                onNavigateClient={navigateToClient}
                isCopied={copyFeedback === note.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedNoteIds.has(note.id)}
                onToggleSelect={() => toggleSelectNote(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sync to CRM Task Configuration Modal */}
      {syncingNote && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sync NDIS Action Items to CRM</h3>
                  <p className="text-[11px] text-slate-400">Push items into the active practitioner task queue</p>
                </div>
              </div>
              <button
                onClick={() => setSyncingNote(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    CATEGORY_CONFIG[syncingNote.category]?.badge || ''
                  }`}
                >
                  {syncingNote.category}
                </span>
                <span className="text-xs font-bold text-white truncate">{syncingNote.title}</span>
              </div>
              {syncingNote.checklist && syncingNote.checklist.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Action Items to Push ({syncingNote.checklist.length}):
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                    {syncingNote.checklist.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className={c.completed ? 'line-through text-slate-500' : ''}>{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-slate-300">{syncingNote.text || 'Single task from note body'}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority Level</label>
                <select
                  value={syncPriority}
                  onChange={(e) => setSyncPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="Critical">🔴 Critical (NDIS Deadline)</option>
                  <option value="High">🟠 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Due Date</label>
                <input
                  type="date"
                  value={syncDueDate}
                  onChange={(e) => setSyncDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Assigned Practitioner</label>
                <select
                  value={syncAssignee}
                  onChange={(e) => setSyncAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  <option value="Marcus Vance">Marcus Vance (Senior PBS Practitioner)</option>
                  <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Clinical Director)</option>
                  <option value="Elena Rostova">Elena Rostova (Compliance & Quality Officer)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSyncingNote(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSyncModal}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Push to CRM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formatted NDIS Compliance PDF Export Modal */}
      {pdfExportModalOpen && (
        <NDISKeepPDFExportModal
          notes={notesToExport}
          clients={clients}
          onClose={() => setPdfExportModalOpen(false)}
          onUpdateNoteSummary={(noteId, summary) => {
            setNotes((prev) =>
              prev.map((n) => (n.id === noteId ? { ...n, executiveSummary: summary } : n))
            );
          }}
        />
      )}
    </div>
  );
};

interface NoteCardProps {
  note: KeepNoteItem;
  clients: Client[];
  getColorConfig: (colorId: string) => any;
  onTogglePin: (id: string) => void;
  onToggleChecklist: (noteId: string, itemId: string) => void;
  onChangeColor: (noteId: string, color: string) => void;
  onChangeCategory: (noteId: string, category: NoteCategory) => void;
  onDelete: (id: string) => void;
  onExportCaseNote: (note: KeepNoteItem) => void;
  onExportSinglePDF: (note: KeepNoteItem) => void;
  onSummarizeWithGemini: (note: KeepNoteItem) => void;
  isSummarizing: boolean;
  onCopy: (note: KeepNoteItem) => void;
  onQuickSyncToCRM: (note: KeepNoteItem) => void;
  onOpenSyncModal: (note: KeepNoteItem) => void;
  onViewInCRM: () => void;
  onNavigateClient: (id: string) => void;
  isCopied: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  clients,
  getColorConfig,
  onTogglePin,
  onToggleChecklist,
  onChangeColor,
  onChangeCategory,
  onDelete,
  onExportCaseNote,
  onExportSinglePDF,
  onSummarizeWithGemini,
  isSummarizing,
  onCopy,
  onQuickSyncToCRM,
  onOpenSyncModal,
  onViewInCRM,
  onNavigateClient,
  isCopied,
  isSelectionMode,
  isSelected,
  onToggleSelect
}) => {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const colorCfg = getColorConfig(note.color);
  const categoryCfg = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.Clinical;
  const CategoryIcon = categoryCfg.icon;

  const incompleteChecklistCount = note.checklist?.filter((it) => !it.completed).length || 0;

  return (
    <div
      onClick={isSelectionMode ? onToggleSelect : undefined}
      className={`${colorCfg.bg} border ${
        isSelected
          ? 'border-teal-400 ring-2 ring-teal-400/40 shadow-xl'
          : `${colorCfg.border} hover:border-slate-600`
      } rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between group relative ${
        isSelectionMode ? 'cursor-pointer' : ''
      }`}
    >
      <div className="space-y-2.5">
        {/* Card Header: Category Badge + Title + Pin */}
        <div className="flex items-start justify-between gap-2">
          {/* Multi-select checkbox */}
          {isSelectionMode && (
            <div className="pt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect && onToggleSelect()}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>
          )}

          <div className="space-y-1 flex-1 min-w-0">
            {/* Visual Category Label Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${categoryCfg.badge}`}
              >
                <CategoryIcon className="w-2.5 h-2.5" />
                {categoryCfg.label}
              </span>

              {note.syncedToCrmCount && note.syncedToCrmCount > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewInCRM();
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition flex items-center gap-1"
                  title="View task in CRM module"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-teal-400" />
                  Synced to CRM
                </button>
              ) : null}
            </div>

            <h3 className="text-sm font-bold text-white leading-snug tracking-tight pt-0.5">
              <SmartTextWithClientLinks
                text={note.title}
                clients={clients}
                onNavigateClient={onNavigateClient}
              />
            </h3>
          </div>

          {!isSelectionMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              className={`p-1 rounded-lg transition shrink-0 ${
                note.isPinned
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Text Content with Clickable Client ID Hyperlinks */}
        {note.text && (
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            <SmartTextWithClientLinks
              text={note.text}
              clients={clients}
              onNavigateClient={onNavigateClient}
            />
          </p>
        )}

        {/* Executive AI Summary Block (if generated) */}
        {note.executiveSummary && (
          <div className="bg-teal-950/60 border border-teal-500/40 rounded-xl p-3 space-y-1.5 text-xs text-teal-100">
            <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-teal-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" /> Executive AI Clinical Summary
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSummarizeWithGemini(note);
                }}
                className="text-teal-400 hover:text-white underline text-[10px]"
                title="Regenerate Executive Summary"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              <SmartTextWithClientLinks
                text={note.executiveSummary}
                clients={clients}
                onNavigateClient={onNavigateClient}
              />
            </p>
          </div>
        )}

        {/* Checklist */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {note.checklist.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleChecklist(note.id, item.id);
                }}
                className="flex items-center gap-2 cursor-pointer group/item text-xs"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition shrink-0 ${
                    item.completed
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'border-slate-600 group-hover/item:border-amber-400'
                  }`}
                >
                  {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={`text-slate-300 ${item.completed ? 'line-through text-slate-500' : ''}`}>
                  <SmartTextWithClientLinks
                    text={item.text}
                    clients={clients}
                    onNavigateClient={onNavigateClient}
                  />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Labels & Client Badge */}
        {(note.labels?.length > 0 || note.clientName) && (
          <div className="flex flex-wrap items-center gap-1 pt-2">
            {note.clientName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (note.clientId) onNavigateClient(note.clientId);
                }}
                className="bg-teal-950/80 text-teal-300 border border-teal-800/60 hover:border-teal-400 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition"
                title="Click to view client in CRM & Dashboard"
              >
                <FolderOpen className="w-2.5 h-2.5" />
                {note.clientName}
              </button>
            )}
            {note.labels?.map((lbl) => (
              <span
                key={lbl}
                className="bg-slate-800/80 text-slate-300 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              >
                #{lbl}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Actions & Sync Bar */}
      <div className="space-y-2 pt-3 mt-3 border-t border-slate-800/60">
        {/* Gemini Summarize & NDIS PDF Export Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSummarizeWithGemini(note);
            }}
            disabled={isSummarizing}
            className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 text-[11px] font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            title="Summarize clinical observations into bullet-point executive review with Gemini"
          >
            {isSummarizing ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>{isSummarizing ? 'Synthesizing...' : 'AI Summary'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExportSinglePDF(note);
            }}
            className="py-1.5 px-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:border-teal-500/60 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            title="Export this note as formatted NDIS compliance PDF document"
          >
            <FileText className="w-3 h-3 text-teal-400" />
            <span>NDIS PDF</span>
          </button>
        </div>

        {/* 1-Click Sync to CRM Button Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSyncModal(note);
            }}
            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-900/60 text-slate-300 hover:text-teal-200 border border-slate-700/80 hover:border-teal-600/60 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            title="Configure and push action items to CRM Task Management"
          >
            <Send className="w-3 h-3 text-teal-400" />
            <span>Sync Action Items to CRM</span>
            {incompleteChecklistCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[9px] border border-amber-500/40 font-bold">
                {incompleteChecklistCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-slate-400 text-[10px]">
          <span className="text-slate-500">
            {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Category Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryMenuOpen(!categoryMenuOpen);
                }}
                className="p-1 hover:text-teal-400 hover:bg-slate-800 rounded transition"
                title="Change Category Domain"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              {categoryMenuOpen && (
                <div className="absolute bottom-7 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-30 space-y-1 w-40">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
                    Category
                  </p>
                  {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => {
                    const c = CATEGORY_CONFIG[cat];
                    const Icon = c.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeCategory(note.id, cat);
                          setCategoryMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-left hover:bg-slate-800 text-slate-200 transition"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Color Picker Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setColorMenuOpen(!colorMenuOpen);
                }}
                className="p-1 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                title="Change note color"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {colorMenuOpen && (
                <div className="absolute bottom-7 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-30 flex gap-1 flex-wrap w-44">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeColor(note.id, p.id);
                        setColorMenuOpen(false);
                      }}
                      className={`w-5 h-5 rounded-full border ${p.border} ${p.bg} hover:scale-110 transition`}
                      title={p.name}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Export to NDIS Case Note */}
            {note.clientId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportCaseNote(note);
                }}
                className="p-1 hover:text-teal-400 hover:bg-slate-800 rounded transition"
                title="Export as Clinical Case Note"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Copy to clipboard */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(note);
              }}
              className="p-1 hover:text-sky-400 hover:bg-slate-800 rounded transition"
              title="Copy Note Content"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Delete note */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
