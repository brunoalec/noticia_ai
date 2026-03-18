import { NextRequest, NextResponse } from "next/server";
import { getAllResultados, updateResultado, deleteResultado } from "@/lib/resultados";

export async function GET() {
  const resultados = getAllResultados();
  return NextResponse.json(resultados);
}

export async function PUT(req: NextRequest) {
  const { id, entidade_principal, entidades_secundarias, script } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  updateResultado(id, { entidade_principal, entidades_secundarias, script });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  deleteResultado(parseInt(id));
  return NextResponse.json({ ok: true });
}
