import { MessageCircle } from "lucide-react";

export default function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/201558625259?text=مرحباً، أريد الاستفسار عن خدمات الصيانة"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
      title="تواصل معنا عبر WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
