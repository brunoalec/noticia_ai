import { getDb } from "./db";

export interface Resultado {
  id: number;
  noticia_id: number;
  entidade_principal: string;
  entidades_secundarias: string;
  script: string;
  imagens: string;
  erro: string | null;
  data_processamento: string;
}

export interface ResultadoInput {
  noticia_id: number;
  entidade_principal: string;
  entidades_secundarias: string[];
  script: string;
  imagens: Record<string, string[]>;
  erro?: string;
}

export function insertResultado(data: ResultadoInput): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO resultados (noticia_id, entidade_principal, entidades_secundarias, script, imagens, erro)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.noticia_id,
    data.entidade_principal,
    JSON.stringify(data.entidades_secundarias),
    data.script,
    JSON.stringify(data.imagens),
    data.erro || null
  );
  return result.lastInsertRowid as number;
}

export function getResultadoByNoticiaId(noticiaId: number): Resultado | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM resultados WHERE noticia_id = ?").get(noticiaId) as Resultado | undefined;
}

export function getAllResultados(): Resultado[] {
  const db = getDb();
  return db.prepare("SELECT * FROM resultados ORDER BY data_processamento DESC").all() as Resultado[];
}
