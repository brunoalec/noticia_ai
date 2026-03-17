import { getDb } from "./db";

export interface Feed {
  id: number;
  nome: string;
  url: string;
  criado_em: string;
}

export function insertFeed(nome: string, url: string): Feed {
  const db = getDb();
  const stmt = db.prepare("INSERT INTO feeds (nome, url) VALUES (?, ?)");
  const result = stmt.run(nome, url);
  return { id: result.lastInsertRowid as number, nome, url, criado_em: new Date().toISOString() };
}

export function getAllFeeds(): Feed[] {
  const db = getDb();
  return db.prepare("SELECT * FROM feeds ORDER BY criado_em DESC").all() as Feed[];
}

export function deleteFeed(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM feeds WHERE id = ?").run(id);
}
