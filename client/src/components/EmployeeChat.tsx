import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Lock, MessageCircle, Send, Users, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNotification } from './EnhancedNotificationSystem';

const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
const supabase = createClient(supabaseUrl, supabaseKey);
const CHAT_ACTION = 'employee_chat';
const CHAT_STORAGE_PREFIX = 'employee_chat_read_';

type ChatMode = 'public' | 'private';
type ChatUser = { id: string | number; name: string; username?: string; role?: string; is_active?: boolean };
type ChatMessage = {
  id: number | string;
  created_at: string;
  user_name: string;
  details: string;
  channel: ChatMode;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientId?: string;
  recipientName?: string;
  text: string;
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizeId = (value: unknown) => String(value ?? '');
const getConversationId = (mode: ChatMode, currentId: string, recipientId?: string) => {
  if (mode === 'public') return 'public';
  return [currentId, recipientId || ''].sort().join(':');
};

const parseChatMessage = (row: any): ChatMessage | null => {
  try {
    const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
    if (!details || details.chatVersion !== 1 || !details.text) return null;
    return {
      id: row.id,
      created_at: row.created_at,
      user_name: row.user_name || details.senderName || 'مستخدم',
      details: row.details,
      channel: details.channel === 'private' ? 'private' : 'public',
      conversationId: details.conversationId || 'public',
      senderId: normalizeId(details.senderId),
      senderName: details.senderName || row.user_name || 'مستخدم',
      senderRole: details.senderRole,
      recipientId: details.recipientId ? normalizeId(details.recipientId) : undefined,
      recipientName: details.recipientName,
      text: String(details.text).slice(0, 2000)
    };
  } catch {
    return null;
  }
};

export default function EmployeeChat() {
  const { addNotification } = useNotification();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('public');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadVersion, setUnreadVersion] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeConversationRef = useRef('public');
  const openRef = useRef(false);
  const currentIdRef = useRef('');

  const userRole = currentUser?.role || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null);
  const canUseChat = ['admin', 'manager', 'tech', 'data-entry'].includes(userRole || '');
  const currentId = normalizeId(currentUser?.id || currentUser?.username || currentUser?.name);
  const currentName = currentUser?.name || currentUser?.techName || currentUser?.username || 'مستخدم';
  const selectedUser = users.find((user) => normalizeId(user.id) === selectedUserId);
  const conversationId = getConversationId(mode, currentId, selectedUserId);
  const isManagement = userRole === 'admin' || userRole === 'manager';
  const getKnownSenderRole = useCallback((message: ChatMessage) => message.senderRole || users.find((user) => normalizeId(user.id) === message.senderId)?.role || '', [users]);
  const canViewMessage = useCallback((message: ChatMessage) => {
    if (message.channel !== 'public' || isManagement) return true;
    if (message.senderId === currentId) return true;
    const senderRole = getKnownSenderRole(message);
    return senderRole === 'admin' || senderRole === 'manager';
  }, [currentId, getKnownSenderRole, isManagement]);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    currentIdRef.current = normalizeId(user?.id || user?.username || user?.name);
  }, []);

  useEffect(() => {
    activeConversationRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const fetchChatData = useCallback(async () => {
    if (!canUseChat) return;
    try {
      const responses = await Promise.allSettled([
        fetch(`${supabaseUrl}/rest/v1/notifications?select=*&action=eq.${CHAT_ACTION}&order=created_at.asc&limit=500`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/users?select=id,name,username,role,is_active&is_active=eq.true&order=name.asc`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/technicians?select=id,name,username,is_active&is_active=eq.true&order=name.asc`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        })
      ]);
      const readJson = async (result: PromiseSettledResult<Response>) => result.status === 'fulfilled' && result.value.ok ? result.value.json() : [];
      const rows = await readJson(responses[0]);
      const userRows = await readJson(responses[1]);
      const technicianRows = await readJson(responses[2]);
      const parsed = (Array.isArray(rows) ? rows : []).map(parseChatMessage).filter(Boolean) as ChatMessage[];
      const participants = new Map<string, ChatUser>();
      (Array.isArray(userRows) ? userRows : []).forEach((user: ChatUser) => {
        const id = normalizeId(user.id);
        if (id && user.name) participants.set(id, user);
      });
      (Array.isArray(technicianRows) ? technicianRows : []).forEach((technician: any) => {
        const id = normalizeId(technician.id);
        if (id && technician.name && !participants.has(id)) {
          participants.set(id, { id: technician.id, name: technician.name, username: technician.username, role: 'tech', is_active: technician.is_active });
        }
      });
      setMessages(parsed);
      setUsers(Array.from(participants.values()).filter((user) => normalizeId(user.id) !== currentIdRef.current));
    } catch (error) {
      console.warn('تعذر تحميل شات الموظفين:', error);
    }
  }, [canUseChat]);

  useEffect(() => {
    if (!canUseChat) return;
    void fetchChatData();
    const interval = window.setInterval(() => void fetchChatData(), 15000);
    const channel = supabase
      .channel('employee-chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `action=eq.${CHAT_ACTION}` }, (payload) => {
        const incoming = parseChatMessage(payload.new);
        if (!incoming) return;
        setMessages((previous) => previous.some((item) => String(item.id) === String(incoming.id)) ? previous : [...previous, incoming]);
        if (incoming.senderId !== currentIdRef.current && canViewMessage(incoming) && incoming.conversationId !== activeConversationRef.current) {
          addNotification({ type: 'info', title: `رسالة جديدة من ${incoming.senderName}`, message: incoming.text.slice(0, 120), duration: 5000 });
          setUnreadVersion((version) => version + 1);
        }
      })
      .subscribe();
    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [addNotification, canUseChat, canViewMessage, fetchChatData]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, conversationId]);

  const visibleMessages = useMemo(() => messages.filter((message) => message.conversationId === conversationId && canViewMessage(message)), [canViewMessage, conversationId, messages]);

  const unreadCount = useMemo(() => {
    void unreadVersion;
    return messages.filter((message) => {
      if (message.senderId === currentId || !canViewMessage(message)) return false;
      const readAt = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${message.conversationId}`);
      return !readAt || new Date(message.created_at).getTime() > new Date(readAt).getTime();
    }).length;
  }, [canViewMessage, currentId, messages, unreadVersion]);

  const markConversationRead = (id: string) => {
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${id}`, new Date().toISOString());
    setUnreadVersion((version) => version + 1);
  };

  const selectMode = (nextMode: ChatMode) => {
    setMode(nextMode);
    if (nextMode === 'public') {
      setSelectedUserId('');
      markConversationRead('public');
    }
  };

  const selectUser = (id: string) => {
    setMode('private');
    setSelectedUserId(id);
    markConversationRead(getConversationId('private', currentId, id));
  };

  const sendMessage = async () => {
    const cleanText = text.trim();
    if (!cleanText || loading || !canUseChat || (mode === 'private' && !selectedUserId)) return;
    const targetConversationId = getConversationId(mode, currentId, selectedUserId);
    setLoading(true);
    const payload = {
      chatVersion: 1,
      channel: mode,
      conversationId: targetConversationId,
      senderId: currentId,
      senderName: currentName,
      senderRole: userRole,
      recipientId: mode === 'private' ? selectedUserId : undefined,
      recipientName: mode === 'private' ? selectedUser?.name : undefined,
      text: cleanText
    };
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
        method: 'POST',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ action: CHAT_ACTION, details: JSON.stringify(payload), user_name: currentName, created_at: new Date().toISOString() })
      });
      if (!response.ok) throw new Error(await response.text());
      setText('');
      await fetchChatData();
      markConversationRead(targetConversationId);
    } catch (error) {
      console.error(error);
      addNotification({ type: 'error', title: 'تعذر إرسال الرسالة', message: 'تحقق من الاتصال وحاول مرة أخرى.', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  if (!canUseChat) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen((value) => !value); if (!open) markConversationRead(conversationId); }}
        aria-label="فتح شات الموظفين"
        className="fixed bottom-24 left-4 z-[80] w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-950/40 flex items-center justify-center transition-all active:scale-95"
      >
        <MessageCircle size={25} />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-[10px] font-black flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:w-[390px] h-[min(620px,calc(100vh-110px))] z-[85] bg-slate-950 border border-indigo-500/40 rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col" dir="rtl">
          <div className="bg-gradient-to-l from-indigo-700 to-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><MessageCircle size={20} className="text-indigo-200" /><div><p className="text-sm font-black text-white">شات الموظفين</p><p className="text-[10px] text-indigo-200">تواصل سريع داخل النظام</p></div></div>
            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg text-indigo-100 hover:bg-white/10" aria-label="إغلاق الشات"><X size={17} /></button>
          </div>

          <div className="p-3 border-b border-slate-800 bg-slate-900/80 space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={() => selectMode('public')} className={`flex-1 rounded-xl py-2 text-xs font-black flex items-center justify-center gap-1.5 ${mode === 'public' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Users size={14} /> عام</button>
              <button type="button" onClick={() => setMode('private')} className={`flex-1 rounded-xl py-2 text-xs font-black flex items-center justify-center gap-1.5 ${mode === 'private' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Lock size={14} /> خاص</button>
            </div>
            {mode === 'private' && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold">اختر موظفاً للمحادثة الخاصة:</p>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {users.map((user) => {
                    const userId = normalizeId(user.id);
                    const selected = selectedUserId === userId;
                    return <button key={userId} type="button" onClick={() => selectUser(userId)} className={`text-right rounded-xl border px-2.5 py-2 transition-all ${selected ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500/60'}`}><span className="block text-[11px] font-black truncate">{user.name}</span><span className="block text-[9px] opacity-70 mt-0.5">{user.role === 'tech' ? 'فني' : user.role === 'manager' ? 'مدير فرع' : user.role === 'admin' ? 'مدير عام' : 'موظف'}</span></button>;
                  })}
                  {users.length === 0 && <p className="col-span-2 text-center text-[10px] text-amber-300 py-3">لا توجد قائمة موظفين حالياً. اضغط تحديث الصفحة.</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-950/80">
            {mode === 'private' && !selectedUserId && <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs leading-6"><Lock size={28} className="mx-auto mb-2 text-slate-700" />اختر موظفاً لبدء محادثة خاصة</div>}
            {mode === 'private' && selectedUserId && visibleMessages.length === 0 && <div className="h-full flex items-center justify-center text-slate-500 text-xs">لا توجد رسائل بعد. ابدأ المحادثة.</div>}
            {visibleMessages.map((message) => {
              const mine = message.senderId === currentId;
              return <div key={message.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 ${mine ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-slate-800 text-slate-100 rounded-bl-md'}`}><p className="text-[9px] font-black opacity-70 mb-1">{mine ? 'أنت' : message.senderName}</p><p className="text-xs leading-5 whitespace-pre-wrap break-words">{message.text}</p><p className="text-[8px] opacity-60 mt-1">{new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p></div></div>;
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900/95">
            <div className="flex items-end gap-2">
              <textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} disabled={mode === 'private' && !selectedUserId} rows={2} placeholder={mode === 'private' && !selectedUserId ? 'اختر موظفاً أولاً' : 'اكتب رسالتك هنا...'} className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
              <button type="button" onClick={() => { void sendMessage(); }} disabled={loading || !text.trim() || (mode === 'private' && !selectedUserId)} className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-40" aria-label="إرسال الرسالة"><Send size={17} /></button>
            </div>
            <p className="text-[9px] text-slate-600 mt-1">Enter للإرسال — Shift + Enter لسطر جديد</p>
          </div>
        </div>
      )}
    </>
  );
}
