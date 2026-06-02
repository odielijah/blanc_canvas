"use client";
import { useMemo, useState } from "react";
import { useQueryStore } from "@/features/query-builder/store/queryStore";
import { generateQuery } from "@/features/query-builder/lib/queryEngine";
import { QueryFormat } from "@/shared/types/query";
import { CheckIcon, CopyIcon } from "./icons";

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
      <div className="panel-header flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="panel-title text-xs tracking-[0.7px] uppercase font-semibold">
          Live Preview
        </span>
        <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-[1fr_auto] sm:w-auto sm:flex sm:items-center">
          {/* Format tabs */}
          <div className="segmented-control grid min-w-0 grid-cols-3">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`
                  min-w-0 px-2 py-1.5 text-xs font-semibold transition-all sm:px-3
                  ${
                    format === opt.value
                      ? "segmented-option-active"
                      : "segmented-option"
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
            className="ghost-button flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all"
          >
            {copied ? (
              <>
                <CheckIcon />
                <span className="truncate">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon />
                <span className="truncate">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto">
        <pre className="query-code min-w-0 whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
          <code>{preview}</code>
        </pre>
      </div>
    </div>
  );
}
