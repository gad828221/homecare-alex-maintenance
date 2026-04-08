// WhatsApp Service - Admin Only
export const whatsappService = {
  isValidEgyptianNumber: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('012') || cleaned.startsWith('015');
  },

  generateWhatsAppLink: (phone: string, message: string): string => {
    if (!whatsappService.isValidEgyptianNumber(phone)) {
      throw new Error('رقم هاتف غير صالح. يجب أن يبدأ بـ 012 أو 015');
    }
    
    const cleaned = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleaned}?text=${encodedMessage}`;
  },

  sendAdminNotification: async (
    phone: string,
    customerName: string,
    orderDetails: string,
    status: string
  ): Promise<{ success: boolean; link?: string; error?: string }> => {
    try {
      if (!whatsappService.isValidEgyptianNumber(phone)) {
        return { 
          success: false, 
          error: 'رقم هاتف غير صالح. يجب أن يبدأ بـ 012 أو 015' 
        };
      }

      const message = `مرحباً ${customerName}\n\nتحديث حول طلبك:\n${orderDetails}\n\nالحالة: ${status}\n\nشكراً!`;
      const link = whatsappService.generateWhatsAppLink(phone, message);
      
      return { success: true, link };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ غير معروف' 
      };
    }
  }
};
