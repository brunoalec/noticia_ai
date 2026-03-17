import { getDb } from "./db";

export interface Noticia {
  id: number;
  feed_id: number | null;
  titulo: string;
  descricao: string;
  link: string;
  fonte: string;
  data_publicacao: string;
  status: "pendente" | "processando" | "processado" | "erro";
  criado_em: string;
}

export interface NoticiaInput {
  feed_id: number;
  titulo: string;
  descricao: string;
  link: string;
  fonte: string;
  data_publicacao: string;
}

export function insertNoticia(data: NoticiaInput): number | null {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO noticias (feed_id, titulo, descricao, link, fonte, data_publicacao)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data.feed_id, data.titulo, data.descricao, data.link, data.fonte, data.data_publicacao);
  return result.changes > 0 ? (result.lastInsertRowid as number) : null;
}

export function getAllNoticias(): Noticia[] {
  const db = getDb();
  return db.prepare("SELECT * FROM noticias ORDER BY criado_em DESC").all() as Noticia[];
}

export function getNoticiasByStatus(status: string): Noticia[] {
  const db = getDb();
  return db.prepare("SELECT * FROM noticias WHERE status = ? ORDER BY criado_em DESC").all(status) as Noticia[];
}

export function getNoticiasByIds(ids: number[]): Noticia[] {
  const db = getDb();
  const placeholders = ids.map(() => "?").join(",");
  return db.prepare(`SELECT * FROM noticias WHERE id IN (${placeholders})`).all(...ids) as Noticia[];
}

export function updateNoticiaStatus(id: number, status: Noticia["status"]): void {
  const db = getDb();
  db.prepare("UPDATE noticias SET status = ? WHERE id = ?").run(status, id);
}
