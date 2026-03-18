"use client";

import { useState, useEffect, useCallback } from "react";

interface Noticia {
  id: number;
  titulo: string;
  descricao: string;
  link: string;
  fonte: string;
  data_publicacao: string;
  status: string;
}

interface NoticiasListProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  refreshTrigger?: number;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "text-yellow-400",
  processando: "text-blue-400",
  processado: "text-green-400",
  erro: "text-red-400",
};

export default function NoticiasList({ selectedIds, onSelectionChange, refreshTrigger }: NoticiasListProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchNoticias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/noticias");
      const data = await res.json();
      setNoticias(data);
    } catch {
      console.error("Erro ao buscar notícias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNoticias();
  }, [fetchNoticias, refreshTrigger]);

  const atualizarNoticias = async () => {
    setFetching(true);
    try {
      await fetch("/api/noticias", { method: "POST" });
      await fetchNoticias();
    } catch {
      console.error("Erro ao atualizar");
    } finally {
      setFetching(false);
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === noticias.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(noticias.map((n) => n.id));
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Notícias ({noticias.length})</h2>
        <button
          onClick={atualizarNoticias}
          disabled={fetching}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded text-sm"
        >
          {fetching ? "Buscando..." : "Atualizar"}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : noticias.length === 0 ? (
        <p className="text-gray-500 text-sm">Nenhuma notícia. Adicione feeds e clique em Atualizar.</p>
      ) : (
        <>
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === noticias.length && noticias.length > 0}
                onChange={toggleAll}
                className="rounded"
              />
              Selecionar todas ({selectedIds.length} selecionadas)
            </label>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {noticias.map((n) => (
              <label
                key={n.id}
                className="flex items-start gap-2 bg-gray-800 rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-750"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="mt-1 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{n.titulo}</div>
                  <div className="text-gray-400 text-xs flex gap-3 mt-0.5">
                    <span>{n.fonte}</span>
                    <span>{n.data_publicacao ? new Date(n.data_publicacao).toLocaleDateString("pt-BR") : ""}</span>
                    <span className={STATUS_COLORS[n.status] || ""}>{n.status}</span>
                  </div>
                </div>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-gray-700 rounded whitespace-nowrap ml-2 shrink-0"
                >
                  Abrir ↗
                </a>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
