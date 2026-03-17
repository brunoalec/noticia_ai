import { NextResponse } from "next/server";
import { getAllFeeds } from "@/lib/feeds";
import { getAllNoticias, insertNoticia } from "@/lib/noticias";
import { fetchAllFeeds } from "@/lib/rss";

export async function GET() {
  try {
    const noticias = getAllNoticias();
    return NextResponse.json(noticias);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const feeds = getAllFeeds();
    if (feeds.length === 0) {
      return NextResponse.json({ error: "Nenhum feed cadastrado" }, { status: 400 });
    }

    const items = await fetchAllFeeds(feeds);
    let inserted = 0;

    for (const item of items) {
      if (item.link) {
        const id = insertNoticia(item);
        if (id !== null) inserted++;
      }
    }

    return NextResponse.json({
      total_encontradas: items.length,
      novas_inseridas: inserted,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
