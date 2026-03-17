import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "noticia_ai.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS noticias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER REFERENCES feeds(id) ON DELETE SET NULL,
      titulo TEXT,
      descricao TEXT,
      link TEXT UNIQUE,
      fonte TEXT,
      data_publicacao TEXT,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','processando','processado','erro')),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resultados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      noticia_id INTEGER REFERENCES noticias(id) ON DELETE CASCADE,
      entidade_principal TEXT,
      entidades_secundarias TEXT,
      script TEXT,
      imagens TEXT,
      erro TEXT,
      data_processamento DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
