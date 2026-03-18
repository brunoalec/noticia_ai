"use client";

import { useState, useCallback } from "react";
import FeedManager from "@/components/FeedManager";
import NoticiasList from "@/components/NoticiasList";
import PipelineControls from "@/components/PipelineControls";
import LogPanel, { LogEntry } from "@/components/LogPanel";
import ResultadosTable from "@/components/ResultadosTable";

export default function Home() {
  const [feedsOpen, setFeedsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [numEntidades, setNumEntidades] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [report, setReport] = useState<{ total: number; sucesso: number; erro: number; resultados: { noticiaId: number; titulo: string; success: boolean; error?: string }[] } | null>(null);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  }, []);

  const handleRefresh = async () => {
    addLog("info", "Buscando notícias dos feeds...");
    try {
      const res = await fetch("/api/noticias", { method: "POST" });
      const data = await res.json();
      addLog("success", `${data.inserted ?? 0} novas notícias encontradas`);
      setRefreshTrigger((t) => t + 1);
    } catch {
      addLog("error", "Erro ao buscar notícias");
    }
  };

  const handleExecute = async () => {
    if (selectedIds.length === 0) return;
    setIsRunning(true);
    setLogs([]);
    setReport(null);
    addLog("info", `Iniciando pipeline para ${selectedIds.length} notícia(s)...`);

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticiaIds: selectedIds, numEntidades }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "report") {
                setReport(parsed.data);
              } else if (parsed.type === "log") {
                addLog(parsed.level || "info", parsed.message);
              } else if (parsed.message) {
                // PipelineLog format from backend
                const msg = parsed.message as string;
                let level: LogEntry["type"] = "info";
                if (msg.includes("[FINAL] sucesso")) level = "success";
                else if (msg.includes("[FINAL] erro") || msg.includes("erro")) level = "error";
                else if (msg.includes("tentativa") && !msg.includes("tentativa 1")) level = "retry";
                addLog(level, msg);
              }
            } catch {
              addLog("info", line);
            }
          }
        }
      }

      addLog("success", "Pipeline finalizado");
      setRefreshTrigger((t) => t + 1);
      setSelectedIds([]);
    } catch {
      addLog("error", "Erro ao executar pipeline");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">NOTICIA_AI</h1>
          <p className="text-gray-400 text-sm">Geração de Scripts e Imagens a partir de Notícias RSS</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRunning}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
          <button
            onClick={() => setFeedsOpen(true)}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
            title="Gerenciar Feeds RSS"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <NoticiasList
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        refreshTrigger={refreshTrigger}
      />

      <PipelineControls
        selectedCount={selectedIds.length}
        isRunning={isRunning}
        numEntidades={numEntidades}
        onNumEntidadesChange={setNumEntidades}
        onExecute={handleExecute}
      />

      <LogPanel logs={logs} />

      {report && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Relatório Final</h2>
          <div className="flex gap-4 mb-3 text-sm">
            <span>Total: <span className="font-bold">{report.total}</span></span>
            <span className="text-green-400">Sucesso: <span className="font-bold">{report.sucesso}</span></span>
            <span className="text-red-400">Erros: <span className="font-bold">{report.erro}</span></span>
          </div>
          {report.resultados?.filter((r) => !r.success).length > 0 && (
            <ul className="text-sm text-red-300 space-y-1">
              {report.resultados.filter((r) => !r.success).map((r, i) => (
                <li key={i}>• {r.titulo} → {r.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <FeedManager
        open={feedsOpen}
        onClose={() => setFeedsOpen(false)}
        onFeedsChange={() => setRefreshTrigger((t) => t + 1)}
      />

      <ResultadosTable refreshTrigger={refreshTrigger} />
    </main>
  );
}
