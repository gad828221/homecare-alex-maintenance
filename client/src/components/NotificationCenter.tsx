import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from '@/hooks/useNotification';

interface NotificationCenterProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onRemove }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto
            backdrop-blur-xl
            border
            rounded-2xl
            p-4
            shadow-2xl
            animate-in
            slide-in-from-right-full
            duration-300
            flex items-start gap-4
            min-w-[320px]
            max-w-[420px]
            ${getBackgroundColor(notification.type)}
          `}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-black text-sm ${getTextColor(notification.type)}`}>
              {notification.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>

          <button
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-white/30 rounded-full"
            style={{
              animation: `progress ${notification.duration || 5000}ms linear forwards`,
              width: '100%',
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
