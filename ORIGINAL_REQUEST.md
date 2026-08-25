# Original User Request

## 2026-08-24T23:20:45Z

Implement a comprehensive, production-grade improvement rollout for **Breakthrough OS** — an NDIS Behaviour Support practice management platform for a small team (2–5 practitioners, 10–50 clients) built with Next.js 15, Firebase Auth/Firestore, Zustand, and Gemini AI, deployed on Firebase App Hosting. Build everything as fast as possible with full real API connections. All existing 90 E2E tests must continue to pass at 100%, and new tests must be added for every new feature.

Working directory: /Users/vanishrapidshare/.gemini/antigravity/worktrees/Administration-Breakthrough-main/teamwork_preview_grill_session

Integrity mode: development

GitHub repository: https://github.com/BreakthroughCo-Co/Breakthrough-Admin (branch: main)
GitHub PAT: <GITHUB_PAT>
Live URL: https://administration-breakthrough--gen-lang-client-0333264365.us-central1.hosted.app

---

## Requirements

### R1. Real Firebase Authentication & Security Hardening
Implement production-grade Firebase Authentication with email/password sign-in for all practitioners. Sessions must persist across browser reloads via IndexedDB. Enforce role-based access control (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR) through real Firestore Security Rules that block unauthorized mutations at the database level, independent of the UI. The sign-in screen must gate all routes for unauthenticated sessions.

### R2. AI — Behaviour Support Plan (BSP) Generator
Build an AI-powered BSP document generator using the Gemini API. It must synthesize a clinically structured, NDIS-compliant Behaviour Support Plan from a client's existing ABC logs, SMART goals, restrictive practices, case notes, and incident history stored in the system. The output must be formatted to meet NDIS Quality and Safeguards Commission standards and be exportable as a downloadable PDF.

### R3. AI — ABC Log Pattern Recognition & Intervention Advisor
Implement a Gemini-powered pattern analysis engine that processes a client's ABC log entries over time to identify antecedent triggers, behavioural patterns, and consequential outcomes. The system must surface statistically significant patterns (e.g., high-frequency antecedents, escalation triggers) and auto-recommend evidence-based intervention strategies aligned with Positive Behaviour Support (PBS) principles.

### R4. AI — Risk Assessment & Client Safety Flagging
Build an AI-driven risk scoring engine that continuously evaluates each participant's profile — incorporating incident frequency, severity, restrictive practice usage, missed appointments, and plan budget depletion rate — to generate a live risk level (Low / Medium / High / Critical) with a plain-English rationale. Critical-risk clients must trigger immediate practitioner notifications.

### R5. AI — Billing Claim Pre-Submission Validator
Implement an AI pre-submission validation layer that analyses every billing claim before PACE submission. It must detect: incorrect NDIS line item codes for the claimed support category, rates exceeding 2026 NDIS price caps, missing mandatory fields, duplicate claims within the same service period, and claims without a matching case note or session record. Flag errors with plain-English explanations and suggested corrections.

### R6. AI — Natural Language Search Across All Records
Implement a Gemini Embedding-powered semantic search that allows practitioners to query across all client records, case notes, incidents, ABC logs, and billing claims using plain-language questions (e.g., "show me all incidents involving self-harm in the last 6 months" or "which clients have unused plan budget over $5,000"). Results must rank by relevance and highlight matching content.

### R7. AI — Scheduling Optimiser
Build an AI scheduling assistant that analyses current practitioner caseloads, appointment histories, client locations, and availability to recommend optimal appointment scheduling and flag caseload imbalances. It must suggest practitioner reassignments when any practitioner exceeds capacity thresholds and integrate with the Google Calendar API for appointment sync.

### R8. NDIS PRODA API Direct Claim Submission
Implement direct programmatic NDIS PRODA bulk claim submission via the NDIS Provider API, replacing the current manual CSV export workflow. Claims with status "Approved" must be batchable for direct submission, with live status polling returning PACE payment outcomes back into the billing ledger automatically.

### R9. Xero OAuth 2.0 Live Integration
Replace the current simulated Xero integration with a complete OAuth 2.0 authorization flow using the official Xero API. Implement the full consent flow (authorize → token exchange → token refresh), live Accounts Receivable invoice creation, and real payment reconciliation syncing Xero bank feed payment statuses back to the Breakthrough OS billing ledger.

### R10. Email & SMS Notification Infrastructure
Integrate SendGrid for transactional email and Twilio for SMS. Automated notifications must be triggered for: critical incident creation (immediate, to practice director), NDIS compliance expiry warnings (14 days and 3 days before), invoice payment receipts, BSP review reminders (30 days before 12-month deadline), and worker screening expiry alerts.

### R11. File & Document Storage (Firebase Storage)
Implement Firebase Storage for attaching files to client records, incidents, and billing claims. Practitioners must be able to upload consent forms, completed assessment PDFs, NDIS plan documents, and incident photo evidence. Files must be served via authenticated download URLs with RBAC — only the assigned practitioner and ADMIN roles can access a client's documents.

### R12. Compliance Automation Suite
Implement: (a) Automated monthly compliance report generation (PDF format) covering active restrictive practices, incident rates, screening expiries, and PACE submission rates — auto-emailed to the practice director on the 1st of each month. (b) Restrictive Practice monthly report generator compliant with NDIS Commission reporting format. (c) NDIS audit preparation tool that assembles required evidence bundles (case notes, incidents, BSPs, screening records) per participant into a structured export package. (d) BSP review workflow with 12-month reminder triggers. (e) Incident investigation workflow with structured multi-step sign-off process.

### R13. NDIS Price Guide Auto-Sync
Build an automated NDIS price guide synchronization service that fetches the latest published support item rates from the NDIS website (or a maintained NDIS pricing API) and updates all rate tables in the application. Practitioners must be notified when rates change and existing claims must be re-validated against the new rates.

### R14. Participant & Carer Portal
Build a read-only portal for NDIS participants and their nominated carers/families. The portal must allow viewing of: scheduled appointments, session notes (with clinical details redacted to plain language), NDIS plan budget utilization, upcoming service dates, and submitted incidents. Access must be controlled via invite-only email with a separate Firebase Auth user role (PARTICIPANT).

### R15. Progressive Web App (PWA) — Mobile-First Field Access
Convert the Next.js application to a Progressive Web App with: installable home-screen icon, offline-capable service worker caching for client records and case note drafting, background sync for notes created offline, and a mobile-optimised responsive UI for all core practitioner workflows (case notes, ABC logs, incident reports, billing).

### R16. AI — Participant & Carer Chatbot
Build a Gemini-powered AI chatbot accessible from the Participant Portal that allows participants and carers to ask plain-language questions about their NDIS plan, support services, upcoming appointments, and budget. The chatbot must operate within guardrails (no clinical advice, no medical diagnosis) and escalate complex questions to the assigned practitioner via notification.

### R17. Comprehensive E2E Test Suite Expansion
For every new feature implemented in R1–R16, add a corresponding E2E test tier (Tier 7+) to the existing test harness at tests/runner.mjs. The test harness uses a Node.js in-memory emulator (tests/harness/emulator.mjs) and does not require a live deployment. All existing 90 tests across Tiers 1–6 must continue to pass at 100%. The total test suite must execute via `PATH=$PATH:/Users/vanishrapidshare/.nvm/versions/node/v24.19.0/bin npm test` with 0 failures.

---

## Acceptance Criteria

### Authentication & Security
- [ ] Unauthenticated sessions redirect to sign-in screen and cannot access any route
- [ ] Each practitioner has their own email/password credential in Firebase Auth
- [ ] Firestore Security Rules enforce role-level permissions independent of the UI (VIEWER cannot write even bypassing the UI)
- [ ] Sessions persist across browser reloads without requiring re-login

### AI — BSP Generator
- [ ] BSP generator produces a complete, structured NDIS-compliant document using live client data
- [ ] Generated BSP is downloadable as a formatted PDF
- [ ] Output includes: client profile, presenting behaviours, antecedent analysis, function of behaviour, intervention strategies, and evaluation criteria

### AI — Pattern Recognition
- [ ] Pattern engine identifies the top 3 most frequent antecedents across a client's ABC logs
- [ ] Intervention recommendations reference PBS principles
- [ ] Analysis updates automatically when new ABC logs are added

### AI — Risk Assessment
- [ ] Every active client has a computed risk level visible on the client card
- [ ] Risk level rationale is displayed in plain English
- [ ] Critical-risk clients trigger an in-app notification and email to the practice director

### AI — Billing Validator
- [ ] Pre-submission check catches rate-cap violations, duplicate claims, missing fields, and mismatched line items
- [ ] All errors are surfaced with plain-English descriptions and suggested corrections before PACE submission
- [ ] Clean claims receive a green validation badge

### AI — Semantic Search
- [ ] Natural language query returns relevant results across case notes, incidents, billing, and ABC logs
- [ ] Results include a relevance score or ranking
- [ ] Search responds within 3 seconds for a dataset of 50 clients

### Integrations
- [ ] Xero OAuth 2.0 consent flow completes end-to-end (authorize → token → invoice)
- [ ] PRODA API direct submission pushes approved claims and returns a payment status
- [ ] Google Calendar sync creates and retrieves appointments bidirectionally
- [ ] Email and SMS notifications fire for all defined trigger events

### File Storage
- [ ] Files attach to client records and are downloadable via authenticated URL
- [ ] RBAC prevents VIEWER and cross-practitioner file access
- [ ] File uploads support PDF, DOCX, JPEG, and PNG formats up to 25MB

### Compliance
- [ ] Monthly compliance report is auto-generated as a PDF on the 1st of each month
- [ ] Incident investigation workflow enforces structured sign-off before closure
- [ ] NDIS audit bundle export produces a complete evidence package per participant

### PWA
- [ ] Application installs to home screen on iOS and Android
- [ ] Core practitioner workflows function offline (case note drafting, ABC log entry)
- [ ] Background sync flushes offline mutations when connectivity is restored

### Participant Portal
- [ ] Participant can log in with invite-only credentials and view their own records only
- [ ] AI chatbot responds to plan/budget questions with guardrails enforced
- [ ] Clinical details are redacted to plain language in participant-facing notes

### Testing
- [ ] npm test executes all tiers with 0 failures
- [ ] Every new feature in R1–R16 has at least one E2E test covering its primary success path and one failure/edge-case path
- [ ] Total test count increases by at least 50 new tests above the current 90 baseline

### Deployment
- [ ] All changes committed to GitHub repository BreakthroughCo-Co/Breakthrough-Admin (branch: main) via git push https://<GITHUB_PAT>@github.com/BreakthroughCo-Co/Breakthrough-Admin.git main
