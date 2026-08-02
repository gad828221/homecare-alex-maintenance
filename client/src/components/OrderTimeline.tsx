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
      <div className="text-slate-400 text-sm text-center py-4">
        لا توجد ملاحظات حتى الآن
      </div>
    );
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('ar-EG');
    const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  return (
    <div className="space-y-4">
      {events.map((event, idx) => {
        const { dateStr, timeStr } = formatDateTime(event.timestamp);
        const isCompleted = event.action.includes('مكتمل') || event.action.includes('completed');
        const isAlert = event.action.includes('خطأ') || event.action.includes('error');

        return (
          <div key={event.id || idx} className="flex gap-4">
            {/* الأيقونة */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${isCompleted ? 'bg-green-900' : isAlert ? 'bg-red-900' : 'bg-blue-900'}`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : isAlert ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-400" />
                )}
              </div>
              {idx < events.length - 1 && <div className="w-1 h-8 bg-slate-700 mt-2"></div>}
            </div>

            {/* المحتوى */}
            <div className="flex-1 pb-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-white">{event.user}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{dateStr}</div>
                    <div className="text-sm font-bold text-slate-300">{timeStr}</div>
                  </div>
                </div>
                <p className="text-slate-300 font-semibold">{event.action}</p>
                {event.details && <p className="text-slate-400 text-sm mt-2">{event.details}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
