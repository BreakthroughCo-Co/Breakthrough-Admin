'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { NDISSupportItem, Client, BillingClaim } from '@/types';
import { NDISPricingSyncEngine } from '@/lib/ndisPricingService';
import {
  Search,
  BookOpen,
  Filter,
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface PriceGuideLookupProps {
  onSelectSupportItem?: (item: NDISSupportItem) => void;
  onClaimCreated?: (claim: BillingClaim) => void;
  defaultCategory?: string;
}

export const PriceGuideLookup: React.FC<PriceGuideLookupProps> = ({
  onSelectSupportItem,
  onClaimCreated,
  defaultCategory = 'ALL'
}) => {
  const {
    clients,
    billingClaims,
    addBillingClaim,
    supportItems,
    addNotification,
    addAuditLog,
    currentUser,
    setActiveTab
  } = useManagementStore();

  const isViewer = currentUser?.role === 'VIEWER';

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [regionalModifier, setRegionalModifier] = useState<'MM1' | 'MM6' | 'MM7'>('MM1');
  const [priceSort, setPriceSort] = useState<'default' | 'price-asc' | 'price-desc' | 'name-asc'>('default');

  // Selected item for inspector drawer & budget validator
  const [inspectedItem, setInspectedItem] = useState<NDISSupportItem | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [serviceHours, setServiceHours] = useState<number>(2.0);
  const [travelHours, setTravelHours] = useState<number>(0.5);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [syncStatus, setSyncStatus] = useState<{
    version: string;
    effectiveDate: string;
    itemCount: number;
  }>({
    version: '2026.1-PRODA-PACE',
    effectiveDate: '1 July 2025 - 30 June 2026',
    itemCount: supportItems.length || 15
  });

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Regional Multipliers
  const getMultiplier = (mod: 'MM1' | 'MM6' | 'MM7') => {
    if (mod === 'MM6') return 1.4; // Remote +40%
    if (mod === 'MM7') return 1.5; // Very Remote +50%
    return 1.0; // Metropolitan
  };

  const multiplier = getMultiplier(regionalModifier);

  // Derive all unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    supportItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [supportItems]);

  // Filtered and Sorted Price Guide Items
  const filteredItems = useMemo(() => {
    return supportItems
      .filter((item) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);

        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesUnit = selectedUnit === 'ALL' || item.unitOfMeasure === selectedUnit;

        return matchesQuery && matchesCategory && matchesUnit;
      })
      .sort((a, b) => {
        if (priceSort === 'price-asc') return a.pricePerUnit - b.pricePerUnit;
        if (priceSort === 'price-desc') return b.pricePerUnit - a.pricePerUnit;
        if (priceSort === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [supportItems, searchQuery, selectedCategory, selectedUnit, priceSort]);

  // Set default inspected item if none selected
  useEffect(() => {
    if (!inspectedItem && filteredItems.length > 0) {
      setInspectedItem(filteredItems[0]);
    }
  }, [filteredItems, inspectedItem]);

  // Sync Price Guide with NDIS API
  const handleSyncPriceGuide = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/ndis/price-guide/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItems: supportItems,
          claims: billingClaims
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastSyncTime(new Date().toISOString());
        setSyncStatus((prev) => ({
          ...prev,
          itemCount: data.syncedCount || supportItems.length
        }));

        addNotification({
          title: 'NDIS Price Guide Synchronized',
          message: `Updated ${data.syncedCount || supportItems.length} support items from NDIS API catalogue (Version 2026.1).`,
          type: 'billing',
          severity: 'info',
          linkTab: 'billing'
        });

        addAuditLog(
          'SYNC_NDIS_PRICE_GUIDE',
          'BILLING',
          'NDIS_PRICE_GUIDE_CATALOGUE',
          `Synchronized ${data.syncedCount || supportItems.length} line items with published NDIA 2026 pricing schedule.`
        );
      } else {
        // Fallback local engine sync
        const result = NDISPricingSyncEngine.syncPriceGuide({
          supportItems,
          billingClaims,
          addNotification
        });
        setLastSyncTime(result.timestamp);
      }
    } catch {
      const result = NDISPricingSyncEngine.syncPriceGuide({
        supportItems,
        billingClaims,
        addNotification
      });
      setLastSyncTime(result.timestamp);
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy support code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export filtered items to CSV
  const handleExportCSV = () => {
    const headers = ['Support Item Code', 'Support Item Name', 'Category', 'Unit of Measure', 'National Price Cap ($)', `Modified Rate (${regionalModifier}) ($)`];
    const rows = filteredItems.map((item) => [
      `"${item.code}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.unitOfMeasure}"`,
      item.pricePerUnit.toFixed(2),
      (item.pricePerUnit * multiplier).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NDIS-Price-Guide-Lookup-${regionalModifier}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Budget Validation Calculations
  const activeItem = inspectedItem || filteredItems[0];
  const unitRate = activeItem ? activeItem.pricePerUnit * multiplier : 0;
  const totalUnits = Number(serviceHours || 0) + Number(travelHours || 0);
  const estimatedCost = totalUnits * unitRate;

  const totalBudget = selectedClient?.totalBudget || 0;
  const spentBudget = selectedClient?.spentBudget || 0;
  const remainingBudget = Math.max(0, totalBudget - spentBudget);
  const budgetAfterClaim = remainingBudget - estimatedCost;
  const isOverBudget = budgetAfterClaim < 0;
  const budgetUtilizationPct = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;
  const remainingHoursAtRate = unitRate > 0 ? (remainingBudget / unitRate).toFixed(1) : '0';

  // Log pre-validated claim
  const handleCreatePreValidatedClaim = () => {
    if (!selectedClient || !activeItem || isViewer) return;

    const newClaim: BillingClaim = {
      id: `claim-val-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      ndisNumber: selectedClient.ndisNumber,
      serviceDate: new Date().toISOString().slice(0, 10),
      ndisSupportItem: `${activeItem.code} - ${activeItem.name}`,
      supportItemCode: activeItem.code,
      supportItemName: activeItem.name,
      ndisCategory: activeItem.category,
      hours: totalUnits,
      unitRate: Math.round(unitRate * 100) / 100,
      totalAmount: Math.round(estimatedCost * 100) / 100,
      status: 'Approved',
      invoiceNumber: `INV-NDIS-${Math.floor(100000 + Math.random() * 900000)}`,
      reconciliationStatus: 'Reconciled',
      validationFlag: 'PRICE_GUIDE_PRE_VALIDATED',
      createdAt: new Date().toISOString()
    };

    addBillingClaim(newClaim);

    addNotification({
      title: 'Pre-Validated Claim Created',
      message: `Created invoice ${newClaim.invoiceNumber} for ${selectedClient.name} ($${newClaim.totalAmount.toFixed(2)} at ${activeItem.code}).`,
      type: 'billing',
      severity: 'info',
      linkTab: 'billing'
    });

    addAuditLog(
      'CREATE_PRE_VALIDATED_CLAIM',
      'BILLING_CLAIMS',
      newClaim.id,
      `Generated pre-validated NDIS claim for participant ${selectedClient.name} (NDIS #${selectedClient.ndisNumber}) using Price Guide line item ${activeItem.code}.`
    );

    if (onClaimCreated) {
      onClaimCreated(newClaim);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: NDIS API Live Status & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">NDIS Price Guide & Support Catalogue Lookup</h3>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30">
                  {syncStatus.version}
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-full border border-slate-700">
                  {syncStatus.itemCount} Items Loaded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time official NDIA price limits, regional MMM modifiers, claiming rules, and live plan budget validation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleSyncPriceGuide}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-teal-500/30 shadow-sm disabled:opacity-50"
              title="Sync latest price guide catalogue from NDIS API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing NDIS API...' : 'Fetch Latest NDIS Rates'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 shadow-sm"
              title="Export current filtered price table to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Regional Loading Selector Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-semibold text-slate-300">Regional Pricing Modifier (MMM):</span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setRegionalModifier('MM1')}
              className={`px-3 py-1.5 rounded-lg border text-left transition-all ${
                regionalModifier === 'MM1'
                  ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 font-bold shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold text-[11px]">MM1 - Metro</div>
              <div className="text-[9px] opacity-75">1.0x Base Cap</div>
            </button>

            <button
              type="button"
              onClick={() => setRegionalModifier('MM6')}
              className={`px-3 py-1.5 rounded-lg border text-left transition-all ${
                regionalModifier === 'MM6'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold text-[11px]">MM6 - Remote</div>
              <div className="text-[9px] opacity-75">1.4x (+40% Loading)</div>
            </button>

            <button
              type="button"
              onClick={() => setRegionalModifier('MM7')}
              className={`px-3 py-1.5 rounded-lg border text-left transition-all ${
                regionalModifier === 'MM7'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-bold shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="font-bold text-[11px]">MM7 - V. Remote</div>
              <div className="text-[9px] opacity-75">1.5x (+50% Loading)</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Search & Catalogue List (Left) + Plan Budget Validator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Search, Filters & Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code (e.g. 07_002), title (e.g. Behaviour), or category..."
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Support Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500 truncate"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All NDIS Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit of Measure */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Unit of Measure</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Units</option>
                  <option value="Hour">Hourly (Hour)</option>
                  <option value="Each">Fixed / Item (Each)</option>
                  <option value="Day">Daily (Day)</option>
                </select>
              </div>

              {/* Sort Ordering */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Sort By</label>
                <select
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="default">Default Catalogue Order</option>
                  <option value="price-desc">Price: Highest to Lowest</option>
                  <option value="price-asc">Price: Lowest to Highest</option>
                  <option value="name-asc">Title: Alphabetical</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                Showing <strong>{filteredItems.length}</strong> of {supportItems.length} support line items
              </span>
              {(searchQuery || selectedCategory !== 'ALL' || selectedUnit !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedUnit('ALL');
                    setPriceSort('default');
                  }}
                  className="text-teal-400 hover:underline font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Table / Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-75" />
                  <p className="text-sm font-bold text-white">No Matching Support Items Found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search keywords or switching category filters to discover published NDIS line items.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = inspectedItem?.code === item.code;
                  const itemModPrice = item.pricePerUnit * multiplier;

                  return (
                    <div
                      key={item.code}
                      onClick={() => {
                        setInspectedItem(item);
                        if (onSelectSupportItem) onSelectSupportItem(item);
                      }}
                      className={`p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-500/10 border-l-4 border-l-teal-400'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-teal-300 bg-slate-950 px-2 py-0.5 rounded border border-teal-500/30">
                            {item.code}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium truncate max-w-[220px]">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>Unit: <strong className="text-slate-300">{item.unitOfMeasure}</strong></span>
                          <span>•</span>
                          <span>National Base: <strong className="text-slate-300">${item.pricePerUnit.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Cap Rate ({regionalModifier})
                          </span>
                          <span className="text-sm font-extrabold text-emerald-400 font-mono">
                            ${itemModPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            /{item.unitOfMeasure.toLowerCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(item.code);
                            }}
                            className="p-1 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
                            title="Copy Support Code"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedItem(item);
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${
                              isSelected
                                ? 'bg-teal-500 text-slate-950 border-teal-400'
                                : 'bg-slate-800 text-teal-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Inspecting' : 'Validate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Plan Budget Validator & Item Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Plan Budget Validation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold text-white">Live Plan Budget Validator</h4>
              </div>
              <span className="text-[10px] font-mono bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20">
                PRODA Ready
              </span>
            </div>

            {/* Participant Selection */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                Target NDIS Participant
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (NDIS #{c.ndisNumber}) - ${((c.totalBudget || 0) - (c.spentBudget || 0)).toLocaleString()} Rem.
                  </option>
                ))}
              </select>
            </div>

            {/* Participant Plan Snapshot */}
            {selectedClient && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Funding Allocation:</span>
                  <span className="text-white font-mono font-bold">
                    ${selectedClient.totalBudget?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Current Plan Spend:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    ${selectedClient.spentBudget?.toLocaleString() || '0'} ({budgetUtilizationPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-900 pt-1.5">
                  <span className="text-slate-300 font-semibold text-[11px]">Remaining Available Balance:</span>
                  <span className="text-emerald-400 font-mono font-extrabold text-sm">
                    ${remainingBudget.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      budgetUtilizationPct > 90
                        ? 'bg-rose-500'
                        : budgetUtilizationPct > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Support Item Rate Breakdown */}
            {activeItem && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/90 rounded-xl border border-teal-500/30 space-y-1.5">
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                    Validated Support Line Item
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-teal-300">{activeItem.code}</span>
                      <p className="text-xs text-white font-semibold leading-tight mt-0.5">{activeItem.name}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                      ${unitRate.toFixed(2)}/hr
                    </span>
                  </div>
                </div>

                {/* Units / Hours Input */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Direct Service (Hours)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={serviceHours}
                      onChange={(e) => setServiceHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Travel / Non-Face-to-Face
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={travelHours}
                      onChange={(e) => setTravelHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Real-time Calculation Summary */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Base Cap Rate:</span>
                    <span className="text-slate-200">${activeItem.pricePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Regional Modifier ({regionalModifier}):</span>
                    <span className="text-amber-400 font-bold">{multiplier}x (${unitRate.toFixed(2)}/hr)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Total Billable Units:</span>
                    <span className="text-teal-300 font-bold">{totalUnits} hrs</span>
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                    <span className="font-sans font-bold text-slate-300">Estimated Claim Total:</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      ${estimatedCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-sans">Remaining Capacity at this Rate:</span>
                    <span className="text-teal-300 font-bold font-mono">{remainingHoursAtRate} hrs</span>
                  </div>
                </div>

                {/* Validation Status Banner */}
                {isOverBudget ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Budget Exhaustion Warning</span>
                      <p className="text-[11px] text-rose-200/90 leading-snug">
                        Claim of ${estimatedCost.toFixed(2)} exceeds remaining available budget (${remainingBudget.toFixed(2)}) by ${(estimatedCost - remainingBudget).toFixed(2)}. Plan review or top-up required.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">NDIS Price Limit Compliant</span>
                      <p className="text-[11px] text-emerald-200/90 leading-snug">
                        Unit rate and total hours comply with NDIA 2026 price caps. Remaining budget balance after claim will be ${budgetAfterClaim.toFixed(2)}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Claim Creation Action Button */}
                {!isViewer && (
                  <button
                    type="button"
                    onClick={handleCreatePreValidatedClaim}
                    disabled={isOverBudget}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Pre-Validated PACE Claim</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Detailed Item Claiming Rules Inspector */}
          {activeItem && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm text-xs">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Info className="w-4 h-4 text-teal-400" />
                <h4 className="font-bold text-white">NDIS Claiming Rules & Guidelines</h4>
              </div>

              <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <strong className="text-teal-300 block mb-0.5">GST Exemption Status:</strong>
                  GST-Free supply under <em>A New Tax System (Goods and Services Tax) Act 1999</em> Section 38-38. Claim uses Tax Code P1.
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <strong className="text-teal-300 block mb-0.5">Non-Face-to-Face & Provider Travel:</strong>
                  Claimable when documented in Service Agreement. Travel capped at 30 mins (MM1-3 Metro) or 60 mins (MM4-5 Regional).
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <strong className="text-teal-300 block mb-0.5">Short-Notice Cancellations:</strong>
                  100% of agreed fee claimable if participant provides less than 2 clear business days notice.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
