import { NextRequest } from "next/server";
import { getNoticiasByIds } from "@/lib/noticias";
import { executarPipeline, type PipelineLog } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const { noticiaIds, numEntidades } = await req.json();

    if (!noticiaIds?.length) {
      return new Response(JSON.stringify({ error: "Selecione ao menos uma notícia" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const noticias = getNoticiasByIds(noticiaIds);
    if (noticias.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma notícia encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const onLog = (log: PipelineLog) => {
          const line = JSON.stringify(log) + "\n";
          controller.enqueue(encoder.encode(line));
        };

        try {
          const report = await executarPipeline(noticias, {
            numEntidades: numEntidades || 2,
            onLog,
          });

          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "report", data: report }) + "\n")
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "error", message: String(err) }) + "\n"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
