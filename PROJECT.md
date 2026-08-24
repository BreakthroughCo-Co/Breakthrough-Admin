# Project: Breakthrough OS 5-Phase Production Rollout

## Architecture
Breakthrough OS is a Next.js 15 (React 19) + Firebase (Auth, Firestore) + Zustand NDIS practice management platform for Behaviour Support practitioners.
- **Presentation Layer**: Next.js App Router (`app/page.tsx`), 18 feature modules in `components/features/`, shared navigation in `components/Header.tsx`, `components/Sidebar.tsx`, `components/CommandPalette.tsx`, `components/QuickActionsFloatingMenu.tsx`.
- **State & Optimistic Cache Layer**: Zustand store in `stores/useManagementStore.ts` caching domain entities (`clients`, `caseNotes`, `billingClaims`, `incidents`, `restrictivePractices`, `abcLogs`, `bspDocuments`, `crmLeads`, `crmTasks`, `practitioners`, `supportItems`, `auditLogs`, `notifications`), managing auth role state and offline delta queues.
- **Persistence & Service Layer**: Typed Firestore services in `lib/firestoreService.ts`, real-time listener manager in `lib/firestoreListeners.ts`, Firebase initialization with persistent local multi-tab cache in `lib/firebase.ts`, offline IndexedDB storage in `lib/keepOfflineStorage.ts`.
- **AI & Intelligence Layer**: Gemini API proxy (`app/api/gemini/generate/route.ts`), clinical heuristics and NLP prompt engineers in `lib/ai-assistant.ts`, Web Speech API voice transcription in `components/VoiceDictationBar.tsx` and `components/features/CaseNotesModule.tsx`.
- **Analytics & Dashboard Layer**: Live aggregated metrics computed via React hooks / `useMemo`, rendered using `recharts` in `components/features/CommandCenter.tsx`, `components/features/ComplianceDashboard.tsx`, and `components/features/BillingModule.tsx`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Firestore Typed Service Layer | CRUD services for all 15 collections with typed interfaces | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Firestore Security Rules (Persistence) | Allow authenticated read/write across all 15 collections; system read | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Store-to-Firestore Wiring | Wire Zustand action creators to firestoreService with optimistic updates | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Initial Data Hydration & Seeding | Hydrate store from Firestore on startup; seed defaults if empty | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Firebase Blueprint Alignment | Complete schemas for all collections in firebase-blueprint.json | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Authentication Screen & Gating | Show SignInScreen when signed out; redirect unauthenticated | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Session Restoration Fix | Fix initAuth session loss on reload while currentUser exists in IndexedDB | M2 | ORIGINAL_REQUEST §R2 |
| 8 | RBAC Roles & Profile Sync | Support ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR from /users/{uid} | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Route & Navigation Gating | Restrict admin-only modules (HR, Audit, Integrations) across Sidebar/Palette/Shortcuts | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Action-Level Button Gating | Hide/disable Add/Delete/Approve for VIEWER; restrict delete to ADMIN | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Firestore Security Rules (RBAC) | Role-based authorization rules (admin delete, practitioner edit own) | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Real-Time onSnapshot Listeners | Real-time multi-tab propagation for Clients, Notes, Claims, Notifications | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Firestore Persistent Cache | Enable persistentLocalCache with persistentMultipleTabManager in firebase.ts | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Offline Queue & Delta Sync | True Firestore batch flush for OfflineDelta mutations in useManagementStore | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Connection Status Indicator | Reflect real Firestore connection and cache status in ConnectionStatusIndicator | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Case Notes AI Drafting | Auto-draft SIMPL/BIRP/Standard notes via Gemini with heuristic fallback | M4 | ORIGINAL_REQUEST §R4 |
| 17 | ABC-to-Goals Generation | AI-suggested SMART/GAS goals from ABC log patterns in ABCAnalyserModule | M4 | ORIGINAL_REQUEST §R4 |
| 18 | Command Center Live AI Chat | Conversational AI chat with live Firestore metrics context in CommandCenter | M4 | ORIGINAL_REQUEST §R4 |
| 19 | Voice-to-Text Dictation | Web Speech API integration in CaseNotesModule surfacing into note fields | M4 | ORIGINAL_REQUEST §R4 |
| 20 | Real-Time Billing Revenue Dashboard | Monthly claims submitted vs paid, outstanding balances by client | M5 | ORIGINAL_REQUEST §R5 |
| 21 | Compliance KPI Dashboard | Worker screening expiry, incident reportability, restrictive practice expiry | M5 | ORIGINAL_REQUEST §R5 |
| 22 | Practitioner Caseload Heatmap | Visual caseload capacity and distribution across practitioners | M5 | ORIGINAL_REQUEST §R5 |
| 23 | Plan Budget Utilisation Chart | Client NDIS funding burn rate and category allocations | M5 | ORIGINAL_REQUEST §R5 |
| 24 | Chart Skeletons & Empty States | Loading skeletons and empty state fallbacks for all Recharts widgets | M5 | ORIGINAL_REQUEST §R5 |
| 25 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite across all acceptance criteria | M-TEST | Dual Track |
| 26 | Final E2E Pass & Adversarial Hardening | 100% test pass + Tier 5 coverage hardening + Forensic audit | M-FINAL | Final Milestone |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-TEST | E2E Testing Track | Test harness, runner, and Tiers 1-4 test cases; publish TEST_READY.md | none | DONE |
| M1 | Phase 1: Firestore Persistence Layer | Typed services, security rules, store hydration, blueprint update | none | DONE |
| M2 | Phase 2: Auth Guards & RBAC | SignInScreen, route guards, RBAC store sync, action gating, RBAC rules | M1 | DONE |
| M3 | Phase 3: Real-Time & Offline Sync | onSnapshot listeners, persistent cache, OfflineDelta flush, connection status | M1, M2 | DONE |
| M4 | Phase 4: AI Enhancements via Gemini | SIMPL/BIRP drafting, ABC-to-goals, Command Center live chat, voice dictation | M1, M3 | DONE |
| M5 | Phase 5: Dashboards & Compliance Analytics | Live billing/compliance/caseload/budget charts with loading skeletons | M1, M3 | DONE |
| M-FINAL | Final Verification & Hardening | 100% E2E test pass (Tiers 1-4) + Tier 5 adversarial tests + Forensic Audit | M-TEST, M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### `lib/firestoreService.ts` ↔ `stores/useManagementStore.ts`
- `fetchCollection<T>(name: string): Promise<T[]>`
- `createDocument<T>(collection: string, data: T, id?: string): Promise<string>`
- `updateDocument<T>(collection: string, id: string, data: Partial<T>): Promise<void>`
- `deleteDocument(collection: string, id: string): Promise<void>`
- `subscribeToCollection<T>(collection: string, onUpdate: (data: T[]) => void): () => void`

### `types/index.ts` (RBAC & Domain)
- `export type UserRole = 'ADMIN' | 'PRACTITIONER' | 'VIEWER' | 'SUPPORT_COORDINATOR';`
- `export interface UserProfile { uid: string; email: string; displayName: string; role: UserRole; practitionerId?: string; }`

### `lib/firestoreListeners.ts` ↔ State
- `initFirestoreListeners(store: ManagementStore): () => void`
- Attaches `onSnapshot` listeners to active collections and calls `store.setEntities(collection, data)` without triggering redundant writes.

### `lib/ai-assistant.ts` ↔ UI Modules
- `draftCaseNote(summary: string, format: 'SIMPL' | 'BIRP' | 'Standard'): Promise<{ content: string; sections?: Record<string, string> }>`
- `suggestGoalsFromABC(abcLogs: ABCLog[]): Promise<NDISGoal[]>`
- `queryCommandCenterAI(question: string, context: LiveMetricsContext): Promise<string>`

## Code Layout
- `lib/`
  - `firebase.ts`: Firebase app, auth, and firestore initialization with persistent cache.
  - `firestoreService.ts`: Type-safe Firestore CRUD operations for all 15 collections.
  - `firestoreListeners.ts`: Multi-collection real-time onSnapshot synchronization.
  - `ai-assistant.ts`: Gemini API integration and deterministic clinical fallback heuristics.
  - `keepOfflineStorage.ts`: IndexedDB storage for Google Keep notes.
- `types/`
  - `index.ts`: Central domain types, UserRole, UserProfile, OfflineDelta, ScheduledShift.
- `stores/`
  - `useManagementStore.ts`: Optimistic Zustand store, Firestore hydration, delta queue sync.
- `components/`
  - `SignInScreen.tsx`: Gated authentication screen with Google Sign-In.
  - `AccessGuard.tsx`: Role and permission boundary wrapper.
  - `ConnectionStatusIndicator.tsx`: Real Firestore transport & offline indicator.
  - `VoiceDictationBar.tsx`: Speech-to-text recording interface.
  - `features/`: 18 practice management modules (`ClientsModule.tsx`, `CaseNotesModule.tsx`, `BillingModule.tsx`, `ComplianceDashboard.tsx`, `CommandCenter.tsx`, `ABCAnalyserModule.tsx`, etc.).
- `firestore.rules`: 15-collection role-aware security ruleset.
- `firebase-blueprint.json`: Data schema blueprints for all Firestore collections.
- `tests/`: E2E test suites (Tiers 1–5), runners, and verification harnesses.
