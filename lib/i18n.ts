/**
 * Breakthrough OS - Multi-Language Accessibility & Internationalization (i18n) Engine
 * 
 * Supports Culturally and Linguistically Diverse (CALD) NDIS participants, carers, and staff.
 * Includes Text-to-Speech (TTS) accessibility synthesis for participants with cognitive/vision needs.
 */

export type SupportedLanguage = 'en' | 'ar' | 'vi' | 'zh' | 'es' | 'tl' | 'el' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇦🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇱🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', flag: '🇻🇳' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Tagalog', direction: 'ltr', flag: '🇵🇭' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', direction: 'ltr', flag: '🇬🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', flag: '🇮🇹' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    welcome: 'Welcome to Participant & Carer Portal',
    portalSubtitle: 'Live NDIS plan budget, therapist shift roster, and positive behaviour milestone tracking.',
    ndisNumber: 'NDIS Number',
    planPeriod: 'Plan Period',
    activePlan: 'Active NDIS Plan',
    totalBudget: 'Total Allocated Funding',
    spentBudget: 'Funds Utilised to Date',
    remainingBudget: 'Remaining Balance',
    budgetHealth: 'Budget Pace: On Track',
    upcomingAppointments: 'Upcoming Therapy & Support Appointments',
    noUpcomingAppointments: 'No upcoming appointments scheduled for this cycle.',
    ndisGoals: 'NDIS Plan Goal Milestones & Progress',
    goalProgress: 'Progress',
    recentCaseNotes: 'Recent Clinical Case Notes (Plain English)',
    easyReadNote: 'Easy-Read Participant Summary',
    downloadGoalReport: 'Download Official Goal Report',
    launchChatbot: 'Ask NDIS AI Assistant',
    voiceReader: 'Read Aloud with Speech Synthesis',
    stopVoiceReader: 'Stop Voice Reading',
    languageSelector: 'Choose Language / اختر اللغة',
    easyReadToggle: 'Easy-Read Visual Mode',
    practitioner: 'Primary Specialist',
    location: 'Session Location',
    duration: 'Duration',
    hours: 'hours',
    minutes: 'mins',
  },
  ar: {
    welcome: 'مرحبًا بك في بوابة المشتركين ومقدمي الرعاية',
    portalSubtitle: 'متابعة مباشرة لميزانية خطة NDIS، جدول مواعيد الأخصائيين، وتقدم أهداف الدعم السلوكي الإيجابي.',
    ndisNumber: 'رقم NDIS',
    planPeriod: 'فترة الخطة',
    activePlan: 'خطة NDIS النشطة',
    totalBudget: 'إجمالي التمويل المخصص',
    spentBudget: 'الأموال المستخدمة حتى اليوم',
    remainingBudget: 'الرصيد المتبقي',
    budgetHealth: 'وتيرة الإنفاق: ممتازة وفي المسار الصحيح',
    upcomingAppointments: 'مواعيد الجلسات العلاجية القادمة',
    noUpcomingAppointments: 'لا توجد مواعيد قادمة مجدولة في هذه الدورة.',
    ndisGoals: 'أهداف خطة NDIS والتقدم المحرز',
    goalProgress: 'نسبة الإنجاز',
    recentCaseNotes: 'ملاحظات الجلسات العلاجية الأخيرة (بلسان مبسط)',
    easyReadNote: 'ملخص مبسط وسهل القراءة',
    downloadGoalReport: 'تحميل تقرير تقدم الأهداف الرسمي',
    launchChatbot: 'تحدث مع مساعد NDIS الذكي',
    voiceReader: 'قراءة صوتية ناطقة',
    stopVoiceReader: 'إيقاف القراءة الصوتية',
    languageSelector: 'اختر اللغة',
    easyReadToggle: 'وضع القراءة المبسطة بالرموز',
    practitioner: 'الأخصائي المعالج الرئيسي',
    location: 'مكان الجلسة',
    duration: 'المدة',
    hours: 'ساعات',
    minutes: 'دقائق',
  },
  vi: {
    welcome: 'Chào mừng đến với Cổng Thông Tin Người Tham Gia & Người Chăm Sóc',
    portalSubtitle: 'Theo dõi trực tiếp ngân sách kế hoạch NDIS, lịch hẹn của chuyên viên và tiến độ mục tiêu hỗ trợ hành vi tích cực.',
    ndisNumber: 'Mã số NDIS',
    planPeriod: 'Kỳ kế hoạch',
    activePlan: 'Kế hoạch NDIS hiện tại',
    totalBudget: 'Tổng ngân sách được cấp',
    spentBudget: 'Kinh phí đã sử dụng',
    remainingBudget: 'Số dư còn lại',
    budgetHealth: 'Tốc độ sử dụng ngân sách: Đúng tiến độ',
    upcomingAppointments: 'Lịch hẹn trị liệu & hỗ trợ sắp tới',
    noUpcomingAppointments: 'Không có lịch hẹn nào sắp tới trong chu kỳ này.',
    ndisGoals: 'Tiến độ mục tiêu kế hoạch NDIS',
    goalProgress: 'Tiến độ',
    recentCaseNotes: 'Ghi chú buổi làm việc lâm sàng gần đây (Ngôn ngữ dễ hiểu)',
    easyReadNote: 'Bản tóm tắt dễ đọc dành cho người tham gia',
    downloadGoalReport: 'Tải báo cáo tiến độ mục tiêu chính thức',
    launchChatbot: 'Hỏi Trợ lý AI NDIS',
    voiceReader: 'Đọc bằng giọng nói trợ thính',
    stopVoiceReader: 'Dừng đọc giọng nói',
    languageSelector: 'Chọn ngôn ngữ',
    easyReadToggle: 'Chế độ Đọc Dễ Hiểu với Hình ảnh',
    practitioner: 'Chuyên viên chính',
    location: 'Địa điểm buổi làm việc',
    duration: 'Thời lượng',
    hours: 'giờ',
    minutes: 'phút',
  },
  zh: {
    welcome: '欢迎使用参与者与照护者门户',
    portalSubtitle: '实时查看NDIS计划预算、治疗师排班日程以及积极行为支持目标进展。',
    ndisNumber: 'NDIS编号',
    planPeriod: '计划周期',
    activePlan: '生效中的NDIS计划',
    totalBudget: '获批资助总额',
    spentBudget: '迄今已使用资金',
    remainingBudget: '剩余可用余额',
    budgetHealth: '预算支出速度：正常合规',
    upcomingAppointments: '即将到来的治疗与支持预约',
    noUpcomingAppointments: '此周期内暂无待履行的预约。',
    ndisGoals: 'NDIS计划目标达成进度',
    goalProgress: '完成度',
    recentCaseNotes: '最新个案记录（通俗易懂版）',
    easyReadNote: '参与者易读摘要',
    downloadGoalReport: '下载官方目标进展报告',
    launchChatbot: '咨询 NDIS 智能助手',
    voiceReader: '朗读文本内容',
    stopVoiceReader: '停止语音朗读',
    languageSelector: '选择语言',
    easyReadToggle: '图文易读模式',
    practitioner: '主要行为支持专家',
    location: '服务地点',
    duration: '时长',
    hours: '小时',
    minutes: '分钟',
  },
  es: {
    welcome: 'Bienvenido al Portal del Participante y Cuidador',
    portalSubtitle: 'Presupuesto del plan NDIS en vivo, horario del terapeuta y seguimiento del progreso de objetivos.',
    ndisNumber: 'Número NDIS',
    planPeriod: 'Período del Plan',
    activePlan: 'Plan NDIS Activo',
    totalBudget: 'Presupuesto Total Asignado',
    spentBudget: 'Fondos Utilizados a la Fecha',
    remainingBudget: 'Saldo Restante',
    budgetHealth: 'Ritmo Presupuestario: En Camino',
    upcomingAppointments: 'Próximas Citas de Terapia y Apoyo',
    noUpcomingAppointments: 'No hay citas programadas para este ciclo.',
    ndisGoals: 'Metas del Plan NDIS y Progreso',
    goalProgress: 'Progreso',
    recentCaseNotes: 'Notas Clínicas Recientes (Lenguaje Claro)',
    easyReadNote: 'Resumen de Lectura Fácil',
    downloadGoalReport: 'Descargar Informe Oficial de Metas',
    launchChatbot: 'Preguntar al Asistente IA NDIS',
    voiceReader: 'Leer en Voz Alta con Síntesis de Voz',
    stopVoiceReader: 'Detener Lectura de Voz',
    languageSelector: 'Seleccionar Idioma',
    easyReadToggle: 'Modo de Lectura Fácil con Iconos',
    practitioner: 'Especialista Principal',
    location: 'Ubicación de la Sesión',
    duration: 'Duración',
    hours: 'horas',
    minutes: 'minutos',
  },
  tl: {
    welcome: 'Maligayang pagdating sa Portal ng Kalahok at Tagapag-alaga',
    portalSubtitle: 'Live na badyet ng plano ng NDIS, iskedyul ng therapist, at pagsubaybay sa layunin.',
    ndisNumber: 'Numero ng NDIS',
    planPeriod: 'Panahon ng Plano',
    activePlan: 'Aktibong Plano ng NDIS',
    totalBudget: 'Kabuuang Pondo',
    spentBudget: 'Nagamit na Pondo',
    remainingBudget: 'Natitirang Balanse',
    budgetHealth: 'Bilis ng Badyet: Nasa Tamang Takbo',
    upcomingAppointments: 'Mga Paparating na Sesyon ng Suporta',
    noUpcomingAppointments: 'Walang nakaiskedyul na appointment sa kasalukuyan.',
    ndisGoals: 'Mga Layunin at Progreso sa NDIS',
    goalProgress: 'Progreso',
    recentCaseNotes: 'Mga Kamakailang Tala ng Sesyon (Malinaw na Wika)',
    easyReadNote: 'Madaling Basahing Buod',
    downloadGoalReport: 'I-download ang Opisyal na Ulat',
    launchChatbot: 'Magtanong sa NDIS AI Assistant',
    voiceReader: 'Basahin nang Malakas gamit ang Boses',
    stopVoiceReader: 'Itigil ang Pagbasa gamit ang Boses',
    languageSelector: 'Pumili ng Wika',
    easyReadToggle: 'Madaling Pagbasa na may Visuals',
    practitioner: 'Pangunahing Espesyalista',
    location: 'Lokasyon ng Sesyon',
    duration: 'Tagal',
    hours: 'oras',
    minutes: 'minuto',
  },
  el: {
    welcome: 'Καλώς ήρθατε στην Πύλη Συμμετεχόντων & Φροντιστών',
    portalSubtitle: 'Ζωντανός προϋπολογισμός NDIS, πρόγραμμα συνεδριών θεραπευτή και παρακολούθηση προόδου στόχων.',
    ndisNumber: 'Αριθμός NDIS',
    planPeriod: 'Περίοδος Σχεδίου',
    activePlan: 'Ενεργό Σχέδιο NDIS',
    totalBudget: 'Συνολική Εγκεκριμένη Χρηματοδότηση',
    spentBudget: 'Δαπάνες μέχρι Σήμερα',
    remainingBudget: 'Υπόλοιπο Προϋπολογισμού',
    budgetHealth: 'Ρυθμός Προϋπολογισμού: Εντός Στόχου',
    upcomingAppointments: 'Προσεχή Ραντεβού Θεραπείας & Υποστήριξης',
    noUpcomingAppointments: 'Δεν υπάρχουν προγραμματισμένα ραντεβού για αυτόν τον κύκλο.',
    ndisGoals: 'Στόχοι Σχεδίου NDIS & Πρόοδος',
    goalProgress: 'Πρόοδος',
    recentCaseNotes: 'Πρόσφατες Κλινικές Σημειώσεις (Απλή Γλώσσα)',
    easyReadNote: 'Εύκολη στην Ανάγνωση Περίληψη',
    downloadGoalReport: 'Λήψη Επίσημης Έκθεσης Στόχων',
    launchChatbot: 'Ρωτήστε τον Βοηθό AI NDIS',
    voiceReader: 'Φωνητική Ανάγνωση',
    stopVoiceReader: 'Διακοπή Φωνητικής Ανάγνωσης',
    languageSelector: 'Επιλογή Γλώσσας',
    easyReadToggle: 'Λειτουργία Εύκολης Ανάγνωσης',
    practitioner: 'Κύριος Ειδικός',
    location: 'Τοποθεσία Συνεδρίας',
    duration: 'Διάρκεια',
    hours: 'ώρες',
    minutes: 'λεπτά',
  },
  it: {
    welcome: 'Benvenuti nel Portale Partecipanti e Assistenti',
    portalSubtitle: 'Budget del piano NDIS in tempo reale, turni dei terapisti e monitoraggio dei traguardi di supporto comportamentale.',
    ndisNumber: 'Numero NDIS',
    planPeriod: 'Periodo del Piano',
    activePlan: 'Piano NDIS Attivo',
    totalBudget: 'Finanziamento Totale Assegnato',
    spentBudget: 'Fondi Utilizzati ad Oggi',
    remainingBudget: 'Saldo Rimanente',
    budgetHealth: 'Velocità di Spesa: Regolare',
    upcomingAppointments: 'Prossimi Appuntamenti di Terapia e Supporto',
    noUpcomingAppointments: 'Nessun appuntamento programmato per questo ciclo.',
    ndisGoals: 'Obiettivi del Piano NDIS e Progresso',
    goalProgress: 'Progresso',
    recentCaseNotes: 'Note Cliniche Recenti (Linguaggio Semplice)',
    easyReadNote: 'Riepilogo Facile da Leggere',
    downloadGoalReport: 'Scarica Report Ufficiale Obiettivi',
    launchChatbot: 'Chiedi all\'Assistente AI NDIS',
    voiceReader: 'Leggi ad Alta Voce con Sintesi Vocale',
    stopVoiceReader: 'Ferma Lettura Vocale',
    languageSelector: 'Seleziona Lingua',
    easyReadToggle: 'Modalità Lettura Semplice con Icone',
    practitioner: 'Specialista Principale',
    location: 'Luogo della Sessione',
    duration: 'Durata',
    hours: 'ore',
    minutes: 'minuti',
  },
};

/**
 * Translates a key for a given language, falling back to English.
 */
export function t(key: string, lang: SupportedLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dictionary[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Text-to-Speech synthesis helper with language-specific voice pitch and speech rate.
 */
export function speakText(
  text: string,
  lang: SupportedLanguage = 'en',
  onEnd?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this environment.');
    onEnd?.();
    return () => {};
  }

  // Cancel any existing utterance
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ar' ? 'ar-SA'
    : lang === 'vi' ? 'vi-VN'
    : lang === 'zh' ? 'zh-CN'
    : lang === 'es' ? 'es-ES'
    : lang === 'tl' ? 'fil-PH'
    : lang === 'el' ? 'el-GR'
    : lang === 'it' ? 'it-IT'
    : 'en-AU';

  utterance.rate = 0.95; // slightly slower for clinical clarity
  utterance.pitch = 1.0;

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (err) => {
    console.warn('Speech synthesis error:', err);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}
