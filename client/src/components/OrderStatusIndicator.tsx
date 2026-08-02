import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface OrderStatusIndicatorProps {
  createdAt: string;
  status: string;
}

export function OrderStatusIndicator({ createdAt, status }: OrderStatusIndicatorProps) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  let bgColor = 'bg-green-900';
  let borderColor = 'border-green-500';
  let textColor = 'text-green-300';
  let icon = null;
  let label = 'جديد';

  if (status === 'completed') {
    bgColor = 'bg-blue-900';
    borderColor = 'border-blue-500';
    textColor = 'text-blue-300';
    label = '✓ مكتمل';
  } else if (hoursElapsed > 48) {
    bgColor = 'bg-red-900';
    borderColor = 'border-red-500';
    textColor = 'text-red-300';
    icon = <AlertTriangle className="w-4 h-4" />;
    label = '⚠️ متأخر جداً (48+ ساعة)';
  } else if (hoursElapsed > 24) {
    bgColor = 'bg-yellow-900';
    borderColor = 'border-yellow-500';
    textColor = 'text-yellow-300';
    icon = <AlertCircle className="w-4 h-4" />;
    label = '⚠️ متأخر (24+ ساعة)';
  } else if (hoursElapsed > 0) {
    bgColor = 'bg-orange-900';
    borderColor = 'border-orange-500';
    textColor = 'text-orange-300';
    icon = <Clock className="w-4 h-4" />;
    label = `⏳ ${Math.floor(hoursElapsed)} ساعات`;
  }

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-3 rounded flex items-center gap-2`}>
      {icon && <span>{icon}</span>}
      <span className={`${textColor} font-semibold text-sm`}>{label}</span>
    </div>
  );
}

export function getOrderStatusColor(createdAt: string, status: string): string {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const hoursElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  if (status === 'completed') return 'bg-blue-600';
  if (hoursElapsed > 48) return 'bg-red-600';
  if (hoursElapsed > 24) return 'bg-yellow-600';
  if (hoursElapsed > 0) return 'bg-orange-600';
  return 'bg-green-600';
}
