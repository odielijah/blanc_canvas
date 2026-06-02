"use client";
import { useEffect, useSyncExternalStore } from "react";
import { QueryBuilder } from "./QueryBuilder";
import QueryPreview from "./QueryPreview";
import ResultsPanel from "./ResultsPanel";
import TopBar from "./TopBar";

const DARK_MODE_KEY = "qb-dark";
const DARK_MODE_EVENT = "qb-dark-change";

function getDarkModeSnapshot() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(DARK_MODE_KEY) === "true"
  );
}

function getDarkModeServerSnapshot() {
  return false;
}

function subscribeDarkMode(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DARK_MODE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DARK_MODE_EVENT, onStoreChange);
  };
}

export function QueryBuilderApp() {
  const darkMode = useSyncExternalStore(
    subscribeDarkMode,
    getDarkModeSnapshot,
    getDarkModeServerSnapshot,
  );

  const setDarkMode = (next: boolean | ((current: boolean) => boolean)) => {
    if (typeof window === "undefined") return;

    const value =
      typeof next === "function" ? next(getDarkModeSnapshot()) : next;

    localStorage.setItem(DARK_MODE_KEY, String(value));
    window.dispatchEvent(new Event(DARK_MODE_EVENT));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex h-full max-h-[1400px] w-full max-w-[2000px] flex-col">
        <TopBar
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />

        <div className="no-scrollbar grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 lg:grid-cols-2 lg:overflow-hidden">
          <QueryBuilder />

          <div className="grid min-h-[36rem] min-w-0 grid-rows-2 gap-4 overflow-hidden lg:min-h-0">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <QueryPreview />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <ResultsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
