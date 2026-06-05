import { Home, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useT } from "@/i18n";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const t = useT();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--dt-page-bg)" }}>
      <div
        className="theme-border theme-shadow w-full max-w-md p-8 text-center"
        style={{ borderRadius: "var(--dt-border-radius)", backgroundColor: "var(--dt-card-bg)" }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="theme-border size-16 flex items-center justify-center"
            style={{ borderRadius: "50%", backgroundColor: "#FEE2E2" }}
          >
            <AlertCircle className="size-8" style={{ color: "#DC2626" }} aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--dt-text)" }}>
          404
        </h1>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#444" }}>
          {t("notFound.title")}
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--dt-text-secondary)" }}>
          {t("notFound.message")}
        </p>

        <button type="button"
          onClick={() => setLocation("/")}
          className="theme-border theme-shadow-sm inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm text-white transition-all duration-150 theme-hover-lift"
          style={{ backgroundColor: "#1a1a1a", borderRadius: "10px" }}
        >
          <Home className="size-4" aria-hidden="true" />
          {t("notFound.home")}
        </button>
      </div>
    </div>
  );
}
