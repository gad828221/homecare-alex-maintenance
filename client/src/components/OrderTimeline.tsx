import React from 'react';
import { User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-slate-500 font-bold text-sm text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
        لا توجد ملاحظات أو سجلات حتى الآن
      </div>
    );
  }

  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return { dateStr: timestamp, timeStr: '' };
      }
      const dateStr = date.toLocaleDateString('ar-EG');
      const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      return { dateStr, timeStr };
    } catch {
      return { dateStr: timestamp, timeStr: '' };
    }
  };

  const uniqueEvents = Array.from(new Map(
    [...events]
      .filter((event) => event && event.action)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map((event) => [
        event.id || `${event.action}|${event.user}|${event.timestamp}|${event.details || ''}`,
        event,
      ])
  ).values());

  return (
    <div className="space-y-4">
      {uniqueEvents.map((event, idx) => {
        const { dateStr, timeStr } = formatDateTime(event.timestamp);
        const isCompleted = event.action.includes('مكتمل') || event.action.includes('completed') || event.action.includes('تم');
        const isAlert = event.action.includes('خطأ') || event.action.includes('error') || event.action.includes('ملغى');

        return (
          <div key={event.id || idx} className="flex gap-3">
            {/* الأيقونة والخط الزمني */}
            <div className="flex flex-col items-center">
              <div 
                className={`rounded-full p-2 border flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-emerald-100 border-emerald-300' 
                    : isAlert 
                    ? 'bg-rose-100 border-rose-300' 
                    : 'bg-blue-100 border-blue-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                ) : isAlert ? (
                  <AlertCircle className="w-4 h-4 text-rose-800" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-800" />
                )}
              </div>
              {idx < events.length - 1 && (
                <div className="w-0.5 flex-1 bg-slate-300 my-1 min-h-[24px]"></div>
              )}
            </div>

            {/* محتوى الحدث */}
            <div className="flex-1 pb-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{event.user}</span>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-[10px] text-slate-500 font-bold">{dateStr}</div>
                    {timeStr && <div className="text-xs font-mono font-bold text-slate-700">{timeStr}</div>}
                  </div>
                </div>

                <p className="text-slate-900 font-bold text-xs sm:text-sm leading-relaxed">{event.action}</p>

                {event.details && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-slate-700 text-xs font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                      {event.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
