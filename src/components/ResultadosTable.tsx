"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Resultado {
  id: number;
  noticia_id: number;
  titulo_noticia?: string;
  entidade_principal: string;
  entidades_secundarias: string;
  script: string;
  imagens: string;
  erro: string | null;
  data_processamento: string;
}

interface ResultadosTableProps {
  refreshTrigger?: number;
}

export default function ResultadosTable({ refreshTrigger }: ResultadosTableProps) {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ entidade_principal: "", script: "" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchResultados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resultados");
      setResultados(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResultados(); }, [fetchResultados, refreshTrigger]);

  const startEdit = (r: Resultado) => {
    setEditingId(r.id);
    setEditData({ entidade_principal: r.entidade_principal, script: r.script });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/resultados", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editData }),
    });
    setEditingId(null);
    fetchResultados();
  };

  const deleteResultado = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este resultado?")) return;
    await fetch(`/api/resultados?id=${id}`, { method: "DELETE" });
    fetchResultados();
  };

  const parseJson = (str: string) => {
    try { return JSON.parse(str); } catch { return str; }
  };

  if (loading && resultados.length === 0) {
    return <div className="bg-gray-900 rounded-lg p-4 mt-6 text-gray-500 text-sm">Carregando resultados...</div>;
  }

  if (resultados.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Resultados ({resultados.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 pr-3">Notícia</th>
              <th className="pb-2 pr-3">Entidade Principal</th>
              <th className="pb-2 pr-3">Secundárias</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Data</th>
              <th className="pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <React.Fragment key={r.id}>
              <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-2 pr-3 max-w-[200px] truncate" title={r.titulo_noticia}>
                  {r.titulo_noticia || `#${r.noticia_id}`}
                </td>
                <td className="py-2 pr-3">
                  {editingId === r.id ? (
                    <input
                      value={editData.entidade_principal}
                      onChange={(e) => setEditData({ ...editData, entidade_principal: e.target.value })}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm w-full"
                    />
                  ) : (
                    r.entidade_principal || <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-gray-400 text-xs max-w-[150px] truncate">
                  {(() => {
                    const parsed = parseJson(r.entidades_secundarias);
                    return Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
                  })()}
                </td>
                <td className="py-2 pr-3">
                  {r.erro ? (
                    <span className="text-red-400 text-xs">Erro</span>
                  ) : (
                    <span className="text-green-400 text-xs">OK</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-gray-400 text-xs whitespace-nowrap">
                  {r.data_processamento ? new Date(r.data_processamento).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    {editingId === r.id ? (
                      <>
                        <button onClick={saveEdit} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 bg-gray-800 rounded">Salvar</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 bg-gray-800 rounded">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-gray-800 rounded">
                          {expandedId === r.id ? "Fechar" : "Ver"}
                        </button>
                        <button onClick={() => startEdit(r)} className="text-yellow-400 hover:text-yellow-300 text-xs px-2 py-1 bg-gray-800 rounded">Editar</button>
                        <button onClick={() => deleteResultado(r.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-800 rounded">Excluir</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {expandedId === r.id && (
                <tr className="bg-gray-800/30">
                  <td colSpan={6} className="p-3">
                    {editingId === r.id ? (
                      <textarea
                        value={editData.script}
                        onChange={(e) => setEditData({ ...editData, script: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm font-mono min-h-[120px]"
                      />
                    ) : (
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Script:</p>
                        <pre className="whitespace-pre-wrap text-sm text-gray-200 bg-gray-950 rounded p-3 max-h-48 overflow-y-auto">{r.script || "Sem script"}</pre>
                        {r.erro && (
                          <div className="mt-2">
                            <p className="text-red-400 text-xs mb-1">Erro:</p>
                            <pre className="text-red-300 text-xs bg-gray-950 rounded p-2">{r.erro}</pre>
                          </div>
                        )}
                        {r.imagens && (
                          <div className="mt-2">
                            <p className="text-gray-400 text-xs mb-1">Imagens:</p>
                            <pre className="text-gray-300 text-xs bg-gray-950 rounded p-2 max-h-24 overflow-y-auto">{JSON.stringify(parseJson(r.imagens), null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
