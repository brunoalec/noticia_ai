import pLimit from "p-limit";
import path from "path";
import { callLLMWithRetry } from "./llm";
import { downloadImagesForEntity } from "./brave";
import { readPrompt } from "./prompt";
import { updateNoticiaStatus, type Noticia } from "./noticias";
import { insertResultado } from "./resultados";

export interface PipelineLog {
  noticiaId: number;
  timestamp: number;
  message: string;
}

export interface PipelineResult {
  noticiaId: number;
  titulo: string;
  success: boolean;
  error?: string;
}

export interface PipelineReport {
  total: number;
  sucesso: number;
  erro: number;
  resultados: PipelineResult[];
}

export interface PipelineConfig {
  numEntidades: number;
  onLog?: (log: PipelineLog) => void;
}

async function processarNoticia(
  noticia: Noticia,
  config: PipelineConfig
): Promise<PipelineResult> {
  const { numEntidades, onLog } = config;
  const downloadPath = process.env.DOWNLOAD_PATH || "./downloads";
  const log = (msg: string) =>
    onLog?.({ noticiaId: noticia.id, timestamp: Date.now(), message: msg });

  log(`[ID: ${noticia.id}] Iniciando processamento`);
  updateNoticiaStatus(noticia.id, "processando");

  try {
    const promptTemplate = readPrompt();
    const llmResult = await callLLMWithRetry(
      noticia.titulo,
      noticia.descricao,
      promptTemplate,
      numEntidades,
      (msg) => log(msg)
    );

    const allEntities = [llmResult.main_entity, ...llmResult.secondary_entities];
    const imagensMap: Record<string, string[]> = {};

    for (const entity of allEntities) {
      log(`[IMG] entidade: ${entity}`);
      const start = Date.now();
      const saved = await downloadImagesForEntity(
        entity,
        path.resolve(downloadPath),
        (msg) => log(msg)
      );
      imagensMap[entity] = saved;
      log(`[DOWNLOAD] ${saved.length} concluídos (${Date.now() - start}ms)`);
    }

    insertResultado({
      noticia_id: noticia.id,
      entidade_principal: llmResult.main_entity,
      entidades_secundarias: llmResult.secondary_entities,
      script: llmResult.script,
      imagens: imagensMap,
    });

    updateNoticiaStatus(noticia.id, "processado");
    log(`[FINAL] sucesso total`);

    return { noticiaId: noticia.id, titulo: noticia.titulo, success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    insertResultado({
      noticia_id: noticia.id,
      entidade_principal: "",
      entidades_secundarias: [],
      script: "",
      imagens: {},
      erro: errorMsg,
    });

    updateNoticiaStatus(noticia.id, "erro");
    log(`[FINAL] erro: ${errorMsg}`);

    return { noticiaId: noticia.id, titulo: noticia.titulo, success: false, error: errorMsg };
  }
}

export async function executarPipeline(
  noticias: Noticia[],
  config: PipelineConfig
): Promise<PipelineReport> {
  const concurrency = parseInt(process.env.MAX_CONCURRENCY || "5", 10);
  const limit = pLimit(concurrency);

  const results = await Promise.all(
    noticias.map((n) => limit(() => processarNoticia(n, config)))
  );

  const report: PipelineReport = {
    total: results.length,
    sucesso: results.filter((r) => r.success).length,
    erro: results.filter((r) => !r.success).length,
    resultados: results,
  };

  config.onLog?.({
    noticiaId: 0,
    timestamp: Date.now(),
    message: `[RELATÓRIO] Total: ${report.total} | Sucesso: ${report.sucesso} | Erro: ${report.erro}`,
  });

  return report;
}
