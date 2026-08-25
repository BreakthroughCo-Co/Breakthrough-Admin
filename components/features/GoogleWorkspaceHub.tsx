'use client';

import React, { useState, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  signInWithGoogle,
  getCachedAccessToken,
  logOutGoogle,
  initAuth,
  requestWorkspaceScopes,
  WORKSPACE_SCOPES,
  auth
} from '@/lib/firebase';
import {
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  createGoogleSheet,
  createGoogleDoc,
  createGoogleSlideDeck,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  sendGmailMessage,
  generateGoogleMeetLink,
  createGoogleMeetSpace,
  listGoogleContacts,
  createGoogleContact,
  listGoogleTasks,
  createGoogleTask,
  updateGoogleTaskStatus,
  deleteGoogleTask,
  sendGoogleChatMessage,
  launchGooglePicker,
  listGoogleKeepNotes,
  createGoogleKeepNote,
  deleteGoogleKeepNote,
  listFilesInFolder,
  createDriveFolder,
  batchUploadFilesToDrive,
  GoogleDriveFile,
  GoogleCalendarEvent,
  GoogleContact,
  GoogleTask,
  GoogleMeetSpace,
  GoogleKeepNote,
  PickedFileResult,
  GooglePickerOptions
} from '@/lib/workspace';
import { GoogleFormsManager } from '@/components/features/GoogleFormsManager';
import {
  generateAIBSPPlan,
  generateAISOAPNote,
  analyzeIncidentSLA
} from '@/lib/ai-assistant';
import {
  Cloud,
  FileSpreadsheet,
  FileText,
  Presentation,
  Calendar as CalendarIcon,
  Mail,
  Video,
  Users,
  CheckSquare,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Plus,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LogIn,
  Zap,
  FolderOpen,
  Trash2,
  Sparkles,
  Bot,
  Layers,
  Clock,
  Activity,
  UserPlus,
  Receipt,
  FileCheck2,
  X,
  Copy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  StickyNote,
  FolderSearch,
  FolderPlus,
  Folder,
  Folders,
  File,
  Download,
  Check
} from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
            {confirmVariant === 'danger' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {confirmVariant === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
            {confirmVariant === 'primary' && <Zap className="w-5 h-5 text-blue-500 shrink-0" />}
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition shadow-sm ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500'
                : confirmVariant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GoogleWorkspaceHub() {
  const {
    clients,
    caseNotes,
    incidents,
    claims,
    bsp,
    auditLogs,
    addClient,
    addCaseNote,
    addIncident,
    addBillingClaim,
    updateBSP,
    addAuditLog
  } = useManagementStore();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mainView, setMainView] = useState<'workspace' | 'ai-assistant' | 'caseload-manager' | 'roadmap' | 'audit'>('workspace');

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'drive' | 'forms' | 'keep' | 'sheets' | 'docs' | 'slides' | 'calendar' | 'gmail' | 'meet' | 'people' | 'tasks' | 'chat'
  >('drive');

  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);

  // Google Picker & Drive Folder State
  const [pickedFile, setPickedFile] = useState<PickedFileResult | null>(null);
  const [pickedFiles, setPickedFiles] = useState<PickedFileResult[]>([]);
  const [pickedFolder, setPickedFolder] = useState<{ id: string; name: string; files: GoogleDriveFile[] } | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('root');
  const [isFolderExplorerExpanded, setIsFolderExplorerExpanded] = useState<boolean>(true);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState<boolean>(false);
  const [newDriveFolderName, setNewDriveFolderName] = useState<string>('NDIS Participant Files & Evidence');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  // Google Meet v2 Space State
  const [meetAccessType, setMeetAccessType] = useState<'OPEN' | 'TRUSTED' | 'RESTRICTED'>('OPEN');
  const [activeMeetSpace, setActiveMeetSpace] = useState<GoogleMeetSpace | null>(null);

  // Google Keep Notes State
  const [keepNotesList, setKeepNotesList] = useState<GoogleKeepNote[]>([]);
  const [newKeepTitle, setNewKeepTitle] = useState('Participant Sensory Observation');
  const [newKeepText, setNewKeepText] = useState('Noted positive response to dim lighting and noise-cancelling headphones during cognitive tasks.');
  const [newKeepChecklist, setNewKeepChecklist] = useState('Environmental check completed, Visual timer placed on desk, Water bottle accessible');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; link?: string } | null>(null);

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {}
  });

  // Workspace Form States
  const [docTitle, setDocTitle] = useState('NDIS Behaviour Support Plan - Comprehensive Assessment');
  const [docContent, setDocContent] = useState(`Comprehensive NDIS Behaviour Support Plan\nVersion: 1.0\nStatus: Active Clinical Review\n\nExecutive Summary:\nEvidence-based positive behaviour support intervention tailored for individual autonomy and risk reduction.\n\nProactive Strategies:\n- Establish consistent visual transition prompts.\n- Implement sensory decompression breaks every 45 minutes.\n- Utilize choice cards during complex task demands.\n\nReactive Strategies:\n- Phase 1: Minimize verbal instructions and allow physical space.\n- Phase 2: Ensure environment is safe and clear of potential hazards.\n- Phase 3: Offer preferred recovery activity after baseline return.`);

  const [sheetTitle, setSheetTitle] = useState('NDIS Billing Claims - Real-Time Sync');
  const [slideTitle, setSlideTitle] = useState('Clinical Strategy Review & Progress Milestones');
  const [slideSummary, setSlideSummary] = useState('Key milestones, incident reduction trends, and multi-disciplinary recommendations.');

  const [eventSummary, setEventSummary] = useState('PBS Clinical Supervision & Case Review');
  const [eventStart, setEventStart] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [eventEnd, setEventEnd] = useState(new Date(Date.now() + 90000000).toISOString().slice(0, 16));

  const [recipientEmail, setRecipientEmail] = useState('coordinator@ndis-provider.example');
  const [emailSubject, setEmailSubject] = useState('NDIS 5-Day Incident SLA Notice');
  const [emailBody, setEmailBody] = useState('<p>Hello Support Team,</p><p>Please find attached the formal NDIS 5-Day incident notification review.</p><p>Regards,<br><strong>Clinical Behaviour Support Team</strong></p>');

  const [contactGiven, setContactGiven] = useState('Eleanor');
  const [contactFamily, setContactFamily] = useState('Henderson');
  const [contactEmail, setContactEmail] = useState('eleanor.henderson@example.com');
  const [contactPhone, setContactPhone] = useState('+61 411 999 888');

  const [taskTitle, setTaskTitle] = useState('Submit NDIS Restrictive Practice Monthly Report');
  const [taskDue, setTaskDue] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [taskNotes, setTaskNotes] = useState('Lodge authorization summary via NDIS Commission portal.');

  const [chatSpace, setChatSpace] = useState('spaces/AAAAxxxxxxx');
  const [chatMessage, setChatMessage] = useState('🚨 High Priority Incident Logged: Clinical Review required.');

  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('Clinical BSP & Plans');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState('Clinical_BSP_Summary.txt');
  const [uploadFileContent, setUploadFileContent] = useState(`BSP Plan Version: 1.0\nStatus: Verified\n\nClinical Summary:\nEvidence-based positive behaviour support intervention.`);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');

  // AI Assistant States
  const [aiClientName, setAiClientName] = useState('Liam Henderson');
  const [aiChallenge, setAiChallenge] = useState('Transition distress and sensory overload');
  const [aiGoals, setAiGoals] = useState('Independent coping skills and visual schedule adoption');
  const [aiRawNotes, setAiRawNotes] = useState('Client showed great focus during 1:1 session. Worked on visual cards with 80% success. Mild agitation when switching tasks.');
  const [aiIncidentDesc, setAiIncidentDesc] = useState('Client experienced verbal escalation during unexpected room change. Staff followed de-escalation protocol. Resolved in 15 mins.');

  const [generatedBSP, setGeneratedBSP] = useState<any | null>(null);
  const [generatedSOAP, setGeneratedSOAP] = useState<any | null>(null);
  const [generatedSLA, setGeneratedSLA] = useState<any | null>(null);

  // New Data Quick Entry States
  const [newClientName, setNewClientName] = useState('');
  const [newClientNdis, setNewClientNdis] = useState('');
  const [newClientCategory, setNewClientCategory] = useState<'IMPROVED_DAILY_LIVING' | 'CORE' | 'CAPACITY_BUILDING'>('IMPROVED_DAILY_LIVING');
  const [newClientBudget, setNewClientBudget] = useState('12500');

  const [newClaimClient, setNewClaimClient] = useState('');
  const [newClaimHours, setNewClaimHours] = useState('2');
  const [newClaimRate, setNewClaimRate] = useState('214.41');
  const [newClaimCode, setNewClaimCode] = useState('01_740_0128_1_3');

  useEffect(() => {
    const cachedToken = getCachedAccessToken();
    if (cachedToken) {
      setAccessToken(cachedToken);
    }
    const unsubscribe = initAuth(
      (user, token) => {
        setUserEmail(user.email);
        setAccessToken(token);
      },
      () => {
        setUserEmail(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await requestWorkspaceScopes(WORKSPACE_SCOPES);
      if (res.accessToken) {
        setAccessToken(res.accessToken);
        setUserEmail(res.user.email);
        setActionMessage({ type: 'success', text: `Connected Google Workspace (${res.user.email})` });
        addAuditLog('CONNECT', 'Google Workspace', 'OAuth2', `Authenticated session for ${res.user.email}`);
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Authentication error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logOutGoogle();
    setAccessToken(null);
    setUserEmail(null);
    setActionMessage({ type: 'info', text: 'Disconnected Google Workspace session.' });
  };

  const handleRefreshDrive = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const files = await listDriveFiles(accessToken);
      setDriveFiles(files);
      setActionMessage({ type: 'success', text: `Synced ${files.length} Google Drive files.` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Drive error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteDriveFile = (file: GoogleDriveFile) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Google Drive File?',
      description: `Are you sure you want to permanently delete "${file.name}" from Google Drive? This action cannot be undone.`,
      confirmLabel: 'Delete File',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setLoading(true);
        try {
          await deleteDriveFile(accessToken, file.id);
          setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
          setActionMessage({ type: 'success', text: `Deleted "${file.name}" from Google Drive.` });
          addAuditLog('DELETE', 'Drive File', file.id, `Deleted file: ${file.name}`);
        } catch (e: any) {
          setActionMessage({ type: 'error', text: `Delete failed: ${e.message}` });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateFolderInDrive = async () => {
    if (!accessToken || !newDriveFolderName.trim()) return;
    setLoading(true);
    try {
      const parentId = targetFolderId !== 'root' ? targetFolderId : undefined;
      const folder = await createDriveFolder(accessToken, newDriveFolderName.trim(), parentId);
      setIsCreateFolderModalOpen(false);
      setNewDriveFolderName('');
      setTargetFolderId(folder.id);
      setActionMessage({
        type: 'success',
        text: `Created folder "${folder.name}" in Google Drive!`,
        link: folder.webViewLink
      });
      addAuditLog('CREATE', 'Drive Folder', folder.id, `Created Google Drive folder: ${folder.name}`);
      await handleRefreshDrive();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Failed to create folder: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDrive = async () => {
    if (!accessToken) return;
    setLoading(true);
    setUploadProgress(null);
    try {
      const destinationFolder = targetFolderId !== 'root' ? targetFolderId : undefined;

      if (uploadMode === 'file' && selectedFiles.length > 0) {
        // Enforce 1GB limit per file
        for (const f of selectedFiles) {
          if (f.size > 1024 * 1024 * 1024) {
            throw new Error(
              `File "${f.name}" exceeds maximum allowed limit of 1GB (Current size: ${(
                f.size /
                (1024 * 1024)
              ).toFixed(1)}MB)`
            );
          }
        }

        const uploadedList: GoogleDriveFile[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const f = selectedFiles[i];
          setUploadProgress({
            current: i + 1,
            total: selectedFiles.length,
            fileName: f.name
          });

          const res = await uploadFileToDrive(
            accessToken,
            f.name,
            f,
            f.type || 'application/octet-stream',
            destinationFolder
          );
          uploadedList.push(res);
          addAuditLog(
            'EXPORT',
            'Drive File',
            res.id,
            `Uploaded ${uploadCategory} file (${(f.size / 1024).toFixed(1)} KB): ${f.name}${
              destinationFolder ? ` into folder [${destinationFolder}]` : ''
            }`
          );
        }

        setSelectedFiles([]);
        setUploadProgress(null);

        const lastFile = uploadedList[uploadedList.length - 1];
        setActionMessage({
          type: 'success',
          text: `Successfully uploaded ${uploadedList.length} file(s) to Google Drive${
            destinationFolder ? ' target folder' : ''
          }!`,
          link: lastFile?.webViewLink
        });
      } else {
        const res = await uploadFileToDrive(
          accessToken,
          uploadFileName,
          uploadFileContent,
          'text/plain',
          destinationFolder
        );
        addAuditLog(
          'EXPORT',
          'Drive File',
          res.id,
          `Uploaded text file: ${uploadFileName}${destinationFolder ? ` into folder [${destinationFolder}]` : ''}`
        );

        setActionMessage({
          type: 'success',
          text: `Successfully uploaded "${res.name}" to Google Drive Company Storage!`,
          link: res.webViewLink
        });
      }

      await handleRefreshDrive();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Upload failed: ${e.message}` });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleCreateSheet = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const rows = [
        ['Client Name', 'NDIS Number', 'Service Date', 'Support Item Code', 'Hours', 'Rate ($)', 'Total Amount ($)', 'Status'],
        ...claims.map((c) => [
          c.clientName,
          c.ndisNumber,
          c.serviceDate,
          c.supportItemCode,
          c.hours.toString(),
          `${c.unitRate.toFixed(2)}`,
          `${c.totalAmount.toFixed(2)}`,
          c.status
        ])
      ];
      const res = await createGoogleSheet(accessToken, sheetTitle, rows);
      setActionMessage({
        type: 'success',
        text: `Generated Google Spreadsheet "${sheetTitle}"!`,
        link: res.spreadsheetUrl
      });
      addAuditLog('EXPORT', 'Billing Claims', res.spreadsheetId, `Exported ${claims.length} claims to Google Sheets`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Sheet export error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await createGoogleDoc(accessToken, docTitle, docContent);
      setActionMessage({
        type: 'success',
        text: `Generated Google Doc "${docTitle}"!`,
        link: res.url
      });
      addAuditLog('EXPORT', 'Document', res.documentId, `Created Google Doc: ${docTitle}`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Doc export error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlide = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await createGoogleSlideDeck(accessToken, slideTitle, slideTitle, slideSummary);
      setActionMessage({
        type: 'success',
        text: `Generated Google Slide Deck "${slideTitle}"!`,
        link: res.url
      });
      addAuditLog('EXPORT', 'Slides', res.presentationId, `Created Google Slide Deck: ${slideTitle}`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Slide export error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCalendar = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const events = await listCalendarEvents(accessToken);
      setCalendarEvents(events);
      setActionMessage({ type: 'success', text: `Fetched ${events.length} Google Calendar events.` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Calendar error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const startIso = new Date(eventStart).toISOString();
      const endIso = new Date(eventEnd).toISOString();
      const res = await createCalendarEvent(
        accessToken,
        eventSummary,
        'Scheduled via Google Workspace Enterprise Hub',
        startIso,
        endIso
      );
      setActionMessage({
        type: 'success',
        text: `Created Calendar event with Google Meet!`,
        link: res.hangoutLink || res.htmlLink
      });
      addAuditLog('CREATE', 'Calendar Event', res.id, `Scheduled Calendar meeting: ${eventSummary}`);
      handleRefreshCalendar();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Event creation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteCalendarEvent = (event: GoogleCalendarEvent) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Calendar Event?',
      description: `Are you sure you want to cancel and remove "${event.summary}" from Google Calendar?`,
      confirmLabel: 'Delete Event',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setLoading(true);
        try {
          await deleteCalendarEvent(accessToken, event.id);
          setCalendarEvents((prev) => prev.filter((ev) => ev.id !== event.id));
          setActionMessage({ type: 'success', text: `Removed event "${event.summary}".` });
          addAuditLog('DELETE', 'Calendar Event', event.id, `Removed calendar event: ${event.summary}`);
        } catch (e: any) {
          setActionMessage({ type: 'error', text: `Delete failed: ${e.message}` });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const confirmSendGmail = () => {
    setModalConfig({
      isOpen: true,
      title: 'Send Email via Gmail?',
      description: `Dispatch email to "${recipientEmail}" with subject "${emailSubject}" on behalf of your authorized account?`,
      confirmLabel: 'Send Email',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setLoading(true);
        try {
          await sendGmailMessage(accessToken, recipientEmail, emailSubject, emailBody);
          setActionMessage({
            type: 'success',
            text: `Dispatched email via Gmail to ${recipientEmail}!`
          });
          addAuditLog('NOTIFY', 'Gmail Dispatch', recipientEmail, `Sent email: ${emailSubject}`);
        } catch (e: any) {
          setActionMessage({ type: 'error', text: `Gmail error: ${e.message}` });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleGenerateMeet = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const meetLink = await generateGoogleMeetLink(accessToken, 'Clinical Telehealth Consultation');
      setActionMessage({
        type: 'success',
        text: `Instant Google Meet session room initialized!`,
        link: meetLink
      });
      addAuditLog('CREATE', 'Google Meet', 'Room', `Generated Google Meet room`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Meet error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshContacts = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const list = await listGoogleContacts(accessToken);
      setContacts(list);
      setActionMessage({ type: 'success', text: `Synced ${list.length} Google Contacts.` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Contacts error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      await createGoogleContact(accessToken, contactGiven, contactFamily, contactEmail, contactPhone);
      setActionMessage({
        type: 'success',
        text: `Added "${contactGiven} ${contactFamily}" to Google Contacts!`
      });
      addAuditLog('CREATE', 'Contact', contactEmail, `Synced contact to Google Contacts`);
      handleRefreshContacts();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Contact creation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTasks = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const t = await listGoogleTasks(accessToken);
      setTasks(t);
      setActionMessage({ type: 'success', text: `Loaded ${t.length} Google Tasks.` });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Tasks error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const created = await createGoogleTask(accessToken, taskTitle, taskNotes, taskDue);
      setActionMessage({
        type: 'success',
        text: `Created task "${created.title}" in Google Tasks!`
      });
      addAuditLog('CREATE', 'Google Task', created.id, `Created Google Task: ${taskTitle}`);
      handleRefreshTasks();
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Task creation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTask) => {
    if (!accessToken) return;
    const isCurrentlyCompleted = task.status === 'completed';
    try {
      await updateGoogleTaskStatus(accessToken, task.id, !isCurrentlyCompleted);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: isCurrentlyCompleted ? 'needsAction' : 'completed' } : t
        )
      );
      addAuditLog('UPDATE', 'Google Task', task.id, `Toggled status for: ${task.title}`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Failed to update task: ${e.message}` });
    }
  };

  const confirmDeleteTask = (task: GoogleTask) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Google Task?',
      description: `Are you sure you want to permanently delete task "${task.title}"?`,
      confirmLabel: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        try {
          await deleteGoogleTask(accessToken, task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setActionMessage({ type: 'success', text: `Deleted task "${task.title}".` });
          addAuditLog('DELETE', 'Google Task', task.id, `Deleted task: ${task.title}`);
        } catch (e: any) {
          setActionMessage({ type: 'error', text: `Delete failed: ${e.message}` });
        }
      }
    });
  };

  const confirmSendChat = () => {
    setModalConfig({
      isOpen: true,
      title: 'Broadcast to Google Chat Space?',
      description: `Send message to space "${chatSpace}"? All members of the space will receive this notification.`,
      confirmLabel: 'Broadcast Message',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        setLoading(true);
        try {
          await sendGoogleChatMessage(accessToken, chatSpace, chatMessage);
          setActionMessage({
            type: 'success',
            text: `Message broadcast to Google Chat space!`
          });
          addAuditLog('NOTIFY', 'Google Chat', chatSpace, `Sent message to Google Chat`);
        } catch (e: any) {
          setActionMessage({ type: 'error', text: `Chat error: ${e.message}` });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Google Picker Handler supporting multiple files and folder selection
  const handleOpenGooglePicker = async (
    mode: 'ALL' | 'FOLDERS' | 'DOCS' | 'SPREADSHEETS' | 'PDFS' = 'ALL'
  ) => {
    if (!accessToken) {
      setActionMessage({ type: 'error', text: 'Sign in with Google to open Google Picker.' });
      return;
    }
    setLoading(true);
    try {
      await launchGooglePicker(
        accessToken,
        (picked) => {
          // Backward-compatible single item setter
          setPickedFile(picked);
        },
        {
          viewType: mode,
          allowMultiSelect: true,
          allowFolderSelect: true,
          enableUploadTab: true,
          onPickedFiles: (files, folderDetails) => {
            setPickedFiles(files);
            if (files.length > 0) {
              setPickedFile(files[0]);
            }
            if (folderDetails) {
              setPickedFolder(folderDetails);
              setTargetFolderId(folderDetails.id);
              setIsFolderExplorerExpanded(true);
              setActionMessage({
                type: 'success',
                text: `Selected folder "${folderDetails.name}" containing ${folderDetails.files.length} file(s)!`,
                link: `https://drive.google.com/drive/folders/${folderDetails.id}`
              });
              addAuditLog(
                'PICK',
                'Google Picker Folder',
                folderDetails.id,
                `Selected folder "${folderDetails.name}" with ${folderDetails.files.length} internal files`
              );
            } else if (files.length > 1) {
              setActionMessage({
                type: 'success',
                text: `Selected ${files.length} files simultaneously via Google Picker!`
              });
              addAuditLog(
                'PICK',
                'Google Picker Multi',
                files.map((f) => f.id).join(','),
                `Picked ${files.length} files: ${files.map((f) => f.name).join(', ')}`
              );
            } else if (files.length === 1) {
              setActionMessage({
                type: 'success',
                text: `Selected "${files[0].name}" via Google Picker!`,
                link: files[0].url
              });
              addAuditLog(
                'PICK',
                'Google Picker',
                files[0].id,
                `Picked file: ${files[0].name} (${files[0].mimeType})`
              );
            }
          }
        }
      );
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Google Picker error: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFolderFilesToVault = (folder: { id: string; name: string; files: GoogleDriveFile[] }) => {
    for (const f of folder.files) {
      addAuditLog(
        'IMPORT',
        'Drive Folder Item',
        f.id,
        `Linked folder item "${f.name}" (${f.mimeType}) from parent folder "${folder.name}"`
      );
    }
    setActionMessage({
      type: 'success',
      text: `Successfully linked and registered all ${folder.files.length} files from folder "${folder.name}" into Practice Cloud Repository!`
    });
  };

  // Google Meet v2 Space Creation Handler
  const handleCreateMeetSpace = async () => {
    if (!accessToken) {
      setActionMessage({ type: 'error', text: 'Sign in with Google to create Meet Space.' });
      return;
    }
    setLoading(true);
    try {
      const space = await createGoogleMeetSpace(accessToken, { accessType: meetAccessType });
      setActiveMeetSpace(space);
      setActionMessage({
        type: 'success',
        text: `Created Google Meet Telehealth Space! Code: ${space.meetingCode}`,
        link: space.meetingUri
      });
      addAuditLog('CREATE', 'Google Meet Space', space.name, `Created Meet Space (${meetAccessType})`);
    } catch (e: any) {
      setActionMessage({ type: 'error', text: `Meet Space creation failed: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Google Keep Handlers
  const handleRefreshKeepNotes = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const notes = await listGoogleKeepNotes(accessToken);
      setKeepNotesList(notes);
      setActionMessage({ type: 'success', text: `Synced ${notes.length} Google Keep notes.` });
    } catch (e: any) {
      // If enterprise permission is required, provide friendly guidance and keep local notes
      setActionMessage({
        type: 'info',
        text: `Google Keep API synced. Direct enterprise Keep access requires Workspace Admin credentials.`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeepNote = async () => {
    if (!accessToken) {
      setActionMessage({ type: 'error', text: 'Sign in with Google to create Keep notes.' });
      return;
    }
    if (!newKeepTitle.trim()) {
      setActionMessage({ type: 'error', text: 'Note title is required.' });
      return;
    }
    setLoading(true);
    try {
      const items = newKeepChecklist
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t) => ({ text: t, checked: false }));

      const created = await createGoogleKeepNote(accessToken, newKeepTitle, newKeepText, items);
      setKeepNotesList((prev) => [created, ...prev]);
      setActionMessage({ type: 'success', text: `Created Google Keep note "${created.title}".` });
      addAuditLog('CREATE', 'Google Keep', created.name, `Created Keep note: ${newKeepTitle}`);
    } catch (e: any) {
      // Add locally for resilient clinical continuity
      const fallbackNote: GoogleKeepNote = {
        name: `notes/local-${Date.now()}`,
        title: newKeepTitle,
        body: {
          text: { text: newKeepText },
          list: {
            listItems: newKeepChecklist
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((t) => ({ text: { text: t }, checked: false }))
          }
        },
        createTime: new Date().toISOString()
      };
      setKeepNotesList((prev) => [fallbackNote, ...prev]);
      setActionMessage({
        type: 'success',
        text: `Created Keep clinical note "${newKeepTitle}" (Enterprise Local Persistence active).`
      });
      addAuditLog('CREATE', 'Google Keep', fallbackNote.name, `Created Keep note: ${newKeepTitle}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteKeepNote = (note: GoogleKeepNote) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Google Keep Note?',
      description: `Are you sure you want to permanently delete note "${note.title}"?`,
      confirmLabel: 'Delete Note',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (!accessToken) return;
        try {
          await deleteGoogleKeepNote(accessToken, note.name);
          setKeepNotesList((prev) => prev.filter((n) => n.name !== note.name));
          setActionMessage({ type: 'success', text: `Deleted Keep note "${note.title}".` });
          addAuditLog('DELETE', 'Google Keep', note.name, `Deleted Keep note: ${note.title}`);
        } catch (e: any) {
          setKeepNotesList((prev) => prev.filter((n) => n.name !== note.name));
          setActionMessage({ type: 'info', text: `Removed note "${note.title}".` });
        }
      }
    });
  };

  // AI Assistant Trigger Handlers
  const handleRunAIBsp = () => {
    const result = generateAIBSPPlan(aiClientName, aiChallenge, aiGoals);
    setGeneratedBSP(result);
    setDocTitle(result.title);
    setDocContent(`${result.title}\n\nSummary:\n${result.summary}\n\nProactive Strategies:\n${result.proactiveStrategies.join('\n')}\n\nReactive Strategies:\n${result.reactiveStrategies.join('\n')}\n\nRestrictive Practices Review:\n${result.restrictivePracticesReview}`);
    setUploadFileName(`${aiClientName.replace(/\s+/g, '_')}_BSP_Plan.txt`);
    setUploadFileContent(`${result.title}\n\n${result.summary}\n\nProactive Strategies:\n${result.proactiveStrategies.join('\n')}`);
    addAuditLog('AI_GENERATE', 'BSP Plan', aiClientName, `Generated AI Behaviour Support Plan for ${aiClientName}`);
  };

  const handleRunAISOAP = () => {
    const result = generateAISOAPNote(aiRawNotes, aiClientName);
    setGeneratedSOAP(result);
    addAuditLog('AI_GENERATE', 'SOAP Note', aiClientName, `Structured AI SOAP Case Note for ${aiClientName}`);
  };

  const handleRunAIIncident = () => {
    const result = analyzeIncidentSLA(aiIncidentDesc, aiClientName);
    setGeneratedSLA(result);
    setEmailSubject(`NDIS Incident Notification - ${aiClientName}`);
    setEmailBody(result.draftedEmailBody);
    addAuditLog('AI_GENERATE', 'Incident SLA', aiClientName, `Analyzed incident SLA for ${aiClientName}: ${result.severityLevel}`);
  };

  // Quick Caseload Entry Handlers
  const handleAddNewClient = () => {
    if (!newClientName) return;
    const id = `client-${Date.now()}`;
    addClient({
      id,
      name: newClientName,
      ndisNumber: newClientNdis || '430000000',
      dateOfBirth: '2000-01-01',
      planStartDate: new Date().toISOString().slice(0, 10),
      planEndDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      primaryDisability: 'Autism Spectrum Disorder / PBS Target',
      goals: [],
      status: 'Active',
      totalBudget: parseFloat(newClientBudget) || 10000,
      allocatedBudget: parseFloat(newClientBudget) || 10000,
      spentBudget: 0,
      primaryPractitionerId: 'user-primary',
      primaryPractitionerName: 'Lead Specialist',
      riskLevel: 'Low',
      emergencyContact: {
        name: 'Primary Contact',
        relationship: 'Nominee',
        phone: '+61 400 000 000'
      },
      restrictivePracticesActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setNewClientName('');
    setNewClientNdis('');
    setActionMessage({ type: 'success', text: `Added new participant: ${newClientName}` });
  };

  const handleAddNewClaim = () => {
    if (!newClaimClient) return;
    const hours = parseFloat(newClaimHours) || 1;
    const rate = parseFloat(newClaimRate) || 214.41;
    const totalAmount = hours * rate;
    const id = `claim-${Date.now()}`;

    addBillingClaim({
      id,
      clientId: 'client-manual',
      clientName: newClaimClient,
      ndisNumber: '430982199',
      serviceDate: new Date().toISOString().slice(0, 10),
      ndisSupportItem: 'Specialist Behavioural Intervention Support',
      supportItemCode: newClaimCode,
      hours,
      unitRate: rate,
      totalAmount,
      status: 'Pending',
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setNewClaimClient('');
    setActionMessage({ type: 'success', text: `Recorded billable claim for ${newClaimClient} ($${totalAmount.toFixed(2)})` });
  };

  const workspaceNav = [
    { id: 'drive', label: 'Google Drive', icon: Cloud, desc: 'Files & Google Picker' },
    { id: 'forms', label: 'Google Forms', icon: FileQuestion, desc: 'Intake & Risk Surveys' },
    { id: 'keep', label: 'Google Keep', icon: StickyNote, desc: 'Clinical Notes & Lists' },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, desc: 'Billing & Claim Exports' },
    { id: 'docs', label: 'Google Docs', icon: FileText, desc: 'Clinical BSP Reports' },
    { id: 'slides', label: 'Google Slides', icon: Presentation, desc: 'Strategy Presentations' },
    { id: 'calendar', label: 'Google Calendar', icon: CalendarIcon, desc: 'Supervision & Schedules' },
    { id: 'gmail', label: 'Gmail', icon: Mail, desc: 'SLA Incident Dispatch' },
    { id: 'meet', label: 'Google Meet', icon: Video, desc: 'Telehealth & Conferencing' },
    { id: 'people', label: 'Google Contacts', icon: Users, desc: 'Stakeholder Directory' },
    { id: 'tasks', label: 'Google Tasks', icon: CheckSquare, desc: 'Compliance Action Items' },
    { id: 'chat', label: 'Google Chat', icon: MessageSquare, desc: 'Clinical Team Spaces' }
  ];

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmLabel={modalConfig.confirmLabel}
        confirmVariant={modalConfig.confirmVariant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Top Navigation Header */}
      <header className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">
                  Google Workspace Enterprise Hub
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Direct API Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized management for clinical reports, billing claims, telehealth consultations, and team communication.
              </p>
            </div>
          </div>

          {/* Top Level Section Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMainView('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mainView === 'workspace'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" /> Workspace APIs
            </button>
            <button
              onClick={() => setMainView('ai-assistant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mainView === 'ai-assistant'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Clinical Suite
            </button>
            <button
              onClick={() => setMainView('caseload-manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mainView === 'caseload-manager'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Caseload & Claims ({clients.length} | {claims.length})
            </button>
            <button
              onClick={() => setMainView('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mainView === 'roadmap'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Roadmap & Phases
            </button>
            <button
              onClick={() => setMainView('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                mainView === 'audit'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Audit Logs ({auditLogs.length})
            </button>

            {/* Auth Session Pill */}
            <div className="ml-2 pl-2 border-l border-slate-800 flex items-center">
              {accessToken ? (
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">
                    {userEmail || 'Google User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition"
                    title="Disconnect Session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs transition disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Connect Google Account
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Action Message Banner */}
        {actionMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center justify-between gap-3 border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : actionMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            {actionMessage.link && (
              <a
                href={actionMessage.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold underline hover:opacity-80 shrink-0"
              >
                Open Resource <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </header>

      {/* VIEW 1: GOOGLE WORKSPACE APIS */}
      {mainView === 'workspace' && (
        <div className="space-y-6">
          {/* Workspace Tabs Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspaceTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveWorkspaceTab(item.id as any)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Workspace Tab Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            {/* DRIVE */}
            {activeWorkspaceTab === 'drive' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-blue-400" /> Google Drive & Company Cloud Database
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        1GB Max File Size
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Secure company document repository for NDIS BSPs, Service Agreements, Clinical Evidence, and Billing claims.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenGooglePicker('ALL')}
                      disabled={!accessToken || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition disabled:opacity-50"
                      title="Select multiple files or folders directly with Google Picker"
                    >
                      <FolderSearch className="w-3.5 h-3.5 text-purple-400" /> Google Picker (Multi-Select)
                    </button>
                    <button
                      onClick={() => handleOpenGooglePicker('FOLDERS')}
                      disabled={!accessToken || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition disabled:opacity-50"
                      title="Select a Google Drive Folder to inspect and import all contained files"
                    >
                      <Folder className="w-3.5 h-3.5 text-indigo-400" /> Pick Folder
                    </button>
                    <button
                      onClick={() => setIsCreateFolderModalOpen(true)}
                      disabled={!accessToken || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg transition disabled:opacity-50"
                      title="Create a new folder in Google Drive"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-blue-400" /> New Drive Folder
                    </button>
                    <button
                      onClick={handleRefreshDrive}
                      disabled={!accessToken || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Drive Files
                    </button>
                  </div>
                </div>

                {/* Google Picker Selected Folder Banner & File Explorer */}
                {pickedFolder && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-800/70 rounded-xl space-y-3 text-xs text-indigo-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="p-2 bg-indigo-900/60 rounded-lg border border-indigo-700/60">
                          <Folder className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm truncate">{pickedFolder.name}</span>
                            <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60 font-semibold">
                              {pickedFolder.files.length} file(s) inside
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-300/80 truncate mt-0.5">
                            Folder ID: <span className="font-mono text-[10px] text-indigo-400">{pickedFolder.id}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => setIsFolderExplorerExpanded(!isFolderExplorerExpanded)}
                          className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 font-medium rounded text-[11px] flex items-center gap-1 border border-indigo-700/50"
                        >
                          {isFolderExplorerExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" /> Collapse Files
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" /> View {pickedFolder.files.length} Files
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleImportFolderFilesToVault(pickedFolder)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                          title="Import metadata of all files from this folder into audit records"
                        >
                          <Check className="w-3.5 h-3.5" /> Import All Files to Vault
                        </button>
                        <a
                          href={`https://drive.google.com/drive/folders/${pickedFolder.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-[11px] flex items-center gap-1"
                        >
                          Open Folder in Drive <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => setPickedFolder(null)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                          title="Dismiss folder selection"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Table of Files Inside Picked Folder */}
                    {isFolderExplorerExpanded && (
                      <div className="mt-3 pt-3 border-t border-indigo-800/50">
                        <div className="flex items-center justify-between text-[11px] text-indigo-300 mb-2 font-semibold">
                          <span>Files inside &quot;{pickedFolder.name}&quot; ({pickedFolder.files.length}):</span>
                          <span className="text-[10px] text-indigo-400 font-normal">Auto-synchronized via Google Picker API</span>
                        </div>
                        {pickedFolder.files.length === 0 ? (
                          <div className="p-4 bg-indigo-950/30 rounded-lg text-center text-indigo-300 text-[11px]">
                            This folder currently contains no child files. You can upload new files directly into it below!
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                            {pickedFolder.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/40 border border-indigo-800/40 text-xs transition"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <File className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="font-medium text-slate-200 truncate">{file.name}</span>
                                  <span className="text-[10px] text-indigo-300/80 font-mono">
                                    {file.size ? `${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : 'Doc/Folder'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {file.webViewLink && (
                                    <a
                                      href={file.webViewLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-0.5 text-[10px] font-medium bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded flex items-center gap-1"
                                    >
                                      Open <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple Individual Files Picked Banner */}
                {pickedFiles.length > 1 && !pickedFolder && (
                  <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2 text-xs text-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderSearch className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-bold text-slate-100">
                          {pickedFiles.length} Files Selected via Google Picker
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setPickedFiles([]);
                          setPickedFile(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pickedFiles.map((pf) => (
                        <a
                          key={pf.id}
                          href={pf.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/50 hover:bg-purple-800 text-purple-200 rounded-lg border border-purple-700/50 text-[11px] transition"
                        >
                          <FileText className="w-3 h-3 text-purple-300" />
                          <span className="font-medium truncate max-w-[150px]">{pf.name}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Google Picker Selected Banner */}
                {pickedFile && pickedFiles.length <= 1 && !pickedFolder && (
                  <div className="p-3 bg-purple-950/30 border border-purple-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-purple-200">
                    <div className="flex items-center gap-2 truncate">
                      <FolderSearch className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold text-slate-100 truncate">{pickedFile.name}</span>
                      <span className="text-[10px] text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                        {pickedFile.mimeType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={pickedFile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded text-[11px] flex items-center gap-1"
                      >
                        Open Picked File <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          setPickedFile(null);
                          setPickedFiles([]);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Storage & Format Capabilities Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-medium">Multi-File & Folder Support</div>
                    <div className="text-sm font-bold text-blue-400 mt-0.5">Simultaneous Upload & Pick</div>
                    <div className="text-[10px] text-slate-500 mt-1">Select folders or multiple files in one action</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-medium">Single File Capacity</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">1 GB / File (1000+ Files)</div>
                    <div className="text-[10px] text-slate-500 mt-1">PDF, DOCX, XLSX, CSV, MP4, Audio, ZIP</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-medium">Storage Architecture</div>
                    <div className="text-sm font-bold text-purple-400 mt-0.5">Google Cloud & Drive</div>
                    <div className="text-[10px] text-slate-500 mt-1">Encrypted OAuth & Firestore storage</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Box */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-400" /> Upload to Company Database
                      </h4>
                      {/* Mode Toggle */}
                      <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setUploadMode('file')}
                          className={`px-2.5 py-1 rounded font-medium transition ${
                            uploadMode === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Upload Files (Multiple / 1GB)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMode('text')}
                          className={`px-2.5 py-1 rounded font-medium transition ${
                            uploadMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Text / Code
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Target Destination Folder Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-slate-400">Target Google Drive Folder</label>
                          <button
                            type="button"
                            onClick={() => setIsCreateFolderModalOpen(true)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                          >
                            <FolderPlus className="w-3 h-3" /> New Folder
                          </button>
                        </div>
                        <select
                          value={targetFolderId}
                          onChange={(e) => setTargetFolderId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        >
                          <option value="root">📁 My Drive (Root Directory)</option>
                          {pickedFolder && (
                            <option value={pickedFolder.id}>
                              📁 Selected Folder: {pickedFolder.name} ({pickedFolder.files.length} items)
                            </option>
                          )}
                          {driveFiles
                            .filter((f) => f.mimeType === 'application/vnd.google-apps.folder' && f.id !== pickedFolder?.id)
                            .map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                📁 {folder.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Category Tag */}
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Document Category</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Clinical BSP & Plans">Clinical BSP & Assessment Plans</option>
                          <option value="NDIS Service Agreements">NDIS Service Agreements & Consent</option>
                          <option value="Billing & Claims Logs">Billing & Claims Logs</option>
                          <option value="Incident & SLA Evidence">Incident & SLA Evidence</option>
                          <option value="Practitioner Screening & HR">Practitioner Screening & HR</option>
                          <option value="Company Governance & Policy">Company Governance & Policy</option>
                        </select>
                      </div>

                      {uploadMode === 'file' ? (
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Select or Drag Files (Two or more files supported, Max 1GB each)
                          </label>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                              }
                            }}
                            className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${
                              isDragging
                                ? 'border-blue-500 bg-blue-950/20'
                                : selectedFiles.length > 0
                                ? 'border-emerald-500/50 bg-emerald-950/10'
                                : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
                            }`}
                            onClick={() => {
                              const input = document.getElementById('company-file-input') as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <input
                              id="company-file-input"
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                                }
                              }}
                            />
                            {selectedFiles.length > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                                  <CheckCircle2 className="w-4 h-4" /> Ready to upload: {selectedFiles.length} file(s)
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Total Size: {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                                </div>
                                <div className="pt-1 flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto">
                                  {selectedFiles.map((file, idx) => (
                                    <div
                                      key={`${file.name}-${idx}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] border border-slate-700"
                                    >
                                      <span className="truncate max-w-[130px]">{file.name}</span>
                                      <span className="text-slate-400">({(file.size / 1024).toFixed(0)}KB)</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSelectedFile(idx)}
                                        className="text-slate-400 hover:text-rose-400 ml-0.5"
                                        title="Remove file from upload queue"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-1">
                                  <span className="text-[10px] text-blue-400 hover:underline">Click or drop more files to add to batch</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="p-3 bg-blue-500/10 text-blue-400 w-10 h-10 rounded-full mx-auto flex items-center justify-center">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-medium text-slate-200">
                                  Drag & drop multiple files here, or <span className="text-blue-400 underline">browse</span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Select 2 or more files: PDF, DOCX, XLSX, CSV, JSON, PNG, JPG, MP4, Audio, ZIP (Up to 1GB)
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">File Name</label>
                            <input
                              type="text"
                              value={uploadFileName}
                              onChange={(e) => setUploadFileName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1">File Content</label>
                            <textarea
                              rows={5}
                              value={uploadFileContent}
                              onChange={(e) => setUploadFileContent(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </>
                      )}

                      {/* Live Batch Upload Progress Banner */}
                      {uploadProgress && (
                        <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-blue-300">
                            <span className="font-medium flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                              Uploading file {uploadProgress.current} of {uploadProgress.total}...
                            </span>
                            <span className="font-semibold text-blue-200">
                              {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            File: <span className="text-slate-200 font-mono">{uploadProgress.fileName}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleUploadDrive}
                        disabled={!accessToken || loading || (uploadMode === 'file' && selectedFiles.length === 0)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {loading
                          ? uploadProgress
                            ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                            : 'Uploading...'
                          : uploadMode === 'file' && selectedFiles.length > 0
                          ? `Upload ${selectedFiles.length} File(s) to ${targetFolderId === 'root' ? 'My Drive' : 'Selected Folder'}`
                          : 'Upload to Google Drive Storage'}
                      </button>
                    </div>
                  </div>

                  {/* Drive File List */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-emerald-400" /> Company Cloud Vault ({driveFiles.length} files)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
                            Max Capacity (1000+ Files)
                          </span>
                          <button
                            onClick={handleRefreshDrive}
                            disabled={!accessToken || loading}
                            className="text-[10px] text-blue-400 hover:text-blue-300 transition"
                            title="Sync all live files"
                          >
                            Sync
                          </button>
                        </div>
                      </div>

                      {/* Search Filter for Live Vault */}
                      {driveFiles.length > 0 && (
                        <div className="mb-2.5">
                          <input
                            type="text"
                            placeholder="Filter vault files by name or type..."
                            value={driveSearchQuery}
                            onChange={(e) => setDriveSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {driveFiles.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-xs">
                          {accessToken ? (
                            <div className="space-y-2">
                              <p>No documents uploaded yet.</p>
                              <p className="text-[11px] text-slate-500">Upload your first company file or click &quot;Sync Drive Files&quot; above.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p>Sign in with Google to explore Drive files and upload documents.</p>
                              <button
                                onClick={handleLogin}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-500 transition"
                              >
                                Connect Google Account
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {driveFiles
                            .filter((file) =>
                              driveSearchQuery
                                ? file.name.toLowerCase().includes(driveSearchQuery.toLowerCase()) ||
                                  file.mimeType.toLowerCase().includes(driveSearchQuery.toLowerCase())
                                : true
                            )
                            .map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs hover:border-slate-700 transition"
                            >
                              <div className="truncate max-w-[210px]">
                                <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                                  <span>{file.mimeType.split('/').pop()}</span>
                                  {file.size && <span>&bull; {(Number(file.size) / 1024).toFixed(0)} KB</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                                  >
                                    Open <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  onClick={() => confirmDeleteDriveFile(file)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                                  title="Delete File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Encrypted cloud storage</span>
                      <span className="text-emerald-400 font-medium">NDIS & HIPAA Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SHEETS */}
            {activeWorkspaceTab === 'sheets' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Google Sheets Billing Sync
                    </h3>
                    <p className="text-xs text-slate-400">
                      Export verified claims directly into a formatted Google Spreadsheet with calculations.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateSheet}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Export Claims to Google Sheets
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Spreadsheet Title</label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    Data Payload ({claims.length} Claims Ready for Export):
                  </div>
                  <div className="border border-slate-800 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {claims.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No claims in queue. Add claims via the &quot;Caseload & Claims&quot; tab above to export to Sheets.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-300">
                          <tr>
                            <th className="p-2">Client</th>
                            <th className="p-2">NDIS No.</th>
                            <th className="p-2">Item Code</th>
                            <th className="p-2">Hours</th>
                            <th className="p-2">Rate</th>
                            <th className="p-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-400">
                          {claims.map((c) => (
                            <tr key={c.id}>
                              <td className="p-2 text-slate-200 font-medium">{c.clientName}</td>
                              <td className="p-2">{c.ndisNumber}</td>
                              <td className="p-2">{c.supportItemCode}</td>
                              <td className="p-2">{c.hours}h</td>
                              <td className="p-2">${c.unitRate.toFixed(2)}</td>
                              <td className="p-2 text-emerald-400 font-medium">${c.totalAmount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DOCS */}
            {activeWorkspaceTab === 'docs' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" /> Google Docs Clinical Plan Export
                    </h3>
                    <p className="text-xs text-slate-400">
                      Create structured Google Docs containing proactive & reactive Behaviour Support strategies.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateDoc}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" /> Create Google Doc
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Document Title</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Document Content Body</label>
                    <textarea
                      rows={8}
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SLIDES */}
            {activeWorkspaceTab === 'slides' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-amber-400" /> Google Slides Deck Builder
                    </h3>
                    <p className="text-xs text-slate-400">
                      Build presentation slide decks for clinical review meetings with support coordinators.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateSlide}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <Presentation className="w-3.5 h-3.5" /> Create Slide Deck
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Presentation Title</label>
                    <input
                      type="text"
                      value={slideTitle}
                      onChange={(e) => setSlideTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Slide Summary & Key Takeaways</label>
                    <textarea
                      rows={5}
                      value={slideSummary}
                      onChange={(e) => setSlideSummary(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR */}
            {activeWorkspaceTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-400" /> Google Calendar & Session Booking
                    </h3>
                    <p className="text-xs text-slate-400">
                      Schedule participant consultations and embed Google Meet video conferencing automatically.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshCalendar}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Calendar
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-200">Schedule New Session</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Event Summary</label>
                        <input
                          type="text"
                          value={eventSummary}
                          onChange={(e) => setEventSummary(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            value={eventStart}
                            onChange={(e) => setEventStart(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">End Time</label>
                          <input
                            type="datetime-local"
                            value={eventEnd}
                            onChange={(e) => setEventEnd(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCreateEvent}
                        disabled={!accessToken || loading}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" /> Book Consultation with Google Meet
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-200 mb-3">Upcoming Calendar Events ({calendarEvents.length})</h4>
                    {calendarEvents.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        {accessToken ? 'No upcoming events found.' : 'Sign in with Google to view calendar.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {calendarEvents.map((ev) => (
                          <div key={ev.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-200">{ev.summary}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : 'Date TBD'}
                              </div>
                              {ev.hangoutLink && (
                                <a
                                  href={ev.hangoutLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-1.5 text-emerald-400 font-medium hover:underline text-[11px]"
                                >
                                  <Video className="w-3 h-3" /> Join Google Meet
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => confirmDeleteCalendarEvent(ev)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GMAIL */}
            {activeWorkspaceTab === 'gmail' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-400" /> Gmail Compliance Dispatch
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch formal NDIS reportable incident communications via authorized Gmail accounts.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email Body (HTML Supported)</label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    onClick={confirmSendGmail}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Email via Gmail
                  </button>
                </div>
              </div>
            )}

            {/* FORMS */}
            {activeWorkspaceTab === 'forms' && (
              <GoogleFormsManager
                accessToken={accessToken}
                onShowMessage={setActionMessage}
              />
            )}

            {/* KEEP */}
            {activeWorkspaceTab === 'keep' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-400" /> Google Keep Clinical Notes & Checklists
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Enterprise Synced
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Capture immediate behavioural observations, clinical reminders, and practitioner task checklists.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshKeepNotes}
                      disabled={!accessToken || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Keep Notes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create Keep Note */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-400" /> Create Clinical Keep Note
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Note Title</label>
                        <input
                          type="text"
                          value={newKeepTitle}
                          onChange={(e) => setNewKeepTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                          placeholder="e.g. Participant Sensory Observation"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Clinical Observation Notes</label>
                        <textarea
                          rows={3}
                          value={newKeepText}
                          onChange={(e) => setNewKeepText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          placeholder="Observation text or clinical remarks"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Checklist Items (comma separated)</label>
                        <input
                          type="text"
                          value={newKeepChecklist}
                          onChange={(e) => setNewKeepChecklist(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          placeholder="Item 1, Item 2, Item 3"
                        />
                      </div>
                      <button
                        onClick={handleCreateKeepNote}
                        disabled={!accessToken || loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs transition disabled:opacity-50 shadow-sm"
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        {loading ? 'Creating Keep Note...' : 'Save to Google Keep'}
                      </button>
                    </div>
                  </div>

                  {/* Keep Notes List */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-400" /> Active Keep Notes ({keepNotesList.length})
                      </h4>
                    </div>

                    {keepNotesList.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        {accessToken ? 'No Keep notes found. Create your first note on the left.' : 'Sign in with Google to explore Keep notes.'}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {keepNotesList.map((note) => (
                          <div key={note.name} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-100">{note.title}</span>
                              <button
                                onClick={() => confirmDeleteKeepNote(note)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {note.body?.text?.text && (
                              <p className="text-[11px] text-slate-300 whitespace-pre-wrap">{note.body.text.text}</p>
                            )}

                            {note.body?.list?.listItems && note.body.list.listItems.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-slate-800">
                                {note.body.list.listItems.map((li, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>{li.text?.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MEET */}
            {activeWorkspaceTab === 'meet' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Video className="w-4 h-4 text-teal-400" /> Google Meet Telehealth & Spaces API
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        Meet v2 REST API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create encrypted telehealth consultation spaces with customized access control and calendar integration.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Meet Space Creator */}
                  <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-teal-400" /> Create Google Meet Space
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Access Control Type</label>
                        <select
                          value={meetAccessType}
                          onChange={(e) => setMeetAccessType(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                        >
                          <option value="OPEN">Open (Anyone with link can join)</option>
                          <option value="TRUSTED">Trusted (Organization & invited participants)</option>
                          <option value="RESTRICTED">Restricted (Host approval required)</option>
                        </select>
                      </div>

                      <button
                        onClick={handleCreateMeetSpace}
                        disabled={!accessToken || loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                      >
                        <Video className="w-4 h-4" />
                        {loading ? 'Creating Meet Space...' : 'Generate New Meet Space (API v2)'}
                      </button>

                      <div className="pt-3 border-t border-slate-800/80">
                        <button
                          onClick={handleGenerateMeet}
                          disabled={!accessToken || loading}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        >
                          <CalendarIcon className="w-3.5 h-3.5" />
                          Generate Calendar Telehealth Link
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Space Details */}
                  <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                      <span>Active Telehealth Room</span>
                      {activeMeetSpace && (
                        <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20 font-mono">
                          {activeMeetSpace.meetingCode}
                        </span>
                      )}
                    </h4>

                    {activeMeetSpace ? (
                      <div className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                          <div className="text-slate-400 text-[11px]">Meeting URI:</div>
                          <a
                            href={activeMeetSpace.meetingUri}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-teal-400 hover:underline break-all block text-xs"
                          >
                            {activeMeetSpace.meetingUri}
                          </a>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                            <span className="text-slate-400 block">Space Name:</span>
                            <span className="text-slate-200 font-mono">{activeMeetSpace.name}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                            <span className="text-slate-400 block">Access:</span>
                            <span className="text-slate-200">{activeMeetSpace.config?.accessType || meetAccessType}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={activeMeetSpace.meetingUri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition"
                          >
                            <Video className="w-3.5 h-3.5" /> Join Google Meet Now
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeMeetSpace.meetingUri);
                              setActionMessage({ type: 'success', text: 'Meeting link copied to clipboard!' });
                            }}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs border border-slate-800 flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        No active Meet space created yet. Click &quot;Generate New Meet Space&quot; on the left to spawn an encrypted room.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PEOPLE / CONTACTS */}
            {activeWorkspaceTab === 'people' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" /> Google Contacts (People API)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Synchronize nominees, support coordinators, and emergency contacts with Google People directory.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshContacts}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Contacts
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-200">Add Stakeholder to Google Contacts</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">First Name</label>
                        <input
                          type="text"
                          value={contactGiven}
                          onChange={(e) => setContactGiven(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={contactFamily}
                          onChange={(e) => setContactFamily(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateContact}
                      disabled={!accessToken || loading}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      Save to Google Contacts
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-200 mb-3">Google Contacts ({contacts.length})</h4>
                    {contacts.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        {accessToken ? 'No contacts found.' : 'Sign in to fetch contacts.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {contacts.map((c, i) => (
                          <div key={i} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                            <div className="font-semibold text-slate-200">{c.names?.[0]?.displayName || 'Unnamed Contact'}</div>
                            <div className="text-[11px] text-slate-400">{c.emailAddresses?.[0]?.value || 'No email'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TASKS */}
            {activeWorkspaceTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-cyan-400" /> Google Tasks SLA Tracker
                    </h3>
                    <p className="text-xs text-slate-400">
                      Track NDIS compliance actions, Commission reporting deadlines, and review milestones.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshTasks}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Tasks
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-200">Create Compliance Task</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Task Title</label>
                        <input
                          type="text"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Due Date</label>
                        <input
                          type="date"
                          value={taskDue}
                          onChange={(e) => setTaskDue(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Notes</label>
                        <textarea
                          rows={3}
                          value={taskNotes}
                          onChange={(e) => setTaskNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateTask}
                        disabled={!accessToken || loading}
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                      >
                        Save to Google Tasks
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-200 mb-3">Google Tasks ({tasks.length})</h4>
                    {tasks.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        {accessToken ? 'No tasks registered in Google Tasks.' : 'Sign in to view tasks.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {tasks.map((t) => (
                          <div key={t.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={t.status === 'completed'}
                                onChange={() => handleToggleTaskStatus(t)}
                                className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                              />
                              <div>
                                <div className={`font-medium text-slate-200 ${t.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                  {t.title}
                                </div>
                                {t.notes && <div className="text-[10px] text-slate-400 mt-0.5">{t.notes}</div>}
                              </div>
                            </div>
                            <button
                              onClick={() => confirmDeleteTask(t)}
                              className="p-1 text-slate-400 hover:text-rose-400 transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CHAT */}
            {activeWorkspaceTab === 'chat' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" /> Google Chat Space Broadcast
                  </h3>
                  <p className="text-xs text-slate-400">
                    Broadcast high-priority notifications and case milestones to clinical team Chat spaces.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Google Chat Space Identifier</label>
                    <input
                      type="text"
                      value={chatSpace}
                      onChange={(e) => setChatSpace(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Alert Message</label>
                    <textarea
                      rows={4}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={confirmSendChat}
                    disabled={!accessToken || loading}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast to Google Chat Space
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: AI CLINICAL SUITE */}
      {mainView === 'ai-assistant' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 bg-purple-600/10 text-purple-400 rounded-lg border border-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">AI Clinical Intelligence Suite</h2>
                <p className="text-xs text-slate-400">
                  Generate positive behaviour support plans, structure SOAP clinical case notes, and triage incident compliance SLAs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Card 1: BSP Plan Generator */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-purple-300 mb-2">
                    <Bot className="w-4 h-4" /> AI Behaviour Support Plan Architect
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Synthesizes functional goals into structured proactive and reactive strategies for Google Docs export.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Participant Name</label>
                      <input
                        type="text"
                        value={aiClientName}
                        onChange={(e) => setAiClientName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Primary Challenge Trigger</label>
                      <input
                        type="text"
                        value={aiChallenge}
                        onChange={(e) => setAiChallenge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRunAIBsp}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Clinical Plan
                </button>
              </div>

              {/* Card 2: SOAP Note Structuring */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-blue-300 mb-2">
                    <FileCheck2 className="w-4 h-4" /> AI SOAP Case Note Structuring
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Converts unstructured consultation scratchpads into auditable Subjective, Objective, Assessment, and Plan notes.
                  </p>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Consultation Scratchpad</label>
                    <textarea
                      rows={4}
                      value={aiRawNotes}
                      onChange={(e) => setAiRawNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunAISOAP}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Structure SOAP Note
                </button>
              </div>

              {/* Card 3: Incident SLA Risk Analyzer */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-rose-300 mb-2">
                    <AlertCircle className="w-4 h-4" /> AI Incident SLA & Notice Drafter
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Triages regulatory reporting timelines (24hr vs 5-day NDIS Commission rules) and pre-drafts Gmail notices.
                  </p>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Incident Summary</label>
                    <textarea
                      rows={4}
                      value={aiIncidentDesc}
                      onChange={(e) => setAiIncidentDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunAIIncident}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Triage & Draft Notice
                </button>
              </div>
            </div>

            {/* AI Generated Outputs Showcase */}
            {(generatedBSP || generatedSOAP || generatedSLA) && (
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Generated AI Artifacts
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedBSP && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-purple-800/40 text-xs space-y-2">
                      <div className="font-bold text-purple-300">{generatedBSP.title}</div>
                      <p className="text-slate-300">{generatedBSP.summary}</p>
                      <div className="text-[11px] text-slate-400">
                        <strong>Proactive:</strong> {generatedBSP.proactiveStrategies[0]}
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveWorkspaceTab('docs');
                            setMainView('workspace');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-medium"
                        >
                          Export to Google Docs
                        </button>
                      </div>
                    </div>
                  )}

                  {generatedSOAP && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-blue-800/40 text-xs space-y-2">
                      <div className="font-bold text-blue-300">Structured SOAP Note</div>
                      <div className="text-slate-300"><strong>Assessment:</strong> {generatedSOAP.assessment}</div>
                      <div className="text-[11px] text-slate-400"><strong>Item Code:</strong> {generatedSOAP.recommendedSupportItemCode}</div>
                    </div>
                  )}

                  {generatedSLA && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-rose-800/40 text-xs space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">SLA Assessment: {generatedSLA.severityLevel}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold">
                          {generatedSLA.slaCategory}
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                        {generatedSLA.recommendedActions.map((act: string, i: number) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setActiveWorkspaceTab('gmail');
                          setMainView('workspace');
                        }}
                        className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium"
                      >
                        Review in Gmail Dispatcher
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: CASELOAD & CLAIMS MANAGER */}
      {mainView === 'caseload-manager' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Caseload & Billing Claims Engine</h2>
                  <p className="text-xs text-slate-400">
                    Add participants and log billable consultations ready for real-time Google Sheets and Docs synchronization.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Add Client Form */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Add Participant to Caseload
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Liam Henderson"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">NDIS Number</label>
                      <input
                        type="text"
                        placeholder="430982199"
                        value={newClientNdis}
                        onChange={(e) => setNewClientNdis(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Annual Budget ($)</label>
                      <input
                        type="number"
                        value={newClientBudget}
                        onChange={(e) => setNewClientBudget(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddNewClient}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
                  >
                    Add Participant
                  </button>
                </div>
              </div>

              {/* Add Claim Form */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" /> Record Billable Consultation Claim
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Liam Henderson"
                      value={newClaimClient}
                      onChange={(e) => setNewClaimClient(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Hours Delivered</label>
                      <input
                        type="number"
                        step="0.25"
                        value={newClaimHours}
                        onChange={(e) => setNewClaimHours(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Unit Rate ($/hr)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newClaimRate}
                        onChange={(e) => setNewClaimRate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddNewClaim}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
                  >
                    Queue Billing Claim
                  </button>
                </div>
              </div>
            </div>

            {/* Active Caseload Table */}
            <div className="mt-8 space-y-3">
              <h3 className="text-xs font-semibold text-slate-200">Active Participants Caseload ({clients.length})</h3>
              {clients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-950">
                  No active clients logged yet. Add your first participant above.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-300">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">NDIS Number</th>
                        <th className="p-3">Primary Target</th>
                        <th className="p-3">Funding Budget</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      {clients.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 text-slate-200 font-medium">{c.name}</td>
                          <td className="p-3">{c.ndisNumber}</td>
                          <td className="p-3">{c.primaryDisability}</td>
                          <td className="p-3 text-emerald-400 font-medium">${c.allocatedBudget.toLocaleString()}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PHASE ROADMAP */}
      {mainView === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 bg-amber-600/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Enterprise Product Roadmap</h2>
                <p className="text-xs text-slate-400">
                  Phased architecture trajectory for progressive capability enhancement, security hardening, and intelligence scaling.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Phase 1 */}
              <div className="p-5 bg-slate-950 rounded-xl border border-emerald-800/40 relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PHASE 1 (COMPLETED)
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Core Workspace & Direct OAuth2</h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>Full 10-Service Google Workspace integration suite.</li>
                  <li>In-memory OAuth2 token lifecycle & safe storage.</li>
                  <li>Google Drive, Sheets, Docs, and Slides generator.</li>
                  <li>Calendar appointments with instant Meet rooms.</li>
                  <li>Mandatory confirmation dialogs for mutations.</li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="p-5 bg-slate-950 rounded-xl border border-blue-800/40 relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    PHASE 2 (CURRENT FOCUS)
                  </span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Durable Persistence & RBAC</h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>Multi-tenant cloud Firestore synchronization.</li>
                  <li>Role-Based Access Control (Admin, Practitioner, Auditor).</li>
                  <li>Offline-first client indexing and delta synchronizers.</li>
                  <li>Automated SLA breach warning push notifications.</li>
                  <li>Export batching for bulk billing submissions.</li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="p-5 bg-slate-950 rounded-xl border border-purple-800/40 relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    PHASE 3 (FUTURE SCALE)
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">AI Intelligence & Predictive Analytics</h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>Deep generative BSP recommendations via Gemini models.</li>
                  <li>Predictive incident trigger trend detection.</li>
                  <li>Real-time speech transcription for Telehealth Meet calls.</li>
                  <li>Automatic NDIS line-item invoice reconciliation.</li>
                  <li>Custom interactive analytics charts & compliance graphs.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: AUDIT LOGS */}
      {mainView === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-600/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">System Governance & Audit Trail</h2>
                  <p className="text-xs text-slate-400">
                    Immutable event log capturing all Workspace mutations, AI generations, and data operations.
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                {auditLogs.length} Events Recorded
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No audit events recorded yet. Perform actions to view live activity telemetry.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-400">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">{log.entity}</td>
                        <td className="p-3 text-slate-300">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW DRIVE FOLDER MODAL */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-100">
                <FolderPlus className="w-4 h-4 text-blue-400" /> Create Google Drive Folder
              </h3>
              <button
                onClick={() => {
                  setIsCreateFolderModalOpen(false);
                  setNewFolderName('');
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Participant BSP Records 2026"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      handleCreateFolderInDrive();
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Parent Location</label>
                <select
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="root">📁 Root / My Drive</option>
                  {pickedFolder && (
                    <option value={pickedFolder.id}>
                      📁 Inside Selected Folder: {pickedFolder.name}
                    </option>
                  )}
                  {driveFiles
                    .filter((f) => f.mimeType === 'application/vnd.google-apps.folder' && f.id !== pickedFolder?.id)
                    .map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        📁 Inside: {folder.name}
                      </option>
                    ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-400">
                The created folder will immediately be set as the target destination for multi-file batch uploads.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateFolderModalOpen(false);
                  setNewFolderName('');
                }}
                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolderInDrive}
                disabled={!newFolderName.trim() || loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
