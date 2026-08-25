'use client';

import { KeepNoteItem } from '@/types';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const DB_NAME = 'BreakthroughKeepDB_v2';
const DB_VERSION = 1;
const NOTES_STORE = 'keep_notes';
const QUEUE_STORE = 'offline_queue';
const META_STORE = 'sync_meta';

const KEEP_LOCAL_STORAGE_KEY = 'breakthrough_keep_notes_cache_v2';
const KEEP_OFFLINE_QUEUE_KEY = 'breakthrough_keep_offline_queue_v2';
const KEEP_LAST_SYNC_KEY = 'breakthrough_keep_last_sync_time';

export interface KeepOfflineMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_UPDATE';
  noteId: string;
  payload?: Partial<KeepNoteItem>;
  timestamp: string;
  retryCount: number;
}

export interface KeepSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError?: string | null;
}

export interface IndexedDBStats {
  noteCount: number;
  notesCount: number;
  queuedCount: number;
  lastSyncTime: string | null;
  isIndexedDBSupported: boolean;
}

/**
 * Open or initialize the IndexedDB database instance.
 */
export function openKeepDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object Store: Notes
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        notesStore.createIndex('category', 'category', { unique: false });
        notesStore.createIndex('clientId', 'clientId', { unique: false });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        notesStore.createIndex('isPinned', 'isPinned', { unique: false });
      }

      // Object Store: Offline Mutation Queue
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
      }

      // Object Store: Metadata
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Retrieve all notes from IndexedDB with fallback to localStorage.
 */
export async function getAllNotesFromIndexedDB(): Promise<KeepNoteItem[]> {
  try {
    const db = await openKeepDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(NOTES_STORE, 'readonly');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as KeepNoteItem[];
        if (result && result.length > 0) {
          // Keep localStorage in sync as backup
          setLocalCachedNotes(result);
          resolve(result);
        } else {
          // Fallback to localStorage
          resolve(getLocalCachedNotes());
        }
      };

      request.onerror = () => {
        resolve(getLocalCachedNotes());
      };
    });
  } catch {
    return getLocalCachedNotes();
  }
}

/**
 * Persist a single note into IndexedDB.
 */
export async function saveNoteToIndexedDB(note: KeepNoteItem): Promise<void> {
  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.put(note);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write error for note:', err);
  }
}

/**
 * Bulk persist an array of Keep notes into IndexedDB.
 */
export async function saveAllNotesToIndexedDB(notes: KeepNoteItem[]): Promise<void> {
  setLocalCachedNotes(notes);
  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);

      notes.forEach((note) => {
        store.put(note);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('IndexedDB bulk write error:', err);
  }
}

/**
 * Delete a note from IndexedDB.
 */
export async function deleteNoteFromIndexedDB(noteId: string): Promise<void> {
  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE, 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      const request = store.delete(noteId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

/**
 * Queue an offline mutation into IndexedDB.
 */
export async function enqueueIndexedDBMutation(
  mutation: Omit<KeepOfflineMutation, 'id' | 'timestamp' | 'retryCount'>
): Promise<KeepOfflineMutation> {
  const newMutation: KeepOfflineMutation = {
    ...mutation,
    id: `mut-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };

  // Sync to localStorage backup
  enqueueOfflineMutation(mutation);

  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.put(newMutation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB enqueue error:', err);
  }

  return newMutation;
}

/**
 * Get all queued offline mutations from IndexedDB.
 */
export async function getPendingIndexedDBMutations(): Promise<KeepOfflineMutation[]> {
  try {
    const db = await openKeepDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as KeepOfflineMutation[];
        resolve(result || getOfflineMutationQueue());
      };

      request.onerror = () => {
        resolve(getOfflineMutationQueue());
      };
    });
  } catch {
    return getOfflineMutationQueue();
  }
}

/**
 * Remove a specific mutation from IndexedDB queue.
 */
export async function removeIndexedDBMutation(mutationId: string): Promise<void> {
  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.delete(mutationId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB remove mutation error:', err);
  }
}

/**
 * Clear the entire IndexedDB offline queue.
 */
export async function clearIndexedDBQueue(): Promise<void> {
  setOfflineMutationQueue([]);
  try {
    const db = await openKeepDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUEUE_STORE, 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear queue error:', err);
  }
}

/**
 * Retrieve diagnostic stats for IndexedDB local storage.
 */
export async function getIndexedDBStorageStats(): Promise<IndexedDBStats> {
  const isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
  const lastSync = typeof window !== 'undefined' ? localStorage.getItem(KEEP_LAST_SYNC_KEY) : null;

  if (!isSupported) {
    const count = getLocalCachedNotes().length;
    return {
      noteCount: count,
      notesCount: count,
      queuedCount: getOfflineMutationQueue().length,
      lastSyncTime: lastSync,
      isIndexedDBSupported: false
    };
  }

  try {
    const db = await openKeepDatabase();
    const [noteCount, queuedCount] = await Promise.all([
      new Promise<number>((resolve) => {
        const tx = db.transaction(NOTES_STORE, 'readonly');
        const req = tx.objectStore(NOTES_STORE).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(getLocalCachedNotes().length);
      }),
      new Promise<number>((resolve) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const req = tx.objectStore(QUEUE_STORE).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(getOfflineMutationQueue().length);
      })
    ]);

    return {
      noteCount,
      notesCount: noteCount,
      queuedCount,
      lastSyncTime: lastSync,
      isIndexedDBSupported: true
    };
  } catch {
    const fallbackCount = getLocalCachedNotes().length;
    return {
      noteCount: fallbackCount,
      notesCount: fallbackCount,
      queuedCount: getOfflineMutationQueue().length,
      lastSyncTime: lastSync,
      isIndexedDBSupported: true
    };
  }
}

/**
 * Reads locally cached Keep notes from localStorage (Synchronous fallback).
 */
export function getLocalCachedNotes(): KeepNoteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEEP_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse local Keep cache:', err);
    return [];
  }
}

/**
 * Saves Keep notes array to localStorage cache.
 */
export function setLocalCachedNotes(notes: KeepNoteItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEEP_LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Failed to write to local Keep cache:', err);
  }
}

/**
 * Gets queued mutations from localStorage backup.
 */
export function getOfflineMutationQueue(): KeepOfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEEP_OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to get offline mutation queue:', err);
    return [];
  }
}

/**
 * Saves offline mutation queue to localStorage.
 */
export function setOfflineMutationQueue(queue: KeepOfflineMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEEP_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to save offline mutation queue:', err);
  }
}

/**
 * Adds an offline mutation to localStorage backup.
 */
export function enqueueOfflineMutation(mutation: Omit<KeepOfflineMutation, 'id' | 'timestamp' | 'retryCount'>): void {
  const queue = getOfflineMutationQueue();
  const newMutation: KeepOfflineMutation = {
    ...mutation,
    id: `mut-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  queue.push(newMutation);
  setOfflineMutationQueue(queue);
}

/**
 * Flushes all pending offline mutations from IndexedDB and localStorage to Firestore when online.
 */
export async function flushOfflineKeepQueue(userId: string): Promise<{ syncedCount: number; errors: number }> {
  if (!userId || !navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }

  const queue = await getPendingIndexedDBMutations();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: KeepOfflineMutation[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'CREATE' || item.type === 'UPDATE') {
        if (item.payload) {
          await setDoc(
            doc(db, 'users', userId, 'keepNotes', item.noteId),
            { ...item.payload, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }
        syncedCount++;
        await removeIndexedDBMutation(item.id);
      } else if (item.type === 'DELETE') {
        await deleteDoc(doc(db, 'users', userId, 'keepNotes', item.noteId));
        syncedCount++;
        await removeIndexedDBMutation(item.id);
      }
    } catch (err) {
      console.warn(`Error syncing offline mutation ${item.id}:`, err);
      errors++;
      if (item.retryCount < 5) {
        remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
      } else {
        await removeIndexedDBMutation(item.id);
      }
    }
  }

  setOfflineMutationQueue(remainingQueue);
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEEP_LAST_SYNC_KEY, new Date().toISOString());
  }

  return { syncedCount, errors };
}

/**
 * Register Service Worker for offline field visit support.
 */
export function registerKeepServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for service worker updates
          if (reg.update) {
            reg.update().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Keep Service Worker registration failed:', err);
        });
    };

    if (document.readyState === 'complete') {
      doRegister();
    } else {
      window.addEventListener('load', doRegister);
    }
  }
}

/**
 * Helper to extract client references like #CID-101, CID-101, #cli-101, #430891245.
 */
export const CLIENT_ID_REGEX = /(#(?:CID-|cli-|client-)?[a-zA-Z0-9_-]+|\bCID-[0-9]{3,6}\b)/gi;

export function extractClientReferences(text: string): string[] {
  if (!text) return [];
  const matches = text.match(CLIENT_ID_REGEX) || [];
  return Array.from(new Set(matches));
}

