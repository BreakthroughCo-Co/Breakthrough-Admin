# Project: Breakthrough OS Production Rollout

## Architecture
Breakthrough OS is an enterprise-grade NDIS Behaviour Support practice management platform built on:
- **Frontend & App Router**: Next.js 15 (React 19 App Router) with Tailwind CSS v4, Lucide icons, and responsive desktop/PWA layout.
- **Backend & Database**: Firebase Auth, Cloud Firestore (with multi-tab persistent cache and offline delta sync), Firebase Storage (with RBAC and 25MB file validation), and Firebase App Hosting.
- **State Management**: Zustand 5 with optimistic client-side caching, offline queueing (`OfflineDelta`), and bi-directional Firestore listener sync.
- **AI & Clinical Intelligence**: Google Gemini API (`@google/genai`) for Behaviour Support Plan synthesis, ABC log pattern analysis, risk evaluation, claim pre-submission validation, natural language semantic search, and guardrailed participant chatbot.
- **Enterprise Integrations**: NDIS PRODA PACE API, Xero OAuth 2.0, SendGrid transactional emails, Twilio SMS, and Google Calendar API.
- **Test Infrastructure**: In-memory ESM test harness (`tests/runner.mjs` + `tests/harness/emulator.mjs`) supporting fast, deterministic zero-network E2E testing across Tiers 1–7+.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| R1 | Real Firebase Authentication & RBAC | Email/password auth, IndexedDB persistence, Firestore Security Rules (ADMIN, PRACTITIONER, VIEWER, SUPPORT_COORDINATOR), route gating | M1 | ORIGINAL_REQUEST §R1 |
| R2 | AI BSP Document Generator | Gemini API synthesis of NDIS BSP from ABC logs, goals, restrictive practices, case notes, incidents + PDF export | M2 | ORIGINAL_REQUEST §R2 |
| R3 | AI ABC Log Pattern Recognition | Antecedent clustering (Top 3), temporal patterns, and PBS intervention recommendations | M2 | ORIGINAL_REQUEST §R3 |
| R4 | AI Continuous Risk Assessment | Multi-factor risk scoring (incidents, restrictive practices, budget velocity, session gaps), plain-English rationale, critical alert notifications | M2 | ORIGINAL_REQUEST §R4 |
| R5 | AI Billing Claim Validator | Pre-submission checks for 2026 NDIS price caps, duplicate claims, missing fields, and case note matching with validation badges | M3 | ORIGINAL_REQUEST §R5 |
| R6 | AI Semantic Search Across Records | Natural language search with query intent parsing across notes, incidents, ABC logs, billing, and clients | M2 | ORIGINAL_REQUEST §R6 |
| R7 | AI Scheduling Optimiser & GCal Sync | Caseload capacity rebalancing, travel time clustering, and bidirectional Google Calendar sync | M3 | ORIGINAL_REQUEST §R7 |
| R8 | NDIS PRODA API Direct Claim Submission | Programmatic bulk claim submission via NDIS Provider API with automated PACE status polling and ledger updates | M3 | ORIGINAL_REQUEST §R8 |
| R9 | Xero OAuth 2.0 Live Integration | OAuth 2.0 authorization code exchange, token refresh, AR invoice creation, and bank feed payment reconciliation | M3 | ORIGINAL_REQUEST §R9 |
| R10 | Email & SMS Notification Infrastructure | SendGrid and Twilio dispatch engine for critical incidents, 14d/3d compliance expiries, payment receipts, and 30d BSP reviews | M3 | ORIGINAL_REQUEST §R10 |
| R11 | File & Document Storage | Firebase Storage integration, storage.rules RBAC, 25MB limits, MIME restrictions, and UI document dropzones/tables | M1 | ORIGINAL_REQUEST §R11 |
| R12 | Compliance Automation Suite | Monthly compliance PDF on 1st, Restrictive Practice report, NDIS audit bundle exporter, 12mo BSP review, multi-step incident sign-off | M4 | ORIGINAL_REQUEST §R12 |
| R13 | NDIS Price Guide Auto-Sync | Live rate sync, price cap diffing, practitioner alerts, and retrospective claim re-validation | M3 | ORIGINAL_REQUEST §R13 |
| R14 | Participant & Carer Portal | Invite-only PARTICIPANT role, appointments, plain-language note redaction, budget utilization, and submitted incidents | M5 | ORIGINAL_REQUEST §R14 |
| R15 | Progressive Web App (PWA) | manifest.json, service worker offline caching, offline note drafting & ABC logging, background sync | M5 | ORIGINAL_REQUEST §R15 |
| R16 | AI Participant & Carer Chatbot | Gemini chatbot in portal, plan/budget Q&A, clinical guardrails, and practitioner escalation | M5 | ORIGINAL_REQUEST §R16 |
| R17 | Comprehensive E2E Test Suite Expansion | Tier 6 (Integrations) & Tier 7 (Compliance/Portal/PWA) test expansion with 50+ new tests, 100% pass rate on full suite | M6 | ORIGINAL_REQUEST §R17 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Authentication, Security & Storage Foundation | R1 (Firebase Auth, Security Rules, RBAC, route gating) + R11 (Firebase Storage, storage.rules, document metadata) | none | DONE |
| M2 | Clinical Intelligence & AI Synthesis Suite | R2 (AI BSP Gen & PDF) + R3 (AI ABC Patterns) + R4 (AI Risk Engine) + R6 (AI Semantic Search) | M1 | DONE |
| M3 | Enterprise Integrations, Billing & Scheduling | R5 (Billing Validator) + R7 (Scheduler & GCal) + R8 (PRODA API) + R9 (Xero OAuth) + R10 (SendGrid/Twilio) + R13 (Price Guide Auto-Sync) | M1 | DONE |
| M4 | Statutory Compliance Automation Suite | R12 (Monthly PDF, RP Report, Audit Bundles, 12mo BSP Review, 4-Step Incident Sign-off) | M1, M2 | IN_PROGRESS |
| M5 | Participant Portal, PWA & AI Chatbot | R14 (Participant Portal & Redactor) + R15 (PWA & Offline Sync) + R16 (Guardrailed Chatbot) | M1, M2 | IN_PROGRESS |
| M6 | E2E Testing Track (Tiers 6 & 7 Expansion) | R17 (Test harness emulator extensions, Tier 6 & Tier 7 suites with 50+ new tests in runner.mjs) | M1, M2, M3, M4, M5 | PLANNED |
| M7 | Final Integration, Adversarial Hardening & GitHub Push | Full E2E verification (100% pass), Tier 5 adversarial stress verification, git commit and push to main branch | M6 | PLANNED |
