import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">الصفحة غير موجودة</p>
          <Button onClick={() => window.location.href = '/'}>
            العودة للرئيسية
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
