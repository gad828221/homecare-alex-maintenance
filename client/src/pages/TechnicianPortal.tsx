import { useState } from "react";
import { Wrench, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function TechnicianPortal() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b-2 border-orange-500/30 p-4">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🔧 بوابة الفنيين</h1>
            <p className="text-slate-400 text-sm mt-1">مرحباً بك في لوحة تحكم الفنيين</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto py-8">
        <div className="bg-slate-800/50 rounded-xl p-8 text-center">
          <Wrench className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">قريباً...</h2>
          <p className="text-slate-400">سيتم إضافة مهام الفنيين هنا قريباً</p>
        </div>
      </div>
    </div>
  );
}
