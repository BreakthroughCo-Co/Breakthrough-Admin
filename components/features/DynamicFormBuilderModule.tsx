import React, { useState } from 'react';
import { useManagementStore } from '../../stores/useManagementStore';
import { DynamicFormBuilderEngine, DynamicFormTemplate } from '../../lib/dynamicFormBuilderEngine';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  ListFilter,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export const DynamicFormBuilderModule: React.FC = () => {
  const { clients, addNotification } = useManagementStore();
  const templates = DynamicFormBuilderEngine.getStandardTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<DynamicFormTemplate>(templates[0]);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  const handleSaveAssessment = () => {
    addNotification({
      title: 'Clinical Assessment Recorded',
      message: `Completed "${selectedTemplate.title}" mapped to NDIS line item ${selectedTemplate.targetSupportItemCode}.`,
      type: 'clinical',
      severity: 'success',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Clinical Assessment & Dynamic Form Builder
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Standardized Scales
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              OT Functional Capacity Assessments (FCA), Vineland-3, and PBS Intake forms with direct case note compilation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate.templateId}
            onChange={(e) => {
              const found = templates.find((t) => t.templateId === e.target.value);
              if (found) setSelectedTemplate(found);
            }}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
          >
            {templates.map((t) => (
              <option key={t.templateId} value={t.templateId}>
                {t.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveAssessment}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-900/30 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save & Compile Assessment
          </button>
        </div>
      </div>

      <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-mono text-indigo-400 font-bold block">{selectedTemplate.templateId}</span>
          <h3 className="text-base font-bold text-white mt-0.5">{selectedTemplate.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
        </div>

        <div className="space-y-4">
          {selectedTemplate.fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {field.label} {field.required && <span className="text-rose-400">*</span>}
              </label>

              {field.type === 'SELECT' ? (
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white">
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  rows={2}
                  placeholder={`Enter clinical findings for ${field.label}...`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
