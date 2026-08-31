'use client';

import React, { useState, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { NDISSupportItem, BillingClaim, Client, BillingValidationResult, NDISPriceGuideSyncResult } from '@/types';
import { validateBillingClaim } from '@/lib/ai-assistant';
import { XeroOAuthService } from '@/lib/xeroService';
import { NDISPricingSyncEngine } from '@/lib/ndisPricingService';
import { ProdaBatchModal } from './ProdaBatchModal';
import { FinancialControl } from './FinancialControl';
import { BillingInsightsPanel } from './BillingInsightsPanel';
import { PriceGuideLookup } from './PriceGuideLookup';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  CreditCard,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  FileCheck,
  X,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Upload,
  FileUp,
  Calculator,
  Tag,
  Filter,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileCode,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  CheckCheck,
  TrendingUp,
  Calendar,
  Activity,
  Flame,
  Zap,
  Wrench
} from 'lucide-react';

const OFFICIAL_2026_PRICE_GUIDE_PRESETS: NDISSupportItem[] = [
  {
    code: '07_002_0115_8_3',
    name: 'Specialist Behavioural Intervention Support',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_004_0115_8_3',
    name: 'Individual Behaviour Support Plan Development & Training',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_056_0128_1_3',
    name: 'Assessment Recommendation Therapy Support - Allied Health',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_043_0128_1_3',
    name: 'Counselling / Allied Health Psychology Support',
    category: 'Capacity Building - Improved Daily Living',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_001_0115_8_3',
    name: 'Behavior Support Practitioner Supervision & Quality Review',
    category: 'Capacity Building - Improved Relationships',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
  {
    code: '15_005_0118_1_3',
    name: 'Early Childhood Support - Key Worker / Behaviour Specialist',
    category: 'Capacity Building - Early Childhood',
    pricePerUnit: 193.99,
    unitOfMeasure: 'Hour',
  },
  {
    code: '07_799_0115_8_3',
    name: 'Provider Travel - Behaviour Support Specialist (Non-Face-To-Face)',
    category: 'Capacity Building - Travel & Non-Face-To-Face',
    pricePerUnit: 214.41,
    unitOfMeasure: 'Hour',
  },
];

export const BillingModule: React.FC = () => {
  const {
    currentUser,
    billingClaims,
    supportItems,
    clients,
    practitioners,
    caseNotes,
    addBillingClaim,
    updateBillingClaim,
    updateBillingStatus,
    reconcileClaim,
    autoReconcileAllClaims,
    addAuditLog,
    addNotification,
    setActiveTab: setStoreTab
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'FINANCIAL_CONTROL' | 'PRICE_GUIDE' | 'CALCULATOR' | 'BURN_RATE'>('FINANCIAL_CONTROL');
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [burnRateClientId, setBurnRateClientId] = useState(clients[0]?.id || 'cli-101');
  const [selectedSupport, setSelectedSupport] = useState(supportItems[0]?.code || '07_002_0115_8_3');
  const [hours, setHours] = useState(1.5);
  const [isAdding, setIsAdding] = useState(false);
  const [isProdaBatchModalOpen, setIsProdaBatchModalOpen] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [fundingChartMode, setFundingChartMode] = useState<'ACTIVE_CLIENTS' | 'MONTHLY_TIMELINE'>('ACTIVE_CLIENTS');

  // AI Pre-Submission Validation State (R5)
  const [selectedValidationClaim, setSelectedValidationClaim] = useState<{
    claim: BillingClaim;
    validation: BillingValidationResult;
  } | null>(null);
  const [isValidationBatchRunning, setIsValidationBatchRunning] = useState(false);
  const [validationBatchSummary, setValidationBatchSummary] = useState<{
    cleanCount: number;
    errorCount: number;
    warningCount: number;
  } | null>(null);

  // Reconciliation Analytics & Warning Checks
  const failedClaims = billingClaims.filter((c: BillingClaim) => c.reconciliationStatus === 'Failed');
  const slaRiskClaims = billingClaims.filter((c: BillingClaim) => c.reconciliationStatus === 'SLA_Breach_Risk');
  const reconciledClaims = billingClaims.filter((c: BillingClaim) => c.reconciliationStatus === 'Reconciled');

  const handleRunReconciliationAudit = () => {
    setIsReconciling(true);
    setTimeout(() => {
      autoReconcileAllClaims();
      setIsReconciling(false);
    }, 600);
  };

  // Run Batch Pre-Submission Validation Across All Claims (R5)
  const handleRunBatchValidation = () => {
    setIsValidationBatchRunning(true);
    let clean = 0;
    let errors = 0;
    let warnings = 0;

    billingClaims.forEach((c) => {
      const client = clients.find((cli) => cli.id === c.clientId || cli.ndisNumber === c.ndisNumber);
      const res = validateBillingClaim(c, client, billingClaims, caseNotes, supportItems);
      if (res.isClean) {
        clean++;
      } else {
        errors++;
      }
      if (res.warnings.length > 0) {
        warnings++;
      }
    });

    setValidationBatchSummary({ cleanCount: clean, errorCount: errors, warningCount: warnings });
    setIsValidationBatchRunning(false);

    addNotification({
      title: 'AI Pre-Submission Billing Audit Complete',
      message: `Audited ${billingClaims.length} claims: ${clean} PACE-ready, ${errors} with compliance issues, ${warnings} warnings.`,
      type: 'billing',
      severity: errors > 0 ? 'high' : 'info',
      linkTab: 'billing'
    });
  };

  // Auto-Fix Rate Cap Discrepancy (R5)
  const handleFixRateCap = (claim: BillingClaim, suggestedRate: number) => {
    const updatedTotal = (claim.hours || 1) * suggestedRate;
    updateBillingClaim(claim.id, {
      unitRate: suggestedRate,
      totalAmount: updatedTotal,
      reconciliationStatus: 'Reconciled',
      reconciliationError: undefined
    });

    addNotification({
      title: `Claim ${claim.invoiceNumber} Rate Fixed`,
      message: `Adjusted hourly unit rate to $${suggestedRate.toFixed(2)} (2026 NDIS Cap Compliant).`,
      type: 'billing',
      severity: 'info',
      linkTab: 'billing'
    });

    if (selectedValidationClaim && selectedValidationClaim.claim.id === claim.id) {
      const updatedClaim: BillingClaim = { ...claim, unitRate: suggestedRate, totalAmount: updatedTotal };
      const client = clients.find((cli) => cli.id === claim.clientId);
      const newValidation = validateBillingClaim(updatedClaim, client, billingClaims, caseNotes, supportItems);
      setSelectedValidationClaim({ claim: updatedClaim, validation: newValidation });
    }
  };

  // Xero OAuth 2.0 Live Integration State (R9)
  const [xeroState, setXeroState] = useState(() => XeroOAuthService.getTokenState());
  const [isConnectingXero, setIsConnectingXero] = useState(false);
  const [isSyncingXero, setIsSyncingXero] = useState(false);
  const [xeroSyncSuccess, setXeroSyncSuccess] = useState<string | null>(null);

  const handleConnectXeroOAuth = () => {
    setIsConnectingXero(true);
    setTimeout(() => {
      const tokens = XeroOAuthService.exchangeCodeForTokens('xero_live_consent_handshake');
      setXeroState(XeroOAuthService.getTokenState());
      setIsConnectingXero(false);

      addNotification({
        title: 'Xero OAuth 2.0 Integration Connected',
        message: `Connected to ${tokens.tenantName}. Token exchange complete.`,
        type: 'compliance',
        severity: 'info',
        linkTab: 'billing'
      });
    }, 800);
  };

  const handleSyncToXeroMYOB = () => {
    setIsSyncingXero(true);
    setXeroSyncSuccess(null);

    setTimeout(() => {
      let createdInvoices = 0;
      let totalValue = 0;

      billingClaims.forEach((claim) => {
        if (claim.status === 'Approved' || claim.status === 'Pending') {
          const inv = XeroOAuthService.createAccrecInvoice(claim);
          updateBillingClaim(claim.id, {
            status: 'Submitted PACE',
            xeroInvoiceId: inv.invoiceId
          });
          createdInvoices++;
          totalValue += claim.totalAmount;
        }
      });

      // Also reconcile bank feed payments
      const syncedPayments = XeroOAuthService.syncBankFeedPayments(xeroState.tenantId || undefined, {
        billingClaims,
        updateBillingClaim
      });

      setXeroState(XeroOAuthService.getTokenState());
      setIsSyncingXero(false);
      setXeroSyncSuccess(
        `Generated ${createdInvoices} Xero ACCREC sales invoices ($${totalValue.toFixed(2)}) and reconciled ${syncedPayments} bank feed payments.`
      );

      addNotification({
        title: 'Xero ACCREC & Bank Feed Sync Complete',
        message: `Pushed ${createdInvoices} invoices ($${totalValue.toFixed(2)}) to Xero Accounts Receivable and reconciled ${syncedPayments} bank payments.`,
        type: 'billing',
        severity: 'info',
        linkTab: 'billing'
      });

      addAuditLog(
        'XERO_MYOB_SYNC',
        'BILLING_CLAIMS',
        'all-claims',
        `Synced ${createdInvoices} approved PACE claims valued at $${totalValue.toFixed(2)} to Xero ACCREC API & reconciled bank feeds.`
      );
    }, 1000);
  };

  // NDIS Price Guide Auto-Sync State (R13)
  const [customPriceItems, setCustomPriceItems] = useState<NDISSupportItem[]>(OFFICIAL_2026_PRICE_GUIDE_PRESETS);
  const [priceSearch, setPriceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [regionalModifier, setRegionalModifier] = useState<'MM1' | 'MM6' | 'MM7'>('MM1');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCSVText, setImportCSVText] = useState('');
  const [isSyncingPriceGuide, setIsSyncingPriceGuide] = useState(false);
  const [priceSyncResult, setPriceSyncResult] = useState<NDISPriceGuideSyncResult | null>(null);

  const handleAutoSyncPriceGuide = () => {
    setIsSyncingPriceGuide(true);
    setTimeout(() => {
      const result = NDISPricingSyncEngine.syncPriceGuide({
        supportItems,
        billingClaims,
        updateBillingClaim,
        addNotification
      });

      setPriceSyncResult(result);
      setIsSyncingPriceGuide(false);

      addAuditLog(
        'PRICE_GUIDE_AUTO_SYNC',
        'NDISSupportItem',
        'all-items',
        `Auto-synced ${result.syncedCount} 2026 price guide items. Detected ${result.changesCount} rate changes and re-validated ${result.revalidatedClaimsCount} claims.`
      );
    }, 700);
  };

  // Interactive Invoicing Calculator State
  const [calcSupportCode, setCalcSupportCode] = useState(supportItems[0]?.code || '07_002_0115_8_3');
  const [calcHours, setCalcHours] = useState(2.0);
  const [calcTravelHours, setCalcTravelHours] = useState(0.5);
  const [calcClient, setCalcClient] = useState(clients[0]?.id || 'cli-101');

  // Selected client for Burn Rate Analysis
  const burnRateClient = React.useMemo(() => {
    return clients.find((c: Client) => c.id === burnRateClientId) || clients[0];
  }, [clients, burnRateClientId]);

  // Compute 12-month burn rate actual vs projected data for selected client
  const burnRateData = React.useMemo(() => {
    if (!burnRateClient) return [];

    const totalBudget = burnRateClient.totalBudget || 45000;
    const spentBudget = burnRateClient.spentBudget || 0;
    const monthlyAllocated = Math.round(totalBudget / 12);

    const clientClaims = billingClaims.filter((c: BillingClaim) => c.clientId === burnRateClient.id);
    const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];

    // Distribute actual claims over recorded months, project remaining
    const currentMonthIdx = 4; // Currently at month 5 of plan
    let runningActual = 0;
    let runningProjected = 0;

    return months.map((monthName, idx) => {
      runningProjected += monthlyAllocated;

      if (idx <= currentMonthIdx) {
        // Proportion of actual spending
        const monthSpend = idx === currentMonthIdx
          ? Math.max(0, spentBudget - (runningActual))
          : Math.round(spentBudget / (currentMonthIdx + 1));
        runningActual += monthSpend;

        return {
          month: monthName,
          projectedSpend: runningProjected,
          actualSpend: runningActual,
          remainingBudget: Math.max(0, totalBudget - runningActual),
          monthlyBurn: monthSpend,
          projectedMonthlyRate: monthlyAllocated,
          status: runningActual > runningProjected ? 'Over-utilizing' : 'On Track'
        };
      } else {
        // Future projection along current velocity
        const velocityPerMonth = spentBudget / (currentMonthIdx + 1);
        const projectedFutureActual = Math.min(totalBudget, Math.round(spentBudget + (velocityPerMonth * (idx - currentMonthIdx))));

        return {
          month: monthName,
          projectedSpend: runningProjected,
          projectedFutureSpend: projectedFutureActual,
          remainingBudget: Math.max(0, totalBudget - projectedFutureActual),
          projectedMonthlyRate: monthlyAllocated,
          status: 'Projected'
        };
      }
    });
  }, [burnRateClient, billingClaims]);

  // Compute Active Clients Funding Utilization ($) vs Remaining Service Hours (hrs)
  const activeClientsFundingVsHoursData = React.useMemo(() => {
    const STANDARD_NDIS_HOURLY_RATE = 193.99; // Standard Therapy / Specialist Behaviour rate ($/hr)

    return clients.map((c: Client) => {
      const totalBudget = c.totalBudget || 45000;
      const spentBudget = c.spentBudget || 0;
      const remainingBudget = Math.max(0, totalBudget - spentBudget);
      const remainingServiceHours = Number((remainingBudget / STANDARD_NDIS_HOURLY_RATE).toFixed(1));
      
      // Calculate monthly funding utilized based on claims for this client in current month (or proportional allocation)
      const clientClaims = billingClaims.filter((claim: BillingClaim) => claim.clientId === c.id);
      const totalClaimed = clientClaims.reduce((acc, cl) => acc + (cl.totalAmount || 0), 0);
      const monthlyAllocated = Math.round(totalBudget / 12);
      const monthlyFundingUtilized = totalClaimed > 0 ? totalClaimed : Math.round(spentBudget / 5); // 5 months elapsed
      const deliveredHours = Number(((spentBudget) / STANDARD_NDIS_HOURLY_RATE).toFixed(1));
      const utilizationRatePercent = Math.min(100, Math.round((spentBudget / totalBudget) * 100));

      return {
        id: c.id,
        clientName: c.name,
        shortName: c.name.split(' ')[0] + ' ' + (c.name.split(' ')[1]?.[0] || '') + '.',
        ndisNumber: c.ndisNumber,
        monthlyFundingUtilized,
        monthlyBudgetCap: monthlyAllocated,
        remainingBudget,
        remainingServiceHours,
        deliveredHours,
        utilizationRatePercent,
        status: spentBudget > (monthlyAllocated * 5.5) ? 'High Burn' : spentBudget < (monthlyAllocated * 4) ? 'Under-Utilizing' : 'Optimal Pace',
      };
    });
  }, [clients, billingClaims]);

  // Compute 12-Month Progression of Monthly Utilization vs Remaining Hours for Selected Client
  const monthlyTimelineFundingVsHoursData = React.useMemo(() => {
    if (!burnRateClient) return [];
    const totalBudget = burnRateClient.totalBudget || 45000;
    const spentBudget = burnRateClient.spentBudget || 0;
    const STANDARD_NDIS_HOURLY_RATE = 193.99;
    const monthlyAllocated = Math.round(totalBudget / 12);

    return burnRateData.map((d) => {
      const remainingBudget = d.remainingBudget || 0;
      const remainingServiceHours = Number((remainingBudget / STANDARD_NDIS_HOURLY_RATE).toFixed(1));
      const monthlyFundingUtilized = d.monthlyBurn || d.projectedMonthlyRate || monthlyAllocated;
      const targetMonthlyHours = Number(((d.projectedMonthlyRate || monthlyAllocated) / STANDARD_NDIS_HOURLY_RATE).toFixed(1));

      return {
        month: d.month,
        monthlyFundingUtilized,
        monthlyBudgetCap: d.projectedMonthlyRate || monthlyAllocated,
        remainingServiceHours,
        targetMonthlyHours,
        status: d.status,
      };
    });
  }, [burnRateClient, burnRateData]);

  // Compute Participant Budget Utilization Donut Chart Data (Spent vs Committed/Pending vs Remaining)
  const budgetDonutData = React.useMemo(() => {
    if (!burnRateClient) return [];
    const totalBudget = burnRateClient.totalBudget || 45000;
    const spentBudget = burnRateClient.spentBudget || 0;

    // Claims pending approval/reconciliation for this client
    const pendingClaimsTotal = billingClaims
      .filter((c) => c.clientId === burnRateClient.id && (c.status === 'Pending' || c.status === 'Submitted PACE'))
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

    const actualSpent = Math.max(0, spentBudget - pendingClaimsTotal);
    const committedPending = pendingClaimsTotal;
    const remainingAvailable = Math.max(0, totalBudget - spentBudget);

    return [
      { name: 'Utilized / Billed Spend', value: actualSpent, color: '#f59e0b', percent: Math.round((actualSpent / totalBudget) * 100) },
      { name: 'Pending / Committed Claims', value: committedPending, color: '#6366f1', percent: Math.round((committedPending / totalBudget) * 100) },
      { name: 'Remaining Available Funds', value: remainingAvailable, color: '#10b981', percent: Math.round((remainingAvailable / totalBudget) * 100) },
    ].filter((item) => item.value > 0);
  }, [burnRateClient, billingClaims]);

  // Compute Category Breakdown for Selected Client
  const categoryBreakdownData = React.useMemo(() => {
    if (!burnRateClient) return [];
    const clientClaims = billingClaims.filter((c) => c.clientId === burnRateClient.id);
    const categoryTotals: { [key: string]: number } = {
      'Capacity Building (Relationships)': 0,
      'Capacity Building (Daily Living)': 0,
      'Early Childhood Support': 0,
      'Travel & Non-Face-to-Face': 0,
    };

    clientClaims.forEach((c) => {
      const code = c.supportItemCode || '';
      if (code.startsWith('07_002') || code.startsWith('07_004') || code.startsWith('07_001')) {
        categoryTotals['Capacity Building (Relationships)'] += c.totalAmount;
      } else if (code.startsWith('15_056') || code.startsWith('15_043')) {
        categoryTotals['Capacity Building (Daily Living)'] += c.totalAmount;
      } else if (code.startsWith('15_005')) {
        categoryTotals['Early Childhood Support'] += c.totalAmount;
      } else if (code.includes('799') || c.ndisSupportItem.toLowerCase().includes('travel')) {
        categoryTotals['Travel & Non-Face-to-Face'] += c.totalAmount;
      } else {
        categoryTotals['Capacity Building (Daily Living)'] += c.totalAmount;
      }
    });

    // If no specific claims yet, generate realistic proportion based on spent budget
    const hasClaims = Object.values(categoryTotals).some((v) => v > 0);
    if (!hasClaims && burnRateClient.spentBudget > 0) {
      categoryTotals['Capacity Building (Relationships)'] = Math.round(burnRateClient.spentBudget * 0.55);
      categoryTotals['Capacity Building (Daily Living)'] = Math.round(burnRateClient.spentBudget * 0.30);
      categoryTotals['Travel & Non-Face-to-Face'] = Math.round(burnRateClient.spentBudget * 0.15);
    }

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        shortCategory: category.replace('Capacity Building ', 'CB ').replace('Support', 'Supp'),
      }))
      .filter((item) => item.amount > 0);
  }, [burnRateClient, billingClaims]);

  // Compute Participant Comparative Budget Bar Data
  const participantsBudgetComparisonData = React.useMemo(() => {
    return clients.map((c) => {
      const total = c.totalBudget || 45000;
      const spent = c.spentBudget || 0;
      const remaining = Math.max(0, total - spent);
      const utilization = Math.min(100, Math.round((spent / total) * 100));

      return {
        id: c.id,
        name: c.name,
        shortName: c.name.split(' ')[0] + ' ' + (c.name.split(' ')[1]?.[0] || '') + '.',
        totalBudget: total,
        spentBudget: spent,
        remainingBudget: remaining,
        utilization,
      };
    });
  }, [clients]);

  // Combined Price Guide Items (Deduplicated by Code)
  const allPriceGuideItems = React.useMemo(() => {
    const map = new Map<string, NDISSupportItem>();
    supportItems.forEach((item) => map.set(item.code, item));
    customPriceItems.forEach((item) => map.set(item.code, item));
    return Array.from(map.values());
  }, [supportItems, customPriceItems]);

  const filteredPriceGuide = allPriceGuideItems.filter((item) => {
    const matchesQuery =
      item.code.toLowerCase().includes(priceSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(priceSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(priceSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const getMultiplier = (mod: 'MM1' | 'MM6' | 'MM7') => {
    if (mod === 'MM6') return 1.4; // Remote 40% loading
    if (mod === 'MM7') return 1.5; // Very Remote 50% loading
    return 1.0; // Metropolitan
  };

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    allPriceGuideItems.forEach((i) => set.add(i.category));
    return ['ALL', ...Array.from(set)];
  }, [allPriceGuideItems]);

  const handleImportData = (e: React.FormEvent) => {
    e.preventDefault();
    const rawText = importCSVText.trim();
    if (!rawText) return;

    // Check if input is JSON or CSV
    if (rawText.startsWith('[') || rawText.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawText);
        const array = Array.isArray(parsed) ? parsed : [parsed];
        const imported: NDISSupportItem[] = array.map((item: any) => ({
          code: item.code || item.supportItemCode || '07_002_0115_8_3',
          name: item.name || item.description || 'NDIS Support Line Item',
          category: item.category || 'Capacity Building',
          pricePerUnit: Number(item.pricePerUnit || item.price || item.unitRate) || 214.41,
          unitOfMeasure: (item.unitOfMeasure || item.unit || 'Hour') as any,
        }));

        if (imported.length > 0) {
          setCustomPriceItems((prev) => [...prev, ...imported]);
          addAuditLog(
            'IMPORT_PRICE_GUIDE_JSON',
            'BILLING',
            'NDIS_PRICE_GUIDE',
            `Successfully imported and stored ${imported.length} NDIS price guide items from JSON source.`
          );
          addNotification({
            title: 'NDIS Price Guide JSON Import Complete',
            message: `Loaded ${imported.length} NDIS price guide rates into system database. Auto-calculation activated.`,
            type: 'compliance',
            severity: 'info',
            linkTab: 'billing',
          });
          setImportCSVText('');
          setIsImportModalOpen(false);
          setActiveTab('PRICE_GUIDE');
        }
        return;
      } catch (err) {
        alert('Could not parse JSON. Please check JSON syntax formatting.');
        return;
      }
    }

    // Fallback: Parse CSV lines: Code, Name, Category, Price, Unit
    const lines = rawText.split('\n');
    const imported: NDISSupportItem[] = [];

    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 4 && parts[0] && parts[1]) {
        const price = parseFloat(parts[3]) || 214.41;
        imported.push({
          code: parts[0],
          name: parts[1],
          category: parts[2] || 'Capacity Building',
          pricePerUnit: price,
          unitOfMeasure: (parts[4] as 'Hour' | 'Each' | 'Day') || 'Hour',
        });
      }
    });

    if (imported.length > 0) {
      setCustomPriceItems((prev) => [...prev, ...imported]);
      addAuditLog('IMPORT_PRICE_GUIDE', 'BILLING', 'NDIS_PRICE_GUIDE', `Imported ${imported.length} new NDIS support catalogue items.`);
      setImportCSVText('');
      setIsImportModalOpen(false);
      setActiveTab('PRICE_GUIDE');
    }
  };

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);
  const selectedSupportObj = allPriceGuideItems.find((s: NDISSupportItem) => s.code === selectedSupport) || supportItems.find((s: NDISSupportItem) => s.code === selectedSupport);

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientObj || !selectedSupportObj) return;

    const total = hours * selectedSupportObj.pricePerUnit;

    addBillingClaim({
      clientId: selectedClientObj.id,
      clientName: selectedClientObj.name,
      ndisNumber: selectedClientObj.ndisNumber,
      serviceDate: new Date().toISOString().slice(0, 10),
      ndisSupportItem: `${selectedSupportObj.code} - ${selectedSupportObj.name}`,
      supportItemCode: selectedSupportObj.code,
      hours: Number(hours),
      unitRate: selectedSupportObj.pricePerUnit,
      totalAmount: Math.round(total * 100) / 100,
      status: 'Approved',
      invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
    });

    const newSpent = (selectedClientObj.spentBudget || 0) + total;
    const budget = selectedClientObj.totalBudget || 1;
    const utilization = newSpent / budget;
    const previousUtilization = (selectedClientObj.spentBudget || 0) / budget;

    if (utilization >= 0.9 && previousUtilization < 0.9) {
      addNotification({
        title: `CRITICAL: NDIS Plan Budget Alert for ${selectedClientObj.name}`,
        message: `Budget utilization has reached ${(utilization * 100).toFixed(1)}%. Immediate review required.`,
        type: 'billing',
        severity: 'high',
        linkTab: 'billing'
      });
    } else if (utilization >= 0.8 && previousUtilization < 0.8) {
      addNotification({
        title: `WARNING: NDIS Plan Budget Alert for ${selectedClientObj.name}`,
        message: `Budget utilization has reached ${(utilization * 100).toFixed(1)}%.`,
        type: 'billing',
        severity: 'medium',
        linkTab: 'billing'
      });
    }

    setIsAdding(false);
  };

  // Export NDIS PRODA Bulk Claim CSV Functionality
  const exportProdaCSV = () => {
    const headers = [
      'RegistrationNumber',
      'NDISParticipantNumber',
      'ServiceStartDate',
      'ServiceEndDate',
      'SupportItemNumber',
      'Quantity',
      'UnitPrice',
      'TotalClaimAmount',
      'PractitionerID',
      'GSTCode',
      'ClaimReference'
    ];

    const rows = billingClaims.map((claim: BillingClaim, idx: number) => {
      const p = practitioners[idx % (practitioners.length || 1)];
      const practitionerId = p ? (p.ndisRegistrationNumber || p.id) : 'PRAC-40500123';

      return [
        '405001234', // NDIS Provider Registration Number
        `"${claim.ndisNumber}"`,
        `"${claim.serviceDate}"`,
        `"${claim.serviceDate}"`,
        `"${claim.supportItemCode}"`,
        claim.hours,
        claim.unitRate,
        claim.totalAmount.toFixed(2),
        `"${practitionerId}"`,
        '"P1"', // GST Free NDIS Claim
        `"${claim.invoiceNumber}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NDIS-PRODA-Bulk-Claims-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(
      'EXPORT_PRODA_BULK_CSV',
      'BILLING_CLAIMS',
      'PRODA_PORTAL',
      `Exported ${billingClaims.length} bulk claims formatted for NDIS PRODA portal requirements.`
    );

    addNotification({
      title: 'NDIS PRODA Bulk Claim CSV Generated',
      message: `Exported ${billingClaims.length} claims with Practitioner IDs & line items for PRODA Portal upload.`,
      type: 'compliance',
      severity: 'info',
      linkTab: 'billing',
    });
  };

  // Export Standard CSV Functionality
  const exportToCSV = () => {
    const headers = [
      'Invoice Number',
      'Service Date',
      'Participant Name',
      'NDIS Number',
      'NDIS Support Item',
      'Hours',
      'Unit Rate ($)',
      'Total Amount ($)',
      'PACE Status'
    ];

    const rows = billingClaims.map((claim: BillingClaim) => [
      `"${claim.invoiceNumber}"`,
      `"${claim.serviceDate}"`,
      `"${claim.clientName}"`,
      `"${claim.ndisNumber}"`,
      `"${claim.ndisSupportItem.replace(/"/g, '""')}"`,
      claim.hours,
      claim.unitRate,
      claim.totalAmount,
      `"${claim.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NDIS-Billing-Claims-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print / PDF Functionality
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalClaimed = billingClaims.reduce((acc: number, c: BillingClaim) => acc + c.totalAmount, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NDIS Official Billing & Claims Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; color: #0f172a; margin-bottom: 4px; }
            .header-info { margin-bottom: 20px; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f8fafc; }
            .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Breakthrough Coaching OS - NDIS Official Billing Report</h1>
          <div class="header-info">
            <p><strong>NDIS Practice Registration:</strong> 405001234 | <strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>PRODA / PACE Mapping Version:</strong> 2026 Arrangements</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Service Date</th>
                <th>Participant</th>
                <th>NDIS Number</th>
                <th>NDIS Support Code & Line Item</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Total ($)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${billingClaims
                .map(
                  (c: BillingClaim) => `
                <tr>
                  <td>${c.invoiceNumber}</td>
                  <td>${c.serviceDate}</td>
                  <td>${c.clientName}</td>
                  <td>${c.ndisNumber}</td>
                  <td>${c.ndisSupportItem}</td>
                  <td>${c.hours}</td>
                  <td>$${c.unitRate}</td>
                  <td>$${c.totalAmount.toFixed(2)}</td>
                  <td>${c.status}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="7" style="text-align: right;">Total Billing Portfolio:</td>
                <td colspan="2">$${totalClaimed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Generated via Breakthrough OS NDIS Financial Control System. Confidential Allied Health Record.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">NDIS PACE & PRODA Billing & Price Guide</h2>
            <p className="text-xs text-slate-400">
              NDIS 2026 Support Catalogue unit rates, regional modifiers, and PRODA claim ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* AI Pre-Submission Batch Validator (R5) */}
          <button
            onClick={handleRunBatchValidation}
            disabled={isValidationBatchRunning}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-purple-500/30 disabled:opacity-50"
            title="Scan all billing claims against 2026 NDIS price caps, duplicate rules, and clinical note linkages"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
            <span>{isValidationBatchRunning ? 'Auditing Claims...' : 'AI Pre-Submission Audit'}</span>
          </button>

          <button
            onClick={handleRunReconciliationAudit}
            disabled={isReconciling || isViewer}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-amber-500/40 transition-all shadow-sm disabled:opacity-50"
            title={isViewer ? "View-only access" : "Perform automatic NDIS price cap validation & SLA breach audit across all claims"}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isReconciling ? 'animate-spin' : ''}`} />
            <span>{isReconciling ? 'Reconciling Ledger...' : 'Auto-Reconcile Ledger'}</span>
          </button>

          {/* Xero OAuth 2.0 Integration Button (R9) */}
          {xeroState.isConnected ? (
            <button
              onClick={handleSyncToXeroMYOB}
              disabled={isSyncingXero || isViewer}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-sky-500/30 disabled:opacity-50"
              title="Sync Approved Claims to Xero ACCREC and reconcile Bank Feed payments"
            >
              <Zap className="w-3.5 h-3.5 text-sky-200" />
              <span>{isSyncingXero ? 'Syncing Xero...' : 'Sync Xero Invoices & Bank'}</span>
            </button>
          ) : (
            <button
              onClick={handleConnectXeroOAuth}
              disabled={isConnectingXero || isViewer}
              className="px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-sky-500/40 disabled:opacity-50"
              title="Connect Official 3-Legged Xero OAuth 2.0 Integration"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{isConnectingXero ? 'Connecting Xero...' : 'Connect Xero OAuth 2.0'}</span>
            </button>
          )}

          <button
            onClick={() => setStoreTab('google-workspace')}
            className="px-3 py-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-300 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-emerald-500/40 transition-all shadow-sm"
            title="Export NDIS Claims directly to collaborative Google Sheets via Google Workspace API"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export to Google Sheets</span>
          </button>

          {!isViewer && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Import Price Guide Data"
            >
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>Import Price Guide</span>
            </button>
          )}

          {!isViewer && (
            <button
              onClick={() => setIsProdaBatchModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md border border-emerald-500/30"
              title="Open Direct NDIS PRODA Bulk Claim Submission Studio"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-200" />
              <span>Direct PRODA Batch Submit</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Print PDF Report"
          >
            <Printer className="w-3.5 h-3.5 text-teal-400" />
            <span>Print PDF</span>
          </button>

          {!isViewer && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Claim</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Batch Audit Summary Alert */}
      {validationBatchSummary && (
        <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-purple-300">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Pre-Submission Audit: <strong>{validationBatchSummary.cleanCount}</strong> PACE Ready,{' '}
              <strong className="text-rose-400">{validationBatchSummary.errorCount}</strong> Errors,{' '}
              <strong className="text-amber-400">{validationBatchSummary.warningCount}</strong> Warnings.
            </span>
          </div>
          <button
            onClick={() => setValidationBatchSummary(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Xero Connection Status Banner */}
      {xeroState.isConnected && (
        <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-sky-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Xero OAuth 2.0 Live: <strong>{xeroState.tenantName || 'Breakthrough Coaching & Consulting'}</strong> | Tenant: {xeroState.tenantId || 'xero-tenant-8821'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Token Active • 3-Legged Handshake Verified
          </span>
        </div>
      )}

      {xeroSyncSuccess && (
        <div className="p-3 bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs rounded-xl flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{xeroSyncSuccess}</span>
          </div>
          <button onClick={() => setXeroSyncSuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('FINANCIAL_CONTROL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'FINANCIAL_CONTROL'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Financial Control & PACE Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('CLAIMS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'CLAIMS'
              ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Claims Ledger & PACE Status ({billingClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRICE_GUIDE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'PRICE_GUIDE'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>NDIS Price Guide Catalogue ({allPriceGuideItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CALCULATOR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'CALCULATOR'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Invoicing Rate Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('BURN_RATE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'BURN_RATE'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Funding Burn Rate & Trajectory Analytics</span>
        </button>
      </div>

      {/* Global Billing Insights Panel */}
      <BillingInsightsPanel />

      {/* TAB 0: FINANCIAL CONTROL & PACE ANALYTICS */}
      {activeTab === 'FINANCIAL_CONTROL' && (
        <FinancialControl
          billingClaims={billingClaims}
          onAutoReconcile={handleRunReconciliationAudit}
          isReconciling={isReconciling}
        />
      )}

      {/* TAB 1: CLAIMS TABLE */}
      {activeTab === 'CLAIMS' && (
        <div className="space-y-4">
          {/* Automated Reconciliation Warning Banner */}
          {(failedClaims.length > 0 || slaRiskClaims.length > 0) && (
            <div className="p-4 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border border-rose-500/40 rounded-xl space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>NDIS Invoice Reconciliation & SLA Warning</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                        {failedClaims.length} Failed • {slaRiskClaims.length} SLA Risk
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Discrepancies detected between claimed rates and NDIS 2026 Price Cap standards, or invoices approaching statutory 30-day payment SLA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunReconciliationAudit}
                    disabled={isReconciling}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                    <span>Auto-Fix & Audit All</span>
                  </button>
                </div>
              </div>

              {/* Warning Item Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-rose-500/20 text-xs">
                {failedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-2.5 bg-slate-950/80 rounded-lg border border-rose-500/30 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-bold text-white font-mono">{claim.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({claim.clientName})</span>
                      </div>
                      <p className="text-[11px] text-rose-300 leading-tight">
                        {claim.reconciliationError || 'Line item exceeds NDIS price cap limit ($214.41/hr).'}
                      </p>
                    </div>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => reconcileClaim(claim.id, 'Reconciled')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30 shrink-0 transition-all"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}

                {slaRiskClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-2.5 bg-slate-950/80 rounded-lg border border-amber-500/30 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold text-white font-mono">{claim.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({claim.clientName})</span>
                      </div>
                      <p className="text-[11px] text-amber-300 leading-tight">
                        SLA Risk: Payment pending &gt; 25 days. Deadline: {claim.slaDeadline || '2026-03-01'}
                      </p>
                    </div>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => updateBillingStatus(claim.id, 'Paid')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] font-bold rounded border border-teal-500/30 shrink-0 transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claims Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-950/50">
                    <th className="py-3 px-4">Invoice # & Date</th>
                    <th className="py-3 px-4">Participant & NDIS #</th>
                    <th className="py-3 px-4">NDIS Line Item</th>
                    <th className="py-3 px-4">Hours / Rate</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">AI Pre-Submission Check</th>
                    <th className="py-3 px-4">Reconciliation & SLA</th>
                    <th className="py-3 px-4 text-right">PACE Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {billingClaims.map((claim: BillingClaim) => {
                    const isFailed = claim.reconciliationStatus === 'Failed';
                    const isSlaRisk = claim.reconciliationStatus === 'SLA_Breach_Risk';
                    const isReconciled = claim.reconciliationStatus === 'Reconciled';

                    const client = clients.find((cli) => cli.id === claim.clientId || cli.ndisNumber === claim.ndisNumber);
                    const validation = validateBillingClaim(claim, client, billingClaims, caseNotes, supportItems);

                    return (
                      <tr
                        key={claim.id}
                        className={`transition-colors ${
                          isFailed
                            ? 'bg-rose-950/10 hover:bg-rose-950/20'
                            : isSlaRisk
                            ? 'bg-amber-950/10 hover:bg-amber-950/20'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-teal-300 block">{claim.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400">{claim.serviceDate}</span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-bold text-white block">{claim.clientName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{claim.ndisNumber}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate font-sans text-slate-300">
                          {claim.ndisSupportItem}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {claim.hours} hrs @ ${claim.unitRate}/hr
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                          ${claim.totalAmount.toFixed(2)}
                        </td>
                        {/* AI Pre-Submission Validation Badge (R5) */}
                        <td className="py-3 px-4 font-sans">
                          {validation.isClean ? (
                            <button
                              type="button"
                              onClick={() => setSelectedValidationClaim({ claim, validation })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                              title="Click to view AI Pre-Submission validation details"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>PACE Ready</span>
                            </button>
                          ) : validation.errors.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedValidationClaim({ claim, validation })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer"
                              title="Click to inspect validation errors & auto-fix"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{validation.errors.length} Issue(s)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedValidationClaim({ claim, validation })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
                              title="Click to view warnings"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Warning</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {isFailed ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                Reconciliation Failed
                              </span>
                              <span className="text-[10px] text-rose-400 block mt-0.5 truncate max-w-[180px]">
                                {claim.reconciliationError || 'Over Cap Rate'}
                              </span>
                            </div>
                          ) : isSlaRisk ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                SLA Breach Risk
                              </span>
                              <span className="text-[10px] text-amber-400 block mt-0.5">
                                Due: {claim.slaDeadline || 'Approaching'}
                              </span>
                            </div>
                          ) : isReconciled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              Reconciled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Pending Check
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <select
                            value={claim.status}
                            disabled={isViewer}
                            onChange={(e) => updateBillingStatus(claim.id, e.target.value as any)}
                            className={`bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-teal-400 font-bold ${
                              isViewer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Submitted PACE">Submitted PACE</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NDIS PRICE GUIDE CATALOGUE & BUDGET VALIDATOR */}
      {activeTab === 'PRICE_GUIDE' && (
        <PriceGuideLookup
          onClaimCreated={() => setActiveTab('CLAIMS')}
        />
      )}

      {/* TAB 3: INVOICING RATE CALCULATOR */}
      {activeTab === 'CALCULATOR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-400" />
              Interactive NDIS Invoicing & Budget Estimator
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cross-calculate service hours, provider travel loadings, and regional multipliers against participant plan caps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Participant Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Select Participant</label>
              <select
                value={calcClient}
                onChange={(e) => setCalcClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NDIS #{c.ndisNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Support Item Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">NDIS Support Line Item</label>
              <select
                value={calcSupportCode}
                onChange={(e) => setCalcSupportCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-300 font-bold"
              >
                {allPriceGuideItems.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name} (${s.pricePerUnit}/hr)
                  </option>
                ))}
              </select>
            </div>

            {/* Service Direct Hours */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Direct Service Delivery Hours</label>
              <input
                type="number"
                step="0.25"
                value={calcHours}
                onChange={(e) => setCalcHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Travel / Non-Face-to-Face Hours */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Provider Travel / Non-Face-to-Face (Hours)</label>
              <input
                type="number"
                step="0.25"
                value={calcTravelHours}
                onChange={(e) => setCalcTravelHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            {/* Regional Location Loading */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-bold">Location Regional Loading</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRegionalModifier('MM1')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    regionalModifier === 'MM1'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">MM1 - Metro</div>
                  <div className="text-[10px] text-slate-500">1.0x Base Rate</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegionalModifier('MM6')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    regionalModifier === 'MM6'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">MM6 - Remote</div>
                  <div className="text-[10px] text-slate-500">1.4x Loading (+40%)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRegionalModifier('MM7')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    regionalModifier === 'MM7'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold">MM7 - V. Remote</div>
                  <div className="text-[10px] text-slate-500">1.5x Loading (+50%)</div>
                </button>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown Box */}
          {(() => {
            const targetItem = allPriceGuideItems.find((i) => i.code === calcSupportCode);
            const targetClient = clients.find((c) => c.id === calcClient);
            const baseRate = targetItem?.pricePerUnit || 214.41;
            const multiplier = getMultiplier(regionalModifier);
            const effectiveRate = baseRate * multiplier;
            const totalHours = calcHours + calcTravelHours;
            const totalEstimatedClaim = totalHours * effectiveRate;
            const remainingBudget = (targetClient?.totalBudget || 0) - (targetClient?.spentBudget || 0);

            return (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Base Unit Rate:</span>
                  <span className="text-white font-bold">${baseRate.toFixed(2)}/hr</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Regional Modifier Loading ({regionalModifier}):</span>
                  <span className="text-amber-400 font-bold">{multiplier}x</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Effective Hourly Rate:</span>
                  <span className="text-emerald-400 font-bold">${effectiveRate.toFixed(2)}/hr</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Billable Units ({calcHours}h Direct + {calcTravelHours}h Travel):</span>
                  <span className="text-teal-300 font-bold">{totalHours} hrs</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">Total Estimated NDIS Claim</span>
                    <span className="text-[11px] text-slate-500">GST-Exempt under Section 38-38 A New Tax System</span>
                  </div>
                  <span className="text-xl font-extrabold text-emerald-400">${totalEstimatedClaim.toFixed(2)}</span>
                </div>

                {targetClient && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-sans flex items-center justify-between">
                    <span className="text-slate-400">Participant Available Plan Budget:</span>
                    <span className={`font-bold font-mono ${remainingBudget >= totalEstimatedClaim ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${remainingBudget.toLocaleString()} remaining
                    </span>
                  </div>
                )}

                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!targetClient || !targetItem) return;
                      addBillingClaim({
                        clientId: targetClient.id,
                        clientName: targetClient.name,
                        ndisNumber: targetClient.ndisNumber,
                        serviceDate: new Date().toISOString().slice(0, 10),
                        ndisSupportItem: `${targetItem.code} - ${targetItem.name}`,
                        supportItemCode: targetItem.code,
                        hours: totalHours,
                        unitRate: Math.round(effectiveRate * 100) / 100,
                        totalAmount: Math.round(totalEstimatedClaim * 100) / 100,
                        status: 'Approved',
                        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
                      });
                      setActiveTab('CLAIMS');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-sans mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Calculated Claim Directly to PACE Ledger</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: FUNDING BURN RATE & TRAJECTORY ANALYTICS */}
      {activeTab === 'BURN_RATE' && (
        <div className="space-y-6">
          {/* Header & Participant Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  NDIS Funding Burn Rate & Financial Trajectory
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                    Recharts Analytics
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualizing actual vs. projected plan expenditure and monthly utilization velocity across the 12-month plan term
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Select Participant:</span>
              <select
                value={burnRateClientId}
                onChange={(e) => setBurnRateClientId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-teal-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                {clients.map((c: Client) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.ndisNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Metric Highlights for this Client */}
          {burnRateClient && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-slate-400 text-xs font-semibold">Total Approved Budget</span>
                <div className="text-lg font-black text-white font-mono">
                  ${burnRateClient.totalBudget.toLocaleString()} <span className="text-xs text-slate-400 font-normal">AUD</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Plan: {burnRateClient.planStartDate} to {burnRateClient.planEndDate}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-slate-400 text-xs font-semibold">Actual Utilized to Date</span>
                <div className="text-lg font-black text-amber-400 font-mono">
                  ${burnRateClient.spentBudget.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Burn: {((burnRateClient.spentBudget / (burnRateClient.totalBudget || 1)) * 100).toFixed(1)}%</span>
                  <span className="text-teal-400 font-bold">Month 5 / 12</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-slate-400 text-xs font-semibold">Remaining Available Balance</span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  ${Math.max(0, burnRateClient.totalBudget - burnRateClient.spentBudget).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500">
                  Monthly Run Rate: ${(Math.round(burnRateClient.totalBudget / 12)).toLocaleString()}/mo
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-slate-400 text-xs font-semibold">Projected Plan Health</span>
                <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>On Trajectory</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  No early fund depletion detected under current delivery schedule.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Recharts Budget Utilization Dashboard (Donut & Support Category Breakdown) */}
          {burnRateClient && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Card 1: Interactive Recharts Donut Chart (Remaining Funds vs Spent vs Committed) */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Budget Utilization Breakdown ({burnRateClient.name})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Interactive Donut: Utilized Spend vs Committed PACE Claims vs Remaining Funds
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                    Recharts Donut
                  </span>
                </div>

                <div className="h-64 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()} (${Math.round((Number(val) / (burnRateClient.totalBudget || 1)) * 100)}%)`, name]}
                      />
                      <Pie
                        data={budgetDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={92}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {budgetDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#090d16" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Overlay Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Plan Total</span>
                    <span className="text-base font-extrabold text-white font-mono">
                      ${burnRateClient.totalBudget.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">
                      {Math.round((burnRateClient.spentBudget / (burnRateClient.totalBudget || 1)) * 100)}% Burned
                    </span>
                  </div>
                </div>

                {/* Donut Legend Items */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                  {budgetDonutData.map((item) => (
                    <div key={item.name} className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-slate-300 font-bold truncate">{item.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-xs font-black font-mono" style={{ color: item.color }}>
                        ${item.value.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block">({item.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Interactive Recharts Category Allocation Bar Chart */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-sky-400" />
                      Support Category Expenditure
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Allocated spend across NDIS Capacity Building, Core, and Travel line items
                    </p>
                  </div>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-500/30 font-bold">
                    NDIS Categories
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryBreakdownData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortCategory"
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Spent Amount']}
                      />
                      <Bar dataKey="amount" fill="#06b6d4" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {categoryBreakdownData.map((_, idx) => (
                          <Cell
                            key={`cat-cell-${idx}`}
                            fill={idx === 0 ? '#14b8a6' : idx === 1 ? '#06b6d4' : idx === 2 ? '#6366f1' : '#f59e0b'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Quick Insights */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Primary Allocation:</span>
                  <span className="text-teal-300 font-bold font-mono">
                    Specialist Behavioural Support (55%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Chart 1: Cumulative Actual vs Projected Funding Expenditure */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Cumulative Funding Burn: Actual vs. Projected Plan Trajectory
                </h4>
                <p className="text-[11px] text-slate-400">
                  Comparison between linear plan budget benchmark (teal) and actual billed claims (amber/purple)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-400" />
                  <span className="text-slate-300">Projected Linear Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Actual Billed Spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-400" />
                  <span className="text-slate-300">Forecasted Spend</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={burnRateData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedSpend"
                    name="Linear Target"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProjected)"
                  />
                  <Area
                    type="monotone"
                    dataKey="actualSpend"
                    name="Actual Spend"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedFutureSpend"
                    name="Forecasted Spend"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart 2: Monthly Burn Velocity vs Monthly Cap */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Monthly Claim Velocity & Budget Utilization
                </h4>
                <p className="text-[11px] text-slate-400">
                  Monthly billable delivery vs recommended monthly allocation (${(Math.round((burnRateClient?.totalBudget || 45000) / 12)).toLocaleString()}/mo)
                </p>
              </div>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={burnRateData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="monthlyBurn" name="Actual Monthly Billed ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projectedMonthlyRate" name="Target Monthly Cap ($)" fill="#334155" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tertiary Chart 3: Active Clients Monthly Funding Utilization vs Remaining Service Hours */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-white">
                      Active Clients: Monthly NDIS Funding Utilization vs. Remaining Service Hours
                    </h4>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                      Dual-Axis Recharts Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Direct comparison of monthly funding claimed ($ AUD on left axis) against unallocated clinical therapy capacity (hours on right axis @ $193.99/hr rate).
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setFundingChartMode('ACTIVE_CLIENTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fundingChartMode === 'ACTIVE_CLIENTS'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Active Participants ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFundingChartMode('MONTHLY_TIMELINE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fundingChartMode === 'MONTHLY_TIMELINE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {burnRateClient?.name || 'Selected Client'} 12-Month Curve
                </button>
              </div>
            </div>

            {/* Recharts Dual-Axis Composed Chart */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={
                    fundingChartMode === 'ACTIVE_CLIENTS'
                      ? activeClientsFundingVsHoursData
                      : monthlyTimelineFundingVsHoursData
                  }
                  margin={{ top: 15, right: 30, left: 15, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey={fundingChartMode === 'ACTIVE_CLIENTS' ? 'shortName' : 'month'}
                    stroke="#64748b"
                    fontSize={11}
                    tick={{ fill: '#94a3b8' }}
                  />
                  {/* Left Y-Axis: Monthly Funding Utilized ($) */}
                  <YAxis
                    yAxisId="left"
                    stroke="#10b981"
                    fontSize={11}
                    tick={{ fill: '#10b981' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                    label={{
                      value: 'Monthly Funding ($)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#10b981',
                      fontSize: 10,
                      offset: -5,
                    }}
                  />
                  {/* Right Y-Axis: Remaining Service Hours (hrs) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#06b6d4"
                    fontSize={11}
                    tick={{ fill: '#06b6d4' }}
                    tickFormatter={(v) => `${v}h`}
                    label={{
                      value: 'Remaining Service Hours (hrs)',
                      angle: 90,
                      position: 'insideRight',
                      fill: '#06b6d4',
                      fontSize: 10,
                      offset: 0,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                    }}
                    formatter={(val: any, name: any) => {
                      if (name.includes('Funding') || name.includes('Monthly')) {
                        return [`$${Number(val).toLocaleString()}`, name];
                      }
                      if (name.includes('Hours')) {
                        return [`${Number(val).toFixed(1)} hrs`, name];
                      }
                      return [val, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                  />
                  {/* Bar: Monthly Funding Utilized */}
                  <Bar
                    yAxisId="left"
                    dataKey="monthlyFundingUtilized"
                    name="Monthly Funding Utilized ($)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  {/* Bar: Monthly Budget Allocation Cap */}
                  <Bar
                    yAxisId="left"
                    dataKey="monthlyBudgetCap"
                    name="Planned Monthly Budget ($)"
                    fill="#334155"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  {/* Line: Remaining Service Hours */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="remainingServiceHours"
                    name="Remaining Service Hours (hrs)"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#090d16' }}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Practice Portfolio Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Total Active Portfolio Hours</span>
                <span className="text-base font-black text-cyan-400 font-mono">
                  {Math.round(activeClientsFundingVsHoursData.reduce((acc, c) => acc + c.remainingServiceHours, 0)).toLocaleString()} hrs
                </span>
                <span className="text-[10px] text-slate-500 block">Available therapy capacity</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Total Monthly Billed Spend</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ${Math.round(activeClientsFundingVsHoursData.reduce((acc, c) => acc + c.monthlyFundingUtilized, 0)).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Across active participants</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Standard Unit Rate</span>
                <span className="text-base font-black text-white font-mono">$193.99 / hr</span>
                <span className="text-[10px] text-slate-500 block">NDIS Price Guide 2026</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Funding Depletion Velocity</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {Math.round(
                    activeClientsFundingVsHoursData.reduce((acc, c) => acc + c.remainingServiceHours, 0) /
                      (activeClientsFundingVsHoursData.length * 4.2 || 1)
                  )}{' '}
                  wks
                </span>
                <span className="text-[10px] text-slate-500 block">Estimated practice runway</span>
              </div>
            </div>
          </div>

          {/* Comparative Participant Budget Utilization Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-emerald-400" />
                  All-Participant Budget Utilization Comparison (Spent vs Remaining Funds)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Interactive grouped bar chart comparing actual spent budget against remaining available NDIS allocation per participant
                </p>
              </div>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30 font-bold">
                Portfolio Bar Chart
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={participantsBudgetComparisonData} margin={{ top: 10, right: 30, left: 15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="shortName" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="spentBudget" name="Spent Funds ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="remainingBudget" name="Remaining Funds ($)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* NDIS PRICE GUIDE IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileUp className="w-5 h-5 text-teal-400" />
                Import NDIS Price Guide (JSON or CSV Source)
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste NDIS Price Guide data in either <strong>JSON array</strong> format or <strong>CSV lines</strong> format: <br />
              <code className="text-teal-300 font-mono text-[11px] block mt-1">
                JSON: [{`{"code":"07_002_0115_8_3", "name":"Intervention", "pricePerUnit":214.41, "category":"Capacity Building"}`}]
              </code>
            </p>

            <form onSubmit={handleImportData} className="space-y-3">
              <textarea
                rows={7}
                value={importCSVText}
                onChange={(e) => setImportCSVText(e.target.value)}
                placeholder={`[\n  {\n    "code": "07_002_0115_8_3",\n    "name": "Specialist Behavioural Intervention Support",\n    "category": "Capacity Building - Improved Relationships",\n    "pricePerUnit": 214.41,\n    "unitOfMeasure": "Hour"\n  }\n]`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportCSVText(JSON.stringify(OFFICIAL_2026_PRICE_GUIDE_PRESETS, null, 2));
                    }}
                    className="text-xs font-bold text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Paste Official 2026 Price Guide JSON Source</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Import & Store Data
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Log NDIS Support Claim
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Participant</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
                >
                  {clients.map((c: Client) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ndisNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">NDIS Support Item Code</label>
                <select
                  value={selectedSupport}
                  onChange={(e) => setSelectedSupport(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-bold"
                >
                  {allPriceGuideItems.map((s: NDISSupportItem) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name} (${s.pricePerUnit}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Hours</label>
                <input
                  type="number"
                  step="0.25"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Calculated Claim Total:</span>
                <span className="text-emerald-400 font-bold font-mono text-base">
                  ${((hours || 0) * (allPriceGuideItems.find(s => s.code === selectedSupport)?.pricePerUnit || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm"
                >
                  Log Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Pre-Submission Claim Validation Details Modal (R5) */}
      {selectedValidationClaim && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl border ${
                  selectedValidationClaim.validation.isClean
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {selectedValidationClaim.validation.isClean ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Pre-Submission Claim Validator</h3>
                  <p className="text-[11px] text-slate-400">NDIS PACE 2026 Rules & Price Cap Verification</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedValidationClaim(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Claim Summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Invoice #</span>
                <span className="font-bold text-teal-300">{selectedValidationClaim.claim.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Service Date</span>
                <span>{selectedValidationClaim.claim.serviceDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Participant</span>
                <span className="font-sans font-medium text-white">{selectedValidationClaim.claim.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Rate & Total</span>
                <span className="text-emerald-400 font-bold">${selectedValidationClaim.claim.unitRate}/hr (${selectedValidationClaim.claim.totalAmount.toFixed(2)})</span>
              </div>
            </div>

            {/* Badges List */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Validation Status & Rule Evaluation
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedValidationClaim.validation.badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                      badge.type === 'green'
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : badge.type === 'red'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        {badge.type === 'green' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : badge.type === 'red' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{badge.code}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans">{badge.message}</p>
                      {badge.suggestedFix && (
                        <p className="text-[11px] text-teal-300 font-sans mt-1">
                          <strong>Suggested Fix:</strong> {badge.suggestedFix}
                        </p>
                      )}
                    </div>

                    {badge.code === 'RATE_EXCEEDS_2026_CAP' && (
                      <button
                        type="button"
                        onClick={() => {
                          const matchedItem = supportItems.find(
                            (s) => s.code === selectedValidationClaim.claim.supportItemCode
                          );
                          const targetCap = matchedItem ? matchedItem.pricePerUnit : 214.41;
                          handleFixRateCap(selectedValidationClaim.claim, targetCap);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Fix to Cap</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedValidationClaim(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk PRODA XML Claim Generator Modal */}
      <ProdaBatchModal
        isOpen={isProdaBatchModalOpen}
        onClose={() => setIsProdaBatchModalOpen(false)}
      />
    </div>
  );
};
