export type OrderWorkflowStage = 'new' | 'scheduled' | 'in_progress' | 'blocked' | 'ready_collection' | 'closed';

export const ORDER_WORKFLOW_STAGES = [
  { value: 'new', label: 'جديد', shortLabel: 'جديد', tone: 'blue', description: 'لم يبدأ التواصل مع العميل بعد', nextAction: 'اتصل بالعميل' },
  { value: 'scheduled', label: 'تواصل وموعد', shortLabel: 'موعد', tone: 'violet', description: 'تم التواصل أو تحديد موعد الزيارة', nextAction: 'حدد الموعد' },
  { value: 'in_progress', label: 'قيد التنفيذ', shortLabel: 'تنفيذ', tone: 'teal', description: 'الفني بدأ الكشف أو الإصلاح', nextAction: 'حدّث نتيجة الخدمة' },
  { value: 'blocked', label: 'متوقف مؤقتًا', shortLabel: 'متوقف', tone: 'amber', description: 'توقف يحتاج سببًا وموعد متابعة', nextAction: 'حدّث سبب التوقف' },
  { value: 'ready_collection', label: 'جاهز للتحصيل', shortLabel: 'تحصيل', tone: 'emerald', description: 'الخدمة انتهت وتحتاج اعتماد التصفية', nextAction: 'اعتمد التحصيل' },
  { value: 'closed', label: 'مغلق', shortLabel: 'مغلق', tone: 'slate', description: 'تمت التصفية والإغلاق النهائي', nextAction: 'لا يوجد' }
] as const;

export const ORDER_WORKFLOW_ACTIONS = [
  'اتصل بالعميل',
  'حدد الموعد',
  'ابدأ التنفيذ',
  'حدّث نتيجة الخدمة',
  'تابع قطعة غيار',
  'اطلب تدخل المدير',
  'اعتمد التحصيل',
  'أغلق الأوردر'
] as const;

const LEGACY_STAGE_ALIASES: Record<string, OrderWorkflowStage> = {
  contact: 'scheduled',
  scheduled: 'scheduled',
  inspected: 'in_progress',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
  deferred: 'blocked',
  returned: 'blocked',
  completed: 'closed',
  cancelled: 'closed'
};

export const normalizeOrderWorkflowStage = (value: unknown): OrderWorkflowStage => {
  const raw = String(value || '').trim();
  if (raw === 'new') return 'new';
  return LEGACY_STAGE_ALIASES[raw] || 'new';
};

export const getOrderWorkflowStage = (order: any): OrderWorkflowStage => {
  const savedStage = String(order?.admin_notes || '').match(/\[بيانات المتابعة:\s*(\{.*?\})\]/)?.[1];
  if (savedStage) {
    try {
      const parsed = JSON.parse(savedStage);
      if (parsed?.stage) return normalizeOrderWorkflowStage(parsed.stage);
    } catch {
      // Fall through to the database status for legacy records.
    }
  }
  return normalizeOrderWorkflowStage(order?.status);
};

export const getOrderWorkflowStageMeta = (stage: unknown) => {
  const normalized = normalizeOrderWorkflowStage(stage);
  return ORDER_WORKFLOW_STAGES.find((item) => item.value === normalized) || ORDER_WORKFLOW_STAGES[0];
};

export const getOrderWorkflowIndex = (stage: unknown) => {
  const normalized = normalizeOrderWorkflowStage(stage);
  return ORDER_WORKFLOW_STAGES.findIndex((item) => item.value === normalized);
};
