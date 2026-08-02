import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TechnicianStats {
  name: string;
  completed: number;
  pending: number;
  cancelled: number;
  total: number;
}

interface TechnicianWorkloadChartProps {
  data: TechnicianStats[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function TechnicianWorkloadChart({ data }: TechnicianWorkloadChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-white text-center">
        <p>لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رسم بياني عمودي */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">📊 توزيع الأوردرات حسب الفني</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" name="مكتملة" />
            <Bar dataKey="pending" fill="#f59e0b" name="قيد التنفيذ" />
            <Bar dataKey="cancelled" fill="#ef4444" name="ملغاة" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* جدول التفاصيل */}
      <div className="bg-slate-800 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-white font-bold mb-4">📋 تفاصيل الأوردرات</h3>
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-right py-2 px-4">اسم الفني</th>
              <th className="text-center py-2 px-4">مكتملة ✓</th>
              <th className="text-center py-2 px-4">قيد التنفيذ ⏳</th>
              <th className="text-center py-2 px-4">ملغاة ✕</th>
              <th className="text-center py-2 px-4">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {data.map((tech, idx) => (
              <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700 transition">
                <td className="py-3 px-4">{tech.name}</td>
                <td className="text-center py-3 px-4 text-green-400 font-semibold">{tech.completed}</td>
                <td className="text-center py-3 px-4 text-yellow-400 font-semibold">{tech.pending}</td>
                <td className="text-center py-3 px-4 text-red-400 font-semibold">{tech.cancelled}</td>
                <td className="text-center py-3 px-4 font-bold">{tech.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
