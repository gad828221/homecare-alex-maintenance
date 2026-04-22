import React, { useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

export const NotificationContext = React.createContext<{
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
} | null>(null);

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}

export function EnhancedNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000,
    };
    setNotifications(prev => [...prev, newNotification]);
    playNotificationSound(notification.type);
    if (newNotification.duration) {
      setTimeout(() => removeNotification(id), newNotification.duration);
    }
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

function playNotificationSound(type: string) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const frequency = type === 'success' ? 800 : type === 'error' ? 300 : 600;
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) { console.warn('Audio not supported'); }
}

function NotificationContainer({ notifications, onRemove }: { notifications: Notification[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} onRemove={() => onRemove(notification.id)} />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRemove }: { notification: Notification; onRemove: () => void }) {
  const getStyles = (type: string) => {
    switch (type) {
      case 'success': return { bg: 'bg-green-900/20 border-green-500/30', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> };
      case 'error': return { bg: 'bg-red-900/20 border-red-500/30', icon: <AlertCircle className="w-5 h-5 text-red-500" /> };
      case 'warning': return { bg: 'bg-yellow-900/20 border-yellow-500/30', icon: <AlertTriangle className="w-5 h-5 text-yellow-500" /> };
      default: return { bg: 'bg-blue-900/20 border-blue-500/30', icon: <Info className="w-5 h-5 text-blue-500" /> };
    }
  };
  const styles = getStyles(notification.type);
  return (
    <div className={`${styles.bg} border rounded-2xl p-4 backdrop-blur-sm shadow-2xl animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <h3 className="font-bold text-sm text-white">{notification.title}</h3>
          <p className="text-xs mt-1 text-gray-200">{notification.message}</p>
        </div>
        <button onClick={onRemove} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
