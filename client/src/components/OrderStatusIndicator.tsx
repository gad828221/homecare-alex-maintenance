import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { parseOrderDate } from '../utils/orderTiming';

interface OrderStatusIndicatorProps {
  createdAt: string;
  status: string;
}

export function OrderStatusIndicator({ createdAt, status }: OrderStatusIndicatorProps) {
  const createdDate = parseOrderDate(createdAt);
  const now = new Date();
  const hoursElapsed = createdDate ? (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60) : 0;

  // تعديل الألوان لتتوافق مع الثيم الفاتح (Neo Operations Light)
  let bgColor = 'bg-emerald-50';
  let borderColor = 'border-emerald-400';
  let textColor = 'text-emerald-800';
  let icon = null;
  let label = 'جديد';

  if (status === 'completed') {
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-400';
    textColor = 'text-blue-800';
    label = '✓ مكتمل';
  } else if (hoursElapsed > 48) {
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-400';
    textColor = 'text-rose-800';
    icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
    label = '⚠️ متأخر جداً (48+ ساعة)';
  } else if (hoursElapsed > 24) {
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-400';
    textColor = 'text-amber-800';
    icon = <AlertCircle className="w-4 h-4 text-amber-600" />;
    label = '⚠️ متأخر (24+ ساعة)';
  } else if (hoursElapsed > 0) {
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-400';
    textColor = 'text-orange-800';
    icon = <Clock className="w-4 h-4 text-orange-600" />;
    label = `⏳ ${Math.floor(hoursElapsed)} ساعات`;
  }

  return (
    <div className={`${bgColor} border-r-4 ${borderColor} p-3 rounded-xl flex items-center gap-2 border border-slate-200/60 shadow-sm`}>
      {icon && <span>{icon}</span>}
      <span className={`${textColor} font-bold text-xs`}>{label}</span>
    </div>
  );
}

export function getOrderStatusColor(createdAt: string, status: string): string {
  const createdDate = parseOrderDate(createdAt);
  const now = new Date();
  const hoursElapsed = createdDate ? (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60) : 0;

  if (status === 'completed') return 'bg-blue-600';
  if (hoursElapsed > 48) return 'bg-rose-600';
  if (hoursElapsed > 24) return 'bg-amber-600';
  if (hoursElapsed > 0) return 'bg-orange-600';
  return 'bg-emerald-600';
    }
