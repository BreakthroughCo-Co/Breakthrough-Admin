'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useManagementStore, TabType } from '@/stores/useManagementStore';
import { searchCrossModuleIndex, IndexedSearchResult } from '@/lib/searchIndexer';
import {
  Search,
  X,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Command,
  StickyNote,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  UserCheck,
  Clock,
  Compass,
  Target,
  BarChart3
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    currentUser,
    clients,
    billingClaims,
    caseNotes,
    incidents,
    practitioners,
    restrictivePractices,
    abcLogs,
    setActiveTab,
    setSelectedClientId
  } = useManagementStore();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'CLIENT' | 'CASE_NOTE' | 'PRACTITIONER' | 'BILLING' | 'INCIDENT' | 'RESTRICTIVE_PRACTICE' | 'ABC_LOG'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const adminTabs: TabType[] = ['hr-roster', 'audit-logs', 'integrations'];
  const isAdminUser = currentUser?.role === 'ADMIN';

  // Keyboard shortcut Ctrl+K or Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Run Cross-Module Semantic & Fuzzy Search Indexer
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const rawResults = searchCrossModuleIndex({
      query,
      categoryFilter: selectedCategory,
      clients,
      caseNotes,
      practitioners,
      billingClaims,
      incidents,
      restrictivePractices,
      abcLogs,
      limit: 30,
    });

    if (isAdminUser) return rawResults;

    return rawResults.filter((r) => !adminTabs.includes(r.targetTab));
  }, [query, selectedCategory, clients, caseNotes, practitioners, billingClaims, incidents, restrictivePractices, abcLogs, isAdminUser]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleNavigate = (tab: TabType, entityId?: string, category?: string) => {
    if (adminTabs.includes(tab) && !isAdminUser) {
      return;
    }
    if (category === 'CLIENT' && entityId) {
      setSelectedClientId(entityId);
    }
    setActiveTab(tab);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  // Keyboard arrow navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (searchResults.length > 0 ? (prev + 1) % searchResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        const item = searchResults[selectedIndex];
        handleNavigate(item.targetTab, item.entityId, item.category);
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-12 md:pt-16 px-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/80">
          <Search className="w-5 h-5 text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search with natural language (e.g. 'incidents in last 6 months', 'unused budget over $5000', 'anxiety notes')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mr-1 hidden sm:inline">Filter:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setSelectedCategory('CLIENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'CLIENT'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Participants</span>
          </button>
          <button
            onClick={() => setSelectedCategory('CASE_NOTE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'CASE_NOTE'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Case Notes</span>
          </button>
          <button
            onClick={() => setSelectedCategory('ABC_LOG')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'ABC_LOG'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>ABC Logs</span>
          </button>
          <button
            onClick={() => setSelectedCategory('BILLING')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'BILLING'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>Billing & Claims</span>
          </button>
          <button
            onClick={() => setSelectedCategory('PRACTITIONER')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'PRACTITIONER'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Staff / HR</span>
          </button>
          <button
            onClick={() => setSelectedCategory('INCIDENT')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'INCIDENT'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Incidents</span>
          </button>
          <button
            onClick={() => setSelectedCategory('RESTRICTIVE_PRACTICE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'RESTRICTIVE_PRACTICE'
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Restrictive Practices</span>
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {!query.trim() && (
            <div className="py-4 text-center text-slate-400 space-y-4">
              <div className="space-y-1">
                <Command className="w-7 h-7 text-teal-400 mx-auto opacity-80" />
                <p className="font-semibold text-slate-200">AI Natural Language Semantic Search Engine</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Ask plain-language questions across all participants, clinical notes, ABC behavior observations, NDIS billing claims, staff qualifications, or critical incidents.
                </p>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 text-left">
                  Quick System Destinations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                  <button
                    onClick={() => handleNavigate('clients')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 text-teal-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>Participants Roster</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('case-notes')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 text-sky-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Clinical Case Notes</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('abc-analyser')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>ABC Analyser & PBS</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('incidents')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 text-rose-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Incidents & Hazards</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('billing')}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>PRODA Claims & Xero</span>
                  </button>
                  {isAdminUser ? (
                    <button
                      onClick={() => handleNavigate('hr-roster')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 text-purple-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>Smart HR Rostering</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavigate('ndis-goals')}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 text-purple-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Target className="w-4 h-4 text-purple-400" />
                      <span>NDIS Goal Tracker</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {query.trim() && searchResults.length === 0 && (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300">No matching records found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Try querying in natural language (e.g. &quot;incidents involving self-harm&quot;, &quot;unpaid claims over $1000&quot;, or &quot;anxiety during transition notes&quot;).
              </p>
            </div>
          )}

          {/* Semantic & Fuzzy Search Results Stream */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Semantic & NLP Results ({searchResults.length})</span>
                <span className="text-teal-400 font-mono">Relevance Rank Active</span>
              </div>

              <div className="space-y-1.5">
                {searchResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.targetTab, item.entityId, item.category)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                        isSelected
                          ? 'bg-slate-800/90 border-teal-500/70 shadow-lg ring-1 ring-teal-500/30'
                          : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                            {item.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${item.badge.color}`}>
                            {item.badge.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.score}% Match
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 font-medium">{item.subtitle}</p>
                        <p
                          className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: item.snippet }}
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-center">
                        <span className="text-[10px] text-teal-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                          Open &rarr;
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">↑</kbd> <kbd className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> to open</span>
          </div>
          <span className="text-teal-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Breakthrough Semantic Search
          </span>
        </div>
      </div>
    </div>
  );
};
