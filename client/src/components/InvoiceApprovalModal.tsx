import React, { useState } from 'react';
import { X, Send, Shield } from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';

interface InvoiceApprovalModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (warranty: string) => void;
  onSendWhatsApp: (link: string) => void;
}

export const InvoiceApprovalModal: React.FC<InvoiceApprovalModalProps> = ({
  order,
  isOpen,
  onClose,
  onApprove,
  onSendWhatsApp
}) => {
  const [warranty, setWarranty] = useState('');
  const [customWarranty, setCustomWarranty] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const warrantyOptions = [
    '3 أشهر ضمان على قطع الغيار والعمل',
    '6 أشهر ضمان على قطع الغيار والعمل',
    'سنة واحدة ضمان على قطع الغيار والعمل',
    'سنتان ضمان على قطع الغيار والعمل'
  ];

  const handleApprove = () => {
    const finalWarranty = isCustom ? customWarranty : warranty;
    if (!finalWarranty.trim()) {
      alert('يرجى اختيار أو إدخال الضمان');
      return;
    }

    onApprove(finalWarranty);

    const invoiceData = {
      id: order.id,
      orderNumber: `MG-${order.id}`,
      customerName: order.customer_name,
      phone: order.phone,
      device: order.device,
      brand: order.brand,
      problem: order.problem_description || order.problem,
      totalAmount: order.total_amount,
      warranty: finalWarranty,
      date: new Date().toLocaleDateString('ar-EG'),
      address: order.address,
      partsUsed: order.parts_used,
      technicianName: order.technician,
    };

    // ✅ استخدم دالة الإرسال الموجودة في invoiceService
    invoiceService.sendInvoiceViaWhatsApp(invoiceData);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            موافقة الفاتورة والضمان
          </h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* بيانات الأوردر */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-orange-400 mb-3">📋 بيانات الأوردر</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">العميل:</span> <span className="text-white font-bold">{order.customer_name}</span></div>
              <div><span className="text-slate-500">الهاتف:</span> <span className="text-white font-bold">{order.phone}</span></div>
              <div><span className="text-slate-500">الجهاز:</span> <span className="text-white font-bold">{order.device}</span></div>
              <div><span className="text-slate-500">الماركة:</span> <span className="text-white font-bold">{order.brand}</span></div>
            </div>
          </div>

          {/* التفاصيل المالية */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-sm font-bold text-green-400 mb-3">💰 التفاصيل المالية</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">الإجمالي:</span> <span className="text-white font-bold">{order.total_amount} ج.م</span></div>
              <div className="flex justify-between"><span className="text-slate-500">المصاريف:</span> <span className="text-red-400 font-bold">{order.expenses} ج.م</span></div>
              <div className="flex justify-between border-t border-slate-600 pt-2"><span className="text-slate-400 font-bold">الصافي:</span> <span className="text-green-400 font-black text-lg">{order.net_amount} ج.م</span></div>
            </div>
          </div>

          {/* اختيار الضمان */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-orange-400">🛡️ اختر الضمان</h3>
            <div className="space-y-2">
              {warrantyOptions.map((option) => (
                <label key={option} className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-orange-500 cursor-pointer transition-all">
                  <input
                    type="radio"
                    name="warranty"
                    value={option}
                    checked={warranty === option && !isCustom}
                    onChange={() => {
                      setWarranty(option);
                      setIsCustom(false);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="mr-3 text-sm text-slate-300">{option}</span>
                </label>
              ))}
            </div>

            <label className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-orange-500 cursor-pointer transition-all">
              <input
                type="radio"
                name="warranty"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="w-4 h-4"
              />
              <span className="mr-3 text-sm text-slate-300">ضمان مخصص</span>
            </label>

            {isCustom && (
              <input
                type="text"
                placeholder="أدخل نص الضمان المخصص..."
                value={customWarranty}
                onChange={(e) => setCustomWarranty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500"
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all">إلغاء</button>
            <button onClick={handleApprove} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
              <Send className="w-4 h-4" /> موافقة وإرسال الفاتورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
