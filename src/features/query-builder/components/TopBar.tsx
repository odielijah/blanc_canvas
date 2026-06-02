"use client";
import { useRef, useState } from "react";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { SCHEMAS } from "@/features/query-builder/lib/schema";
import { validateImportedJSON } from "@/features/query-builder/lib/validators";
import { THEMES, ThemeId } from "@/features/query-builder/theme/themes";
import {
  ExportIcon,
  HistoryIcon,
  ImportIcon,
  MoonIcon,
  PresetsIcon,
  ResetIcon,
  ThemeIcon,
} from "./icons";

interface Props {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export default function TopBar({ theme, onThemeChange }: Props) {
  const {
    schemaId,
    reset,
    history,
    restoreHistory,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    exportQuery,
    importQuery,
  } = useQueryStore();

  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const currentSchema = SCHEMAS.find((s) => s.id === schemaId)!;
  const currentThemeIndex = THEMES.findIndex((option) => option.id === theme);
  const nextTheme =
    THEMES[(currentThemeIndex + 1) % THEMES.length] ?? THEMES[0];
  const ThemeToggleIcon = theme === "brown" ? MoonIcon : ThemeIcon;

  const handleExport = () => {
    const json = exportQuery();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-${schemaId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const { valid, error } = validateImportedJSON(importText);
    if (!valid) {
      setImportError(error ?? "Invalid query");
      return;
    }
    importQuery(importText);
    setShowImport(false);
    setImportText("");
    setImportError("");
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { valid, error } = validateImportedJSON(text);
      if (!valid) {
        setImportError(error ?? "Invalid query file");
        return;
      }
      importQuery(text);
      setShowImport(false);
    };
    reader.readAsText(file);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim());
    setPresetName("");
  };

  return (
    <header className="relative z-[80] flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:gap-4 sm:px-7 sm:py-4">
      <span
        className="brand-mark flex items-center gap-2 leading-1 whitespace-nowrap text-[var(--accent-strong)]"
        data-logo="Blanc."
      >
        <span className="brand-blanc text-[2.75rem] leading-none tracking-tight sm:text-6xl">
          Blanc.
        </span>
      </span>

      <nav className="order-3 flex w-full min-w-0 flex-wrap items-center justify-start gap-1 sm:order-none sm:ml-auto sm:w-auto sm:flex-nowrap sm:justify-end">
        <button
          className="topbar-btn danger-button"
          onClick={() => reset(currentSchema.fields[0].name)}
          title="Reset query"
          aria-label="Reset query"
        >
          <ResetIcon />
          <span className="topbar-label">Reset</span>
        </button>

        <div className="relative">
          <button
            className="topbar-btn"
            onClick={() => {
              setShowHistory(!showHistory);
              setShowPresets(false);
              setShowImport(false);
            }}
            title="Query history"
            aria-label="Query history"
          >
            <HistoryIcon />
            <span className="topbar-label">History</span>
          </button>
          {showHistory && (
            <div className="dropdown-panel right-2 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]">
              <p className="text-soft-theme mb-2 text-xs font-semibold">
                History (latest first)
              </p>
              {history.length === 0 ? (
                <p className="text-muted-theme text-xs italic">
                  No history yet
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.slice(0, 10).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        restoreHistory(i);
                        setShowHistory(false);
                      }}
                      className="dropdown-item rounded px-2 py-1.5 text-left text-xs transition-colors"
                    >
                      <span className="text-muted-theme mr-2 font-mono">
                        #{i + 1}
                      </span>
                      {h.children.length} condition
                      {h.children.length !== 1 ? "s" : ""}, {h.logic}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="topbar-btn"
            onClick={() => {
              setShowPresets(!showPresets);
              setShowHistory(false);
              setShowImport(false);
            }}
            title="Saved presets"
            aria-label="Saved presets"
          >
            <PresetsIcon />
            <span className="topbar-label">Presets</span>
          </button>
          {showPresets && (
            <div className="dropdown-panel right-2 top-full mt-2 w-72 max-w-[calc(100vw-2rem)]">
              <p className="text-soft-theme mb-2 text-xs font-semibold">
                Saved Presets
              </p>
              {presets.length === 0 ? (
                <p className="text-muted-theme mb-3 text-xs italic">
                  No saved presets
                </p>
              ) : (
                <div className="mb-3 flex flex-col gap-1">
                  {presets.map((p) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          loadPreset(p.id);
                          setShowPresets(false);
                        }}
                        className="dropdown-item flex-1 rounded px-2 py-1.5 text-left text-xs transition-colors"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => deletePreset(p.id)}
                        className="danger-button p-1 transition-colors"
                        aria-label={`Delete ${p.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 border-t border-[var(--border)] pt-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                  placeholder="Preset name..."
                  className="theme-input flex-1 text-xs"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="accent-button rounded px-2.5 py-1.5 text-xs transition-all disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="theme-divider mx-1 h-6 w-px" />

        <button
          className="topbar-btn"
          onClick={handleExport}
          title="Export query"
          aria-label="Export query"
        >
          <ExportIcon />
          <span className="topbar-label">Export</span>
        </button>

        <div className="relative">
          <button
            className="topbar-btn"
            onClick={() => {
              setShowImport(!showImport);
              setShowHistory(false);
              setShowPresets(false);
            }}
            title="Import query"
            aria-label="Import query"
          >
            <ImportIcon />
            <span className="topbar-label">Import</span>
          </button>
          {showImport && (
            <div className="dropdown-panel right-2 top-full mt-2 w-80 max-w-[calc(100vw-2rem)]">
              <p className="text-soft-theme mb-2 text-xs font-semibold">
                Import Query JSON
              </p>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError("");
                }}
                rows={5}
                placeholder='Paste JSON here, e.g. {"type":"group","logic":"AND","children":[...]}'
                className="theme-input w-full resize-none font-mono text-xs"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="ghost-button rounded px-2 py-1.5 text-xs transition-colors"
                >
                  From file...
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
                <button
                  onClick={handleImportSubmit}
                  className="accent-button flex-1 rounded py-1.5 text-xs transition-colors"
                >
                  Import
                </button>
              </div>
              {importError && (
                <p className="mt-1.5 text-xs text-[var(--danger)]">
                  {importError}
                </p>
              )}
            </div>
          )}
        </div>
      </nav>

      <button
        className="topbar-btn ml-auto shrink-0 sm:ml-0"
        onClick={() => {
          onThemeChange(nextTheme.id);
          setShowHistory(false);
          setShowPresets(false);
          setShowImport(false);
        }}
        title={`Switch to ${nextTheme.label}`}
        aria-label={`Switch to ${nextTheme.label}`}
      >
        <ThemeToggleIcon />
        <span className="topbar-label">Theme</span>
      </button>
    </header>
  );
}
