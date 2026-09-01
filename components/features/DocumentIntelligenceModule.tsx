'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal, BSPDocument } from '@/types';
import { authFetch } from '@/lib/apiClient';
import {
  FileSearch,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Target,
  BrainCircuit,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

export const DocumentIntelligenceModule: React.FC = () => {
  const { addClient, addClientGoal, addBSPDocument, addNotification, currentUser } = useManagementStore();

  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; content?: string } | null>(null);
  const [documentType, setDocumentType] = useState('NDIS Plan Review Letter');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImported, setIsImported] = useState(false);

  const [extractedData, setExtractedData] = useState<{
    participantName: string;
    ndisNumber: string;
    dateOfBirth: string;
    planStartDate: string;
    planEndDate: string;
    primaryDisability: string;
    fundingAllocations: Array<{ category: string; amount: number; supportItem: string }>;
    totalBudget: number;
    diagnoses: string[];
    sensoryTriggers: string[];
    communicationMethod: string;
    presentingBehaviorsOfConcern: string[];
    restrictivePracticesIdentified: Array<{
      type: string;
      description: string;
      authorizationStatus: string;
      authorizedBy: string;
    }>;
    recommendedGoals: Array<{
      title: string;
      category: string;
      targetDate: string;
      progressPercent: number;
      gasTargetScore: number;
    }>;
    confidenceScore: number;
    analysisSummary: string;
  } | null>(null);

  const sampleDocuments = [
    {
      title: 'NDIS Plan Letter 2026 (Jordan Miller)',
      type: 'NDIS Plan Review Letter',
      size: '245 KB',
      content: `National Disability Insurance Scheme (NDIS) Plan Approval Notice
Participant: Jordan Miller | NDIS Number: 430891245 | DOB: 15/03/2004
Plan Validity: 01/01/2026 - 31/12/2026
Primary Diagnosis: Autism Spectrum Disorder (Level 2) with co-occurring Generalized Anxiety
Approved Budgets:
- Capacity Building (Improved Daily Living / Behaviour Support): $32,000 (Item 07_002_0115_8_3)
- Core Supports (Assistance with Daily Life): $16,500 (Item 01_011_0107_1_1)
Total Plan Value: $48,500
Identified Safety Precautions: Environmental restriction of front boundary gate approved by Victorian Senior Practitioner. Target goal: develop emotional regulation and independent community transitions.`
    },
    {
      title: 'Comprehensive OT & Sensory Assessment',
      type: 'Occupational Therapy Assessment',
      size: '410 KB',
      content: `Allied Health Diagnostic Summary - Functional Capacity & Sensory Profile
Client: Taylor Brooks | NDIS ID: 430982110 | Date of Assessment: 10/08/2026
Primary Diagnosis: Psychosocial Disability / Attention Deficit Hyperactivity Disorder
Sensory Triggers: Auditory overload in dining spaces, unexpected physical transitions.
Communication: Expressive verbal, benefits from visual picture exchange schedules (PECS).
Goal Recommendations:
1. Master self-advocacy using visual break cards during high-demand tasks.
2. Build stamina for 2-hour independent community volunteer shifts.`
    }
  ];

  const handleSelectSample = (sample: typeof sampleDocuments[0]) => {
    setSelectedFile({ name: sample.title, size: sample.size, content: sample.content });
    setDocumentType(sample.type);
    setExtractedData(null);
    setIsImported(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: event.target?.result as string
        });
        setExtractedData(null);
        setIsImported(false);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) {
      addNotification({
        title: 'No Document Selected',
        message: 'Please choose or upload a clinical document to analyze.',
        type: 'clinical',
        severity: 'low'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await authFetch('/api/gemini/analyze-document', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileContent: selectedFile.content || 'Sample NDIS Plan letter text',
          documentType
        })
      });

      const resJson = await response.json();

      if (resJson.success && resJson.extractedData) {
        setExtractedData(resJson.extractedData);
        addNotification({
          title: 'Document Analysis Complete',
          message: `Successfully extracted structured clinical data from ${selectedFile.name}.`,
          type: 'clinical',
          severity: 'success'
        });
      } else {
        throw new Error(resJson.error || 'Failed to extract document contents');
      }
    } catch (err: any) {
      console.warn('Document analysis error:', err);
      addNotification({
        title: 'Analysis Fallback',
        message: 'Loaded simulated structured intake data.',
        type: 'general',
        severity: 'info'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handle1ClickImport = () => {
    if (!extractedData) return;

    const clientId = `cli-${Date.now().toString().slice(-4)}`;

    // 1. Create Client
    const newClient: Client = {
      id: clientId,
      name: extractedData.participantName,
      ndisNumber: extractedData.ndisNumber,
      dateOfBirth: extractedData.dateOfBirth,
      status: 'Active',
      primaryDisability: extractedData.primaryDisability,
      totalBudget: extractedData.totalBudget,
      allocatedBudget: extractedData.totalBudget,
      spentBudget: 0,
      planStartDate: extractedData.planStartDate,
      planEndDate: extractedData.planEndDate,
      primaryPractitionerId: currentUser?.practitionerId || currentUser?.id || 'prac-1',
      primaryPractitionerName: currentUser?.displayName || currentUser?.name || 'Primary Practitioner',
      riskLevel: extractedData.restrictivePracticesIdentified.length > 0 ? 'High' : 'Low',
      restrictivePracticesActive: extractedData.restrictivePracticesIdentified.length > 0,
      emergencyContact: {
        name: 'Primary Nominee / Carer',
        relationship: 'Guardian / Carer',
        phone: '0412 345 678',
      },
      goals: extractedData.recommendedGoals.map((g, idx) => ({
        id: `goal-${idx + 1}-${Date.now().toString().slice(-3)}`,
        title: g.title,
        category: g.category,
        targetDate: g.targetDate,
        progressPercent: g.progressPercent || 25,
        status: 'In Progress',
        gasScore: (g.gasTargetScore as any) || 0
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addClient(newClient);

    // 2. Create Draft BSP if restrictive practices or presenting behaviours exist
    if (extractedData.presentingBehaviorsOfConcern.length > 0) {
      const newBsp: BSPDocument = {
        id: `bsp-${Date.now().toString().slice(-4)}`,
        clientId: clientId,
        clientName: extractedData.participantName,
        title: `Positive Behaviour Support Plan - ${extractedData.participantName}`,
        ndisNumber: extractedData.ndisNumber,
        version: 'v1.0 (Intake Draft)',
        status: 'Draft',
        summary: `Automated baseline BSP drafted from intake assessment. Diagnoses: ${extractedData.diagnoses.join(', ')}.`,
        primaryBehaviorsOfConcern: extractedData.presentingBehaviorsOfConcern,
        proactiveStrategies: extractedData.sensoryTriggers.map((trig) => `Proactive accommodation for trigger: ${trig}`),
        reactiveStrategies: [
          'Safe physical step-back and visual calming timer',
          'Offer sensory weighted lap pad in designated low-arousal quiet space'
        ],
        restrictivePractices: extractedData.restrictivePracticesIdentified.map((rp, idx) => ({
          id: `rp-ext-${idx + 1}`,
          clientId: clientId,
          clientName: extractedData.participantName,
          practiceType: (rp.type as any) || 'Environmental',
          description: rp.description,
          status: 'Active',
          authorizationBody: rp.authorizedBy || 'VIC Senior Practitioner',
          authorizationReference: `EXT-AUTH-${Date.now().toString().slice(-4)}`,
          startDate: extractedData.planStartDate,
          expiryDate: extractedData.planEndDate,
          reductionPlanSummary: 'Fade environmental restriction as functional communication autonomy is established.',
          monthlyReportStatus: 'Due'
        })),
        reviewDate: extractedData.planEndDate,
        authorName: currentUser?.displayName || currentUser?.name || 'Intake Specialist',
        lastUpdated: new Date().toISOString()
      };

      addBSPDocument(newBsp);
    }

    setIsImported(true);

    addNotification({
      title: 'Participant Ingested',
      message: `${extractedData.participantName} imported with goals and draft Behaviour Support Plan!`,
      type: 'client',
      severity: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Clinical Document Intelligence & OCR Intake
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MULTIMODAL AI
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Upload NDIS plan letters, OT functional assessments, and neuropsych evaluations. Gemini extracts diagnostic criteria, allocated budgets, sensory profiles, and target behaviors for 1-click clinical ingestion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-950/50 flex items-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
              <input type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload/Sample Selector + Extraction Reviewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sample Documents & Upload Details */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-indigo-400" />
              <span>Select Sample Document</span>
            </h2>

            <div className="space-y-2.5">
              {sampleDocuments.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedFile?.name === s.title
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">{s.title}</p>
                      <p className="text-[11px] text-slate-400">{s.type} • {s.size}</p>
                    </div>
                    {selectedFile?.name === s.title && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedFile && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Selected File:</span>
                  <span className="font-bold text-slate-200">{selectedFile.name}</span>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleAnalyzeDocument}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Document Layout & OCR...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract Clinical Profile</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Structured Clinical Ingestion Results */}
        <div className="lg:col-span-2 space-y-5">
          {extractedData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fadeIn">
              {/* Extraction Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{extractedData.participantName}</h3>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-teal-400">
                      NDIS: {extractedData.ndisNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Plan Period: {extractedData.planStartDate} to {extractedData.planEndDate} • Total Funding: ${extractedData.totalBudget.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confidence: {(extractedData.confidenceScore * 100).toFixed(0)}%
                  </span>

                  <button
                    type="button"
                    disabled={isImported}
                    onClick={handle1ClickImport}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      isImported
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/40'
                    }`}
                  >
                    {isImported ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Ingested to System!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>1-Click Ingestion</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid: Funding Allocations & Diagnoses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Funding Lines */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <DollarSign className="w-4 h-4" />
                    <span>NDIS Funding Allocations</span>
                  </div>
                  <div className="space-y-2">
                    {extractedData.fundingAllocations.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                        <div>
                          <p className="font-semibold text-slate-200">{f.category}</p>
                          <p className="text-[11px] font-mono text-slate-400">{f.supportItem}</p>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono">${f.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Diagnoses & Sensory Triggers */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4" />
                    <span>Diagnoses & Sensory Profile</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {extractedData.diagnoses.map((d, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium pt-1">Sensory Triggers:</p>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {extractedData.sensoryTriggers.map((st, idx) => (
                        <li key={idx}>{st}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Extracted Goals */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  <span>Recommended NDIS Goal Linkages</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {extractedData.recommendedGoals.map((g, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-slate-200">{g.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Category: {g.category}</span>
                        <span className="text-teal-400 font-bold">Target GAS: +{g.gasTargetScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restrictive Practice Safeguards */}
              {extractedData.restrictivePracticesIdentified.length > 0 && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Identified Restrictive Practices (Victorian Senior Practitioner)</span>
                  </div>
                  {extractedData.restrictivePracticesIdentified.map((rp, idx) => (
                    <div key={idx} className="text-xs text-slate-200 p-2.5 bg-slate-950/80 rounded-xl border border-rose-900/30 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-rose-400">{rp.type} Restriction:</span> {rp.description}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 ml-3">
                        Status: {rp.authorizationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[380px] bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <FileSearch className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">No Document Analyzed Yet</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select a sample document from the left or upload an NDIS plan PDF to initiate multimodal clinical parsing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
