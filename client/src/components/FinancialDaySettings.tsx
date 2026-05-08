import React, { useState, useEffect } from 'react';
import { Settings, Clock, Save, AlertCircle } from 'lucide-react';
import { FinancialDayConfig, DEFAULT_FINANCIAL_CONFIG } from '../services/financialDayService';

interface FinancialDaySettingsProps {
  onSave?: (config: FinancialDayConfig) => void;
  onClose?: () => void;
}

export const FinancialDaySettings: React.FC<FinancialDaySettingsProps> = ({ onSave, onClose }) => {
  const [config, setConfig] = useState<FinancialDayConfig>(
    JSON.parse(localStorage.getItem('financialDayConfig') || JSON.stringify(DEFAULT_FINANCIAL_CONFIG))
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('financialDayConfig', JSON.stringify(config));
    setSaved(true);
    onSave?.(config);
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-white">إعدادات اليوم المالي</h2>
      </div>

      {/* تحذير مهم */}
      <div className="bg-yellow-600/20 border border-yellow-500 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-yellow-200">⚠️ تحذير مهم</p>
          <p className="text-xs text-yellow-100 mt-1">
            تغيير هذا الإعداد سيؤثر على جميع الحسابات المالية. تأكد من استشارة المحاسب قبل التغيير.
          </p>
        </div>
      </div>

      {/* خيارات بداية اليوم المالي */}
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            بداية اليوم المالي
          </span>
          
          <div className="space-y-3">
            {/* خيار منتصف الليل */}
            <div
              onClick={() => setConfig({ ...config, startHour: 0 })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                config.startHour === 0
                  ? 'border-orange-500 bg-orange-600/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  config.startHour === 0
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-slate-500'
                }`} />
                <div>
                  <p className="font-bold text-white">🌙 منتصف الليل (00:00)</p>
                  <p className="text-xs text-slate-300 mt-1">
                    ✅ الموصى به - يمنع أي تعقيد في الحسابات. اليوم المالي ينتهي في منتصف الليل.
                  </p>
                </div>
              </div>
            </div>

            {/* خيار الظهر */}
            <div
              onClick={() => setConfig({ ...config, startHour: 12 })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                config.startHour === 12
                  ? 'border-orange-500 bg-orange-600/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  config.startHour === 12
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-slate-500'
                }`} />
                <div>
                  <p className="font-bold text-white">☀️ الظهر (12:00)</p>
                  <p className="text-xs text-slate-300 mt-1">
                    للتوافق مع الأنظمة القديمة. يتطلب حذر في التعديلات بعد منتصف الليل.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* ملخص الإعداد الحالي */}
      <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
        <p className="text-xs font-bold text-slate-400 mb-2">الإعداد الحالي:</p>
        <p className="text-sm text-white">
          اليوم المالي يبدأ من الساعة <span className="font-bold text-orange-400">
            {config.startHour === 0 ? '00:00 (منتصف الليل)' : '12:00 (الظهر)'}
          </span>
        </p>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          {saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            إغلاق
          </button>
        )}
      </div>

      {/* ملاحظة توضيحية */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        <p>💡 الإعدادات تُحفظ محلياً في متصفحك</p>
      </div>
    </div>
  );
};

export default FinancialDaySettings;
