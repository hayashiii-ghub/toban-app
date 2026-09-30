import { lazy, Suspense } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch, useLocation } from "wouter";
import { CircleHelp, Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider, useT } from "./i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Home from "./pages/Home";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const TemplateDetailPage = lazy(() => import("./pages/TemplateDetailPage"));
const SharedScheduleView = lazy(() => import("./pages/SharedScheduleView"));
const Transfer = lazy(() => import("./pages/Transfer"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LazyFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--dt-page-bg)" }}
    >
      <Loader2
        className="size-8 animate-spin"
        style={{ color: "var(--dt-current-highlight)" }}
      />
    </div>
  );
}

function Router() {
  // Route を追加・変更したら server/handlers/seo.ts の KNOWN_APP_ROUTES も更新すること。
  // 同期が漏れると bot に 404 が返り、新ページが検索に index されない。
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
  const t = useT();
  // アプリ本体と共有ページのみ表示
  const showFooter = location === "/" || location.startsWith("/s/");
  if (!showFooter) return null;

  return (
    <footer
      // ホームのスマホ表示では、同じ案内をタイトル右上の「⋯」（MoreMenu）に出す
      className={`px-3 pt-6 pb-[calc(1rem+var(--home-toolbar-space,0px))] print:hidden ${location === "/" ? "max-sm:hidden" : ""}`}
      style={{
        backgroundColor: "var(--dt-page-bg)",
        backgroundImage: "var(--dt-page-texture, none)",
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-end gap-1">
        <LanguageSwitcher />
        <a
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-8 rounded-full text-muted-foreground/60 hover:text-muted-foreground/80 hover:bg-muted/40 transition-colors"
          title={t("footer.about")}
        >
          <CircleHelp className="size-5" />
        </a>
        <a
          href="/privacy"
          className="px-1 text-sm whitespace-nowrap text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors"
        >
          {t("footer.privacy")}
        </a>
        <a
          href="https://shigoto.dev/works/toban"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 px-2 text-sm text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors"
        >
          <img
            src="/hayashigoto-seal.svg"
            alt="はやしごと"
            className="size-5 opacity-70 group-hover:opacity-100 transition-opacity"
          />
          <span>hay@shigoto.dev</span>
        </a>
      </div>
    </footer>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <LanguageProvider>
            <Toaster />
            <Router />
            <AppFooter />
          </LanguageProvider>
        </MotionConfig>
      </LazyMotion>
    </ErrorBoundary>
  );
}

export default App;
