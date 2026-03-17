"use client";

import { useState, useEffect } from "react";

interface Feed {
  id: number;
  nome: string;
  url: string;
}

interface FeedManagerProps {
  open: boolean;
  onClose: () => void;
  onFeedsChange?: () => void;
}

export default function FeedManager({ open, onClose, onFeedsChange }: FeedManagerProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchFeeds = async () => {
    const res = await fetch("/api/feeds");
    const data = await res.json();
    setFeeds(data);
  };

  useEffect(() => {
    if (open) fetchFeeds();
  }, [open]);

  const addFeed = async () => {
    if (!nome.trim() || !url.trim()) {
      setError("Nome e URL são obrigatórios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, url }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao adicionar feed");
        return;
      }
      setNome("");
      setUrl("");
      await fetchFeeds();
      onFeedsChange?.();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const removeFeed = async (id: number) => {
    await fetch(`/api/feeds?id=${id}`, { method: "DELETE" });
    await fetchFeeds();
    onFeedsChange?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold text-lg">Gerenciar Feeds RSS</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nome do feed"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm flex-1"
            />
            <input
              type="url"
              placeholder="URL do feed RSS"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm flex-[2]"
            />
            <button
              onClick={addFeed}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
            >
              {loading ? "..." : "Adicionar"}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          {feeds.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum feed cadastrado. Adicione um acima.</p>
          ) : (
            <ul className="space-y-1">
              {feeds.map((feed) => (
                <li key={feed.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{feed.nome}</span>
                    <span className="text-gray-400 ml-2 text-xs break-all">{feed.url}</span>
                  </span>
                  <button
                    onClick={() => removeFeed(feed.id)}
                    className="text-red-400 hover:text-red-300 text-xs ml-3 whitespace-nowrap"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-gray-700">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
