"use client";

import { useState } from "react";
import PromptModal from "./PromptModal";

interface PipelineControlsProps {
  selectedCount: number;
  isRunning: boolean;
  numEntidades: number;
  onNumEntidadesChange: (n: number) => void;
  onExecute: () => void;
}

export default function PipelineControls({
  selectedCount,
  isRunning,
  numEntidades,
  onNumEntidadesChange,
  onExecute,
}: PipelineControlsProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Pipeline</h2>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          Entidades secundárias:
          <input
            type="number"
            min={0}
            max={10}
            value={numEntidades}
            onChange={(e) => onNumEntidadesChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-16 text-center"
          />
        </label>
        <button
          onClick={onExecute}
          disabled={isRunning || selectedCount === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium"
        >
          {isRunning ? "Executando..." : `Executar Pipeline (${selectedCount})`}
        </button>
        <button
          onClick={() => setPromptOpen(true)}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
        >
          Editar Prompt
        </button>
      </div>
      <PromptModal open={promptOpen} onClose={() => setPromptOpen(false)} />
    </div>
  );
}
