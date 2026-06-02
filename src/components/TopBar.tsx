"use client";
import { useRef, useState } from "react";
import { useQueryStore } from "@/store/queryStore";
import { SCHEMAS } from "@/lib/schema";
import { validateImportedJSON } from "@/lib/validators";

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PresetsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function TopBar({ darkMode, onToggleDark }: Props) {
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
    <header className="flex h-16 items-center gap-4 px-4">
      <span className="whitespace-nowrap text-sm font-bold text-zinc-800 dark:text-zinc-100">
        Blanc
      </span>

      <nav className="ml-auto flex items-center gap-1">
        <button
          className="topbar-btn text-zinc-500 hover:text-red-500"
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
            <div className="dropdown-panel right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)]">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                History (latest first)
              </p>
              {history.length === 0 ? (
                <p className="text-xs italic text-zinc-400">No history yet</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.slice(0, 10).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        restoreHistory(i);
                        setShowHistory(false);
                      }}
                      className="rounded px-2 py-1.5 text-left text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      <span className="mr-2 font-mono text-zinc-400 dark:text-zinc-500">
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
            <div className="dropdown-panel right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)]">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Saved Presets
              </p>
              {presets.length === 0 ? (
                <p className="mb-3 text-xs italic text-zinc-400">
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
                        className="flex-1 rounded px-2 py-1.5 text-left text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => deletePreset(p.id)}
                        className="p-1 text-zinc-400 transition-colors hover:text-red-500"
                        aria-label={`Delete ${p.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-700">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                  placeholder="Preset name..."
                  className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="rounded bg-violet-600 px-2.5 py-1.5 text-xs text-white transition-all hover:bg-violet-700 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

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
            <div className="dropdown-panel right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)]">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
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
                className="w-full resize-none rounded border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded border border-zinc-200 px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
                  className="flex-1 rounded bg-violet-600 py-1.5 text-xs text-white transition-colors hover:bg-violet-700"
                >
                  Import
                </button>
              </div>
              {importError && (
                <p className="mt-1.5 text-xs text-red-500">{importError}</p>
              )}
            </div>
          )}
        </div>
      </nav>

      <button
        className="topbar-btn"
        onClick={onToggleDark}
        title="Toggle dark mode"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <SunIcon /> : <MoonIcon />}
        <span className="topbar-label">Theme</span>
      </button>
    </header>
  );
}
