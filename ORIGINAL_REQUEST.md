# Original User Request

## Initial Request — 2026-08-24T20:12:30Z

Execute the complete 5-Phase Production Rollout for Breakthrough OS (Next.js 15 + Firebase Auth/Firestore + Zustand practice management platform for NDIS Behaviour Support practitioners), delivering and verifying all production features across Milestones M2 (Auth Guards & RBAC), M3 (Real-Time & Offline Sync), M4 (AI & Dictation Enhancements), M5 (Dashboards & Compliance Analytics), and M-FINAL (E2E Verification & Forensic Hardening).

Working directory: /Users/vanishrapidshare/.gemini/antigravity/worktrees/Administration-Breakthrough-main/teamwork_preview_grill_session
Integrity mode: development

## Requirements

### R1. Complete Auth Guards & RBAC (Milestone M2)
Implement SignInScreen gating, session restoration fix for IndexedDB persistence, role-based navigation/route gating (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR), action-level button gating, and Firestore RBAC security rules.

### R2. Complete Real-Time Sync & Offline Infrastructure (Milestone M3)
Implement Firestore onSnapshot multi-collection listeners with state sync, persistent local multi-tab cache configuration, true offline mutation delta queue flushing, and dynamic connection status indication.

### R3. Complete AI & Clinical Enhancements (Milestone M4)
Implement Gemini AI note drafting (SIMPL/BIRP formats with fallback), ABC log pattern to NDIS SMART/GAS goal generation, live context Command Center AI chat, and Web Speech API voice dictation.

### R4. Complete Dashboards & Compliance Analytics (Milestone M5)
Implement real-time billing revenue dashboard, compliance KPI tracking (screening/restrictive practice expiry), practitioner caseload heatmap, plan budget utilization charts, with loading skeletons and empty states.

### R5. Complete E2E Verification & Forensic Hardening (Milestone M-FINAL)
Execute comprehensive automated E2E test runner (PATH=$PATH:/Users/vanishrapidshare/.nvm/versions/node/v24.19.0/bin npm test) across Tiers 1–5 (84 test cases) and achieve a 100% clean test pass rate.

## Acceptance Criteria

### Milestone M2 - Auth & RBAC
- [ ] Signed-out sessions display SignInScreen and block unauthorized route navigation.
- [ ] Session restoration persists auth state across reloads via IndexedDB.
- [ ] VIEWER role grants read-only access and hides add/edit/delete buttons.
- [ ] PRACTITIONER role permits writing own notes and blocks client deletion.
- [ ] ADMIN role permits full system management including client deletion.

### Milestone M3 - Real-Time & Offline
- [ ] Firestore onSnapshot listeners propagate collection updates across subscribers in real-time.
- [ ] Offline delta queue accumulates state mutations during disconnection.
- [ ] Automatic delta flush syncs all queued changes upon network restoration.
- [ ] ConnectionStatusIndicator accurately reflects real transport and offline status.

### Milestone M4 - AI & Clinical Features
- [ ] Gemini API generates structured SIMPL/BIRP notes from bullet points, with heuristic fallback when offline.
- [ ] ABC log analyser generates NDIS SMART & GAS goals.
- [ ] Command Center live chat incorporates live Firestore metrics context.
- [ ] Web Speech API streams voice dictation into note fields.

### Milestone M5 - Dashboards & Analytics
- [ ] Real-time billing revenue dashboard computes claims submitted vs paid and client balances.
- [ ] Compliance KPI dashboard monitors screening expiries and 24h statutory incident reporting rates.
- [ ] Practitioner caseload heatmap displays capacity limits.
- [ ] Recharts widgets render loading skeletons when loading and handle empty datasets gracefully.

### Milestone M-FINAL - Automated Verification
- [ ] All 84 automated E2E test cases across Tiers 1 through 5 pass with 0 failures via npm test.
