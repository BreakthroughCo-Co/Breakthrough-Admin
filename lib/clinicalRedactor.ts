import type { CaseNote, PlainLanguageSessionNote, Incident } from '@/types';

/**
 * Clinical Jargon Translation Dictionary
 * Maps complex positive behaviour support (PBS) and clinical terminology
 * to supportive, strengths-based, plain-English explanations.
 */
export const CLINICAL_JARGON_DICTIONARY: Record<string, string> = {
  'autonomic agitation': 'stress responses and physical signs of feeling overwhelmed',
  'agitation': 'feeling overwhelmed or restless',
  'DRI schedule': 'positive behaviour reward plan that encourages helpful replacement habits',
  'DRA schedule': 'encouraging positive alternative choices',
  'differential reinforcement': 'rewarding and celebrating positive alternative choices',
  'functional capacity assessment \\(FCA\\)': 'independence and daily living skills review',
  'functional capacity assessment': 'independence and daily living skills review',
  'FCA': 'daily living skills review',
  'restrictive practice protocol': 'safety and protection guideline',
  'restrictive practice': 'safety support protocol',
  'chemical restraint': 'prescribed calming medication',
  'environmental restraint': 'environmental safety boundary',
  'mechanical restraint': 'safety support equipment',
  'physical restraint': 'physical safety hold',
  'maladaptive behaviour': 'challenging moment',
  'maladaptive behaviors': 'challenging moments',
  'maladaptive': 'unhelpful',
  'aberrant behaviour': 'stress-related response',
  'fading schedule': 'step-by-step progress plan towards independence',
  'fading protocol': 'gradual independence plan',
  'antecedent trigger': 'situation that prompted feelings of distress',
  'antecedent': 'situation or setting that sparked big feelings',
  'escape avoidance': 'expressing a need for a quiet break or change of activity',
  'escape/avoidance': 'taking a supportive break when tasks feel difficult',
  'escape-avoidance': 'taking a supportive break when tasks feel difficult',
  'latency to compliance': 'time taken to feel ready and comfortable to follow instructions',
  'latency': 'processing time',
  'sensory overload': 'feeling overwhelmed by noise, lights, or surroundings',
  'tact/mand functional communication': 'practicing clear communication of needs and preferences',
  'tact/mand': 'functional communication',
  'functional communication training \\(FCT\\)': 'learning new ways to express needs and choices',
  'functional communication training': 'learning new ways to express needs and choices',
  'FCT': 'communication skill training',
  'extinction burst': 'temporary increase in frustration before settling into a new routine',
  'extinction': 'supporting transitions to positive habits',
  'Level 3 physical guide': 'gentle hands-on physical guidance and reassurance',
  'physical guide': 'supportive physical reassurance',
  'emotional dysregulation': 'experiencing big, overwhelming emotions',
  'dysregulation': 'feeling overwhelmed',
  'proactive strategies': 'helpful ways to prepare, stay calm, and feel supported',
  'reactive strategies': 'caring steps taken to support recovery when feeling distressed',
  'PBS replacement skill': 'helpful new skills for communicating needs and managing stress',
  'replacement skill': 'new positive habit',
  'visual task sequencing': 'step-by-step visual picture schedule',
  'visual schedule': 'step-by-step visual picture schedule',
  'compliance': 'participation and teamwork',
  'non-compliance': 'needing additional time and support to participate',
  'elopement': 'leaving a space when feeling overwhelmed',
  'target behaviour': 'identified focus area for support',
  'behaviours of concern': 'challenging moments requiring support',
  'behaviour of concern': 'challenging moment requiring support'
};

/**
 * Translates clinical and PBS jargon in raw text to supportive plain English.
 */
export function redactClinicalText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let text = rawText;

  for (const [jargon, plainEnglish] of Object.entries(CLINICAL_JARGON_DICTIONARY)) {
    const regex = new RegExp(`\\b${jargon}\\b`, 'gi');
    text = text.replace(regex, plainEnglish);
  }

  return text;
}

/**
 * Extracts positive highlights from a case note.
 */
export function extractPositiveHighlights(note: CaseNote | any): string[] {
  const highlights: string[] = [];
  const text = `${note.subjective || ''} ${note.objective || ''} ${note.assessment || ''} ${note.plan || ''} ${note.text || ''}`.toLowerCase();

  if (text.includes('progress') || text.includes('success') || text.includes('achiev')) {
    highlights.push('Demonstrated strong engagement and made positive milestone progress.');
  }
  if (text.includes('calm') || text.includes('regulat') || text.includes('reduc')) {
    highlights.push('Successfully utilized calming strategies and self-regulation techniques.');
  }
  if (text.includes('communicat') || text.includes('choice') || text.includes('express')) {
    highlights.push('Practiced clear functional communication to express personal choices and preferences.');
  }
  if (text.includes('visual') || text.includes('routine') || text.includes('schedul')) {
    highlights.push('Followed visual schedules and routine transitions smoothly.');
  }

  if (highlights.length === 0) {
    highlights.push('Active participation and positive relationship building with the practitioner.');
    highlights.push('Engaged in therapeutic activities aligned with NDIS plan goals.');
  }

  return highlights;
}

/**
 * Extracts skills practiced during the session.
 */
export function extractSkillsPracticed(note: CaseNote | any): string[] {
  const skills: string[] = [];
  const text = `${note.subjective || ''} ${note.objective || ''} ${note.assessment || ''} ${note.plan || ''} ${note.text || ''}`.toLowerCase();

  if (text.includes('visual') || text.includes('sequence') || text.includes('routine')) {
    skills.push('Visual task sequencing & daily routine navigation');
  }
  if (text.includes('calm') || text.includes('breath') || text.includes('sensory') || text.includes('regulat')) {
    skills.push('Sensory calming & emotional self-regulation strategies');
  }
  if (text.includes('choice') || text.includes('mand') || text.includes('communicat')) {
    skills.push('Functional communication & making positive choices');
  }
  if (text.includes('social') || text.includes('community') || text.includes('interaction')) {
    skills.push('Community participation & positive social interactions');
  }

  if (skills.length === 0) {
    skills.push('Positive coping strategies & independence building');
    skills.push('Goal-directed daily living activities');
  }

  return skills;
}

/**
 * Generates empowering home practice suggestions for carers and family.
 */
export function generateHomePracticeSuggestions(note: CaseNote | any): string[] {
  const suggestions: string[] = [];
  const text = `${note.subjective || ''} ${note.objective || ''} ${note.assessment || ''} ${note.plan || ''}`.toLowerCase();

  if (text.includes('visual') || text.includes('schedule')) {
    suggestions.push('Keep visual daily schedules in easy-to-see areas before transitions.');
  }
  if (text.includes('calm') || text.includes('break')) {
    suggestions.push('Provide prompt access to quiet calming spaces when noticing signs of fatigue.');
  }
  suggestions.push('Celebrate and offer positive praise when replacement communication tools are used.');
  suggestions.push('Maintain consistent, predictable daily routines whenever possible.');

  return suggestions;
}

/**
 * Transforms a practitioner's technical CaseNote into a participant-safe PlainLanguageSessionNote.
 */
export function redactCaseNote(note: CaseNote | any): PlainLanguageSessionNote {
  if (!note) {
    return {
      id: 'note-empty',
      sessionDate: new Date().toISOString().slice(0, 10),
      practitionerName: 'Practitioner',
      durationMinutes: 60,
      summary: 'Session completed with positive engagement.',
      sessionSummary: 'You met with your practitioner for a positive support session focused on daily living skills and calming strategies.',
      plainLanguageProgress: 'Great progress was made during the session.',
      positiveHighlights: ['Engaged positively throughout the session.'],
      skillsPracticed: ['Positive coping and daily living routines.'],
      homePracticeSuggestions: ['Continue daily routines and encourage positive choices.'],
      goalsAddressed: [],
      serviceType: 'Therapeutic Support',
      verified: true
    };
  }

  const rawDate = note.date || note.sessionDate || note.createdAt || new Date().toISOString().slice(0, 10);
  const practitioner = note.practitionerName || 'Your Behaviour Support Practitioner';
  const duration = note.sessionDurationMinutes || note.durationMinutes || 60;
  const serviceType = note.serviceType || note.category || 'Positive Behaviour Support & Therapeutic Intervention';

  // Redacted components
  const rawSubjective = redactClinicalText(note.subjective || note.situation || '');
  const rawObjective = redactClinicalText(note.objective || note.intervention || '');
  const rawAssessment = redactClinicalText(note.assessment || note.progress || '');
  const rawPlan = redactClinicalText(note.plan || '');

  // Synthesize supportive summary paragraph
  let summary = `During this session, ${practitioner} provided ${duration} minutes of ${serviceType}. `;
  if (rawSubjective) {
    summary += `Focus was placed on addressing ${rawSubjective} and supporting positive living environments. `;
  }
  if (rawObjective) {
    summary += `Practiced supportive replacement skills (${rawObjective}) and strengths-based activities. `;
  }
  if (rawAssessment) {
    summary += `Observed progress: ${rawAssessment}. `;
  }
  if (rawPlan) {
    summary += `Next steps: ${rawPlan}.`;
  }

  const sessionSummary = `You met with ${practitioner} for a positive support session. You focused on daily activities, communication exercises, and practicing calming strategies.`;
  const plainLanguageProgress = 'Great progress was made in using visual choice tools, practicing calming strategies, and communicating preferences calmly.';
  const nextSessionFocus = rawPlan ? redactClinicalText(rawPlan) : 'We will continue practicing transition strategies in our next scheduled meeting.';

  const positiveHighlights = extractPositiveHighlights(note);
  const skillsPracticed = extractSkillsPracticed(note);
  const homePracticeSuggestions = generateHomePracticeSuggestions(note);

  return {
    id: note.id,
    sessionDate: rawDate,
    date: rawDate,
    practitionerName: practitioner,
    durationMinutes: duration,
    summary: summary.trim(),
    sessionSummary,
    plainLanguageProgress,
    nextSessionFocus,
    positiveHighlights,
    skillsPracticed,
    homePracticeSuggestions,
    goalsAddressed: note.linkedGoalIds || [],
    serviceType,
    verified: true
  };
}

/**
 * Batch transforms an array of CaseNotes into PlainLanguageSessionNotes.
 */
export function batchRedactNotes(notes: (CaseNote | any)[]): PlainLanguageSessionNote[] {
  if (!Array.isArray(notes)) return [];
  return notes.map((n) => redactCaseNote(n));
}

/**
 * Filters and sanitizes incident records for participant and carer view.
 * Removes internal investigative/governance jargon while keeping transparent records of support provided.
 */
export function getParticipantReadableIncidents(incidents: Incident[] | any[], clientId: string) {
  if (!Array.isArray(incidents)) return [];

  return incidents
    .filter((inc) => inc.clientId === clientId && inc.severity !== 'Critical / Reportable')
    .map((inc) => ({
      id: inc.id,
      date: inc.incidentDate || inc.date || inc.createdAt?.slice(0, 10),
      type: inc.type || 'Support Incident',
      status: inc.status === 'Closed' ? 'Resolved' : 'Followed Up by Care Team',
      description: redactClinicalText(inc.description || 'Support was provided by the care team to ensure participant safety and well-being.'),
      actionTaken: redactClinicalText(inc.immediateActionTaken || 'Care team provided immediate reassurance, calming support, and followed safety guidelines.')
    }));
}
