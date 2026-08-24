'use client';

import React, { useState } from 'react';
import { useManagementStore } from '@/stores/useManagementStore';
import { Client, ClientGoal } from '@/types';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Shield,
  HeartPulse,
  Sparkles,
  Users,
  Target,
  FileSpreadsheet,
  HelpCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Info,
  Check,
  Award
} from 'lucide-react';

interface ParticipantOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (newClient: Client) => void;
}

const PRIMARY_DISABILITIES = [
  'Autism Spectrum Disorder (Level 1)',
  'Autism Spectrum Disorder (Level 2)',
  'Autism Spectrum Disorder (Level 3)',
  'Intellectual Disability (Mild)',
  'Intellectual Disability (Moderate / Severe)',
  'Acquired Brain Injury (ABI)',
  'Cerebral Palsy (GMFCS I-V)',
  'Psychosocial Disability / Schizophrenia / Bipolar',
  'Down Syndrome',
  'Spinal Cord Injury (Paraplegia / Tetraplegia)',
  'Multiple Sclerosis (MS)',
  'Neurological Disorder / Parkinsonism',
  'Sensory / Hearing / Vision Impairment',
  'Global Developmental Delay (Early Childhood)'
];

const HIGH_INTENSITY_OPTIONS = [
  'Dysphagia & Texture-Modified Mealtime Support',
  'Epilepsy Management & Emergency Midazolam',
  'Enteral (PEG / PEJ) Tube Feeding',
  'Subcutaneous Injections & Diabetes Management',
  'Complex Bowel Care & Stoma Management',
  'Tracheostomy & Suctioning Care',
  'Pressure Injury & High-Risk Skin Integrity'
];

export const ParticipantOnboardingWizard: React.FC<ParticipantOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onClientCreated
}) => {
  const { addClient, supportItems, currentUser } = useManagementStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelpTooltip, setShowHelpTooltip] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identity & Demographics
    name: '',
    preferredName: '',
    ndisNumber: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    phone: '',
    email: '',
    street: '',
    suburb: '',
    state: 'VIC',
    postcode: '',
    mmmZone: 'MMM 1 - Metropolitan',

    // Step 2: NDIS Plan Details
    planStartDate: new Date().toISOString().split('T')[0],
    planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    planManagementType: 'Plan-Managed' as 'Agency-Managed (NDIA)' | 'Plan-Managed' | 'Self-Managed',
    totalBudget: 45000,
    coreBudget: 20000,
    therapyBudget: 15000,
    pbsBudget: 10000,
    supportCoordBudget: 0,
    capitalBudget: 0,

    // Step 3: Care Circle & Contacts
    supportCoordName: '',
    supportCoordAgency: '',
    supportCoordEmail: '',
    supportCoordPhone: '',
    planManagerAgency: '',
    planManagerEmail: '',
    planManagerPhone: '',
    nomineeName: '',
    nomineeRelationship: 'Parent / Primary Guardian',
    nomineePhone: '',
    gpName: '',
    gpClinic: '',
    gpPhone: '',

    // Step 4: Disability & Clinical Needs
    primaryDisability: 'Autism Spectrum Disorder (Level 3)',
    customDisability: '',
    secondaryDisabilitiesText: 'Sensory Processing Sensitivity, Anxiety',
    selectedHighIntensity: [] as string[],
    communicationMethod: 'Verbal with visual schedule prompting',
    mobilityNeeds: 'Fully independent mobility in community',

    // Step 5: Risk & Safety
    riskLevel: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    triggersText: 'Sensory overload, loud sudden noises, unexpected routine transitions',
    deescalationStrategies: 'Provide quiet sensory room, use visual countdown timer, offer noise-cancelling headphones',
    restrictivePracticesActive: false,
    bspStatus: 'In Development',

    // Step 6: Initial Goals
    goal1Title: 'Master independent emotional self-regulation techniques during sensory overload',
    goal1Category: 'Capacity Building' as const,
    goal1TargetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal1GasScore: 0 as -2 | -1 | 0 | 1 | 2,

    goal2Title: 'Establish daily functional communication system for personal meal preferences',
    goal2Category: 'Core' as const,
    goal2TargetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goal2GasScore: -1 as -2 | -1 | 0 | 1 | 2,

    // Step 7: Service Schedule
    primarySupportItemCode: '07_004_0115_8_3',
    agreedHourlyRate: 214.41,
    weeklyAllocatedHours: 2.5
  });

  if (!isOpen) return null;

  const totalSteps = 7;

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleToggleHighIntensity = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedHighIntensity: prev.selectedHighIntensity.includes(item)
        ? prev.selectedHighIntensity.filter((i) => i !== item)
        : [...prev.selectedHighIntensity, item]
    }));
  };

  const handleFillSampleData = () => {
    setFormData({
      name: 'Alex Rivera',
      preferredName: 'Alex',
      ndisNumber: '430998812',
      dateOfBirth: '2001-08-14',
      gender: 'Non-Binary',
      phone: '0422 918 304',
      email: 'alex.rivera@example.com.au',
      street: '42 Highfield Crescent',
      suburb: 'Richmond',
      state: 'VIC',
      postcode: '3121',
      mmmZone: 'MMM 1 - Metropolitan',
      planStartDate: '2026-01-01',
      planEndDate: '2026-12-31',
      planManagementType: 'Plan-Managed',
      totalBudget: 58500,
      coreBudget: 28000,
      therapyBudget: 18500,
      pbsBudget: 12000,
      supportCoordBudget: 0,
      capitalBudget: 0,
      supportCoordName: 'Clara Oswald',
      supportCoordAgency: 'Empower NDIS Coordination',
      supportCoordEmail: 'clara@empowercoord.com.au',
      supportCoordPhone: '0411 223 344',
      planManagerAgency: 'MyPlan Invoicing Solutions',
      planManagerEmail: 'invoices@myplansolutions.com.au',
      planManagerPhone: '1300 445 566',
      nomineeName: 'Elena Rivera',
      nomineeRelationship: 'Mother & Legal Nominee',
      nomineePhone: '0433 881 290',
      gpName: 'Dr. Michael Cho',
      gpClinic: 'Richmond Family Health Practice',
      gpPhone: '03 9428 1100',
      primaryDisability: 'Autism Spectrum Disorder (Level 3)',
      customDisability: '',
      secondaryDisabilitiesText: 'Generalized Anxiety Disorder, Sensory Hyper-reactivity',
      selectedHighIntensity: ['Dysphagia & Texture-Modified Mealtime Support'],
      communicationMethod: 'Verbal assisted by visual schedule board',
      mobilityNeeds: 'Independent ambulant; requires handrail support on stairs',
      riskLevel: 'Medium',
      triggersText: 'Sudden unexpected loud sounds, crowded spaces, rapid transition between activities without visual warning',
      deescalationStrategies: 'Offer active noise cancelling headphones, guide to quiet zone, present visual timer with 5-minute cooldown break',
      restrictivePracticesActive: false,
      bspStatus: 'Drafting',
      goal1Title: 'Achieve emotional self-regulation independently when experiencing sensory fatigue at university',
      goal1Category: 'Capacity Building',
      goal1TargetDate: '2026-10-31',
      goal1GasScore: 0,
      goal2Title: 'Prepare 3 balanced meals weekly using structured step-by-step visual recipe cards',
      goal2Category: 'Core',
      goal2TargetDate: '2026-11-30',
      goal2GasScore: -1,
      primarySupportItemCode: '07_004_0115_8_3',
      agreedHourlyRate: 214.41,
      weeklyAllocatedHours: 2.5
    });
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();

    const secondaryArray = formData.secondaryDisabilitiesText
      ? formData.secondaryDisabilitiesText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const triggersArray = formData.triggersText
      ? formData.triggersText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const goals: ClientGoal[] = [
      {
        id: `g-${Date.now()}-1`,
        title: formData.goal1Title,
        category: formData.goal1Category,
        targetDate: formData.goal1TargetDate,
        progressPercent: 20,
        status: 'In Progress',
        gasScore: formData.goal1GasScore,
        gasHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            score: formData.goal1GasScore,
            note: 'Initial baseline set during NDIS participant intake questionnaire'
          }
        ]
      }
    ];

    if (formData.goal2Title.trim()) {
      goals.push({
        id: `g-${Date.now()}-2`,
        title: formData.goal2Title,
        category: formData.goal2Category,
        targetDate: formData.goal2TargetDate,
        progressPercent: 15,
        status: 'In Progress',
        gasScore: formData.goal2GasScore,
        gasHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            score: formData.goal2GasScore,
            note: 'Secondary goal baseline established at intake'
          }
        ]
      });
    }

    const calculatedTotalBudget =
      formData.totalBudget ||
      (Number(formData.coreBudget) || 0) +
        (Number(formData.therapyBudget) || 0) +
        (Number(formData.pbsBudget) || 0) +
        (Number(formData.supportCoordBudget) || 0) +
        (Number(formData.capitalBudget) || 0);

    const newClient: Client = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      ndisNumber: formData.ndisNumber || `43${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: formData.name || 'New Participant',
      preferredName: formData.preferredName || undefined,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      address: {
        street: formData.street,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
        mmmZone: formData.mmmZone
      },
      dateOfBirth: formData.dateOfBirth || '2000-01-01',
      status: 'Active',
      primaryDisability:
        formData.primaryDisability === 'Other (Specify)'
          ? formData.customDisability || 'Disability Support'
          : formData.primaryDisability,
      secondaryDisabilities: secondaryArray,
      goals,
      planStartDate: formData.planStartDate,
      planEndDate: formData.planEndDate,
      planManagementType: formData.planManagementType,
      planManager: {
        agency: formData.planManagerAgency,
        email: formData.planManagerEmail,
        phone: formData.planManagerPhone
      },
      supportCoordinator: {
        name: formData.supportCoordName,
        agency: formData.supportCoordAgency,
        email: formData.supportCoordEmail,
        phone: formData.supportCoordPhone
      },
      budgetBreakdown: {
        core: Number(formData.coreBudget) || 0,
        capacityBuildingTherapy: Number(formData.therapyBudget) || 0,
        capacityBuildingPBS: Number(formData.pbsBudget) || 0,
        supportCoordination: Number(formData.supportCoordBudget) || 0,
        capital: Number(formData.capitalBudget) || 0
      },
      totalBudget: calculatedTotalBudget,
      allocatedBudget: Math.round(calculatedTotalBudget * 0.85),
      spentBudget: 0,
      primaryPractitionerId: currentUser.practitionerId || 'prac-201',
      primaryPractitionerName: currentUser.name || 'Primary Practitioner',
      riskLevel: formData.riskLevel,
      emergencyContact: {
        name: formData.nomineeName || 'Emergency Contact',
        relationship: formData.nomineeRelationship || 'Family Member',
        phone: formData.nomineePhone || formData.phone || '0400 000 000'
      },
      gpContact: {
        doctorName: formData.gpName,
        clinicName: formData.gpClinic,
        phone: formData.gpPhone
      },
      highIntensityNeeds: formData.selectedHighIntensity,
      communicationMethod: formData.communicationMethod,
      mobilityNeeds: formData.mobilityNeeds,
      triggers: triggersArray,
      deescalationStrategies: formData.deescalationStrategies,
      primarySupportItemCode: formData.primarySupportItemCode,
      agreedHourlyRate: Number(formData.agreedHourlyRate) || 214.41,
      weeklyAllocatedHours: Number(formData.weeklyAllocatedHours) || 2.0,
      restrictivePracticesActive: formData.restrictivePracticesActive,
      isCustomUserParticipant: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addClient(newClient);
    if (onClientCreated) onClientCreated(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  NDIS Participant Intake & Questionnaire Wizard
                </h2>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Answer the guided questions to establish a complete clinical and financial participant profile.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSampleData}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 transition-all font-medium"
              title="Pre-fill sample data for rapid testing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 overflow-x-auto gap-2 pb-1">
            {[
              { num: 1, title: 'Identity & Demographics' },
              { num: 2, title: 'NDIS Plan & Budget' },
              { num: 3, title: 'Care Circle' },
              { num: 4, title: 'Disability & Clinical' },
              { num: 5, title: 'Safety & Risk' },
              { num: 6, title: 'Goals & GAS' },
              { num: 7, title: 'Service Schedule' }
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                  currentStep === step.num
                    ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                    : currentStep > step.num
                    ? 'text-teal-400/80 hover:text-teal-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                    currentStep === step.num
                      ? 'bg-teal-500 text-slate-950'
                      : currentStep > step.num
                      ? 'bg-teal-900 text-teal-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > step.num ? <Check className="w-2.5 h-2.5" /> : step.num}
                </span>
                <span className="hidden md:inline">{step.title}</span>
              </button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Form Body */}
        <form onSubmit={handleCompleteOnboarding} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* STEP 1: IDENTITY & DEMOGRAPHICS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <Info className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 1: Who is the participant?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Enter the participant&apos;s primary legal name, NDIS number (9-digit NDIA reference), date of birth, and primary residential location for MMM travel loading calculation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Participant Full Legal Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Jordan Miller"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Preferred Name / Pronouns
                  </label>
                  <input
                    type="text"
                    value={formData.preferredName}
                    onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    placeholder="e.g. Jordy (They/Them)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    NDIS Participant Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ndisNumber}
                    onChange={(e) => setFormData({ ...formData, ndisNumber: e.target.value })}
                    placeholder="e.g. 430891245 (9 digits)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Found on the participant&apos;s official NDIS plan cover page.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0412 345 678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="participant@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="border-t border-slate-800/80 pt-4">
                <h5 className="font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>Residential Location & Modified Monash Model (MMM) Classification</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="123 Example Street"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Suburb / City</label>
                    <input
                      type="text"
                      value={formData.suburb}
                      onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                      placeholder="Melbourne"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="VIC">Victoria (VIC)</option>
                      <option value="NSW">New South Wales (NSW)</option>
                      <option value="QLD">Queensland (QLD)</option>
                      <option value="WA">Western Australia (WA)</option>
                      <option value="SA">South Australia (SA)</option>
                      <option value="TAS">Tasmania (TAS)</option>
                      <option value="ACT">Australian Capital Territory (ACT)</option>
                      <option value="NT">Northern Territory (NT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      placeholder="3000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">MMM Travel Zone</label>
                    <select
                      value={formData.mmmZone}
                      onChange={(e) => setFormData({ ...formData, mmmZone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="MMM 1 - Metropolitan">MMM 1 - Metropolitan (Standard Cap)</option>
                      <option value="MMM 2-3 - Regional Centre">MMM 2-3 - Regional Centre (Standard Cap)</option>
                      <option value="MMM 4-5 - Medium/Small Rural">MMM 4-5 - Medium/Small Rural (Standard Cap)</option>
                      <option value="MMM 6 - Remote">MMM 6 - Remote (+40% NDIS Price Loading)</option>
                      <option value="MMM 7 - Very Remote">MMM 7 - Very Remote (+50% NDIS Price Loading)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: NDIS PLAN & BUDGET HIERARCHY */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 2: How is their NDIS Plan funded & managed?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Define the NDIS plan duration, whether they are Plan-Managed, NDIA-Managed, or Self-Managed, and allocate funding across core support categories.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan Management Type <span className="text-rose-400">*</span></label>
                  <select
                    value={formData.planManagementType}
                    onChange={(e) => setFormData({ ...formData, planManagementType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-teal-500"
                  >
                    <option value="Plan-Managed">Plan-Managed (Invoices sent to Plan Manager)</option>
                    <option value="Agency-Managed (NDIA)">Agency-Managed / NDIA (PACE / PRODA Direct)</option>
                    <option value="Self-Managed">Self-Managed (Invoices sent to Participant/Nominee)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan Start Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.planStartDate}
                    onChange={(e) => setFormData({ ...formData, planStartDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan End / Review Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.planEndDate}
                    onChange={(e) => setFormData({ ...formData, planEndDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Funding Category Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h5 className="font-bold text-slate-200">NDIS Budget Breakdown by Support Category ($ AUD)</h5>
                  <div className="text-teal-400 font-mono font-bold text-sm">
                    Total: ${ (
                      Number(formData.coreBudget) +
                      Number(formData.therapyBudget) +
                      Number(formData.pbsBudget) +
                      Number(formData.supportCoordBudget) +
                      Number(formData.capitalBudget)
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Core: Daily Life & Social ($)</label>
                    <input
                      type="number"
                      value={formData.coreBudget}
                      onChange={(e) => setFormData({ ...formData, coreBudget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Capacity Building: Allied Health ($)</label>
                    <input
                      type="number"
                      value={formData.therapyBudget}
                      onChange={(e) => setFormData({ ...formData, therapyBudget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Capacity Building: PBS & Relationships ($)</label>
                    <input
                      type="number"
                      value={formData.pbsBudget}
                      onChange={(e) => setFormData({ ...formData, pbsBudget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Support Coordination ($)</label>
                    <input
                      type="number"
                      value={formData.supportCoordBudget}
                      onChange={(e) => setFormData({ ...formData, supportCoordBudget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Capital: Assistive Tech / Home Mods ($)</label>
                    <input
                      type="number"
                      value={formData.capitalBudget}
                      onChange={(e) => setFormData({ ...formData, capitalBudget: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CARE CIRCLE & STAKEHOLDERS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <Users className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 3: Who are the key stakeholders & care network?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Record the Support Coordinator, Plan Manager billing contact, legal nominee, and primary GP for clinical multidisciplinary communication.
                  </p>
                </div>
              </div>

              {/* Support Coordinator */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-teal-400">Support Coordinator (SC)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Coordinator Name</label>
                    <input
                      type="text"
                      value={formData.supportCoordName}
                      onChange={(e) => setFormData({ ...formData, supportCoordName: e.target.value })}
                      placeholder="e.g. Clara Oswald"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Coordination Agency</label>
                    <input
                      type="text"
                      value={formData.supportCoordAgency}
                      onChange={(e) => setFormData({ ...formData, supportCoordAgency: e.target.value })}
                      placeholder="e.g. Empower NDIS Coordination"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Coordinator Email</label>
                    <input
                      type="email"
                      value={formData.supportCoordEmail}
                      onChange={(e) => setFormData({ ...formData, supportCoordEmail: e.target.value })}
                      placeholder="clara@empowercoord.com.au"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Coordinator Phone</label>
                    <input
                      type="tel"
                      value={formData.supportCoordPhone}
                      onChange={(e) => setFormData({ ...formData, supportCoordPhone: e.target.value })}
                      placeholder="0411 223 344"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Plan Manager Invoicing */}
              {formData.planManagementType === 'Plan-Managed' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h5 className="font-bold text-teal-400">Plan Management Invoicing Contact</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Plan Manager Agency</label>
                      <input
                        type="text"
                        value={formData.planManagerAgency}
                        onChange={(e) => setFormData({ ...formData, planManagerAgency: e.target.value })}
                        placeholder="e.g. MyPlan Solutions"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Invoice Submission Email</label>
                      <input
                        type="email"
                        value={formData.planManagerEmail}
                        onChange={(e) => setFormData({ ...formData, planManagerEmail: e.target.value })}
                        placeholder="invoices@myplansolutions.com.au"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Agency Phone</label>
                      <input
                        type="tel"
                        value={formData.planManagerPhone}
                        onChange={(e) => setFormData({ ...formData, planManagerPhone: e.target.value })}
                        placeholder="1300 445 566"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Nominee & Emergency Contact */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-teal-400">Primary Nominee / Legal Guardian / Emergency Contact</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Full Name <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.nomineeName}
                      onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                      placeholder="e.g. Elena Rivera"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={formData.nomineeRelationship}
                      onChange={(e) => setFormData({ ...formData, nomineeRelationship: e.target.value })}
                      placeholder="Mother / Public Trustee"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Emergency Phone Number <span className="text-rose-400">*</span></label>
                    <input
                      type="tel"
                      required
                      value={formData.nomineePhone}
                      onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                      placeholder="0433 881 290"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DISABILITY & CLINICAL COMPLEXITY */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <HeartPulse className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 4: What are their primary disabilities & clinical support needs?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Select diagnostic categories and flag any NDIS High-Intensity Daily Personal Activities requiring specialized practitioner training.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Disability Diagnosis <span className="text-rose-400">*</span></label>
                  <select
                    value={formData.primaryDisability}
                    onChange={(e) => setFormData({ ...formData, primaryDisability: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {PRIMARY_DISABILITIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="Other (Specify)">Other (Specify custom diagnosis)</option>
                  </select>
                  {formData.primaryDisability === 'Other (Specify)' && (
                    <input
                      type="text"
                      value={formData.customDisability}
                      onChange={(e) => setFormData({ ...formData, customDisability: e.target.value })}
                      placeholder="Enter primary disability"
                      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Secondary Disabilities & Co-morbidities</label>
                  <input
                    type="text"
                    value={formData.secondaryDisabilitiesText}
                    onChange={(e) => setFormData({ ...formData, secondaryDisabilitiesText: e.target.value })}
                    placeholder="e.g. Anxiety, Sensory Processing Sensitivity"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Separate multiple diagnoses with commas.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Communication Method</label>
                  <input
                    type="text"
                    value={formData.communicationMethod}
                    onChange={(e) => setFormData({ ...formData, communicationMethod: e.target.value })}
                    placeholder="e.g. Verbal with visual timetable prompting / AAC device"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobility & Transfer Profile</label>
                  <input
                    type="text"
                    value={formData.mobilityNeeds}
                    onChange={(e) => setFormData({ ...formData, mobilityNeeds: e.target.value })}
                    placeholder="e.g. Independent ambulant / Requires 1-person assist on stairs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* High-Intensity Daily Personal Activities */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-slate-200 flex items-center justify-between">
                  <span>NDIS High-Intensity Support Skills (Select all that apply)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Requires Registered Nurse oversight or specific competency verification</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HIGH_INTENSITY_OPTIONS.map((item) => (
                    <label
                      key={item}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        formData.selectedHighIntensity.includes(item)
                          ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedHighIntensity.includes(item)}
                        onChange={() => handleToggleHighIntensity(item)}
                        className="rounded border-slate-700 text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-xs">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SAFETY, RISK & RESTRICTIVE PRACTICES */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <Shield className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 5: What are their behavioral triggers, risks & safety protocols?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Document known escalation triggers, proactive de-escalation strategies, and indicate if any regulated restrictive practices are currently authorised.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Clinical Risk Level <span className="text-rose-400">*</span></label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold"
                  >
                    <option value="Low">Low - Minimal safety concerns; independent regulation</option>
                    <option value="Medium">Medium - Occasional agitation; responds well to standard calming cues</option>
                    <option value="High">High - Frequent severe escalation; risk of self-harm or property damage</option>
                    <option value="Critical">Critical - Regulated BSP / 2:1 staffing required; immediate supervisor escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Behaviour Support Plan (BSP) Status</label>
                  <select
                    value={formData.bspStatus}
                    onChange={(e) => setFormData({ ...formData, bspStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Not Required">Not Required (No restrictive practices or severe behaviors)</option>
                    <option value="Drafting">In Development / Functional Assessment</option>
                    <option value="Authorised">Authorised & Lodged with NDIS Quality & Safeguards Commission</option>
                    <option value="Review Due">Annual Review Due</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Known Behavioral Escalation Triggers</label>
                  <input
                    type="text"
                    value={formData.triggersText}
                    onChange={(e) => setFormData({ ...formData, triggersText: e.target.value })}
                    placeholder="e.g. Loud unexpected sirens, crowded shopping malls, abrupt activity transitions"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Proactive De-escalation & Calming Protocol</label>
                  <textarea
                    rows={3}
                    value={formData.deescalationStrategies}
                    onChange={(e) => setFormData({ ...formData, deescalationStrategies: e.target.value })}
                    placeholder="e.g. Offer noise-cancelling headphones, guide to quiet sensory room, use visual 5-min timer, reduce verbal demands..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Are Regulated Restrictive Practices Active?</span>
                    <span className="text-[11px] text-slate-400">Chemical, Mechanical, Physical, Environmental, or Seclusion restrictions.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.restrictivePracticesActive}
                      onChange={(e) => setFormData({ ...formData, restrictivePracticesActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: NDIS OUTCOME GOALS & GAS SCALING */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <Target className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 6: What are the participant&apos;s primary NDIS goals?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Set up SMART goals with baseline Goal Attainment Scaling (GAS from -2 much less than expected to +2 much more than expected) to track measurable outcomes.
                  </p>
                </div>
              </div>

              {/* Goal 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-teal-400 flex items-center justify-between">
                  <span>Primary NDIS Goal 1 <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20">Capacity Building</span>
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Goal Statement</label>
                    <input
                      type="text"
                      required
                      value={formData.goal1Title}
                      onChange={(e) => setFormData({ ...formData, goal1Title: e.target.value })}
                      placeholder="e.g. Master independent emotional regulation techniques during sensory overload"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={formData.goal1Category}
                        onChange={(e) => setFormData({ ...formData, goal1Category: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Capacity Building">Capacity Building</option>
                        <option value="Core">Core</option>
                        <option value="Social & Community">Social & Community</option>
                        <option value="Capital">Capital</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={formData.goal1TargetDate}
                        onChange={(e) => setFormData({ ...formData, goal1TargetDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      >
                      </input>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Baseline GAS Score</label>
                      <select
                        value={formData.goal1GasScore}
                        onChange={(e) => setFormData({ ...formData, goal1GasScore: Number(e.target.value) as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                      >
                        <option value="-2">-2: Much less than expected outcome</option>
                        <option value="-1">-1: Somewhat less than expected outcome</option>
                        <option value="0">0: Expected baseline standard</option>
                        <option value="1">+1: Somewhat more than expected</option>
                        <option value="2">+2: Much more than expected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>Secondary NDIS Goal 2</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Core & Daily Living</span>
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Goal Statement</label>
                    <input
                      type="text"
                      value={formData.goal2Title}
                      onChange={(e) => setFormData({ ...formData, goal2Title: e.target.value })}
                      placeholder="e.g. Prepare 3 balanced meals weekly using visual step-by-step recipe cards"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={formData.goal2Category}
                        onChange={(e) => setFormData({ ...formData, goal2Category: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Core">Core</option>
                        <option value="Capacity Building">Capacity Building</option>
                        <option value="Social & Community">Social & Community</option>
                        <option value="Capital">Capital</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={formData.goal2TargetDate}
                        onChange={(e) => setFormData({ ...formData, goal2TargetDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Baseline GAS Score</label>
                      <select
                        value={formData.goal2GasScore}
                        onChange={(e) => setFormData({ ...formData, goal2GasScore: Number(e.target.value) as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                      >
                        <option value="-2">-2: Much less than expected</option>
                        <option value="-1">-1: Somewhat less than expected</option>
                        <option value="0">0: Expected baseline standard</option>
                        <option value="1">+1: Somewhat more than expected</option>
                        <option value="2">+2: Much more than expected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SERVICE AGREEMENT & SCHEDULE OF SUPPORTS */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <Award className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-sm">Question 7: What is the agreed billable schedule of supports?</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Select the official NDIS price guide support item code, agreed hourly rate, and weekly service delivery hours to complete the onboarding profile.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Primary NDIS Support Item Code <span className="text-rose-400">*</span></label>
                  <select
                    value={formData.primarySupportItemCode}
                    onChange={(e) => {
                      const item = supportItems.find((s) => s.code === e.target.value);
                      setFormData({
                        ...formData,
                        primarySupportItemCode: e.target.value,
                        agreedHourlyRate: item?.pricePerUnit || formData.agreedHourlyRate
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {supportItems.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} — {item.name} (${item.pricePerUnit.toFixed(2)}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Agreed Hourly Rate ($ AUD) <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.agreedHourlyRate}
                    onChange={(e) => setFormData({ ...formData, agreedHourlyRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Weekly Service Delivery Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.weeklyAllocatedHours}
                    onChange={(e) => setFormData({ ...formData, weeklyAllocatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated Annual Service Value:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      ${(Number(formData.agreedHourlyRate) * Number(formData.weeklyAllocatedHours) * 48).toLocaleString(undefined, { minimumFractionDigits: 2 })} / yr
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Calculated based on 48 billable delivery weeks per year.</p>
                </div>
              </div>

              {/* Summary Overview Card */}
              <div className="bg-slate-950 border border-teal-500/30 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Onboarding Profile Summary</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px] pt-1">
                  <div><span className="text-slate-500 block">Participant:</span> <strong className="text-white">{formData.name || 'Not specified'}</strong></div>
                  <div><span className="text-slate-500 block">NDIS #:</span> <span className="font-mono text-teal-400">{formData.ndisNumber || 'Auto-generated'}</span></div>
                  <div><span className="text-slate-500 block">Management:</span> {formData.planManagementType}</div>
                  <div><span className="text-slate-500 block">Risk Rating:</span> <span className="text-amber-400 font-bold">{formData.riskLevel}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Question</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Participant to Database</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
