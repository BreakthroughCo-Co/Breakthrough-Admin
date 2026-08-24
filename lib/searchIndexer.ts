import { Client, CaseNote, Practitioner, BillingClaim, Incident, RestrictivePractice } from '@/types';
import { TabType } from '@/stores/useManagementStore';

export interface IndexedSearchResult {
  id: string;
  category: 'CLIENT' | 'CASE_NOTE' | 'PRACTITIONER' | 'BILLING' | 'INCIDENT' | 'RESTRICTIVE_PRACTICE';
  title: string;
  subtitle: string;
  snippet: string;
  targetTab: TabType;
  entityId: string;
  score: number;
  badge: {
    label: string;
    color: string;
  };
  matchedField?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface CrossModuleSearchIndexParams {
  query: string;
  categoryFilter?: 'ALL' | 'CLIENT' | 'CASE_NOTE' | 'PRACTITIONER' | 'BILLING' | 'INCIDENT' | 'RESTRICTIVE_PRACTICE';
  clients: Client[];
  caseNotes: CaseNote[];
  practitioners: Practitioner[];
  billingClaims: BillingClaim[];
  incidents: Incident[];
  restrictivePractices: RestrictivePractice[];
  limit?: number;
}

/**
 * Calculates Levenshtein Distance for fuzzy string similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Fuzzy scoring function between search term and target text
 */
function calculateFuzzyScore(target: string, query: string, weight = 1.0): number {
  if (!target || !query) return 0;
  const targetLower = target.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact full match
  if (targetLower === queryLower) return 100 * weight;

  // Exact prefix match
  if (targetLower.startsWith(queryLower)) return 85 * weight;

  // Substring inclusion
  if (targetLower.includes(queryLower)) {
    const position = targetLower.indexOf(queryLower);
    const score = Math.max(50, 80 - position * 2);
    return score * weight;
  }

  // Token multi-word matching
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);
  const targetTokens = targetLower.split(/\s+/).filter(Boolean);

  let tokenMatchCount = 0;
  for (const qToken of queryTokens) {
    for (const tToken of targetTokens) {
      if (tToken.includes(qToken) || qToken.includes(tToken)) {
        tokenMatchCount++;
        break;
      } else {
        // Levenshtein fuzzy distance tolerance
        const maxLen = Math.max(qToken.length, tToken.length);
        if (maxLen > 3) {
          const dist = levenshteinDistance(qToken, tToken);
          if (dist <= 1 || (maxLen > 6 && dist <= 2)) {
            tokenMatchCount += 0.8;
            break;
          }
        }
      }
    }
  }

  if (tokenMatchCount > 0) {
    return Math.round((tokenMatchCount / queryTokens.length) * 65 * weight);
  }

  return 0;
}

/**
 * Cross-module fuzzy indexing and search engine helper
 */
export function searchCrossModuleIndex({
  query,
  categoryFilter = 'ALL',
  clients,
  caseNotes,
  practitioners,
  billingClaims,
  incidents,
  restrictivePractices,
  limit = 20
}: CrossModuleSearchIndexParams): IndexedSearchResult[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: IndexedSearchResult[] = [];

  // 1. Index and search Clients
  if (categoryFilter === 'ALL' || categoryFilter === 'CLIENT') {
    clients.forEach((c) => {
      const nameScore = calculateFuzzyScore(c.name, cleanQuery, 1.2);
      const ndisScore = calculateFuzzyScore(c.ndisNumber, cleanQuery, 1.1);
      const disabilityScore = calculateFuzzyScore(c.primaryDisability, cleanQuery, 0.9);
      const emailScore = calculateFuzzyScore(c.email || '', cleanQuery, 0.8);
      const suburbScore = calculateFuzzyScore(c.suburb || '', cleanQuery, 0.7);

      const maxScore = Math.max(nameScore, ndisScore, disabilityScore, emailScore, suburbScore);
      if (maxScore > 25) {
        results.push({
          id: `client-${c.id}`,
          category: 'CLIENT',
          title: c.name,
          subtitle: `NDIS #${c.ndisNumber} • ${c.primaryDisability}`,
          snippet: `Risk: ${c.riskLevel} | Status: ${c.status} | Plan: ${c.planType || 'NDIA Managed'} | Suburb: ${c.suburb || 'Perth Metro'}`,
          targetTab: 'clients',
          entityId: c.id,
          score: maxScore,
          badge: {
            label: 'Participant',
            color: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          },
          metadata: {
            ndisNumber: c.ndisNumber,
            riskLevel: c.riskLevel,
            restrictivePracticesActive: c.restrictivePracticesActive,
          }
        });
      }
    });
  }

  // 2. Index and search Case Notes
  if (categoryFilter === 'ALL' || categoryFilter === 'CASE_NOTE') {
    caseNotes.forEach((n) => {
      const clientScore = calculateFuzzyScore(n.clientName, cleanQuery, 1.1);
      const pracScore = calculateFuzzyScore(n.practitionerName, cleanQuery, 0.9);
      const subjScore = calculateFuzzyScore(n.subjective, cleanQuery, 0.9);
      const objScore = calculateFuzzyScore(n.objective || '', cleanQuery, 0.8);
      const assessScore = calculateFuzzyScore(n.assessment || '', cleanQuery, 0.8);
      const planScore = calculateFuzzyScore(n.plan || '', cleanQuery, 0.8);

      const maxScore = Math.max(clientScore, pracScore, subjScore, objScore, assessScore, planScore);
      if (maxScore > 25) {
        results.push({
          id: `note-${n.id}`,
          category: 'CASE_NOTE',
          title: `${n.clientName} - ${n.format} Clinical Note`,
          subtitle: `Practitioner: ${n.practitionerName} • Date: ${n.date}`,
          snippet: n.subjective || n.assessment || n.objective || 'Clinical progress note record.',
          targetTab: 'case-notes',
          entityId: n.id,
          score: maxScore,
          badge: {
            label: `${n.format} Note`,
            color: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          },
          metadata: {
            date: n.date,
            format: n.format,
            practitionerName: n.practitionerName,
          }
        });
      }
    });
  }

  // 3. Index and search Practitioners
  if (categoryFilter === 'ALL' || categoryFilter === 'PRACTITIONER') {
    practitioners.forEach((p) => {
      const nameScore = calculateFuzzyScore(p.name, cleanQuery, 1.2);
      const posScore = calculateFuzzyScore(p.position, cleanQuery, 1.0);
      const qualScore = calculateFuzzyScore(p.qualification, cleanQuery, 0.9);
      const pbsScore = calculateFuzzyScore(p.pbsRegistrationLevel || '', cleanQuery, 1.0);
      const regScore = calculateFuzzyScore(p.ndisRegistrationNumber || '', cleanQuery, 1.0);

      const maxScore = Math.max(nameScore, posScore, qualScore, pbsScore, regScore);
      if (maxScore > 25) {
        results.push({
          id: `prac-${p.id}`,
          category: 'PRACTITIONER',
          title: p.name,
          subtitle: `${p.position} • ${p.pbsRegistrationLevel || 'Proficient Practitioner'}`,
          snippet: `Qualification: ${p.qualification} | NWSC Screening: ${p.screeningStatus} (Exp: ${p.screeningExpiryDate}) | Caseload: ${p.activeCaseloadCount}/${p.caseloadLimit}`,
          targetTab: 'hr-roster',
          entityId: p.id,
          score: maxScore,
          badge: {
            label: 'Staff / Practitioner',
            color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          },
          metadata: {
            screeningStatus: p.screeningStatus,
            successRate: p.historicalSuccessRate,
          }
        });
      }
    });
  }

  // 4. Index and search Billing Claims & Invoices
  if (categoryFilter === 'ALL' || categoryFilter === 'BILLING') {
    billingClaims.forEach((b) => {
      const invScore = calculateFuzzyScore(b.invoiceNumber, cleanQuery, 1.3);
      const clientScore = calculateFuzzyScore(b.clientName, cleanQuery, 1.1);
      const itemScore = calculateFuzzyScore(b.ndisSupportItem, cleanQuery, 0.9);
      const statusScore = calculateFuzzyScore(b.status, cleanQuery, 0.8);

      const maxScore = Math.max(invScore, clientScore, itemScore, statusScore);
      if (maxScore > 25) {
        results.push({
          id: `billing-${b.id}`,
          category: 'BILLING',
          title: `${b.invoiceNumber} - ${b.clientName}`,
          subtitle: `$${b.totalAmount.toFixed(2)} AUD • Status: ${b.status}`,
          snippet: `Support Item: ${b.ndisSupportItem} | Quantity: ${b.quantity || b.hours} hrs | Rate: $${b.unitPrice || b.unitRate}/hr | Xero Ref: ${b.xeroInvoiceId || 'Synced'}`,
          targetTab: 'billing',
          entityId: b.id,
          score: maxScore,
          badge: {
            label: 'PRODA / Invoice',
            color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          },
          metadata: {
            invoiceNumber: b.invoiceNumber,
            totalAmount: b.totalAmount,
            status: b.status,
          }
        });
      }
    });
  }

  // 5. Index and search Incidents
  if (categoryFilter === 'ALL' || categoryFilter === 'INCIDENT') {
    incidents.forEach((inc) => {
      const clientScore = calculateFuzzyScore(inc.clientName, cleanQuery, 1.2);
      const descScore = calculateFuzzyScore(inc.description, cleanQuery, 0.9);
      const sevScore = calculateFuzzyScore(inc.severity, cleanQuery, 0.9);
      const actScore = calculateFuzzyScore(inc.immediateActionTaken || '', cleanQuery, 0.8);

      const maxScore = Math.max(clientScore, descScore, sevScore, actScore);
      if (maxScore > 25) {
        results.push({
          id: `inc-${inc.id}`,
          category: 'INCIDENT',
          title: `Incident: ${inc.clientName} (${inc.severity})`,
          subtitle: `Date: ${inc.incidentDate} • Status: ${inc.status}`,
          snippet: inc.description || 'Reported participant incident log.',
          targetTab: 'incidents',
          entityId: inc.id,
          score: maxScore,
          badge: {
            label: inc.severity,
            color: inc.severity.includes('Critical')
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          },
          metadata: {
            severity: inc.severity,
            isNdisReportable: inc.isNdisReportable,
          }
        });
      }
    });
  }

  // 6. Index and search Restrictive Practices
  if (categoryFilter === 'ALL' || categoryFilter === 'RESTRICTIVE_PRACTICE') {
    restrictivePractices.forEach((rp) => {
      const clientScore = calculateFuzzyScore(rp.clientName, cleanQuery, 1.2);
      const pracScore = calculateFuzzyScore(rp.practiceType, cleanQuery, 1.1);
      const authScore = calculateFuzzyScore(rp.authorisationStatus || rp.status || '', cleanQuery, 0.9);
      const reasonScore = calculateFuzzyScore(rp.clinicalRationale || rp.description || '', cleanQuery, 0.8);

      const maxScore = Math.max(clientScore, pracScore, authScore, reasonScore);
      if (maxScore > 25) {
        results.push({
          id: `rp-${rp.id}`,
          category: 'RESTRICTIVE_PRACTICE',
          title: `Restrictive Practice: ${rp.practiceType}`,
          subtitle: `Participant: ${rp.clientName} • Status: ${rp.authorisationStatus || rp.status}`,
          snippet: `Authorised By: ${rp.authorisedBy || rp.authorizationBody || 'Senior Practitioner'} | Expiry: ${rp.expiryDate || 'Active'} | Fade Plan: ${rp.fadePlanStatus || 'In Progress'}`,
          targetTab: 'restrictive-practices',
          entityId: rp.id,
          score: maxScore,
          badge: {
            label: 'Restrictive Practice',
            color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          },
          metadata: {
            practiceType: rp.practiceType,
            status: rp.authorisationStatus || rp.status,
          }
        });
      }
    });
  }

  // Sort by highest fuzzy relevance score descending
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
