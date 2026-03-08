import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

interface BookingFormProps {
  title?: string;
  description?: string;
  defaultService?: string;
}

export default function BookingForm({ 
  title = "احجز خدمتك الآن", 
  description = "استجابة سريعة وخدمة احترافية",
  defaultService = ""
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: defaultService,
    address: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const serviceNames: { [key: string]: string } = {
    fridge: "صيانة الثلاجات",
    washer: "صيانة الغسالات",
    ac: "صيانة المكيفات",
    oven: "صيانة الأفران",
    heater: "صيانة السخانات",
    dishwasher: "صيانة غسالات الأطباق",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // إرسال البيانات إلى Netlify Forms
      const formElement = e.currentTarget as HTMLFormElement;
      const formDataObj = new FormData(formElement);
      
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formDataObj as any).toString(),
      });

      if (response.ok) {
        setSubmitMessage("تم استقبال طلبك بنجاح! سيتم التواصل معك قريباً.");
      }
    } catch (error) {
      console.error("Error submitting form to Netlify:", error);
    }

    // إرسال رسالة WhatsApp
    const serviceName = serviceNames[formData.service] || formData.service;
    const message = `مرحباً، أنا ${formData.name}\nرقم الهاتف: ${formData.phone}\nالخدمة المطلوبة: ${serviceName}\nالعنوان: ${formData.address}\n\nأرجو تأكيد الحجز في أقرب وقت.`;
    const whatsappUrl = `https://wa.me/201558625259?text=${encodeURIComponent(message)}`;
    
    // فتح WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // إظهار رسالة تأكيد
    if (!submitMessage) {
      setSubmitMessage("تم إرسال طلب الحجز عبر WhatsApp! سيتم التواصل معك قريباً.");
    }
    
    // إعادة تعيين النموذج
    setTimeout(() => {
      setFormData({ name: "", phone: "", service: defaultService, address: "", email: "" });
      setIsSubmitting(false);
      setSubmitMessage("");
    }, 2000);
  };

  return (
    <section className="py-12 bg-orange-50">
      <div className="container max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-gray-600 mb-8">{description}</p>
        <Card className="p-8 shadow-lg">
          {submitMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {submitMessage}
            </div>
          )}
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            name="booking"
            method="POST"
            netlify
          >
            <input type="hidden" name="form-name" value="booking" />
            
            <div>
              <label className="block text-sm font-medium mb-2">الاسم</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="أدخل اسمك"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="01234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع الخدمة</label>
              <select
                name="service"
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر الخدمة</option>
                <option value="fridge">صيانة الثلاجات</option>
                <option value="washer">صيانة الغسالات</option>
                <option value="ac">صيانة المكيفات</option>
                <option value="oven">صيانة الأفران</option>
                <option value="heater">صيانة السخانات</option>
                <option value="dishwasher">صيانة غسالات الأطباق</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">العنوان بالتفصيل</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="مثال: سموحة، شارع عزيز كحيل"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
            >
              <MessageCircle className="w-5 h-5 ml-2" />
              {isSubmitting ? "جاري الإرسال..." : "إرسال عبر WhatsApp"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
