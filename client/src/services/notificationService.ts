// ============ ADVANCED NOTIFICATION SERVICE ============

export interface NotificationPayload {
  title: string;
  message: string;
  role: 'admin' | 'manager' | 'tech' | 'data-entry' | 'all';
  orderNumber?: string;
  priority?: 'low' | 'normal' | 'high';
  sound?: 'default' | 'urgent' | 'success';
}

/**
 * Send notification to specific roles
 */
export const sendNotification = async (payload: NotificationPayload) => {
  try {
    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error('Failed to send notification');
    return await response.json();
  } catch (err) {
    console.error('Notification error:', err);
    // Fallback to local notification
    playLocalNotification(payload);
  }
};

/**
 * Send WhatsApp notification to technician
 */
export const sendTechnicianWhatsApp = async (
  techPhone: string,
  orderNumber: string,
  customerName: string,
  deviceType: string,
  address: string
) => {
  const message = `🔧 *أوردر جديد معين لك* 🔧\n\n🔢 *رقم الأوردر:* ${orderNumber}\n👤 *العميل:* ${customerName}\n🔧 *الجهاز:* ${deviceType}\n📍 *العنوان:* ${address}\n\n⏰ يرجى الوصول في أسرع وقت ممكن.`;
  
  const phone = formatPhoneForWhatsApp(techPhone);
  if (!phone) return;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
};

/**
 * Send WhatsApp notification to customer
 */
export const sendCustomerWhatsApp = async (
  customerPhone: string,
  orderNumber: string,
  customerName: string,
  deviceType: string
) => {
  const message = `📝 *تم استلام طلب الصيانة بنجاح* 📝\n\n🔢 *رقم الأوردر:* ${orderNumber}\n👤 *العميل:* ${customerName}\n🔧 *الجهاز:* ${deviceType}\n\n✅ تم تسجيل طلبك وسيتم التواصل معك قريباً لتأكيد الموعد.`;
  
  const phone = formatPhoneForWhatsApp(customerPhone);
  if (!phone) return;
  
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
};

/**
 * Format phone number for WhatsApp
 */
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[^\d]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '20' + cleaned;
  return cleaned;
};

/**
 * Play local notification sound
 */
export const playNotificationSound = (type: 'default' | 'urgent' | 'success' = 'default') => {
  try {
    const soundMap = {
      default: '/sounds/notification.mp3',
      urgent: '/sounds/notification.mp3',
      success: '/sounds/notification.mp3'
    };
    
    const audio = new Audio(soundMap[type]);
    audio.volume = 0.7;
    audio.play().catch(() => console.log('Audio playback failed'));
  } catch (err) {
    console.error('Error playing sound:', err);
  }
};

/**
 * Show browser notification
 */
export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    });
  }
};

/**
 * Show local in-app notification
 */
export const playLocalNotification = (payload: NotificationPayload) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce max-w-md`;
  
  const priorityColor = {
    low: 'from-blue-500 to-blue-600',
    normal: 'from-orange-500 to-orange-600',
    high: 'from-red-500 to-red-600'
  };
  
  notification.className = `fixed top-4 right-4 bg-gradient-to-r ${priorityColor[payload.priority || 'normal']} text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-bounce max-w-md`;
  notification.innerHTML = `
    <h4 class="font-black text-lg mb-2">${payload.title}</h4>
    <p class="font-bold text-sm">${payload.message}</p>
  `;
  
  document.body.appendChild(notification);
  
  // Play sound
  if (payload.sound) {
    playNotificationSound(payload.sound);
  }
  
  // Remove after 6 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 6000);
};

/**
 * Send SMS notification (requires backend integration)
 */
export const sendSMSNotification = async (
  phone: string,
  message: string
) => {
  try {
    const response = await fetch('/.netlify/functions/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    
    if (!response.ok) throw new Error('Failed to send SMS');
    return await response.json();
  } catch (err) {
    console.error('SMS error:', err);
  }
};

/**
 * Notify admin about new order
 */
export const notifyAdminNewOrder = async (order: any) => {
  await sendNotification({
    title: '📋 أوردر جديد!',
    message: `${order.customer_name} - ${order.device_type} - ${order.address}`,
    role: 'admin',
    orderNumber: order.order_number,
    priority: 'high',
    sound: 'urgent'
  });
  
  playLocalNotification({
    title: '🔔 أوردر جديد!',
    message: `${order.customer_name} يحتاج صيانة ${order.device_type}`,
    role: 'admin',
    priority: 'high',
    sound: 'urgent'
  });
};

/**
 * Notify technician about assigned order
 */
export const notifyTechnicianAssignment = async (
  techPhone: string,
  order: any
) => {
  await sendTechnicianWhatsApp(
    techPhone,
    order.order_number,
    order.customer_name,
    order.device_type,
    order.address
  );
  
  playLocalNotification({
    title: '🔧 تم تعيين أوردر لك!',
    message: `${order.customer_name} - ${order.device_type}`,
    role: 'tech',
    priority: 'high',
    sound: 'urgent'
  });
};

/**
 * Notify all staff about order update
 */
export const notifyStaffOrderUpdate = async (
  order: any,
  updateType: 'status_change' | 'tech_assigned' | 'completed'
) => {
  const messages = {
    status_change: `تم تحديث حالة الأوردر ${order.order_number} إلى ${order.status}`,
    tech_assigned: `تم تعيين فني للأوردر ${order.order_number}`,
    completed: `تم إكمال الأوردر ${order.order_number} بنجاح`
  };
  
  await sendNotification({
    title: '📢 تحديث أوردر',
    message: messages[updateType],
    role: 'all',
    orderNumber: order.order_number,
    priority: 'normal',
    sound: 'success'
  });
};
