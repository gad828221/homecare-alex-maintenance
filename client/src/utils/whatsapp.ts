/**
 * أداة مساعدة لفتح تطبيق الواتساب مباشرة دون المرور بالمتصفح أولاً
 */
export const openWhatsAppDirectly = (phone: string, message: string): void => {
  if (!phone) return;
  
  // تنظيف رقم الهاتف
  let cleanedPhone = phone.toString().replace(/[^\d]/g, '');
  if (cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
  if (cleanedPhone.length === 10) cleanedPhone = '20' + cleanedPhone;
  
  const encodedMsg = encodeURIComponent(message);
  
  // فحص نوع الجهاز
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // الرابط العميق لفتح التطبيق مباشرة على الموبايل
    window.location.href = `whatsapp://send?phone=${cleanedPhone}&text=${encodedMsg}`;
  } else {
    // الرابط التقليدي للكمبيوتر
    window.open(`https://wa.me/${cleanedPhone}?text=${encodedMsg}`, '_blank');
  }
};
