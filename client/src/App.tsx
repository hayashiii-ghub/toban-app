import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { CircleHelp, Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const TemplateDetailPage = lazy(() => import("./pages/TemplateDetailPage"));
const SharedScheduleView = lazy(() => import("./pages/SharedScheduleView"));
const Transfer = lazy(() => import("./pages/Transfer"));
const NotFound = lazy(() => import("./pages/NotFound"));


function LazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--dt-page-bg)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--dt-current-highlight)" }} />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/about"} component={LandingPage} />
        <Route path={"/templates"} component={TemplatesPage} />
        <Route path={"/templates/:slug"} component={TemplateDetailPage} />
        <Route path={"/s/:slug"} component={SharedScheduleView} />
        <Route path={"/transfer"} component={Transfer} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppFooter() {
  const [location] = useLocation();
  // アプリ本体と共有ページのみ表示
  const showFooter = location === "/" || location.startsWith("/s/");
  if (!showFooter) return null;

  return (
    <footer className="py-2 pr-3 text-right print:hidden md:fixed md:bottom-0 md:right-0 md:z-50">
      <div className="flex items-center justify-end gap-1 md:inline-flex">
        <a
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground/60 hover:text-muted-foreground/80 hover:bg-muted/40 transition-colors"
          title="toban について"
        >
          <CircleHelp className="w-5 h-5" />
        </a>
        <a
          href="https://shigoto.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0 px-2 text-sm text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors"
        >
          <img src="/hayashigoto-logo.png" alt="はやしごと" className="h-9 w-auto" />
          <span>hay@shigoto.dev</span>
        </a>
      </div>
    </footer>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
            <AppFooter />
          </TooltipProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
