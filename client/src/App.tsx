import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SamsungService from "./pages/SamsungService";
import LGService from "./pages/LGService";
import SharpService from "./pages/SharpService";
import ToshibaService from "./pages/ToshibaService";
import ZanussiService from "./pages/ZanussiService";
import UnionaireService from "./pages/UnionaireService";
import FreshService from "./pages/FreshService";
import WhiteWhaleService from "./pages/WhiteWhaleService";
import AristonService from "./pages/AristonService";
import BekoService from "./pages/BekoService";
import HooverService from "./pages/HooverService";
import IndesitService from "./pages/IndesitService";
import ProtectedOrders from "./components/ProtectedOrders";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Phone, MessageCircle } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/samsung-service"} component={SamsungService} />
      <Route path={"/lg-service"} component={LGService} />
      <Route path={"/sharp-service"} component={SharpService} />
      <Route path={"/toshiba-service"} component={ToshibaService} />
      <Route path={"/zanussi-service"} component={ZanussiService} />
      <Route path={"/unionaire-service"} component={UnionaireService} />
      <Route path={"/fresh-service"} component={FreshService} />
      <Route path={"/white-whale-service"} component={WhiteWhaleService} />
      <Route path={"/ariston-service"} component={AristonService} />
      <Route path={"/beko-service"} component={BekoService} />
      <Route path={"/hoover-service"} component={HooverService} />
      <Route path={"/indesit-service"} component={IndesitService} />
      <Route path={"/orders"} component={ProtectedOrders} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function FloatingButtons() {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-between px-4 pointer-events-none z-50">
      {/* زر الاتصال (يمين) */}
      <a
        href="tel:01278885772"
        onClick={() => gtag('event', 'conversion', {'send_to': 'AW-16866300615/Hg5gCNz5nvkbEMelveo-'})}
        className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ml-auto"
        style={{ marginRight: '10px' }}
        aria-label="اتصال"
      >
        <Phone className="w-6 h-6" />
      </a>

      {/* زر واتساب (يسار) */}
      <a
        href="https://wa.me/201558625259"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => gtag('event', 'conversion', {'send_to': 'AW-16866300615/Hg5gCNz5nvkbEMelveo-'})}
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
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
