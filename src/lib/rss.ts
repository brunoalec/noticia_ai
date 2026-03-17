import Parser from "rss-parser";
import type { Feed } from "./feeds";
import type { NoticiaInput } from "./noticias";

const parser = new Parser();

export async function fetchFeed(feed: Feed): Promise<NoticiaInput[]> {
  const parsed = await parser.parseURL(feed.url);
  return (parsed.items || []).map((item) => ({
    feed_id: feed.id,
    titulo: item.title || "Sem título",
    descricao: item.contentSnippet || item.content || "",
    link: item.link || "",
    fonte: parsed.title || feed.nome,
    data_publicacao: item.pubDate || new Date().toISOString(),
  }));
}

export async function fetchAllFeeds(feeds: Feed[]): Promise<NoticiaInput[]> {
  const results: NoticiaInput[] = [];
  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed);
      results.push(...items);
    } catch (err) {
      console.error(`Erro ao buscar feed ${feed.nome}:`, err);
    }
  }
  return results;
}
