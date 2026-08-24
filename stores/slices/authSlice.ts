import { StateCreator } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, UserRole } from '@/types';
import { logOutGoogle } from '@/lib/firebase';
import { getUserProfile, saveUserProfile } from '@/lib/firestoreService';
import { INITIAL_USERS } from '@/lib/seedData';
import { AuthSlice, RootStore } from '../types';

export const createAuthSlice: StateCreator<RootStore, [], [], AuthSlice> = (set, get) => ({
  currentUser: INITIAL_USERS[0],
  users: INITIAL_USERS,
  isAuthenticated: false,
  authLoading: true,

  setUserProfile: (profile: UserProfile | null) => {
    if (profile) {
      set({ currentUser: profile, isAuthenticated: true, authLoading: false });
      get().addAuditLog(
        'SET_PROFILE',
        'UserProfile',
        profile.id,
        `User session profile updated: ${profile.name} (${profile.role})`
      );
    } else {
      set({ currentUser: INITIAL_USERS[0], isAuthenticated: false, authLoading: false });
    }
  },

  signOutUser: async () => {
    try {
      await logOutGoogle();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    const currentId = get().currentUser?.id || 'unknown';
    set({
      currentUser: INITIAL_USERS[0],
      isAuthenticated: false,
      authLoading: false
    });
    get().addAuditLog('LOGOUT', 'UserProfile', currentId, 'User signed out from Breakthrough OS');
  },

  handleAuthUser: async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      set({ isAuthenticated: false, authLoading: false });
      return null;
    }
    set({ authLoading: true });
    try {
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        // Auto-bootstrap profile on first sign-in
        const isDirectorOrAdmin =
          (firebaseUser.email && (firebaseUser.email.includes('admin') || firebaseUser.email.includes('director'))) ?? false;
        const role: UserRole = isDirectorOrAdmin ? 'ADMIN' : 'PRACTITIONER';

        profile = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NDIS Specialist',
          displayName: firebaseUser.displayName || undefined,
          email: firebaseUser.email || '',
          role: role,
          photoURL: firebaseUser.photoURL || undefined,
          avatarUrl: firebaseUser.photoURL || undefined,
          position: isDirectorOrAdmin ? 'Clinical Director' : 'Behaviour Support Practitioner',
          practitionerId: `prac-${firebaseUser.uid.slice(-4)}`,
          workerScreeningStatus: 'Active',
          workerScreeningExpiry: '2028-12-31',
          policeCheckExpiry: '2027-12-31',
          ndisOrientationDone: true,
          activeCaseload: 0,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveUserProfile(profile).catch((err) =>
          console.warn('Could not persist new user profile to Firestore:', err)
        );
      }
      set({ currentUser: profile, isAuthenticated: true, authLoading: false });
      return profile;
    } catch (err) {
      console.error('handleAuthUser error:', err);
      const fallback: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NDIS Specialist',
        email: firebaseUser.email || '',
        role: 'PRACTITIONER',
        position: 'Behaviour Support Practitioner',
        workerScreeningStatus: 'Active',
        workerScreeningExpiry: '2028-12-31',
        policeCheckExpiry: '2027-12-31',
        ndisOrientationDone: true,
        activeCaseload: 0
      };
      set({ currentUser: fallback, isAuthenticated: true, authLoading: false });
      return fallback;
    }
  },

  canEdit: () => {
    const role = get().currentUser?.role;
    return role === 'ADMIN' || role === 'PRACTITIONER' || role === 'SUPPORT_COORDINATOR';
  },

  canDelete: () => {
    return get().currentUser?.role === 'ADMIN';
  },

  isAdmin: () => {
    return get().currentUser?.role === 'ADMIN';
  },

  isPractitioner: () => {
    const role = get().currentUser?.role;
    return role === 'PRACTITIONER' || role === 'ADMIN';
  },

  isViewer: () => {
    return get().currentUser?.role === 'VIEWER';
  },

  isSupportCoordinator: () => {
    const role = get().currentUser?.role;
    return role === 'SUPPORT_COORDINATOR' || role === 'ADMIN';
  },

  switchUser: (id: string) => {
    const user = get().users.find((u) => u.id === id);
    if (user) {
      set({ currentUser: user });
      get().addAuditLog('SWITCH_USER', 'UserProfile', user.id, `Active session switched to ${user.name} (${user.role})`);
    }
  },

  setUserRole: (role: UserRole) => {
    set((state) => ({
      currentUser: { ...state.currentUser, role }
    }));
    get().addAuditLog('UPDATE_ROLE', 'UserProfile', get().currentUser.id, `User role altered to ${role}`);
  }
});
