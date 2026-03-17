"use client";

import { useState, useEffect } from "react";

interface PromptModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PromptModal({ open, onClose }: PromptModalProps) {
  const [content, setContent] = useState("");
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/prompt")
        .then((r) => r.json())
        .then((data) => {
          setContent(data.content || "");
          setDefaultPrompt(data.defaultPrompt || "");
        });
    }
  }, [open]);

  const save = async () => {
    setSaving(true);
    await fetch("/api/prompt", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold">Editar Prompt</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 bg-gray-800 border border-gray-700 rounded p-3 text-sm font-mono resize-y"
            placeholder="Template do prompt..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Variáveis: {"{{titulo}}"}, {"{{descricao}}"}, {"{{num_entidades}}"}
          </p>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-700">
          <button
            onClick={() => setContent(defaultPrompt)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
          >
            Restaurar Padrão
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-medium"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
