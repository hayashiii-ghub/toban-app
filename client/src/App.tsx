import { lazy, Suspense } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingScreen } from "./components/LoadingScreen";
import { LanguageProvider, useT } from "./i18n";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { SITE_LINKS } from "./components/siteLinks";
import Home from "./pages/Home";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const TemplateDetailPage = lazy(() => import("./pages/TemplateDetailPage"));
const SharedScheduleView = lazy(() => import("./pages/SharedScheduleView"));
const Transfer = lazy(() => import("./pages/Transfer"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  // Route を追加・変更したら server/handlers/seo.ts の KNOWN_APP_ROUTES も更新すること。
  // 同期が漏れると bot に 404 が返り、新ページが検索に index されない。
  return (
    <Suspense fallback={<LoadingScreen />}>
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

const FOOTER_ITEM_CLASS =
  "flex items-center gap-1.5 px-2 h-8 rounded-full text-sm whitespace-nowrap text-muted-foreground/60 hover:text-muted-foreground/80 hover:bg-muted/40 transition-colors";

function AppFooter() {
  const [location] = useLocation();
  const t = useT();
  // アプリ本体と共有ページのみ表示
  const showFooter = location === "/" || location.startsWith("/s/");
  if (!showFooter) return null;

  return (
    <footer
      // ホームのスマホ表示では出さない（言語はタイトルの右上、ほかは編集画面の「くわしい設定」にある）
      className={`px-3 pt-6 pb-[calc(1rem+var(--home-toolbar-space,0px))] print:hidden ${location === "/" ? "max-sm:hidden" : ""}`}
      style={{
        backgroundColor: "var(--dt-page-bg)",
        backgroundImage: "var(--dt-page-texture, none)",
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-end gap-1">
        <LanguageSwitcher className={FOOTER_ITEM_CLASS} />
        {SITE_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            {...(link.newTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={FOOTER_ITEM_CLASS}
          >
            {link.icon}
            <span>{t(link.labelKey)}</span>
          </a>
        ))}
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
