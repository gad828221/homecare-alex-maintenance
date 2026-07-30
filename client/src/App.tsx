import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EnhancedNotificationProvider } from "./components/EnhancedNotificationSystem";
import { Phone, MessageCircle } from "lucide-react";

// ============ LAZY LOADED PAGES ============
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/LoginPage"));
const TechPortal = lazy(() => import("./pages/TechnicianPortal"));
const DataEntry = lazy(() => import("./pages/DataEntryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProtectedOrders = lazy(() => import("./components/ProtectedOrders"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const PickupReceiptPage = lazy(() => import("./pages/PickupReceiptPage"));

// ============ LAZY LOADED BRAND PAGES ============
const SamsungService = lazy(() => import("./pages/SamsungService"));
const LGService = lazy(() => import("./pages/LGService"));
const SharpService = lazy(() => import("./pages/SharpService"));
const ToshibaService = lazy(() => import("./pages/ToshibaService"));
const ZanussiService = lazy(() => import("./pages/ZanussiService"));
const UnionaireService = lazy(() => import("./pages/UnionaireService"));
const FreshService = lazy(() => import("./pages/FreshService"));
const WhiteWhaleService = lazy(() => import("./pages/WhiteWhaleService"));
const AristonService = lazy(() => import("./pages/AristonService"));
const BekoService = lazy(() => import("./pages/BekoService"));
const HooverService = lazy(() => import("./pages/HooverService"));
const IndesitService = lazy(() => import("./pages/IndesitService"));

// ============ LOADING FALLBACK ============
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-bold">جاري التحميل...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/samsung-service" component={SamsungService} />
        <Route path="/lg-service" component={LGService} />
        <Route path="/sharp-service" component={SharpService} />
        <Route path="/toshiba-service" component={ToshibaService} />
        <Route path="/zanussi-service" component={ZanussiService} />
        <Route path="/unionaire-service" component={UnionaireService} />
        <Route path="/fresh-service" component={FreshService} />
        <Route path="/white-whale-service" component={WhiteWhaleService} />
        <Route path="/ariston-service" component={AristonService} />
        <Route path="/beko-service" component={BekoService} />
        <Route path="/hoover-service" component={HooverService} />
        <Route path="/indesit-service" component={IndesitService} />
        <Route path="/orders" component={ProtectedOrders} />
        <Route path="/login" component={Login} />
        <Route path="/tech-portal" component={TechPortal} />
        <Route path="/data-entry" component={DataEntry} />
        <Route path="/invoice" component={InvoicePage} />
        <Route path="/pickup-receipt" component={PickupReceiptPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function FloatingButtons() {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-between px-4 pointer-events-none z-50">
      <a 
        href="tel:01278885772" 
        className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ml-auto" 
        style={{ marginRight: '10px' }} 
        aria-label="اتصال"
      >
        <Phone className="w-6 h-6" />
      </a>
      <a 
        href="https://wa.me/201558625259" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="pointer-events-auto bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110" 
        aria-label="واتساب"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}

function AppContent() {
  return (
    <>
      <Router />
      <FloatingButtons />
    </>
  );
}

function App() {
  useEffect(() => {
    const publicPaths = [
      "/", "/login", "/invoice", "/pickup-receipt",
      "/samsung-service", "/lg-service", "/sharp-service",
      "/toshiba-service", "/zanussi-service", "/unionaire-service",
      "/fresh-service", "/white-whale-service", "/ariston-service",
      "/beko-service", "/hoover-service", "/indesit-service"
    ];

    const currentPath = window.location.pathname;
    const userRole = localStorage.getItem("userRole");

    if (publicPaths.includes(currentPath)) return;

    if (!userRole) {
      window.location.href = "/login";
      return;
    }

    if (userRole === "tech" && currentPath !== "/tech-portal") {
      window.location.href = "/tech-portal";
    } else if (userRole === "data-entry" && currentPath !== "/data-entry") {
      window.location.href = "/data-entry";
    } else if ((userRole === "admin" || userRole === "manager" || userRole === "viewer") && currentPath !== "/orders") {
      window.location.href = "/orders";
    }
  }, []);

  return (
    <ErrorBoundary>
      <EnhancedNotificationProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster position="top-center" richColors />
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </EnhancedNotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
