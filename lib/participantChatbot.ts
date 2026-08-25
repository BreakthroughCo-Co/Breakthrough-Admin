import type { Client, ScheduledShift, ClientGoal, ParticipantChatbotQueryResult } from '../types/index.ts';

export interface ParticipantChatbotContext {
  client?: Client | any;
  appointments?: ScheduledShift[] | any[];
  goals?: ClientGoal[] | any[];
  budget?: {
    total?: number;
    spent?: number;
    remaining?: number;
  };
}

/**
 * Clinical & Safety Guardrail Checkers
 */
const CRISIS_PATTERN = /\b(die|suicide|suicidal|kill myself|harm myself|hurt myself|hurting myself|end my life|self-harm|abuse|crisis|emergency)\b/i;
const MEDICAL_PATTERN = /\b(medication|prescribe|prescription|dosage|dose|diagnose|diagnosis|pill|pills|doctor|drug|drugs|antidepressant|clonidine|ritalin|prozac)\b/i;
const COMPLEX_CLINICAL_PATTERN = /\b(change bsp|modify bsp|restraint|restrictive practice|violent aggression|alter plan strategies|clinical advice|psychiatric)\b/i;

/**
 * Executes guardrailed logic to answer participant & carer questions.
 * Handles:
 * 1. Crisis / emergency detection (000, Lifeline 13 11 14, auto-escalates)
 * 2. Medical / diagnosis / medication blocking
 * 3. Complex clinical query escalation to assigned practitioner
 * 4. Plan budget inquiries (total, used, remaining, dates)
 * 5. Appointment & session scheduling lookups
 * 6. Active goals & milestone progress lookups
 * 7. General practice and service questions
 */
export function runParticipantChatbotQuery(
  query: string,
  context: ParticipantChatbotContext = {}
): ParticipantChatbotQueryResult {
  const q = (query || '').toLowerCase().trim();
  const { client, appointments = [], goals = [] } = context;
  const practitionerName = client?.primaryPractitionerName || 'your assigned Behaviour Support Practitioner';

  // Guardrail 1: Emergency & Crisis Query Detection
  if (CRISIS_PATTERN.test(q)) {
    return {
      reply:
        'I am detecting that you or someone you know may be in immediate distress or danger. Breakthrough OS cannot provide emergency triage. Please immediately contact emergency services at 000, Lifeline at 13 11 14, or the Suicide Call Back Service at 1300 659 467. Your assigned practitioner has been automatically alerted.',
      message:
        'I am detecting that you or someone you know may be in immediate distress or danger. Breakthrough OS cannot provide emergency triage. Please immediately contact emergency services at 000, Lifeline at 13 11 14, or the Suicide Call Back Service at 1300 659 467. Your assigned practitioner has been automatically alerted.',
      guardrailTriggered: true,
      isEscalated: true,
      isCrisis: true,
      escalatedTo: practitionerName,
      practitionerNotified: practitionerName,
      category: 'crisis_escalated'
    };
  }

  // Guardrail 2: Medical / Medication / Diagnosis Queries
  if (MEDICAL_PATTERN.test(q)) {
    return {
      reply:
        'Breakthrough OS provides support for your NDIS plan and behavioral support goals, but cannot give medical diagnoses or medication advice. Please consult your General Practitioner (GP), psychiatrist, or medical specialist regarding medical questions.',
      message:
        'Breakthrough OS provides support for your NDIS plan and behavioral support goals, but cannot give medical diagnoses or medication advice. Please consult your General Practitioner (GP), psychiatrist, or medical specialist regarding medical questions.',
      guardrailTriggered: true,
      isEscalated: false,
      isCrisis: false,
      category: 'medical_blocked'
    };
  }

  // Guardrail 3: Complex Clinical & Safety Questions (Escalate to practitioner)
  if (COMPLEX_CLINICAL_PATTERN.test(q)) {
    return {
      reply: `This requires clinical review by your practitioner. I have forwarded this inquiry to ${practitionerName}, who will contact you directly to discuss your support plan.`,
      message: `This requires clinical review by your practitioner. I have forwarded this inquiry to ${practitionerName}, who will contact you directly to discuss your support plan.`,
      guardrailTriggered: true,
      isEscalated: true,
      isCrisis: false,
      escalatedTo: practitionerName,
      practitionerNotified: practitionerName,
      category: 'clinical_escalated'
    };
  }

  // Domain Query 1: Budget & Funding Information
  if (
    q.includes('budget') ||
    q.includes('funds') ||
    q.includes('funding') ||
    q.includes('money') ||
    q.includes('balance') ||
    q.includes('how much')
  ) {
    if (!client) {
      return {
        reply: 'I could not retrieve your active plan budget information at this moment.',
        message: 'I could not retrieve your active plan budget information at this moment.',
        guardrailTriggered: false,
        isEscalated: false,
        isCrisis: false,
        category: 'budget'
      };
    }
    const total = client.totalBudget || context.budget?.total || 0;
    const spent = client.spentBudget || context.budget?.spent || 0;
    const remaining = total - spent;
    return {
      reply: `Your total NDIS plan budget is $${total.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}. You have used $${spent.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}, leaving $${remaining.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })} remaining in your current plan period (ending ${client.planEndDate || 'at end of plan'}).`,
      message: `Your total NDIS plan budget is $${total.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}. You have used $${spent.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })}, leaving $${remaining.toLocaleString('en-AU', {
        minimumFractionDigits: 2
      })} remaining in your current plan period (ending ${client.planEndDate || 'at end of plan'}).`,
      guardrailTriggered: false,
      isEscalated: false,
      isCrisis: false,
      category: 'budget'
    };
  }

  // Domain Query 2: Appointments & Shifts
  if (
    q.includes('appointment') ||
    q.includes('shift') ||
    q.includes('schedule') ||
    q.includes('session') ||
    q.includes('when') ||
    q.includes('next') ||
    q.includes('visit')
  ) {
    if (!appointments || appointments.length === 0) {
      return {
        reply:
          'You have no upcoming appointments scheduled in the next 14 days. If you would like to book a session, please reach out to your practitioner.',
        message:
          'You have no upcoming appointments scheduled in the next 14 days. If you would like to book a session, please reach out to your practitioner.',
        guardrailTriggered: false,
        isEscalated: false,
        isCrisis: false,
        category: 'appointment'
      };
    }
    const nextAppt = appointments[0];
    return {
      reply: `Your next scheduled session is on ${nextAppt.date} from ${nextAppt.startTime} to ${nextAppt.endTime} for "${
        nextAppt.supportType
      }" with ${nextAppt.practitionerName || practitionerName}.`,
      message: `Your next scheduled session is on ${nextAppt.date} from ${nextAppt.startTime} to ${nextAppt.endTime} for "${
        nextAppt.supportType
      }" with ${nextAppt.practitionerName || practitionerName}.`,
      guardrailTriggered: false,
      isEscalated: false,
      isCrisis: false,
      category: 'appointment'
    };
  }

  // Domain Query 3: Goals & Progress
  if (q.includes('goal') || q.includes('progress') || q.includes('milestone') || q.includes('target')) {
    const clientGoals = goals && goals.length > 0 ? goals : client?.goals || [];
    if (clientGoals.length === 0) {
      return {
        reply: 'Your active plan goals are being updated by your practitioner.',
        message: 'Your active plan goals are being updated by your practitioner.',
        guardrailTriggered: false,
        isEscalated: false,
        isCrisis: false,
        category: 'goals'
      };
    }
    const goalList = clientGoals
      .map((g: any, idx: number) => `${idx + 1}. ${g.title} (${g.progressPercent || g.progress || 0}% achieved)`)
      .join('\n');
    return {
      reply: `Here are your current active NDIS goals:\n${goalList}`,
      message: `Here are your current active NDIS goals:\n${goalList}`,
      guardrailTriggered: false,
      isEscalated: false,
      isCrisis: false,
      category: 'goals'
    };
  }

  // Fallback Assistant Reply
  return {
    reply: `Hello ${
      client?.name || 'there'
    }! I am your Breakthrough OS participant assistant. I can help answer questions about your NDIS plan dates, remaining budget, upcoming appointments, and goal progress. How can I assist you today?`,
    message: `Hello ${
      client?.name || 'there'
    }! I am your Breakthrough OS participant assistant. I can help answer questions about your NDIS plan dates, remaining budget, upcoming appointments, and goal progress. How can I assist you today?`,
    guardrailTriggered: false,
    isEscalated: false,
    isCrisis: false,
    category: 'general'
  };
}

/**
 * Async API-connected Chatbot executor that leverages Gemini LLM when available,
 * while strictly upholding clinical and emergency guardrails.
 */
export async function askParticipantChatbotAsync(
  query: string,
  context: ParticipantChatbotContext = {}
): Promise<ParticipantChatbotQueryResult> {
  // First evaluate guardrails synchronously to guarantee zero bypass
  const guardrailResult = runParticipantChatbotQuery(query, context);
  if (guardrailResult.guardrailTriggered) {
    return guardrailResult;
  }

  try {
    const clientName = context.client?.name || 'Participant';
    const total = context.client?.totalBudget || 0;
    const spent = context.client?.spentBudget || 0;
    const remaining = total - spent;

    const systemPrompt = `You are the empathetic, supportive AI Assistant in the Breakthrough OS NDIS Participant & Carer Portal for participant "${clientName}".
Context:
- Remaining NDIS Budget: $${remaining.toFixed(2)} (Total: $${total.toFixed(2)}, Spent: $${spent.toFixed(2)})
- Plan Dates: ${context.client?.planStartDate || '2026-01-01'} to ${context.client?.planEndDate || '2026-12-31'}
- Primary Practitioner: ${context.client?.primaryPractitionerName || 'Behaviour Support Practitioner'}

Rules:
- NEVER give medical diagnosis, medication recommendations, or clinical advice.
- Speak in warm, supportive, plain-English.
- Keep answers concise and helpful.`;

    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `${systemPrompt}\n\nParticipant Question: ${query}\nAssistant Answer:`
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
        return {
          reply: data.text.trim(),
          message: data.text.trim(),
          guardrailTriggered: false,
          isEscalated: false,
          isCrisis: false,
          category: guardrailResult.category
        };
      }
    }
  } catch (err) {
    // Graceful fallback to verified rule-based engine
  }

  return guardrailResult;
}
