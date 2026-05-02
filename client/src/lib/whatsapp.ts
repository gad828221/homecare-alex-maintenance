// إرسال رسالة واتساب لرقم محدد
export const sendWhatsApp = (phone: string, message: string) => {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// إشعار للمدير (يرسل لكلا الرقمين)
export const notifyAdmin = (message: string) => {
  const adminNumbers = ["201558625259", "201278885772"];
  adminNumbers.forEach(phone => sendWhatsApp(phone, message));
};

// إشعار لفني معين
export const notifyTechnician = (techPhone: string, techName: string, orderDetails: string) => {
  if (!techPhone) return;
  const message = `🔧 *أوردر جديد لك يا ${techName}* 🔧\n\n${orderDetails}`;
  sendWhatsApp(techPhone, message);
};
