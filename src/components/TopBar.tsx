"use client";
import { useState, useRef } from "react";
import { useQueryStore } from "@/store/queryStore";
import { SCHEMAS } from "@/lib/schema";
import { validateImportedJSON } from "@/lib/validators";

interface Props {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function TopBar({ darkMode, onToggleDark }: Props) {
  const {
    schemaId,
    setSchema,
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
  const [presetName, setPresetName] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currentSchema = SCHEMAS.find((s) => s.id === schemaId)!;

  const handleSchemaChange = (id: string) => {
    const schema = SCHEMAS.find((s) => s.id === id)!;
    setSchema(id, schema.fields[0].name);
  };

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
    <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-2">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M3 6h18M3 12h10M3 18h6" />
          </svg>
        </div>
        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
          QueryCraft
        </span>
      </div>

      {/* Schema selector */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Source:
        </span>
        <select
          value={schemaId}
          onChange={(e) => handleSchemaChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {SCHEMAS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />

      {/* Reset */}
      <button
        onClick={() => reset(currentSchema.fields[0].name)}
        className="topbar-btn text-zinc-500 hover:text-red-500"
        title="Reset query"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset
      </button>

      {/* History */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => {
            setShowHistory(!showHistory);
            setShowPresets(false);
          }}
          className="topbar-btn"
          title="Query history"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              {history.length}
            </span>
          )}
        </button>
        {showHistory && (
          <div className="dropdown-panel w-64">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              History (latest first)
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No history yet</p>
            ) : (
              <div className="flex flex-col gap-1">
                {history.slice(0, 10).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      restoreHistory(i);
                      setShowHistory(false);
                    }}
                    className="text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <span className="font-mono text-zinc-400 dark:text-zinc-500 mr-2">
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

      {/* Presets */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => {
            setShowPresets(!showPresets);
            setShowHistory(false);
          }}
          className="topbar-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Presets
          {presets.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
              {presets.length}
            </span>
          )}
        </button>
        {showPresets && (
          <div className="dropdown-panel w-72">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              Saved Presets
            </p>
            {presets.length === 0 ? (
              <p className="text-xs text-zinc-400 italic mb-3">
                No saved presets
              </p>
            ) : (
              <div className="flex flex-col gap-1 mb-3">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        loadPreset(p.id);
                        setShowPresets(false);
                      }}
                      className="flex-1 text-left text-xs px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5 border-t border-zinc-100 dark:border-zinc-700 pt-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                placeholder="Preset name…"
                className="flex-1 text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-2.5 py-1.5 text-xs rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />

      {/* Export */}
      <button onClick={handleExport} className="topbar-btn flex-shrink-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>

      {/* Import */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowImport(!showImport)}
          className="topbar-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>
        {showImport && (
          <div className="dropdown-panel w-80 right-0">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
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
              className="w-full text-xs font-mono px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                From file…
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
                className="flex-1 text-xs py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors"
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

      <div className="ml-auto flex-shrink-0">
        <button
          onClick={onToggleDark}
          className="topbar-btn"
          title="Toggle dark mode"
        >
          {darkMode ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
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
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
