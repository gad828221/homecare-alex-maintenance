import { useEffect } from "react";
import { useLocation } from "wouter";
import OrdersPage from "@/pages/OrdersPage";
import OrdersLoginPage from "@/pages/OrdersLoginPage";

export default function ProtectedOrders() {
  const [, setLocation] = useLocation();
  const isAuthenticated = sessionStorage.getItem("ordersAuthenticated") === "true";

  useEffect(() => {
    // التحقق من انتهاء الجلسة (مثلاً بعد إغلاق المتصفح)
    if (!isAuthenticated) {
      // لا تفعل شيء - اترك المستخدم على صفحة تسجيل الدخول
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <OrdersLoginPage />;
  }

  return <OrdersPage />;
}
