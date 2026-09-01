import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  DocumentData,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Client,
  CaseNote,
  BillingClaim,
  Incident,
  RestrictivePractice,
  ABCLog,
  BSPDocument,
  Lead,
  CRMTask,
  Practitioner,
  NDISSupportItem,
  AuditLog,
  ScheduledShift,
  UserProfile,
  KeepNoteItem,
  AppNotification
} from '@/types';

// ==========================================
// Generic CRUD & Subscription Helpers
// ==========================================

export async function fetchCollection<T>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : query(colRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as unknown as T));
  } catch (error: any) {
    if (
      error?.message?.includes('client is offline') ||
      error?.code === 'unavailable' ||
      error?.code === 'failed-precondition'
    ) {
      console.warn(`[Firestore] Collection ${collectionName} offline/unavailable, operating with local state.`);
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as unknown as T;
  } catch (error: any) {
    if (
      error?.message?.includes('client is offline') ||
      error?.code === 'unavailable' ||
      error?.code === 'not-found' ||
      error?.code === 'failed-precondition'
    ) {
      console.warn(`[Firestore] Document ${collectionName}/${id} offline/unavailable, operating with local state.`);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
  }
}

export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  id?: string
): Promise<string> {
  const docId = id || data.id || `${collectionName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullData = { ...data, id: docId };
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, fullData, { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${collectionName}/${docId}`);
  }
}

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as DocumentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  onError?: (err: Error) => void,
  queryConstraints: QueryConstraint[] = []
): Unsubscribe {
  try {
    const colRef = collection(db, collectionName);
    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : query(colRef);
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as unknown as T));
        onUpdate(items);
      },
      (error) => {
        console.warn(`Firestore subscription error on collection ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (error: any) {
    console.error(`Failed to subscribe to ${collectionName}:`, error);
    if (onError) onError(error);
    return () => {};
  }
}

export async function batchWriteDocuments<T extends { id: string }>(
  collectionName: string,
  documents: T[]
): Promise<void> {
  if (!documents || documents.length === 0) return;
  try {
    // Firestore batches are limited to 500 operations
    const CHUNK_SIZE = 450;
    for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
      const chunk = documents.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

// ==========================================
// 1. Clients (`clients`)
// ==========================================
export const fetchClients = (): Promise<Client[]> => fetchCollection<Client>('clients');
export const subscribeToClients = (cb: (data: Client[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<Client>('clients', cb, errCb);
export const createClient = (client: Client | Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const id = (client as Client).id || `cli-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const docData: Client = {
    id,
    createdAt: (client as Client).createdAt || now,
    updatedAt: (client as Client).updatedAt || now,
    ...client
  } as Client;
  return createDocument('clients', docData, id);
};
export const updateClient = (id: string, updates: Partial<Client>): Promise<void> =>
  updateDocument('clients', id, { ...updates, updatedAt: new Date().toISOString() });
export const deleteClient = (id: string): Promise<void> => deleteDocument('clients', id);

// ==========================================
// 2. Case Notes (`caseNotes`)
// ==========================================
export const fetchCaseNotes = (): Promise<CaseNote[]> => fetchCollection<CaseNote>('caseNotes');
export const subscribeToCaseNotes = (cb: (data: CaseNote[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<CaseNote>('caseNotes', cb, errCb);
export const createCaseNote = (note: CaseNote | Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const id = (note as CaseNote).id || `note-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const docData: CaseNote = {
    id,
    createdAt: (note as CaseNote).createdAt || now,
    updatedAt: (note as CaseNote).updatedAt || now,
    ...note
  } as CaseNote;
  return createDocument('caseNotes', docData, id);
};
export const updateCaseNote = (id: string, updates: Partial<CaseNote>): Promise<void> =>
  updateDocument('caseNotes', id, { ...updates, updatedAt: new Date().toISOString() });
export const deleteCaseNote = (id: string): Promise<void> => deleteDocument('caseNotes', id);

// ==========================================
// 3. Billing Claims (`billingClaims`)
// ==========================================
export const fetchBillingClaims = (): Promise<BillingClaim[]> => fetchCollection<BillingClaim>('billingClaims');
export const subscribeToBillingClaims = (cb: (data: BillingClaim[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<BillingClaim>('billingClaims', cb, errCb);
export const createBillingClaim = (claim: BillingClaim | Omit<BillingClaim, 'id' | 'invoiceNumber'>): Promise<string> => {
  const id = (claim as BillingClaim).id || `claim-${Date.now().toString().slice(-4)}`;
  const invoiceNumber =
    (claim as BillingClaim).invoiceNumber || `INV-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const docData: BillingClaim = {
    id,
    invoiceNumber,
    ...claim
  } as BillingClaim;
  return createDocument('billingClaims', docData, id);
};
export const updateBillingClaim = (id: string, updates: Partial<BillingClaim>): Promise<void> =>
  updateDocument('billingClaims', id, updates);
export const deleteBillingClaim = (id: string): Promise<void> => deleteDocument('billingClaims', id);

// ==========================================
// 4. Incidents (`incidents`)
// ==========================================
export const fetchIncidents = (): Promise<Incident[]> => fetchCollection<Incident>('incidents');
export const subscribeToIncidents = (cb: (data: Incident[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<Incident>('incidents', cb, errCb);
export const createIncident = (incident: Incident | Omit<Incident, 'id' | 'createdAt'>): Promise<string> => {
  const id = (incident as Incident).id || `inc-${Date.now().toString().slice(-4)}`;
  const docData: Incident = {
    id,
    createdAt: (incident as Incident).createdAt || new Date().toISOString(),
    ...incident
  } as Incident;
  return createDocument('incidents', docData, id);
};
export const updateIncident = (id: string, updates: Partial<Incident>): Promise<void> =>
  updateDocument('incidents', id, updates);
export const deleteIncident = (id: string): Promise<void> => deleteDocument('incidents', id);

// ==========================================
// 5. Restrictive Practices (`restrictivePractices`)
// ==========================================
export const fetchRestrictivePractices = (): Promise<RestrictivePractice[]> =>
  fetchCollection<RestrictivePractice>('restrictivePractices');
export const subscribeToRestrictivePractices = (
  cb: (data: RestrictivePractice[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<RestrictivePractice>('restrictivePractices', cb, errCb);
export const createRestrictivePractice = (
  practice: RestrictivePractice | Omit<RestrictivePractice, 'id'>
): Promise<string> => {
  const id = (practice as RestrictivePractice).id || `rp-${Date.now().toString().slice(-4)}`;
  const docData: RestrictivePractice = {
    id,
    ...practice
  } as RestrictivePractice;
  return createDocument('restrictivePractices', docData, id);
};
export const updateRestrictivePractice = (id: string, updates: Partial<RestrictivePractice>): Promise<void> =>
  updateDocument('restrictivePractices', id, updates);
export const deleteRestrictivePractice = (id: string): Promise<void> =>
  deleteDocument('restrictivePractices', id);

// ==========================================
// 6. ABC Behaviour Logs (`abcLogs`)
// ==========================================
export const fetchABCLogs = (): Promise<ABCLog[]> => fetchCollection<ABCLog>('abcLogs');
export const subscribeToABCLogs = (cb: (data: ABCLog[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<ABCLog>('abcLogs', cb, errCb);
export const createABCLog = (log: ABCLog | Omit<ABCLog, 'id'>): Promise<string> => {
  const id = (log as ABCLog).id || `abc-${Date.now().toString().slice(-4)}`;
  const docData: ABCLog = {
    id,
    ...log
  } as ABCLog;
  return createDocument('abcLogs', docData, id);
};
export const updateABCLog = (id: string, updates: Partial<ABCLog>): Promise<void> =>
  updateDocument('abcLogs', id, updates);
export const deleteABCLog = (id: string): Promise<void> => deleteDocument('abcLogs', id);

// ==========================================
// 7. Behaviour Support Plans (`bspDocuments`)
// ==========================================
export const fetchBSPDocuments = (): Promise<BSPDocument[]> => fetchCollection<BSPDocument>('bspDocuments');
export const subscribeToBSPDocuments = (
  cb: (data: BSPDocument[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<BSPDocument>('bspDocuments', cb, errCb);
export const createBSPDocument = (
  bsp: BSPDocument | Omit<BSPDocument, 'id' | 'lastUpdated'>
): Promise<string> => {
  const id = (bsp as BSPDocument).id || `bsp-${Date.now().toString().slice(-4)}`;
  const docData: BSPDocument = {
    id,
    lastUpdated: (bsp as BSPDocument).lastUpdated || new Date().toISOString(),
    ...bsp
  } as BSPDocument;
  return createDocument('bspDocuments', docData, id);
};
export const updateBSPDocument = (id: string, updates: Partial<BSPDocument>): Promise<void> =>
  updateDocument('bspDocuments', id, { ...updates, lastUpdated: new Date().toISOString() });
export const deleteBSPDocument = (id: string): Promise<void> => deleteDocument('bspDocuments', id);

// ==========================================
// 8. CRM Leads (`crmLeads` / `leads`)
// ==========================================
export const fetchCRMLeads = (): Promise<Lead[]> => fetchCollection<Lead>('crmLeads');
export const fetchLeads = fetchCRMLeads;
export const subscribeToCRMLeads = (cb: (data: Lead[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<Lead>('crmLeads', cb, errCb);
export const subscribeToLeads = subscribeToCRMLeads;
export const createCRMLead = (lead: Lead | Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const id = (lead as Lead).id || `lead-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const docData: Lead = {
    id,
    createdAt: (lead as Lead).createdAt || now,
    updatedAt: (lead as Lead).updatedAt || now,
    ...lead
  } as Lead;
  return createDocument('crmLeads', docData, id);
};
export const createLead = createCRMLead;
export const updateCRMLead = (id: string, updates: Partial<Lead>): Promise<void> =>
  updateDocument('crmLeads', id, { ...updates, updatedAt: new Date().toISOString() });
export const updateLead = updateCRMLead;
export const deleteCRMLead = (id: string): Promise<void> => deleteDocument('crmLeads', id);
export const deleteLead = deleteCRMLead;

// ==========================================
// 9. CRM Tasks (`crmTasks`)
// ==========================================
export const fetchCRMTasks = (): Promise<CRMTask[]> => fetchCollection<CRMTask>('crmTasks');
export const subscribeToCRMTasks = (cb: (data: CRMTask[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<CRMTask>('crmTasks', cb, errCb);
export const createCRMTask = (task: CRMTask | Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const id = (task as CRMTask).id || `task-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const docData: CRMTask = Object.assign(
    {
      status: 'Pending' as const,
      priority: 'Medium' as const,
      category: 'General' as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: auth.currentUser?.displayName || 'Unassigned',
      createdAt: now,
      updatedAt: now
    },
    task,
    { id }
  );
  return createDocument('crmTasks', docData, id);
};
export const updateCRMTask = (id: string, updates: Partial<CRMTask>): Promise<void> =>
  updateDocument('crmTasks', id, { ...updates, updatedAt: new Date().toISOString() });
export const deleteCRMTask = (id: string): Promise<void> => deleteDocument('crmTasks', id);

// ==========================================
// 10. HR Practitioners (`practitioners`)
// ==========================================
export const fetchPractitioners = (): Promise<Practitioner[]> => fetchCollection<Practitioner>('practitioners');
export const subscribeToPractitioners = (
  cb: (data: Practitioner[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<Practitioner>('practitioners', cb, errCb);
export const createPractitioner = (practitioner: Practitioner): Promise<string> =>
  createDocument('practitioners', practitioner, practitioner.id);
export const updatePractitioner = (id: string, updates: Partial<Practitioner>): Promise<void> =>
  updateDocument('practitioners', id, updates);
export const deletePractitioner = (id: string): Promise<void> => deleteDocument('practitioners', id);

// ==========================================
// 11. Support Items / Price Guide (`supportItems`)
// ==========================================
export const fetchSupportItems = (): Promise<NDISSupportItem[]> =>
  fetchCollection<NDISSupportItem>('supportItems');
export const subscribeToSupportItems = (
  cb: (data: NDISSupportItem[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<NDISSupportItem>('supportItems', cb, errCb);
export const createSupportItem = (item: NDISSupportItem): Promise<string> =>
  createDocument('supportItems', item, item.code);
export const updateSupportItem = (code: string, updates: Partial<NDISSupportItem>): Promise<void> =>
  updateDocument('supportItems', code, updates);

// ==========================================
// 12. Audit Logs (`auditLogs`)
// ==========================================
export const fetchAuditLogs = (limitCount: number = 100): Promise<AuditLog[]> =>
  fetchCollection<AuditLog>('auditLogs', [orderBy('timestamp', 'desc'), limit(limitCount)]);
export const subscribeToAuditLogs = (
  cb: (data: AuditLog[]) => void,
  errCb?: (err: Error) => void,
  limitCount: number = 100
): Unsubscribe =>
  subscribeToCollection<AuditLog>('auditLogs', cb, errCb, [orderBy('timestamp', 'desc'), limit(limitCount)]);
export const createAuditLog = (log: AuditLog): Promise<string> =>
  createDocument('auditLogs', log, log.id);

// ==========================================
// 13. Scheduled Shifts (`scheduledShifts`)
// ==========================================
export const fetchScheduledShifts = (): Promise<ScheduledShift[]> =>
  fetchCollection<ScheduledShift>('scheduledShifts');
export const subscribeToScheduledShifts = (
  cb: (data: ScheduledShift[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<ScheduledShift>('scheduledShifts', cb, errCb);
export const createScheduledShift = (
  shift: ScheduledShift | Omit<ScheduledShift, 'id'>
): Promise<string> => {
  const id = (shift as ScheduledShift).id || `shift-${Date.now().toString().slice(-4)}`;
  const docData: ScheduledShift = { id, ...shift } as ScheduledShift;
  return createDocument('scheduledShifts', docData, id);
};
export const updateScheduledShift = (id: string, updates: Partial<ScheduledShift>): Promise<void> =>
  updateDocument('scheduledShifts', id, updates);
export const deleteScheduledShift = (id: string): Promise<void> => deleteDocument('scheduledShifts', id);

// ==========================================
// 14. User Profiles (`users`)
// ==========================================
export const fetchUsers = (): Promise<UserProfile[]> => fetchCollection<UserProfile>('users');
export const subscribeToUsers = (cb: (data: UserProfile[]) => void, errCb?: (err: Error) => void): Unsubscribe =>
  subscribeToCollection<UserProfile>('users', cb, errCb);
export const getUserProfile = (userId: string): Promise<UserProfile | null> =>
  getDocument<UserProfile>('users', userId);
export const saveUserProfile = (user: UserProfile): Promise<string> => {
  const now = new Date().toISOString();
  const docData: UserProfile = {
    ...user,
    createdAt: user.createdAt || now,
    updatedAt: now
  };
  return createDocument('users', docData, user.id);
};
export const updateUserProfile = (userId: string, updates: Partial<UserProfile>): Promise<void> =>
  updateDocument('users', userId, { ...updates, updatedAt: new Date().toISOString() });

// ==========================================
// 15. User Keep Notes (`users/{userId}/keepNotes`)
// ==========================================
export const fetchUserKeepNotes = async (userId: string): Promise<KeepNoteItem[]> => {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'keepNotes');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as KeepNoteItem));
  } catch (error: any) {
    if (
      error?.message?.includes('client is offline') ||
      error?.code === 'unavailable' ||
      error?.code === 'failed-precondition'
    ) {
      console.warn(`[Firestore] Keep notes for ${userId} offline, using local cache.`);
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/keepNotes`);
  }
};

export const subscribeToUserKeepNotes = (
  userId: string,
  cb: (data: KeepNoteItem[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => {
  if (!userId) return () => {};
  try {
    const colRef = collection(db, 'users', userId, 'keepNotes');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as KeepNoteItem));
        cb(items);
      },
      (error) => {
        console.warn(`Error subscribing to keepNotes for user ${userId}:`, error);
        if (errCb) errCb(error);
      }
    );
  } catch (error: any) {
    console.error(`Failed to subscribe to keepNotes for user ${userId}:`, error);
    if (errCb) errCb(error);
    return () => {};
  }
};

export const createUserKeepNote = async (
  userId: string,
  note: KeepNoteItem | Omit<KeepNoteItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const noteId = (note as KeepNoteItem).id || `keep-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const docData: KeepNoteItem = {
    ...note,
    id: noteId,
    userId,
    createdAt: (note as KeepNoteItem).createdAt || now,
    updatedAt: (note as KeepNoteItem).updatedAt || now
  } as KeepNoteItem;
  try {
    const docRef = doc(db, 'users', userId, 'keepNotes', noteId);
    await setDoc(docRef, docData, { merge: true });
    return noteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/keepNotes/${noteId}`);
  }
};

export const updateUserKeepNote = async (
  userId: string,
  noteId: string,
  updates: Partial<KeepNoteItem>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'keepNotes', noteId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() } as DocumentData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/keepNotes/${noteId}`);
  }
};

export const deleteUserKeepNote = async (userId: string, noteId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'keepNotes', noteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/keepNotes/${noteId}`);
  }
};

// ==========================================
// App Notifications (`notifications`)
// ==========================================
export const fetchNotifications = (): Promise<AppNotification[]> =>
  fetchCollection<AppNotification>('notifications');
export const subscribeToNotifications = (
  cb: (data: AppNotification[]) => void,
  errCb?: (err: Error) => void
): Unsubscribe => subscribeToCollection<AppNotification>('notifications', cb, errCb);
export const createNotification = (notif: AppNotification): Promise<string> =>
  createDocument('notifications', notif, notif.id);
export const updateNotification = (id: string, updates: Partial<AppNotification>): Promise<void> =>
  updateDocument('notifications', id, updates);
export const deleteNotification = (id: string): Promise<void> => deleteDocument('notifications', id);

// ==========================================
// Comprehensive Seed Engine
// ==========================================
export interface SeedDataset {
  users?: UserProfile[];
  clients?: Client[];
  caseNotes?: CaseNote[];
  billingClaims?: BillingClaim[];
  incidents?: Incident[];
  restrictivePractices?: RestrictivePractice[];
  abcLogs?: ABCLog[];
  bspDocuments?: BSPDocument[];
  leads?: Lead[];
  crmTasks?: CRMTask[];
  practitioners?: Practitioner[];
  supportItems?: NDISSupportItem[];
  auditLogs?: AuditLog[];
  scheduledShifts?: ScheduledShift[];
  notifications?: AppNotification[];
}

export async function seedInitialFirestoreDataIfEmpty(seedData: SeedDataset): Promise<{
  seededCollections: string[];
  skippedCollections: string[];
}> {
  const seededCollections: string[] = [];
  const skippedCollections: string[] = [];

  const checkAndSeed = async <T extends { id?: string; code?: string }>(
    colName: string,
    items?: T[]
  ) => {
    if (!items || items.length === 0) return;
    try {
      const existing = await fetchCollection<T>(colName);
      if (existing.length === 0) {
        const batch = writeBatch(db);
        for (const item of items) {
          const docId = (item as any).id || (item as any).code || `${colName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const docRef = doc(db, colName, docId);
          batch.set(docRef, { ...item, id: docId }, { merge: true });
        }
        await batch.commit();
        seededCollections.push(colName);
      } else {
        skippedCollections.push(colName);
      }
    } catch (err) {
      console.warn(`Could not seed collection ${colName}:`, err);
      skippedCollections.push(colName);
    }
  };

  await checkAndSeed('users', seedData.users);
  await checkAndSeed('clients', seedData.clients);
  await checkAndSeed('caseNotes', seedData.caseNotes);
  await checkAndSeed('billingClaims', seedData.billingClaims);
  await checkAndSeed('incidents', seedData.incidents);
  await checkAndSeed('restrictivePractices', seedData.restrictivePractices);
  await checkAndSeed('abcLogs', seedData.abcLogs);
  await checkAndSeed('bspDocuments', seedData.bspDocuments);
  await checkAndSeed('crmLeads', seedData.leads);
  await checkAndSeed('crmTasks', seedData.crmTasks);
  await checkAndSeed('practitioners', seedData.practitioners);
  await checkAndSeed('supportItems', seedData.supportItems);
  await checkAndSeed('auditLogs', seedData.auditLogs);
  await checkAndSeed('scheduledShifts', seedData.scheduledShifts);
  await checkAndSeed('notifications', seedData.notifications);

  return { seededCollections, skippedCollections };
}
