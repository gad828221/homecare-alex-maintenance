import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EnhancedNotificationProvider } from "./components/EnhancedNotificationSystem";
import { Phone, MessageCircle, Download } from "lucide-react";
import { usePwaInstall } from './hooks/usePwaInstall';
import PresenceManager from "./components/PresenceManager";
// EmployeeChat removed as per user request (v3.2.8)
import { readAuthSession } from './utils/authSession';

const PUBLIC_PATHS = new Set([
  '/', '/login', '/invoice', '/pickup-receipt', '/feedback', '/track',
  '/samsung-service', '/lg-service', '/sharp-service',
  '/toshiba-service', '/zanussi-service', '/unionaire-service',
  '/fresh-service', '/white-whale-service', '/ariston-service',
  '/beko-service', '/hoover-service', '/indesit-service'
]);

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/LoginPage"));
const TechPortal = lazy(() => import("./pages/TechnicianPortal"));
const DataEntry = lazy(() => import("./pages/DataEntryPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ProtectedOrders = lazy(() => import("./components/ProtectedOrders"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const PickupReceiptPage = lazy(() => import("./pages/PickupReceiptPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));

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
        <Route path="/feedback" component={FeedbackPage} />
        <Route path="/track/:orderNumber" component={OrderTracking} />
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

// PwaInstallBanner removed as per user request (v3.2.6)

function AppContent() {
  const currentPath = window.location.pathname;

  // كل مسار له هوية تثبيت مستقلة: الزوار لا يرثون تطبيق الموظفين والعكس صحيح.
  useEffect(() => {
    const isStaffPath = ['/login', '/orders', '/tech-portal', '/data-entry'].some((path) => currentPath.startsWith(path));
    const manifestHref = isStaffPath ? '/staff-manifest.webmanifest' : '/manifest.webmanifest';
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink && manifestLink.getAttribute('href') !== manifestHref) {
      manifestLink.setAttribute('href', manifestHref);
    }

    // الربط الصامت مع OneSignal للموظفين والمديرين
    if (isStaffPath) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const role = user.role || localStorage.getItem('userRole') || 'user';
          const stableId = user.id ?? user.username ?? user.techName;
          const externalId = stableId !== undefined && stableId !== null ? `${role}:${stableId}` : null;
          
          const win = window as any;
          win.OneSignalDeferred = win.OneSignalDeferred || [];
          win.OneSignalDeferred.push(async (OneSignal: any) => {
            if (externalId) {
              await OneSignal.login(externalId).catch(() => {});
              await OneSignal.User.addTags({
                role: role,
                user_id: String(stableId),
                ...(user.techName ? { tech_name: user.techName } : {})
              }).catch(() => {});
            }
          });
        } catch (e) {}
      }
    }
  }, [currentPath]);

  // إخفاء أزرار الاتصال في صفحات الإدارة والعمل
  const hideFloatingButtons = [
    "/orders", "/tech-portal", "/data-entry", "/login"
  ].includes(currentPath);
  const currentRole = localStorage.getItem('userRole');
  // EmployeeChat paths and logic removed (v3.2.8)

  // تنبيه صوتي داخلي بسيط للأوردرات الجديدة (يعمل والبرنامج مفتوح)
  useEffect(() => {
    if (!['admin', 'manager', 'tech'].includes(currentRole || '')) return;
    
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE';
    
    let lastOrderCount = -1;
    const checkNewOrders = async () => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/orders?select=id&status=eq.pending`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const data = await res.json();
        if (lastOrderCount !== -1 && data.length > lastOrderCount) {
          audio.play().catch(() => {});
        }
        lastOrderCount = data.length;
      } catch (e) {}
    };

    const interval = setInterval(checkNewOrders, 30000);
    checkNewOrders();
    return () => clearInterval(interval);
  }, [currentRole]);

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Router />
      </Suspense>
      {!hideFloatingButtons && <FloatingButtons />}

      <PresenceManager />
      {/* PwaInstallBanner removed */}
      {/* EmployeeChat removed */}
    </>
  );
}

function App() {
  useEffect(() => {
    const currentPath = window.location.pathname;

    const checkAuth = () => {
      const { role } = readAuthSession();
      
      // v3.1.8: تحويل سلس وموحد لمنع "الرعشة"
      if (role && (currentPath === '/login' || currentPath === '/')) {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect');
        
        if (redirectPath && !PUBLIC_PATHS.has(redirectPath)) {
          window.location.replace(`${redirectPath}${window.location.search}`);
        } else {
          if (role === 'tech') window.location.replace('/tech-portal');
          else if (role === 'data-entry') window.location.replace('/data-entry');
          else window.location.replace('/orders');
        }
        return;
      }

      // تم إلغاء التحويل التلقائي ليبقى الموقع الخاص بالزوار منفصلاً تماماً عن لوحة التحكم
      if (currentPath === '/') return;

      if ((PUBLIC_PATHS.has(currentPath) || currentPath.startsWith('/track/')) && !window.location.search.includes('source=pwa')) return;

      if (!role && !PUBLIC_PATHS.has(currentPath)) {
        window.location.replace('/login' + window.location.search);
        return;
      }

      if (role === 'tech' && !currentPath.startsWith('/tech-portal')) {
        window.location.replace(`/tech-portal${window.location.search}`);
      } else if (role === 'data-entry' && !currentPath.startsWith('/data-entry')) {
        window.location.replace(`/data-entry${window.location.search}`);
      } else if (role && ['admin', 'manager', 'viewer'].includes(role) && !currentPath.startsWith('/orders')) {
        window.location.replace(`/orders${window.location.search}`);
      }
    };

    checkAuth();
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
