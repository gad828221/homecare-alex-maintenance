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
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/samsung-service"} component={SamsungService} />
      <Route path={"/lg-service"} component={LGService} />
      <Route path={"/sharp-service"} component={SharpService} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Wrapper component to include FloatingWhatsAppButton
function AppContent() {
  return (
    <>
      <Router />
      <FloatingWhatsAppButton />
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
