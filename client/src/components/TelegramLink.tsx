import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';

export default function TelegramLink({ role, userName }: { role: string; userName: string }) {
  const [chatId, setChatId] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`telegram_chat_id_${userName}`);
    if (saved) {
      setChatId(saved);
      setIsLinked(true);
    }
  }, [userName]);

  const handleSave = () => {
    if (!chatId.trim()) return;
    localStorage.setItem(`telegram_chat_id_${userName}`, chatId.trim());
    setIsLinked(true);
    alert("تم ربط تليجرام بنجاح! ستصلك التنبيهات الفورية هناك.");
  };

  const handleUnlink = () => {
    localStorage.removeItem(`telegram_chat_id_${userName}`);
    setChatId('');
    setIsLinked(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-800/50 mt-4 w-full max-w-sm mx-auto bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
      <div className="flex items-center gap-2 text-xs font-bold text-white">
        <Send className="text-blue-400" size={16} />
        <span>قناة الطوارئ البديلة: إشعارات Telegram</span>
      </div>

      {isLinked ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 text-xs">
            <CheckCircle2 size={14} />
            <span>متصل بـ Telegram (ID: {chatId})</span>
          </div>
          <button 
            onClick={handleUnlink}
            className="text-[10px] text-slate-500 hover:text-red-400 underline transition-colors"
          >
            فقط الربط أو تغيير الرقم
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            لضمان عدم فوات أي أوردر، استقبل التنبيهات بصوت قوي عبر بوت تليجرام الرسمي للشركة:
          </p>
          
          <a 
            href="https://t.me/userinfobot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-black shadow-lg transition-all"
          >
            <Send size={14} /> 1. اضغط هنا واكتب Start <ExternalLink size={12} />
          </a>

          <div className="flex gap-2 mt-2">
            <input 
              type="text" 
              placeholder="اكتب رقم الـ Chat ID هنا..." 
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button 
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              حفظ
            </button>
          </div>
          <p className="text-[9px] text-slate-500 text-center">
            (البوت سيعطيك رقماً بجانب كلمة Id، انسخه وضعه في المربع أعلاه)
          </p>
        </div>
      )}
    </div>
  );
}
