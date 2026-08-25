import {
  Client,
  CaseNote,
  Practitioner,
  BillingClaim,
  Incident,
  RestrictivePractice,
  ABCLog,
  SearchResult
} from '@/types';
import { TabType } from '@/stores/useManagementStore';

export interface IndexedSearchResult {
  id: string;
  category: 'CLIENT' | 'CASE_NOTE' | 'PRACTITIONER' | 'BILLING' | 'INCIDENT' | 'RESTRICTIVE_PRACTICE' | 'ABC_LOG';
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
  matchedHighlights?: string[];
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface CrossModuleSearchIndexParams {
  query: string;
  categoryFilter?: 'ALL' | 'CLIENT' | 'CASE_NOTE' | 'PRACTITIONER' | 'BILLING' | 'INCIDENT' | 'RESTRICTIVE_PRACTICE' | 'ABC_LOG';
  clients?: Client[];
  caseNotes?: CaseNote[];
  practitioners?: Practitioner[];
  billingClaims?: BillingClaim[];
  incidents?: Incident[];
  restrictivePractices?: RestrictivePractice[];
  abcLogs?: ABCLog[];
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
 * Highlights matched keywords in a snippet text with <mark> tags
 */
export function highlightMatchedSnippet(text: string, query: string, maxLength = 160): string {
  if (!text) return '';
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return text.slice(0, maxLength);

  const tokens = cleanQuery
    .split(/\s+/)
    .filter((t) => t.length > 2 && !['the', 'and', 'for', 'with', 'all', 'show', 'find', 'which', 'who', 'has', 'have'].includes(t));

  if (tokens.length === 0) return text.slice(0, maxLength);

  let snippet = text;
  // Find first match position to center snippet around it
  let firstPos = -1;
  for (const token of tokens) {
    const pos = text.toLowerCase().indexOf(token);
    if (pos !== -1 && (firstPos === -1 || pos < firstPos)) {
      firstPos = pos;
    }
  }

  if (firstPos > 40) {
    const start = Math.max(0, firstPos - 30);
    snippet = `...${text.slice(start, start + maxLength)}...`;
  } else {
    snippet = text.slice(0, maxLength);
    if (text.length > maxLength) snippet += '...';
  }

  // Highlight all tokens
  for (const token of tokens) {
    const regex = new RegExp(`(${token})`, 'gi');
    snippet = snippet.replace(regex, '<mark class="bg-teal-500/25 text-teal-200 font-bold px-0.5 rounded">$1</mark>');
  }

  return snippet;
}

/**
 * Parses natural language query intents, dates, amounts, and concepts
 */
interface ParsedNLQuery {
  rawQuery: string;
  cleanText: string;
  isIncidentIntent: boolean;
  isBudgetIntent: boolean;
  isBillingIntent: boolean;
  isClinicalNoteIntent: boolean;
  isABCIntent: boolean;
  isRPIntent: boolean;
  isRiskIntent: boolean;
  minAmount?: number;
  maxAmount?: number;
  dateCutoffMonths?: number;
  statusFilter?: string;
  riskFilter?: string;
  targetDisability?: string;
}

function parseNaturalLanguageQuery(query: string): ParsedNLQuery {
  const q = query.toLowerCase();

  // 1. Amount Extraction (e.g. "$5,000", "5000", "over $5,000", "> 1000")
  let minAmount: number | undefined;
  let maxAmount: number | undefined;
  const amountMatch = q.match(/(?:over|greater than|more than|>|above|\$)\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    const num = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) minAmount = num;
  }
  const underAmountMatch = q.match(/(?:under|less than|<|below)\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i);
  if (underAmountMatch) {
    const num = parseFloat(underAmountMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) maxAmount = num;
  }

  // 2. Date Cutoff (e.g. "in the last 6 months", "past 30 days", "past year")
  let dateCutoffMonths: number | undefined;
  if (q.includes('last 6 months') || q.includes('past 6 months')) dateCutoffMonths = 6;
  else if (q.includes('last 3 months') || q.includes('past 3 months')) dateCutoffMonths = 3;
  else if (q.includes('last month') || q.includes('past 30 days') || q.includes('past month')) dateCutoffMonths = 1;
  else if (q.includes('last 12 months') || q.includes('past year') || q.includes('this year')) dateCutoffMonths = 12;

  // 3. Category Intents
  const isIncidentIntent = q.includes('incident') || q.includes('harm') || q.includes('self-harm') || q.includes('injury') || q.includes('police') || q.includes('hospital') || q.includes('emergency') || q.includes('assault') || q.includes('abuse') || q.includes('crisis');
  const isBudgetIntent = q.includes('budget') || q.includes('unused') || q.includes('funding') || q.includes('burn rate') || q.includes('deplet') || q.includes('allocated') || q.includes('spent');
  const isBillingIntent = q.includes('claim') || q.includes('invoice') || q.includes('billing') || q.includes('proda') || q.includes('pace') || q.includes('paid') || q.includes('unpaid') || q.includes('rejected');
  const isClinicalNoteIntent = q.includes('case note') || q.includes('note') || q.includes('soap') || q.includes('birp') || q.includes('session') || q.includes('progress') || q.includes('consultation');
  const isABCIntent = q.includes('abc') || q.includes('antecedent') || q.includes('behavior') || q.includes('consequence') || q.includes('trigger') || q.includes('meltdown') || q.includes('escape') || q.includes('tangible');
  const isRPIntent = q.includes('restrictive') || q.includes('chemical') || q.includes('mechanical') || q.includes('seclusion') || q.includes('restraint') || q.includes('environmental');
  const isRiskIntent = q.includes('risk') || q.includes('critical') || q.includes('high risk') || q.includes('safety') || q.includes('flag');

  // Status Filter
  let statusFilter: string | undefined;
  if (q.includes('paid')) statusFilter = 'Paid';
  else if (q.includes('unpaid') || q.includes('pending')) statusFilter = 'Pending';
  else if (q.includes('approved')) statusFilter = 'Approved';
  else if (q.includes('rejected')) statusFilter = 'Rejected';

  // Risk Filter
  let riskFilter: string | undefined;
  if (q.includes('critical')) riskFilter = 'Critical';
  else if (q.includes('high risk') || q.includes('high')) riskFilter = 'High';
  else if (q.includes('medium')) riskFilter = 'Medium';
  else if (q.includes('low')) riskFilter = 'Low';

  return {
    rawQuery: query,
    cleanText: q,
    isIncidentIntent,
    isBudgetIntent,
    isBillingIntent,
    isClinicalNoteIntent,
    isABCIntent,
    isRPIntent,
    isRiskIntent,
    minAmount,
    maxAmount,
    dateCutoffMonths,
    statusFilter,
    riskFilter
  };
}

/**
 * Universal Natural Language Semantic Search across all records
 */
export async function executeSemanticSearch(
  query: string,
  records: {
    caseNotes?: CaseNote[];
    incidents?: Incident[];
    abcLogs?: ABCLog[];
    claims?: BillingClaim[];
    billingClaims?: BillingClaim[];
    clients?: Client[];
    practitioners?: Practitioner[];
    restrictivePractices?: RestrictivePractice[];
  }
): Promise<SearchResult[]> {
  const params: CrossModuleSearchIndexParams = {
    query,
    categoryFilter: 'ALL',
    clients: records.clients || [],
    caseNotes: records.caseNotes || [],
    practitioners: records.practitioners || [],
    billingClaims: records.claims || records.billingClaims || [],
    incidents: records.incidents || [],
    restrictivePractices: records.restrictivePractices || [],
    abcLogs: records.abcLogs || [],
    limit: 50
  };

  const indexed = searchCrossModuleIndex(params);
  return indexed.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    subtitle: r.subtitle,
    snippet: r.snippet,
    targetTab: r.targetTab,
    entityId: r.entityId,
    score: r.score,
    badge: r.badge,
    matchedField: r.matchedField,
    matchedHighlights: r.matchedHighlights,
    metadata: r.metadata
  }));
}

/**
 * Cross-module fuzzy & natural language semantic indexing and search engine
 */
export function searchCrossModuleIndex({
  query,
  categoryFilter = 'ALL',
  clients = [],
  caseNotes = [],
  practitioners = [],
  billingClaims = [],
  incidents = [],
  restrictivePractices = [],
  abcLogs = [],
  limit = 30
}: CrossModuleSearchIndexParams): IndexedSearchResult[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const nl = parseNaturalLanguageQuery(cleanQuery);
  const results: IndexedSearchResult[] = [];
  const now = Date.now();

  // 1. Index and search Clients
  if (categoryFilter === 'ALL' || categoryFilter === 'CLIENT') {
    clients.forEach((c) => {
      let score = 0;
      const unusedBudget = Math.max(0, (c.totalBudget || 0) - (c.spentBudget || 0));

      // Semantic Budget Criteria match
      if (nl.isBudgetIntent && nl.minAmount !== undefined) {
        if (unusedBudget >= nl.minAmount) {
          score += 65;
        }
      }

      // Risk Level match
      if (nl.isRiskIntent || nl.riskFilter) {
        if (nl.riskFilter && c.riskLevel?.toLowerCase() === nl.riskFilter.toLowerCase()) {
          score += 55;
        } else if (nl.isRiskIntent && (c.riskLevel === 'High' || c.riskLevel === 'Critical')) {
          score += 45;
        }
      }

      // Text fuzzy matches
      const nameScore = calculateFuzzyScore(c.name, cleanQuery, 1.3);
      const ndisScore = calculateFuzzyScore(c.ndisNumber, cleanQuery, 1.2);
      const disabilityScore = calculateFuzzyScore(c.primaryDisability, cleanQuery, 1.0);
      const suburbScore = calculateFuzzyScore(c.suburb || c.address?.suburb || '', cleanQuery, 0.8);
      const pracScore = calculateFuzzyScore(c.primaryPractitionerName || '', cleanQuery, 0.9);

      const maxTextScore = Math.max(nameScore, ndisScore, disabilityScore, suburbScore, pracScore);
      score = Math.max(score, maxTextScore);

      if (score > 25) {
        const snippetText = `NDIS #${c.ndisNumber} • ${c.primaryDisability} | Risk: ${c.riskLevel} | Spent: $${(c.spentBudget || 0).toLocaleString()} / Total: $${(c.totalBudget || 0).toLocaleString()} (Unused: $${unusedBudget.toLocaleString()}) | Suburb: ${c.suburb || c.address?.suburb || 'Metro'}`;
        results.push({
          id: `client-${c.id}`,
          category: 'CLIENT',
          title: c.name,
          subtitle: `NDIS #${c.ndisNumber} • ${c.primaryDisability}`,
          snippet: highlightMatchedSnippet(snippetText, cleanQuery),
          targetTab: 'clients',
          entityId: c.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: 'Participant',
            color: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          },
          matchedField: nameScore > 30 ? 'Name' : ndisScore > 30 ? 'NDIS Number' : 'Disability/Budget',
          metadata: {
            ndisNumber: c.ndisNumber,
            riskLevel: c.riskLevel,
            totalBudget: c.totalBudget,
            unusedBudget,
          }
        });
      }
    });
  }

  // 2. Index and search Case Notes
  if (categoryFilter === 'ALL' || categoryFilter === 'CASE_NOTE') {
    caseNotes.forEach((n) => {
      let score = 0;

      // Date cutoff evaluation
      let passesDate = true;
      if (nl.dateCutoffMonths) {
        const noteTime = n.date ? new Date(n.date).getTime() : new Date(n.createdAt || 0).getTime();
        const cutoffMs = nl.dateCutoffMonths * 30 * 24 * 3600 * 1000;
        passesDate = (now - noteTime) <= cutoffMs;
      }

      if (nl.isClinicalNoteIntent) score += 30;

      const clientScore = calculateFuzzyScore(n.clientName, cleanQuery, 1.2);
      const pracScore = calculateFuzzyScore(n.practitionerName, cleanQuery, 1.0);
      const subjScore = calculateFuzzyScore(n.subjective || '', cleanQuery, 1.0);
      const objScore = calculateFuzzyScore(n.objective || '', cleanQuery, 0.9);
      const assessScore = calculateFuzzyScore(n.assessment || '', cleanQuery, 0.9);
      const planScore = calculateFuzzyScore(n.plan || '', cleanQuery, 0.9);

      const maxTextScore = Math.max(clientScore, pracScore, subjScore, objScore, assessScore, planScore);
      score = Math.max(score, maxTextScore);

      if (passesDate && score > 25) {
        const fullContent = `${n.subjective || ''} ${n.objective || ''} ${n.assessment || ''} ${n.plan || ''}`;
        results.push({
          id: `note-${n.id}`,
          category: 'CASE_NOTE',
          title: `${n.clientName} - ${n.format} Clinical Note`,
          subtitle: `Practitioner: ${n.practitionerName} • Date: ${n.date || n.sessionDate || 'Recent'}`,
          snippet: highlightMatchedSnippet(fullContent || 'Clinical progress note record.', cleanQuery),
          targetTab: 'case-notes',
          entityId: n.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: `${n.format} Note`,
            color: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          },
          matchedField: clientScore > 30 ? 'Client Name' : 'Clinical Note Text',
          metadata: {
            date: n.date,
            format: n.format,
            practitionerName: n.practitionerName,
          }
        });
      }
    });
  }

  // 3. Index and search Incidents
  if (categoryFilter === 'ALL' || categoryFilter === 'INCIDENT') {
    incidents.forEach((inc) => {
      let score = 0;

      // Date cutoff check (e.g. "last 6 months")
      let passesDate = true;
      if (nl.dateCutoffMonths) {
        const incTime = inc.incidentDate ? new Date(inc.incidentDate).getTime() : new Date(inc.createdAt || 0).getTime();
        const cutoffMs = nl.dateCutoffMonths * 30 * 24 * 3600 * 1000;
        passesDate = (now - incTime) <= cutoffMs;
      }

      if (nl.isIncidentIntent) {
        score += 45;
        const descLower = (inc.description || '').toLowerCase();
        if (cleanQuery.includes('self-harm') && (descLower.includes('self-harm') || descLower.includes('harm') || descLower.includes('head-bang') || descLower.includes('injur'))) {
          score += 40;
        }
        if (cleanQuery.includes('police') && (descLower.includes('police') || descLower.includes('officer'))) {
          score += 35;
        }
        if (cleanQuery.includes('critical') && inc.severity?.includes('Critical')) {
          score += 30;
        }
      }

      const clientScore = calculateFuzzyScore(inc.clientName, cleanQuery, 1.2);
      const descScore = calculateFuzzyScore(inc.description || '', cleanQuery, 1.1);
      const sevScore = calculateFuzzyScore(inc.severity, cleanQuery, 0.9);
      const actScore = calculateFuzzyScore(inc.immediateActionTaken || '', cleanQuery, 0.9);

      const maxTextScore = Math.max(clientScore, descScore, sevScore, actScore);
      score = Math.max(score, maxTextScore);

      if (passesDate && score > 25) {
        results.push({
          id: `inc-${inc.id}`,
          category: 'INCIDENT',
          title: `Incident: ${inc.clientName} (${inc.severity})`,
          subtitle: `Date: ${inc.incidentDate} • Status: ${inc.status} • NDIS Reportable: ${inc.isNdisReportable ? 'Yes (24h)' : 'No'}`,
          snippet: highlightMatchedSnippet(inc.description || inc.immediateActionTaken || 'Reported participant incident log.', cleanQuery),
          targetTab: 'incidents',
          entityId: inc.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: inc.severity,
            color: inc.severity?.includes('Critical')
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          },
          matchedField: clientScore > 30 ? 'Client Name' : 'Incident Description',
          metadata: {
            severity: inc.severity,
            incidentDate: inc.incidentDate,
            isNdisReportable: inc.isNdisReportable,
          }
        });
      }
    });
  }

  // 4. Index and search ABC Logs
  if (categoryFilter === 'ALL' || categoryFilter === 'ABC_LOG') {
    abcLogs.forEach((abc) => {
      let score = 0;

      if (nl.isABCIntent) score += 35;

      const clientScore = calculateFuzzyScore(abc.clientName, cleanQuery, 1.2);
      const antScore = calculateFuzzyScore(abc.antecedent || '', cleanQuery, 1.1);
      const behScore = calculateFuzzyScore(abc.behavior || '', cleanQuery, 1.1);
      const conScore = calculateFuzzyScore(abc.consequence || '', cleanQuery, 0.9);
      const funcScore = calculateFuzzyScore(abc.perceivedFunction || '', cleanQuery, 1.0);

      const maxTextScore = Math.max(clientScore, antScore, behScore, conScore, funcScore);
      score = Math.max(score, maxTextScore);

      if (score > 25) {
        const fullABC = `Antecedent: ${abc.antecedent} | Behavior: ${abc.behavior} | Consequence: ${abc.consequence} | Function: ${abc.perceivedFunction} (${abc.timeOfDay})`;
        results.push({
          id: `abc-${abc.id}`,
          category: 'ABC_LOG',
          title: `ABC Log: ${abc.clientName} (${abc.perceivedFunction})`,
          subtitle: `Time: ${abc.timeOfDay} (${abc.dayOfWeek}) • Intensity: ${abc.intensity}/5 • Location: ${abc.location || 'Activity Center'}`,
          snippet: highlightMatchedSnippet(fullABC, cleanQuery),
          targetTab: 'abc-analyser',
          entityId: abc.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: `ABC: ${abc.perceivedFunction}`,
            color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          },
          matchedField: antScore > 30 ? 'Antecedent' : behScore > 30 ? 'Behavior' : 'ABC Function',
          metadata: {
            perceivedFunction: abc.perceivedFunction,
            intensity: abc.intensity,
          }
        });
      }
    });
  }

  // 5. Index and search Billing Claims & Invoices
  if (categoryFilter === 'ALL' || categoryFilter === 'BILLING') {
    billingClaims.forEach((b) => {
      let score = 0;

      if (nl.isBillingIntent) score += 30;

      // Status check
      if (nl.statusFilter && b.status?.toLowerCase() === nl.statusFilter.toLowerCase()) {
        score += 35;
      }

      // Amount filter
      if (nl.minAmount !== undefined && (b.totalAmount || 0) >= nl.minAmount) {
        score += 40;
      }

      const invScore = calculateFuzzyScore(b.invoiceNumber || '', cleanQuery, 1.3);
      const clientScore = calculateFuzzyScore(b.clientName, cleanQuery, 1.1);
      const itemScore = calculateFuzzyScore(b.ndisSupportItem || b.supportItemCode || '', cleanQuery, 1.0);
      const statusScore = calculateFuzzyScore(b.status || '', cleanQuery, 0.8);

      const maxTextScore = Math.max(invScore, clientScore, itemScore, statusScore);
      score = Math.max(score, maxTextScore);

      if (score > 25) {
        const fullClaim = `Support Item: ${b.ndisSupportItem || b.supportItemCode} | Total: $${b.totalAmount.toFixed(2)} AUD | Hours: ${b.hours || b.quantity || 1} hrs @ $${b.unitRate || b.unitPrice}/hr | Status: ${b.status} | Invoice: ${b.invoiceNumber}`;
        results.push({
          id: `billing-${b.id}`,
          category: 'BILLING',
          title: `${b.invoiceNumber} - ${b.clientName}`,
          subtitle: `$${b.totalAmount.toFixed(2)} AUD • Status: ${b.status} • Service Date: ${b.serviceDate || 'Recent'}`,
          snippet: highlightMatchedSnippet(fullClaim, cleanQuery),
          targetTab: 'billing',
          entityId: b.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: `Claim: ${b.status}`,
            color: b.status === 'Paid'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : b.status === 'Rejected'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          },
          matchedField: invScore > 30 ? 'Invoice #' : clientScore > 30 ? 'Client Name' : 'Support Item Code',
          metadata: {
            invoiceNumber: b.invoiceNumber,
            totalAmount: b.totalAmount,
            status: b.status,
          }
        });
      }
    });
  }

  // 6. Index and search Practitioners & Staff
  if (categoryFilter === 'ALL' || categoryFilter === 'PRACTITIONER') {
    practitioners.forEach((p) => {
      const nameScore = calculateFuzzyScore(p.name, cleanQuery, 1.2);
      const posScore = calculateFuzzyScore(p.position, cleanQuery, 1.0);
      const qualScore = calculateFuzzyScore(p.qualification, cleanQuery, 0.9);
      const pbsScore = calculateFuzzyScore(p.pbsRegistrationLevel || '', cleanQuery, 1.0);
      const regScore = calculateFuzzyScore(p.ndisRegistrationNumber || '', cleanQuery, 1.0);

      const maxScore = Math.max(nameScore, posScore, qualScore, pbsScore, regScore);
      if (maxScore > 25) {
        const fullPrac = `Position: ${p.position} | PBS Level: ${p.pbsRegistrationLevel || 'Proficient Practitioner'} | Qualification: ${p.qualification} | Caseload: ${p.activeCaseloadCount}/${p.caseloadLimit} | Screening: ${p.screeningStatus}`;
        results.push({
          id: `prac-${p.id}`,
          category: 'PRACTITIONER',
          title: p.name,
          subtitle: `${p.position} • ${p.pbsRegistrationLevel || 'Proficient Practitioner'}`,
          snippet: highlightMatchedSnippet(fullPrac, cleanQuery),
          targetTab: 'hr-roster',
          entityId: p.id,
          score: Math.min(100, Math.round(maxScore)),
          badge: {
            label: 'Practitioner',
            color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          },
          matchedField: nameScore > 30 ? 'Staff Name' : 'Position/Registration',
          metadata: {
            screeningStatus: p.screeningStatus,
            successRate: p.historicalSuccessRate,
          }
        });
      }
    });
  }

  // 7. Index and search Restrictive Practices
  if (categoryFilter === 'ALL' || categoryFilter === 'RESTRICTIVE_PRACTICE') {
    restrictivePractices.forEach((rp) => {
      let score = 0;
      if (nl.isRPIntent) score += 35;

      const clientScore = calculateFuzzyScore(rp.clientName, cleanQuery, 1.2);
      const pracScore = calculateFuzzyScore(rp.practiceType, cleanQuery, 1.1);
      const authScore = calculateFuzzyScore(rp.authorisationStatus || rp.status || '', cleanQuery, 0.9);
      const reasonScore = calculateFuzzyScore(rp.clinicalRationale || rp.description || '', cleanQuery, 0.8);

      const maxTextScore = Math.max(clientScore, pracScore, authScore, reasonScore);
      score = Math.max(score, maxTextScore);

      if (score > 25) {
        const fullRP = `Restrictive Practice: ${rp.practiceType} (${rp.status || 'Active'}) | Description: ${rp.description || 'Clinical restriction'} | Authorised by: ${rp.authorizationBody || rp.authorisedBy || 'Senior Practitioner'} | Reduction Plan: ${rp.reductionPlanSummary || 'Quarterly review active'}`;
        results.push({
          id: `rp-${rp.id}`,
          category: 'RESTRICTIVE_PRACTICE',
          title: `Restrictive Practice: ${rp.practiceType}`,
          subtitle: `Participant: ${rp.clientName} • Status: ${rp.authorisationStatus || rp.status || 'Active'}`,
          snippet: highlightMatchedSnippet(fullRP, cleanQuery),
          targetTab: 'restrictive-practices',
          entityId: rp.id,
          score: Math.min(100, Math.round(score)),
          badge: {
            label: `${rp.practiceType} Restraint`,
            color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          },
          matchedField: pracScore > 30 ? 'Practice Type' : 'Client Name',
          metadata: {
            practiceType: rp.practiceType,
            status: rp.authorisationStatus || rp.status,
          }
        });
      }
    });
  }

  // Sort by highest relevance score descending and apply limit
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
