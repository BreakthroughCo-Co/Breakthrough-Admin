/**
 * Breakthrough OS — Multi-Collection Real-Time Firestore Listeners (Phase 3)
 * 
 * Attaches persistent onSnapshot listeners across all 15 active Firestore collections,
 * propagating real-time updates directly into the Zustand state cache across multi-tab sessions
 * without triggering secondary write loops.
 */

import {
  subscribeToClients,
  subscribeToCaseNotes,
  subscribeToBillingClaims,
  subscribeToIncidents,
  subscribeToRestrictivePractices,
  subscribeToABCLogs,
  subscribeToBSPDocuments,
  subscribeToCRMLeads,
  subscribeToCRMTasks,
  subscribeToPractitioners,
  subscribeToSupportItems,
  subscribeToAuditLogs,
  subscribeToScheduledShifts,
  subscribeToUsers,
  subscribeToNotifications
} from './firestoreService';
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
  AppNotification
} from '@/types';

/**
 * Helper to update store state directly via whichever state setter mechanism is available
 * on the provided store reference, avoiding action creator write-back loops.
 */
function updateStore(store: any, patch: Record<string, any>): void {
  if (!store) return;
  if (typeof store.setState === 'function') {
    store.setState(patch);
  } else if (typeof store.setEntities === 'function') {
    Object.entries(patch).forEach(([col, data]) => {
      store.setEntities(col, data);
    });
  } else if (typeof store.set === 'function') {
    store.set(patch);
  } else if (typeof store === 'function') {
    store(patch);
  }
}

/**
 * Initializes real-time onSnapshot listeners for all 15 active collections.
 * 
 * @param store - The Zustand store hook or state setter
 * @returns Composite cleanup function that cleanly unsubscribes all active listeners
 */
export function initFirestoreListeners(store: any): () => void {
  const unsubscribes: Array<(() => void) | undefined> = [];

  const errHandler = (err: Error) => {
    console.warn('[Realtime] Firestore listener error, operating from cache:', err.message);
    updateStore(store, { syncStatus: 'offline' });
  };

  try {
    // 1. Clients (`clients`)
    unsubscribes.push(
      subscribeToClients((clients: Client[]) => {
        updateStore(store, {
          clients,
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString()
        });
      }, errHandler)
    );

    // 2. Case Notes (`caseNotes`)
    unsubscribes.push(
      subscribeToCaseNotes((caseNotes: CaseNote[]) => {
        updateStore(store, { caseNotes });
      }, errHandler)
    );

    // 3. Billing Claims (`billingClaims`)
    unsubscribes.push(
      subscribeToBillingClaims((billingClaims: BillingClaim[]) => {
        updateStore(store, {
          billingClaims,
          claims: billingClaims
        });
      }, errHandler)
    );

    // 4. Incidents (`incidents`)
    unsubscribes.push(
      subscribeToIncidents((incidents: Incident[]) => {
        updateStore(store, { incidents });
      }, errHandler)
    );

    // 5. Restrictive Practices (`restrictivePractices`)
    unsubscribes.push(
      subscribeToRestrictivePractices((restrictivePractices: RestrictivePractice[]) => {
        updateStore(store, { restrictivePractices });
      }, errHandler)
    );

    // 6. ABC Behaviour Logs (`abcLogs`)
    unsubscribes.push(
      subscribeToABCLogs((abcLogs: ABCLog[]) => {
        updateStore(store, { abcLogs });
      }, errHandler)
    );

    // 7. Behaviour Support Plans (`bspDocuments`)
    unsubscribes.push(
      subscribeToBSPDocuments((bspDocuments: BSPDocument[]) => {
        const patch: Record<string, any> = {
          bspDocuments,
          bspPlans: bspDocuments
        };
        if (bspDocuments && bspDocuments.length > 0) {
          patch.bsp = bspDocuments[0];
        }
        updateStore(store, patch);
      }, errHandler)
    );

    // 8. CRM Leads (`crmLeads`)
    unsubscribes.push(
      subscribeToCRMLeads((leads: Lead[]) => {
        updateStore(store, {
          leads,
          crmLeads: leads
        });
      }, errHandler)
    );

    // 9. CRM Tasks (`crmTasks`)
    unsubscribes.push(
      subscribeToCRMTasks((crmTasks: CRMTask[]) => {
        updateStore(store, { crmTasks });
      }, errHandler)
    );

    // 10. Practitioners (`practitioners`)
    unsubscribes.push(
      subscribeToPractitioners((practitioners: Practitioner[]) => {
        updateStore(store, { practitioners });
      }, errHandler)
    );

    // 11. Support Items / Price Guide (`supportItems`)
    unsubscribes.push(
      subscribeToSupportItems((supportItems: NDISSupportItem[]) => {
        updateStore(store, { supportItems });
      }, errHandler)
    );

    // 12. Audit Logs (`auditLogs`)
    unsubscribes.push(
      subscribeToAuditLogs((auditLogs: AuditLog[]) => {
        updateStore(store, { auditLogs });
      }, errHandler)
    );

    // 13. Scheduled Shifts (`scheduledShifts`)
    unsubscribes.push(
      subscribeToScheduledShifts((scheduledShifts: ScheduledShift[]) => {
        updateStore(store, { scheduledShifts });
      }, errHandler)
    );

    // 14. Users (`users`)
    unsubscribes.push(
      subscribeToUsers((users: UserProfile[]) => {
        updateStore(store, { users });
      }, errHandler)
    );

    // 15. App Notifications (`notifications`)
    unsubscribes.push(
      subscribeToNotifications((notifications: AppNotification[]) => {
        updateStore(store, { notifications });
      }, errHandler)
    );

    updateStore(store, { syncStatus: 'synced' });
  } catch (initErr) {
    console.warn('[Realtime] Failed to initialize some Firestore listeners:', initErr);
  }

  // Return composite unsubscribe function
  return () => {
    unsubscribes.forEach((unsub) => {
      try {
        if (typeof unsub === 'function') {
          unsub();
        }
      } catch (err) {
        console.warn('[Realtime] Error unsubscribing listener:', err);
      }
    });
    unsubscribes.length = 0;
  };
}

export default initFirestoreListeners;
