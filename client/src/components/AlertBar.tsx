import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, alertingService } from '../services/alertingService';

interface AlertBarProps {
  target?: 'admin' | 'technician' | 'partner';
}

export const AlertBar: React.FC<AlertBarProps> = ({ target = 'admin' }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // تحديث التنبيهات كل ثانية
    const interval = setInterval(() => {
      const activeAlerts = alertingService.getActiveAlerts(target as any);
      setAlerts(activeAlerts);
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  const criticalAlerts = alerts.filter(a => a.level === 'critical');
  const warningAlerts = alerts.filter(a => a.level === 'warning');

  if (alerts.length === 0) return null;

  const hasErrors = criticalAlerts.length > 0;

  return (
    <div className={`sticky top-0 z-50 transition-all ${
      hasErrors 
        ? 'bg-red-600/90 border-b-2 border-red-700' 
        : 'bg-yellow-600/90 border-b-2 border-yellow-700'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* الصف الرئيسي للتنبيهات */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-sm">
                {hasErrors ? '🚨 أخطاء مالية معلقة' : '⚠️ تنبيهات'}
              </p>
              <p className="text-xs opacity-90">
                {criticalAlerts.length > 0 && `${criticalAlerts.length} خطأ حرج • `}
                {warningAlerts.length > 0 && `${warningAlerts.length} تحذير`}
              </p>
            </div>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-white/20 rounded transition-all"
              title={expanded ? 'إغلاق' : 'فتح'}
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* قائمة التنبيهات المفصلة */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t border-white/20 pt-3">
            {criticalAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-red-700/50 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{alert.title}</p>
                  <p className="text-xs text-red-100 mt-1">{alert.message}</p>
                  {alert.action && (
                    <button
                      onClick={alert.action.callback}
                      className="mt-2 px-3 py-1 bg-white text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-all"
                    >
                      {alert.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => alertingService.resolveAlert(alert.id)}
                  className="p-1 hover:bg-white/20 rounded transition-all flex-shrink-0"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {warningAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-yellow-700/50 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-white">{alert.title}</p>
                  <p className="text-xs text-yellow-100 mt-1">{alert.message}</p>
                  {alert.action && (
                    <button
                      onClick={alert.action.callback}
                      className="mt-2 px-3 py-1 bg-white text-yellow-600 rounded text-xs font-bold hover:bg-yellow-50 transition-all"
                    >
                      {alert.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => alertingService.resolveAlert(alert.id)}
                  className="p-1 hover:bg-white/20 rounded transition-all flex-shrink-0"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertBar;
