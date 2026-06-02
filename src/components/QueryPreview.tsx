"use client";
import { useMemo, useState } from "react";
import { useQueryStore } from "@/store/queryStore";
import { generateQuery } from "@/lib/queryEngine";
import { QueryFormat } from "@/types/query";

const FORMAT_OPTIONS: { value: QueryFormat; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "mongo", label: "MongoDB" },
  { value: "graphql", label: "GraphQL" },
];

export default function QueryPreview() {
  const { root, format, schemaId, setFormat } = useQueryStore();
  const [copied, setCopied] = useState(false);

  const preview = useMemo(
    () => generateQuery(root, format, schemaId),
    [root, format, schemaId],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Live Preview
        </span>
        <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-[1fr_auto] sm:w-auto sm:flex sm:items-center">
          {/* Format tabs */}
          <div className="grid min-w-0 grid-cols-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`
                  min-w-0 px-2 py-1.5 text-xs font-semibold transition-all sm:px-3
                  ${
                    format === opt.value
                      ? "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }
                `}
              >
                <span className="block truncate">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {copied ? (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="truncate">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span className="truncate">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <pre className="min-w-0 p-4 text-xs font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
          <code>{preview}</code>
        </pre>
      </div>
    </div>
  );
}
