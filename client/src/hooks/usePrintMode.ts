import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { viewOrientation } from "@/features/home/viewTabsConfig";
import { useT } from "@/i18n";

export function usePrintMode(): {
  handlePrint: (viewTab: string) => void;
} {
  const t = useT();
  useEffect(() => {
    const cleanupPrintState = () => {
      delete document.body.dataset.printMode;
      document.getElementById("print-orientation")?.remove();
    };
    window.addEventListener("afterprint", cleanupPrintState);
    return () => {
      window.removeEventListener("afterprint", cleanupPrintState);
      cleanupPrintState();
    };
  }, []);

  const handlePrint = useCallback((viewTab: string) => {
    if (typeof window.print !== "function") {
      toast.error(t("shared.printUnsupported"));
      return;
    }
    document.body.dataset.printMode = viewTab;
    const orientation = viewOrientation(viewTab);
    const style = document.createElement("style");
    style.id = "print-orientation";
    style.textContent = `@page { size: A4 ${orientation}; }`;
    document.head.appendChild(style);
    window.print();
  }, [t]);

  return { handlePrint };
}
