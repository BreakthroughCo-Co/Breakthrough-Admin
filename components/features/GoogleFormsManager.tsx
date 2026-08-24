'use client';

import React, { useState } from 'react';
import {
  createGoogleForm,
  getGoogleForm,
  listGoogleFormResponses,
  GoogleForm,
  GoogleFormResponse
} from '@/lib/workspace';
import { useManagementStore } from '@/stores/useManagementStore';
import {
  FileQuestion,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  ListPlus,
  Send,
  Sparkles,
  Users,
  Eye,
  Trash2
} from 'lucide-react';

interface GoogleFormsManagerProps {
  accessToken: string | null;
  onShowMessage: (msg: { type: 'success' | 'error' | 'info'; text: string; link?: string }) => void;
}

export const GoogleFormsManager: React.FC<GoogleFormsManagerProps> = ({ accessToken, onShowMessage }) => {
  const { addAuditLog } = useManagementStore();
  const [loading, setLoading] = useState(false);

  // Form creation state
  const [formTitle, setFormTitle] = useState('NDIS Initial Intake & Risk Screening Form');
  const [formDesc, setFormDesc] = useState('Standardized functional capacity, communication preferences, and behavioural risk assessment.');
  
  const [questions, setQuestions] = useState<Array<{
    title: string;
    type: 'RADIO' | 'CHECKBOX' | 'TEXT' | 'PARAGRAPH';
    options: string[];
    required: boolean;
  }>>([
    {
      title: 'Primary Communication Method',
      type: 'RADIO',
      options: ['Verbal', 'AAC Device', 'Visual Cards / PECS', 'Key Word Sign', 'Non-verbal'],
      required: true
    },
    {
      title: 'Current Sensory Triggers or Sensitivities',
      type: 'CHECKBOX',
      options: ['Loud Noises / Sudden Sounds', 'Fluorescent Lighting', 'Crowded Environments', 'Unexpected Touch', 'Temperature Changes'],
      required: false
    },
    {
      title: 'Does the participant have any diagnosed physical or environmental risks?',
      type: 'RADIO',
      options: ['Yes - High Risk (Requires Protocol)', 'Yes - Moderate Risk', 'No Known Risks'],
      required: true
    },
    {
      title: 'Summary of Positive Behaviour Support Goals',
      type: 'PARAGRAPH',
      options: [],
      required: true
    }
  ]);

  // Saved / Managed Forms
  const [createdForms, setCreatedForms] = useState<GoogleForm[]>([
    {
      formId: 'sample-form-ndis-intake',
      info: {
        title: 'NDIS Initial Intake & Risk Screening Form',
        description: 'Standardized functional capacity and risk assessment questionnaire.',
        documentTitle: 'NDIS Intake Form'
      },
      responderUri: 'https://docs.google.com/forms'
    }
  ]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [responses, setResponses] = useState<GoogleFormResponse[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        title: `Question ${prev.length + 1}`,
        type: 'RADIO',
        options: ['Option 1', 'Option 2', 'Option 3'],
        required: false
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const handleCreateForm = async () => {
    if (!accessToken) {
      onShowMessage({ type: 'error', text: 'Please sign in with Google to create forms.' });
      return;
    }
    if (!formTitle.trim()) {
      onShowMessage({ type: 'error', text: 'Form title cannot be empty.' });
      return;
    }

    setLoading(true);
    try {
      const newForm = await createGoogleForm(
        accessToken,
        formTitle,
        formDesc,
        questions
      );

      setCreatedForms((prev) => [newForm, ...prev]);
      setSelectedFormId(newForm.formId);
      onShowMessage({
        type: 'success',
        text: `Google Form "${newForm.info.title}" created successfully!`,
        link: newForm.responderUri || `https://docs.google.com/forms/d/${newForm.formId}/edit`
      });
      addAuditLog('CREATE', 'Google Form', newForm.formId, `Created Google Form: ${formTitle}`);
    } catch (e: any) {
      onShowMessage({ type: 'error', text: `Failed to create form: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchResponses = async (formId: string) => {
    if (!accessToken) return;
    if (formId.startsWith('sample-')) {
      onShowMessage({ type: 'info', text: 'Sample form responses simulated for demonstration.' });
      setResponses([
        {
          responseId: 'resp-101',
          createTime: new Date(Date.now() - 3600000).toISOString(),
          lastSubmittedTime: new Date().toISOString(),
          respondentEmail: 'family.advocate@example.com',
          answers: {
            q1: { questionId: 'q1', textAnswers: { answers: [{ value: 'AAC Device & Visual Cards' }] } },
            q2: { questionId: 'q2', textAnswers: { answers: [{ value: 'Loud Noises / Sudden Sounds' }] } },
            q3: { questionId: 'q3', textAnswers: { answers: [{ value: 'Moderate Risk (De-escalation protocol attached)' }] } }
          }
        }
      ]);
      return;
    }

    setLoading(true);
    try {
      const resps = await listGoogleFormResponses(accessToken, formId);
      setResponses(resps);
      onShowMessage({ type: 'success', text: `Fetched ${resps.length} submission responses.` });
      addAuditLog('FETCH', 'Google Form Responses', formId, `Fetched ${resps.length} responses for form ${formId}`);
    } catch (e: any) {
      onShowMessage({ type: 'error', text: `Failed to fetch responses: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-purple-400" /> Google Forms API Integration
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Forms v1 REST API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Create participant intake surveys, functional risk questionnaires, and fetch real-time questionnaire responses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Creator */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Create NDIS Clinical Google Form
            </h4>
            <span className="text-[11px] text-slate-400">{questions.length} Questions</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Form Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                placeholder="e.g. NDIS Risk & Sensory Profile Survey"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Form Description</label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                placeholder="Description shown to respondents"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-semibold text-slate-300 block">Question Builder</label>
              {questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-purple-400 text-[11px]">Q{idx + 1}</span>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => handleUpdateQuestion(idx, 'title', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none"
                    >
                      <option value="RADIO">Multiple Choice</option>
                      <option value="CHECKBOX">Checkboxes</option>
                      <option value="PARAGRAPH">Long Text</option>
                      <option value="TEXT">Short Text</option>
                    </select>
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Remove Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(q.type === 'RADIO' || q.type === 'CHECKBOX') && (
                    <div className="pl-6 space-y-1">
                      <span className="text-[10px] text-slate-400">Options (comma separated):</span>
                      <input
                        type="text"
                        value={q.options.join(', ')}
                        onChange={(e) =>
                          handleUpdateQuestion(
                            idx,
                            'options',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pl-6">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0"
                      />
                      Required Question
                    </label>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded hover:bg-purple-950/40 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Question
              </button>
            </div>

            <button
              onClick={handleCreateForm}
              disabled={!accessToken || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <FileQuestion className="w-4 h-4" />
              {loading ? 'Creating Google Form...' : 'Deploy Form to Google Forms'}
            </button>
          </div>
        </div>

        {/* Form Library & Live Responses */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Managed Google Forms</span>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                {createdForms.length} Active
              </span>
            </h4>

            <div className="space-y-2">
              {createdForms.map((form) => (
                <div
                  key={form.formId}
                  className={`p-3 rounded-lg border transition text-xs space-y-2 ${
                    selectedFormId === form.formId
                      ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 line-clamp-1">{form.info.title}</span>
                    <a
                      href={form.responderUri || `https://docs.google.com/forms/d/${form.formId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {form.info.description || 'No description.'}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => handleFetchResponses(form.formId)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded border border-slate-800 text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-purple-400" /> View Responses
                    </button>
                    {form.responderUri && (
                      <button
                        onClick={() => copyToClipboard(form.responderUri!, form.formId)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[11px] flex items-center gap-1"
                      >
                        {copiedId === form.formId ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Share Link
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Responses Viewer */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" /> Submissions & Responses ({responses.length})
              </h4>
            </div>

            {responses.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Select a form and click &quot;View Responses&quot; to inspect questionnaire submissions.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {responses.map((resp, idx) => (
                  <div key={resp.responseId || idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">
                        {resp.respondentEmail || `Participant Submission #${idx + 1}`}
                      </span>
                      <span className="text-slate-500">
                        {new Date(resp.lastSubmittedTime || resp.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {resp.answers && Object.entries(resp.answers).map(([key, ans]: [string, any]) => (
                      <div key={key} className="text-[11px] bg-slate-950 p-2 rounded border border-slate-800/60">
                        <span className="text-purple-300 font-medium">Answer: </span>
                        <span className="text-slate-200">
                          {ans.textAnswers?.answers?.map((a: any) => a.value).join(', ') || 'No value recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
