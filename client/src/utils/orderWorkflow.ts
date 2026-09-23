export type OrderWorkflowStage = 'new' | 'scheduled' | 'in_progress' | 'blocked' | 'ready_collection' | 'closed';

export const ORDER_WORKFLOW_STAGES = [
  { value: 'new', label: 'اتصال بالعميل', shortLabel: 'اتصال', tone: 'blue', description: 'لم يتم التواصل مع العميل بعد', nextAction: 'اتصل بالعميل' },
  { value: 'scheduled', label: 'اتصال وموعد', shortLabel: 'موعد', tone: 'violet', description: 'تم التواصل وتحديد موعد الزيارة', nextAction: 'حدد الموعد' },
  { value: 'in_progress', label: 'جاري التنفيذ', shortLabel: 'تنفيذ', tone: 'teal', description: 'الفني ينفذ الزيارة أو الإصلاح', nextAction: 'حدّث نتيجة الخدمة' },
  { value: 'blocked', label: 'رفض الإصلاح أو تأجيل بسبب', shortLabel: 'رفض/تأجيل', tone: 'amber', description: 'توقف مع تسجيل سبب الرفض أو التأجيل', nextAction: 'سجّل السبب وموعد المتابعة' },
  { value: 'ready_collection', label: 'تصفية أو قيمة زيارة', shortLabel: 'تصفية', tone: 'emerald', description: 'الخدمة انتهت وتحتاج اعتماد التصفية أو قيمة الزيارة', nextAction: 'اعتمد التصفية أو قيمة الزيارة' },
  { value: 'closed', label: 'مغلق', shortLabel: 'مغلق', tone: 'slate', description: 'تمت التصفية والإغلاق النهائي', nextAction: 'لا يوجد' }
] as const;

export const ORDER_WORKFLOW_ACTIONS = [
  'اتصل بالعميل',
  'حدد الموعد',
  'ابدأ التنفيذ',
  'سجّل رفض أو تأجيل وسببه',
  'اعتمد التصفية أو قيمة الزيارة',
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
