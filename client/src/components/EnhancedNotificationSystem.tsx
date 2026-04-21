import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, AlertCircle, CheckCircle2, Info, AlertTriangle, Volume2, VolumeX } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// متغير عام لتحديد ما إذا كان الصوت مصرح به
let audioAllowed = false;
let audioContext: AudioContext | null = null;

// دالة لتفعيل الصوت (تُستدعى عند أول نقرة على الجرس)
export function enableAudio() {
  if (audioAllowed) return;
  audioAllowed = true;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    audioContext.resume().then(() => {
      // تشغيل نغمة اختبار قصيرة جداً
      const oscillator = audioContext!.createOscillator();
      const gainNode = audioContext!.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext!.destination);
      oscillator.frequency.value = 400;
      gainNode.gain.setValueAtTime(0.05, audioContext!.currentTime);
      oscillator.start(audioContext!.currentTime);
      oscillator.stop(audioContext!.currentTime + 0.1);
    });
  } catch (err) {
    console.error('خطأ في تفعيل الصوت:', err);
  }
}

// دالة تشغيل الصوت (تُستدعى عند وصول إشعار جديد)
function playNotificationSound(type: string) {
  if (!audioAllowed) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency = 600;
    let duration = 0.3;

    switch (type) {
      case 'success':
        frequency = 800;
        duration = 0.3;
        break;
      case 'error':
        frequency = 300;
        duration = 0.5;
        break;
      case 'warning':
        frequency = 500;
        duration = 0.4;
        break;
      case 'critical':
        frequency = 900;
        duration = 0.6;
        oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.15);
        break;
      default:
        frequency = 600;
        duration = 0.3;
    }

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (err) {
    console.error('خطأ في تشغيل الصوت:', err);
  }
}

export const NotificationContext = React.createContext<{
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  clearAll: () => void;
} | null>(null);

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within EnhancedNotificationProvider');
  }
  return context;
}

export function EnhancedNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || (notification.type === 'critical' ? 0 : 5000),
    };

    setNotifications(prev => [...prev, newNotification]);
    setUnreadCount(prev => prev + 1);

    if (soundEnabled) {
      playNotificationSound(notification.type);
    }

    if (newNotification.duration) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }, newNotification.duration);
    }
  }, [soundEnabled]);

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ addNotification, clearAll }}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={(id) => {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }}
        unreadCount={unreadCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onClearAll={clearAll}
      />
    </NotificationContext.Provider>
  );
}

function NotificationContainer({
  notifications,
  onRemove,
  unreadCount,
  soundEnabled,
  onToggleSound,
  onClearAll
}: {
  notifications: Notification[];
  onRemove: (id: string) => void;
  unreadCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearAll: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [audioActivated, setAudioActivated] = useState(false);

  const handleFirstClick = () => {
    if (!audioActivated) {
      enableAudio();
      setAudioActivated(true);
    }
    setShowHistory(!showHistory);
  };

  return (
    <>
      {/* الإشعارات النشطة (المنبثقة) */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onRemove={() => onRemove(notification.id)}
            />
          </div>
        ))}
      </div>

      {/* الأزرار الثابتة (الجرس + الصوت) */}
      <div className="fixed bottom-6 left-6 z-[9998] flex flex-col gap-2">
        <button
          onClick={onToggleSound}
          className={`p-3 rounded-full shadow-lg transition-all ${
            soundEnabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          onClick={handleFirstClick}
          className="relative p-3 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 text-white transition-all"
          title="الإشعارات"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* نافذة سجل الإشعارات */}
      {showHistory && (
        <div className="fixed bottom-24 left-6 z-[9998] bg-white rounded-xl shadow-2xl p-4 max-w-sm max-h-96 overflow-y-auto border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">سجل الإشعارات</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {notification.timestamp.toLocaleTimeString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="w-full mt-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                >
                  مسح الكل
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function NotificationItem({
  notification,
  onRemove
}: {
  notification: Notification;
  onRemove: () => void;
}) {
  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/95 border-green-500/50',
          icon: <CheckCircle2 className="w-6 h-6 text-green-400" />,
          title: 'text-green-100',
          message: 'text-green-200/90',
          animation: 'animate-in slide-in-from-right-full duration-300'
        };
      case 'error':
        return {
          bg: 'bg-red-900/95 border-red-500/50',
          icon: <AlertCircle className="w-6 h-6 text-red-400" />,
          title: 'text-red-100',
          message: 'text-red-200/90',
          animation: 'animate-in slide-in-from-right-full duration-300'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/95 border-yellow-500/50',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
          title: 'text-yellow-100',
          message: 'text-yellow-200/90',
          animation: 'animate-in slide-in-from-right-full duration-300'
        };
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-600 to-red-700 border-red-400/70 shadow-2xl shadow-red-900/50',
          icon: <AlertCircle className="w-6 h-6 text-red-100 animate-pulse" />,
          title: 'text-red-50 font-bold text-lg',
          message: 'text-red-100/95',
          animation: 'animate-in slide-in-from-right-full duration-300 bounce'
        };
      default:
        return {
          bg: 'bg-blue-900/95 border-blue-500/50',
          icon: <Info className="w-6 h-6 text-blue-400" />,
          title: 'text-blue-100',
          message: 'text-blue-200/90',
          animation: 'animate-in slide-in-from-right-full duration-300'
        };
    }
  };

  const styles = getStyles(notification.type);

  return (
    <div
      className={`${styles.bg} border rounded-2xl p-4 backdrop-blur-md ${styles.animation} shadow-xl`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm ${styles.title}`}>
            {notification.title}
          </h3>
          <p className={`text-sm mt-1 ${styles.message} break-words`}>
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-slate-300 hover:text-slate-100 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
