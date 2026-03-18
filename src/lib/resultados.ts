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

export function getAllResultados(): (Resultado & { titulo_noticia?: string })[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, n.titulo as titulo_noticia
    FROM resultados r
    LEFT JOIN noticias n ON r.noticia_id = n.id
    ORDER BY r.data_processamento DESC
  `).all() as (Resultado & { titulo_noticia?: string })[];
}

export function updateResultado(id: number, data: { entidade_principal?: string; entidades_secundarias?: string[]; script?: string }): void {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.entidade_principal !== undefined) {
    fields.push("entidade_principal = ?");
    values.push(data.entidade_principal);
  }
  if (data.entidades_secundarias !== undefined) {
    fields.push("entidades_secundarias = ?");
    values.push(JSON.stringify(data.entidades_secundarias));
  }
  if (data.script !== undefined) {
    fields.push("script = ?");
    values.push(data.script);
  }

  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE resultados SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteResultado(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM resultados WHERE id = ?").run(id);
}
