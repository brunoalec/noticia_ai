"use client";

import { useEffect, useRef } from "react";

export interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error" | "retry" | "warn";
  message: string;
}

interface LogPanelProps {
  logs: LogEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  info: "text-gray-300",
  success: "text-green-400",
  error: "text-red-400",
  retry: "text-yellow-400",
  warn: "text-orange-400",
};

export default function LogPanel({ logs }: LogPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Logs</h2>
      <div className="bg-gray-950 rounded p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-0.5">
        {logs.map((log, i) => (
          <div key={i} className={TYPE_COLORS[log.type] || "text-gray-300"}>
            <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
