export interface FormFieldDefinition {
  id: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'RADIO' | 'TEXTAREA' | 'SLIDER';
  options?: string[];
  required: boolean;
  ndisSectionMapping?: string;
}

export interface DynamicFormTemplate {
  templateId: string;
  title: string;
  category: 'OT_FUNCTIONAL_CAPACITY' | 'PBS_INTAKE' | 'VINELAND_ADAPTIVE' | 'SENSORY_PROFILE';
  description: string;
  fields: FormFieldDefinition[];
  targetSupportItemCode: string;
}

export class DynamicFormBuilderEngine {
  /**
   * Returns standard NDIS clinical form templates.
   */
  public static getStandardTemplates(): DynamicFormTemplate[] {
    return [
      {
        templateId: 'FORM-OT-FCA-01',
        title: 'Occupational Therapy Functional Capacity Assessment (FCA)',
        category: 'OT_FUNCTIONAL_CAPACITY',
        description: 'Standardized comprehensive evaluation of daily living activities, motor skills, and environmental supports.',
        targetSupportItemCode: '15_056_0128_1_3',
        fields: [
          { id: 'f_self_care', label: 'Self-Care & Hygiene Independence Level', type: 'SELECT', options: ['Independent', 'Prompting Required', 'Physical Assistance', 'Total Dependence'], required: true, ndisSectionMapping: 'Daily Living' },
          { id: 'f_mobility', label: 'Community Mobility & Transfer Capacity', type: 'TEXTAREA', required: true, ndisSectionMapping: 'Mobility' },
          { id: 'f_assistive_tech', label: 'Recommended Assistive Technology & Home Modifications', type: 'TEXTAREA', required: false, ndisSectionMapping: 'Capital Supports' },
        ],
      },
      {
        templateId: 'FORM-PBS-INTAKE-02',
        title: 'Positive Behaviour Support (PBS) Intake Questionnaire',
        category: 'PBS_INTAKE',
        description: 'Comprehensive antecedent-behavior-consequence intake for initial BSP formulation.',
        targetSupportItemCode: '07_002_0115_8_3',
        fields: [
          { id: 'f_primary_boc', label: 'Primary Behaviors of Concern & Baseline Frequency', type: 'TEXTAREA', required: true, ndisSectionMapping: 'Behaviors of Concern' },
          { id: 'f_triggers', label: 'Environmental & Sensory Triggers', type: 'TEXTAREA', required: true, ndisSectionMapping: 'Antecedents' },
          { id: 'f_restrictive_practices', label: 'Current Chemical/Mechanical Restraints in Use', type: 'TEXTAREA', required: true, ndisSectionMapping: 'Restrictive Practices' },
        ],
      },
    ];
  }
}
