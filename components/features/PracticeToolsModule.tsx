'use client';

import React, { useState, useMemo } from 'react';
import { useManagementStore, OFFICIAL_2026_NDIS_PRICE_GUIDE } from '@/stores/useManagementStore';
import { Client, NDISSupportItem } from '@/types';
import {
  Sparkles,
  BookOpen,
  Boxes,
  Users,
  CheckCircle2,
  RefreshCw,
  Send,
  Heart,
  Search,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Calculator,
  Filter,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  FileCheck
} from 'lucide-react';

export const PracticeToolsModule: React.FC = () => {
  const { clients, supportItems } = useManagementStore();
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || 'cli-101');
  const [activeTab, setActiveTab] = useState<'price-guide' | 'social-stories' | 'lego'>('price-guide');

  // Price Guide State
  const [priceSearch, setPriceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Rate Verifier & Calculator State
  const activeItemsList = supportItems && supportItems.length > 0 ? supportItems : OFFICIAL_2026_NDIS_PRICE_GUIDE;
  const [verifierItem, setVerifierItem] = useState<NDISSupportItem>(activeItemsList[0]);
  const [proposedRate, setProposedRate] = useState<number>(activeItemsList[0]?.pricePerUnit || 214.41);
  const [plannedUnits, setPlannedUnits] = useState<number>(2); // e.g. 2 hours / session
  const [frequencyWeeks, setFrequencyWeeks] = useState<number>(1); // e.g. every 1 week

  // Social Story Generator State
  const [socialStoryPrompt, setSocialStoryPrompt] = useState({
    situation: 'Taking the bus to the day program during peak sensory noise',
    targetEmotion: 'Calmness & Sensory Self-Regulation',
    participantAge: 'Young Adult (19 yrs)',
  });
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Lego Therapy Planner State
  const [legoSession, setLegoSession] = useState({
    theme: 'Building a Community Rescue Station',
    engineerName: 'Jordan (Participant)',
    builderName: 'Marcus (Specialist)',
    supplierName: 'Carer Support',
    socialTarget: 'Turn-taking, expressing frustration with words, asking for pieces politely',
  });

  const selectedClientObj = clients.find((c: Client) => c.id === selectedClient);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set(activeItemsList.map((item) => item.category));
    return ['ALL', ...Array.from(set)];
  }, [activeItemsList]);

  // Filtered support items
  const filteredSupportItems = useMemo(() => {
    return activeItemsList.filter((item) => {
      const matchesSearch =
        item.code.toLowerCase().includes(priceSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(priceSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(priceSearch.toLowerCase());

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [activeItemsList, priceSearch, selectedCategory]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleSelectVerifierItem = (item: NDISSupportItem) => {
    setVerifierItem(item);
    setProposedRate(item.pricePerUnit);
  };

  // Calculator computations
  const maxPriceLimit = verifierItem?.pricePerUnit || 214.41;
  const isRateCompliant = proposedRate <= maxPriceLimit;
  const rateDifference = proposedRate - maxPriceLimit;
  const sessionTotal = proposedRate * plannedUnits;
  const monthlyTotal = sessionTotal * (4 / frequencyWeeks);
  const annualTotal = sessionTotal * (52 / frequencyWeeks);

  const participantRemainingBudget = selectedClientObj
    ? Math.max(0, selectedClientObj.totalBudget - selectedClientObj.spentBudget)
    : 0;

  const handleGenerateSocialStory = async () => {
    setIsGeneratingStory(true);
    try {
      const prompt = `Write a personalized, clear, neuroaffirming NDIS Social Story for participant ${selectedClientObj?.name || 'Participant'}.
Situation: ${socialStoryPrompt.situation}
Target Emotion/Goal: ${socialStoryPrompt.targetEmotion}
Age Group: ${socialStoryPrompt.participantAge}

Format the story into 5 structured, encouraging paragraphs:
1. Descriptive sentences (Where I am and what is happening).
2. Perspective sentences (How others feel and why it is loud/busy).
3. Directive/Positive coping sentences (What I can do - e.g. put on noise-cancelling headphones, take 3 deep breaths).
4. Affirming closing sentence (I am safe and supported).

Use simple, respectful, first-person language ("I can...", "My body...").`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an expert NDIS Clinical Allied Health Specialist creating Social Stories.',
        }),
      });

      const data = await res.json();
      if (data.text) {
        setGeneratedStory(data.text);
      }
    } catch (e) {
      console.error('Failed to generate social story:', e);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Clinical & Practice Tools</h2>
            <p className="text-xs text-slate-400">
              NDIS Price Guide lookup & rate verifier, Lego Therapy planner, and AI Social Story builder.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('price-guide')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'price-guide'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Price Guide & Verifier</span>
          </button>
          <button
            onClick={() => setActiveTab('social-stories')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'social-stories'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>AI Social Stories</span>
          </button>
          <button
            onClick={() => setActiveTab('lego')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'lego'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Lego Based Therapy</span>
          </button>
        </div>
      </div>

      {/* Participant Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Active Participant Context:</span>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-teal-500 w-full sm:w-64"
          >
            {clients.map((c: Client) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.primaryDisability})
              </option>
            ))}
          </select>
        </div>

        {selectedClientObj && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Remaining Budget:</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30">
              ${participantRemainingBudget.toLocaleString()} AUD
            </span>
          </div>
        )}
      </div>

      {/* PRICE GUIDE & CLAIM VERIFIER TAB */}
      {activeTab === 'price-guide' && (
        <div className="space-y-6">
          {/* Rate Verification & Funding Impact Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">NDIS Rate Compliance & Plan Budget Verifier</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Official NDIA 2025/2026 National Pricing Standards
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Line item selection and rate inputs */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Selected Line Item</span>
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded font-bold border border-teal-500/20">
                      {verifierItem.code}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{verifierItem.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="text-teal-400">{verifierItem.category}</span>
                    <span>•</span>
                    <span>Max Cap: <strong className="text-white">${verifierItem.pricePerUnit.toFixed(2)} / {verifierItem.unitOfMeasure}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Proposed Billing Rate ($)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        step="0.01"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Units / Session ({verifierItem.unitOfMeasure})</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={plannedUnits}
                      onChange={(e) => setPlannedUnits(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Frequency</label>
                    <select
                      value={frequencyWeeks}
                      onChange={(e) => setFrequencyWeeks(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-teal-500"
                    >
                      <option value="1">Weekly (1x / wk)</option>
                      <option value="2">Fortnightly (Every 2 wks)</option>
                      <option value="4">Monthly (Every 4 wks)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Verification Results */}
              <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-semibold">PACE Compliance Status:</span>
                    {isRateCompliant ? (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Compliant with Price Limit
                      </span>
                    ) : (
                      <span className="text-xs bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full font-bold border border-rose-500/20 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Exceeds Official Cap (+${rateDifference.toFixed(2)})
                      </span>
                    )}
                  </div>

                  {!isRateCompliant && (
                    <div className="p-2 bg-rose-950/40 rounded-lg border border-rose-500/30 text-[11px] text-rose-300 leading-snug">
                      ⚠️ Proposed rate exceeds the NDIS maximum of <strong>${maxPriceLimit.toFixed(2)}</strong>. Lodging claims above the cap will result in immediate PRODA rejection.
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Per Session</span>
                      <span className="text-sm font-black text-white font-mono">${sessionTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Monthly Burn</span>
                      <span className="text-sm font-black text-teal-300 font-mono">${monthlyTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Annual Projection</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">${annualTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedClientObj && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                    <span>Impact on {selectedClientObj.name.split(' ')[0]}&apos;s remaining budget:</span>
                    <span className={`font-mono font-bold ${annualTotal > participantRemainingBudget ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {((annualTotal / (participantRemainingBudget || 1)) * 100).toFixed(1)}% of remaining funds
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by line item code, keyword, or support title (e.g. 07_002, Behaviour, Therapy, Travel)..."
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-teal-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'All Support Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filter Tag Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
              <span className="text-slate-500 font-semibold mr-1">Quick Select:</span>
              <button
                onClick={() => { setPriceSearch('07_002'); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-teal-400 rounded border border-slate-800 transition-all font-mono"
              >
                PBS Specialist ($214.41)
              </button>
              <button
                onClick={() => { setPriceSearch('15_056'); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 rounded border border-slate-800 transition-all font-mono"
              >
                Allied Health / Therapy ($193.99)
              </button>
              <button
                onClick={() => { setPriceSearch('15_043'); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-purple-400 rounded border border-slate-800 transition-all font-mono"
              >
                Psychology ($214.41)
              </button>
              <button
                onClick={() => { setPriceSearch('Travel'); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-amber-400 rounded border border-slate-800 transition-all"
              >
                Provider Travel (07_799 / 15_799)
              </button>
              <button
                onClick={() => { setPriceSearch('Coordination'); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-sky-400 rounded border border-slate-800 transition-all"
              >
                Support Coordination ($100.14)
              </button>
              <button
                onClick={() => { setPriceSearch(''); setSelectedCategory('ALL'); }}
                className="px-2 py-0.5 text-slate-400 hover:text-white underline transition-all ml-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Official Line Items Schedule ({filteredSupportItems.length} Available)
              </h4>
              <span className="text-[11px] text-teal-400 font-mono">2025/2026 NDIS Pricing Matrix</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="p-3.5 font-bold">Line Item Code</th>
                    <th className="p-3.5 font-bold">Support Item Description</th>
                    <th className="p-3.5 font-bold">Support Category</th>
                    <th className="p-3.5 font-bold text-right">Price Limit</th>
                    <th className="p-3.5 font-bold text-center">Unit</th>
                    <th className="p-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSupportItems.map((item) => {
                    const isSelected = verifierItem.code === item.code;
                    return (
                      <tr
                        key={item.code}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-teal-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5 font-mono text-teal-400 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{item.code}</span>
                            <button
                              onClick={() => handleCopyCode(item.code)}
                              className="text-slate-500 hover:text-teal-300 p-1 rounded transition-colors"
                              title="Copy item code"
                            >
                              {copiedCode === item.code ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-3.5 text-white font-medium max-w-xs">
                          <div>{item.name}</div>
                          {item.code.includes('799') && (
                            <span className="text-[10px] text-amber-400/80 block mt-0.5">
                              *Max 30m metro / 60m regional provider travel
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-emerald-400 whitespace-nowrap">
                          ${item.pricePerUnit.toFixed(2)}
                        </td>

                        <td className="p-3.5 text-center text-slate-400 font-mono whitespace-nowrap">
                          {item.unitOfMeasure}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleSelectVerifierItem(item)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              isSelected
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Loaded in Verifier' : 'Verify & Calculate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory NDIS Claiming Rules & Guidance Accordion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <MapPin className="w-4 h-4" />
                <span>Provider Travel Claiming Rules</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Travel is claimable at the hourly rate of the practitioner. Capped at <strong>30 minutes</strong> in MMM1–3 (metro) and <strong>60 minutes</strong> in MMM4–5 (regional). Non-labor travel costs (tolls/parking) require participant agreement.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>Short Notice Cancellations</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Providers can claim <strong>100%</strong> of the agreed fee for short notice cancellations made within <strong>7 clear business days</strong> for therapy/PBS supports, provided reasonable mitigation was attempted.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <FileCheck className="w-4 h-4" />
                <span>Non-Face-to-Face & Reporting</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Report writing, comprehensive behavior support plan authoring, and clinical stakeholder case conferences are billable under Capacity Building line items when pre-agreed in the NDIS Service Agreement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI SOCIAL STORIES TAB */}
      {activeTab === 'social-stories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              Social Story Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Situation / Trigger</label>
                <textarea
                  rows={2}
                  value={socialStoryPrompt.situation}
                  onChange={(e) =>
                    setSocialStoryPrompt({ ...socialStoryPrompt, situation: e.target.value })
                  }
                  placeholder="e.g. Visiting the dentist or taking the bus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Regulation / Emotion Goal</label>
                <input
                  type="text"
                  value={socialStoryPrompt.targetEmotion}
                  onChange={(e) =>
                    setSocialStoryPrompt({ ...socialStoryPrompt, targetEmotion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Participant Stage</label>
                <input
                  type="text"
                  value={socialStoryPrompt.participantAge}
                  onChange={(e) =>
                    setSocialStoryPrompt({ ...socialStoryPrompt, participantAge: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={handleGenerateSocialStory}
                disabled={isGeneratingStory}
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {isGeneratingStory ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isGeneratingStory ? 'Crafting Social Story...' : 'Generate AI Social Story'}</span>
              </button>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Custom Story Canvas ({selectedClientObj?.name})
            </h3>

            {generatedStory ? (
              <div className="p-4 bg-slate-950/80 rounded-xl border border-teal-500/20 text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-3 font-serif">
                {generatedStory}
              </div>
            ) : (
              <div className="p-8 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                Fill out parameters on the left and click &quot;Generate AI Social Story&quot; to create a custom narrative.
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEGO BASED THERAPY TAB */}
      {activeTab === 'lego' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              Lego Based Therapy Collaboration Planner
            </h3>
            <span className="text-xs text-teal-400 font-mono">Capacity Building Intervention</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 text-sm">1. Engineer</span>
              <p className="text-slate-400 text-[11px]">Describes the instructions from the diagram to the supplier.</p>
              <input
                type="text"
                value={legoSession.engineerName}
                onChange={(e) => setLegoSession({ ...legoSession, engineerName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 text-sm">2. Supplier</span>
              <p className="text-slate-400 text-[11px]">Finds the correct Lego bricks requested and hands them to builder.</p>
              <input
                type="text"
                value={legoSession.supplierName}
                onChange={(e) => setLegoSession({ ...legoSession, supplierName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 text-sm">3. Builder</span>
              <p className="text-slate-400 text-[11px]">Listens to instructions from engineer and puts pieces together.</p>
              <input
                type="text"
                value={legoSession.builderName}
                onChange={(e) => setLegoSession({ ...legoSession, builderName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300">Social Communication Goal & Metrics</span>
            <p className="text-slate-200">{legoSession.socialTarget}</p>
          </div>
        </div>
      )}
    </div>
  );
};
