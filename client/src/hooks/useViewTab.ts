import { startTransition, useCallback, useState } from "react";
import { type ViewTabValue, isViewTab } from "@/features/home/viewTabsConfig";
import { safeGetItem, safeSetItem } from "@/lib/storage";

const VIEW_TAB_KEY = "toban-view-tab";

export function useViewTab() {
  const [viewTab, setViewTab] = useState<ViewTabValue>(() => {
    // /junban など SEO ページからの ?view=disc 着地を優先（localStorage より上位）。
    const viewParam = new URLSearchParams(window.location.search).get("view");
    if (isViewTab(viewParam)) return viewParam;
    const saved = safeGetItem(VIEW_TAB_KEY);
    if (isViewTab(saved)) return saved;
    return "cards";
  });

  const changeTab = useCallback((tab: ViewTabValue) => {
    startTransition(() => setViewTab(tab));
    safeSetItem(VIEW_TAB_KEY, tab);
  }, []);

  return { viewTab, changeTab };
}
