import { NextRequest, NextResponse } from "next/server";
import { readPrompt, writePrompt, getDefaultPrompt } from "@/lib/prompt";

export async function GET() {
  try {
    const content = readPrompt();
    const defaultPrompt = getDefaultPrompt();
    return NextResponse.json({ content, defaultPrompt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (typeof content !== "string") {
      return NextResponse.json({ error: "content é obrigatório" }, { status: 400 });
    }
    writePrompt(content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
