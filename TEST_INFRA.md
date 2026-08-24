# E2E Test Infra: Breakthrough OS

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing across 4 Tiers.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Firestore Persistence Layer | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Auth Guards & RBAC | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 3 | Real-Time Sync & Offline | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 4 | AI Enhancements (Gemini/Speech) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 5 | Data Dashboards & Compliance | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js / TypeScript test suite runner executing automated assertion suites.
- Test Files Location: `tests/e2e/`
  - `tier1-feature-coverage.test.ts` (≥25 test cases: ≥5 per feature area)
  - `tier2-boundary-corner.test.ts` (≥25 test cases: ≥5 per feature area)
  - `tier3-pairwise-cross-feature.test.ts` (≥10 test cases: cross-module interactions)
  - `tier4-real-world-workloads.test.ts` (≥5 realistic practitioner workflows)
- Test Execution Command: `npm test` or `node --loader ts-node/esm tests/run-all-tests.ts` or standalone executable runner script `tests/runner.mjs`.

## Acceptance Criteria Mapping
- Phase 1: Client creation persists in Firestore `clients`; Case note creation persists in `caseNotes`; Rules block unauthenticated access.
- Phase 2: Signed-out screen redirect; VIEWER cannot see Add/Delete/Approve; ADMIN can delete client, PRACTITIONER cannot.
- Phase 3: Multi-tab real-time sync (<3s); Connection status indicator; Offline queue & sync.
- Phase 4: AI draft SIMPL/BIRP; Voice dictation; Live context Command Center AI chat.
- Phase 5: Live billing revenue metrics; Live compliance KPI screening dates; Chart loading skeletons.
