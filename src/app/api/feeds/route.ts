import { NextRequest, NextResponse } from "next/server";
import { getAllFeeds, insertFeed, deleteFeed } from "@/lib/feeds";

export async function GET() {
  try {
    const feeds = getAllFeeds();
    return NextResponse.json(feeds);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nome, url } = await req.json();
    if (!nome || !url) {
      return NextResponse.json({ error: "nome e url são obrigatórios" }, { status: 400 });
    }
    const feed = insertFeed(nome, url);
    return NextResponse.json(feed, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Feed com esta URL já existe" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }
    deleteFeed(parseInt(id, 10));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
