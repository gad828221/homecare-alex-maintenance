export const sendWhatsAppNotification = async (message: string) => {
  const adminPhone = "201558625259";
  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
