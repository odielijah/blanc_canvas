"use client";
import { useEffect, useSyncExternalStore } from "react";
import { QueryBuilder } from "./QueryBuilder";
import QueryPreview from "./QueryPreview";
import ResultsPanel from "./ResultsPanel";
import TopBar from "./TopBar";
import {
  DEFAULT_THEME,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  ThemeId,
  isThemeId,
} from "@/features/query-builder/theme/themes";

function getThemeSnapshot(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(theme) ? theme : DEFAULT_THEME;
}

function getThemeServerSnapshot(): ThemeId {
  return DEFAULT_THEME;
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function QueryBuilderApp() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const setTheme = (nextTheme: ThemeId) => {
    if (typeof window === "undefined") return;

    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app-shell max-w-[1400px] mx-auto flex h-screen overflow-hidden transition-colors">
      <div className="app-frame flex h-full max-h-[1400px] w-full flex-col">
        <TopBar
          theme={theme}
          onThemeChange={setTheme}
        />

        <div className="app-grid no-scrollbar grid w-full flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 sm:pt-0 lg:grid-cols-2 lg:overflow-hidden">
          <QueryBuilder />

          <div className="grid min-h-[36rem] min-w-0 grid-rows-2 gap-4 overflow-hidden lg:min-h-0">
            <div className="panel-surface flex min-h-0 flex-col overflow-hidden">
              <QueryPreview />
            </div>
            <div className="panel-surface flex min-h-0 flex-col overflow-hidden">
              <ResultsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
