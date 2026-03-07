import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function WasherService() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container py-12">
        <Card className="p-8 shadow-lg rounded-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">صيانة غسالات في الإسكندرية</h1>
          <p className="text-center text-gray-600 mb-8">حلول متكاملة لجميع أنواع الغسالات (أتوماتيك، فوق أتوماتيك، هاف أتوماتيك)</p>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <img src="/images/washer-service.jpg" alt="صيانة غسالات" className="rounded-lg shadow-md" />
            <div>
              <h2 className="text-2xl font-bold text-orange-600 mb-4">لماذا تختارنا لصيانة غسالتك؟</h2>
              <p className="text-gray-700 mb-4">نحن ندرك أهمية الغسالة في منزلك، لذلك نوفر فريقاً من الفنيين المتخصصين القادرين على التعامل مع جميع الأعطال بكفاءة وسرعة.</p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 ml-2" /><span>إصلاح أعطال تصريف المياه والمضخات.</span></li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 ml-2" /><span>حل مشاكل برامج الغسيل واللوحة الإلكترونية.</span></li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 ml-2" /><span>تغيير قطع الغيار التالفة بأخرى أصلية معتمدة.</span></li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 ml-2" /><span>صيانة دورية للحفاظ على كفاءة الغسالة.</span></li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">احجز موعد صيانة الآن</h2>
            <p className="text-gray-600 mb-6">تواصل معنا مباشرة عبر الهاتف أو واتساب للحصول على أسرع خدمة.</p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 text-lg rounded-full" asChild>
                <a href="https://wa.me/201558625259">تواصل واتساب</a>
              </Button>
              <Button size="lg" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-bold py-3 px-6 text-lg rounded-full" asChild>
                <a href="tel:01278885772">اتصل بنا الآن</a>
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
