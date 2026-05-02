import { useEffect } from "react";
import { Route, Switch } from "wouter";
import Login from "./pages/LoginPage";
import ProtectedOrders from "./components/ProtectedOrders";
import TechPortal from "./pages/TechnicianPortal";
import Home from "./pages/Home";

function App() {
  // التحقق من توجيه المستخدم (اختياري، يمكنك إلغاء تعليقه لاحقاً)
  useEffect(() => {
    const publicPaths = ["/", "/login"];
    const currentPath = window.location.pathname;
    const userRole = localStorage.getItem("userRole");

    if (publicPaths.includes(currentPath)) return;

    if (!userRole && currentPath !== "/login") {
      window.location.href = "/login";
    } else if (userRole === "admin" && currentPath !== "/orders") {
      window.location.href = "/orders";
    } else if (userRole === "tech" && currentPath !== "/tech-portal") {
      window.location.href = "/tech-portal";
    }
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/orders" component={ProtectedOrders} />
      <Route path="/tech-portal" component={TechPortal} />
      <Route>404 Not Found</Route>
    </Switch>
  );
}

export default App;
