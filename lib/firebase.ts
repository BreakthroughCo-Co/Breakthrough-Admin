import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  User,
  UserCredential
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { UserProfile, UserRole } from '@/types';
import appletConfig from '../firebase-applet-config.json';

// Comprehensive Scopes for Google Workspace Integration
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.announcements'
];

const app = getApps().length > 0 ? getApp() : initializeApp(appletConfig);
export const auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Configure robust session persistence for browser environments
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Auth persistence fallback:', err);
    });
  });
}

function getFirestoreInstance(): Firestore {
  const databaseId = (appletConfig as any).firestoreDatabaseId;
  if (typeof window === 'undefined') {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
  try {
    const cacheSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };
    return databaseId
      ? initializeFirestore(app, cacheSettings, databaseId)
      : initializeFirestore(app, cacheSettings);
  } catch {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

export const db: Firestore = getFirestoreInstance();

// Test Firestore Connection
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline or unreachable.');
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Lightweight base provider for standard authentication
const baseProvider = new GoogleAuthProvider();
baseProvider.addScope('profile');
baseProvider.addScope('email');
baseProvider.addScope('openid');

// Microsoft 365 / Entra ID OAuth Provider
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('openid');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('User.Read');
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common'
});

// In-memory token storage (MANDATORY: Never store access token in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, baseProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signInWithMicrosoft = async (): Promise<{ user: User; accessToken: string | null }> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, microsoftProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error signing in with Microsoft:', error);
    throw error;
  }
};

export const requestWorkspaceScopes = async (
  scopes: string[] = WORKSPACE_SCOPES
): Promise<{ user: User; accessToken: string | null }> => {
  try {
    const scopeProvider = new GoogleAuthProvider();
    scopes.forEach((scope) => {
      scopeProvider.addScope(scope);
    });
    scopeProvider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });
    const result: UserCredential = await signInWithPopup(auth, scopeProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error requesting Google Workspace scopes:', error);
    throw error;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const logOutGoogle = async (): Promise<void> => {
  cachedAccessToken = null;
  await signOut(auth);
};

export const onAuthUserChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error: any) {
    console.error('Error in signInWithEmail:', error);
    throw error;
  }
}

/**
 * Register a new user with email, password, displayName and role, and initialize Firestore user profile
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'PRACTITIONER'
): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;
    if (displayName && user) {
      try {
        await updateProfile(user, { displayName });
      } catch (profErr) {
        console.warn('Could not update Auth displayName:', profErr);
      }
    }

    const profile: UserProfile = {
      id: user.uid,
      uid: user.uid,
      name: displayName || email.split('@')[0] || 'NDIS Specialist',
      displayName: displayName || undefined,
      email: user.email || email.trim(),
      role: role,
      position:
        role === 'ADMIN'
          ? 'Clinical Director'
          : role === 'SUPPORT_COORDINATOR'
          ? 'Support Coordinator'
          : role === 'VIEWER'
          ? 'Auditor / Viewer'
          : 'Behaviour Support Practitioner',
      practitionerId: `prac-${user.uid.slice(-4)}`,
      workerScreeningStatus: 'Active',
      workerScreeningExpiry: '2028-12-31',
      policeCheckExpiry: '2027-12-31',
      ndisOrientationDone: true,
      activeCaseload: 0,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
    } catch (saveErr) {
      console.warn('Could not persist new user profile to Firestore:', saveErr);
    }

    return { user, profile };
  } catch (error: any) {
    console.error('Error in signUpWithEmail:', error);
    throw error;
  }
}

/**
 * Trigger password reset email via Firebase Auth
 */
export async function resetUserPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error('Error in resetUserPassword:', error);
    throw error;
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  browserLocalPersistence,
  getStorage
};

