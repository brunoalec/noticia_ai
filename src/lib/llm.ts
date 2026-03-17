import OpenAI from "openai";

export interface LLMResponse {
  main_entity: string;
  secondary_entities: string[];
  script: string;
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.LLM_API_KEY || "",
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  });
}

export async function callLLM(
  titulo: string,
  descricao: string,
  promptTemplate: string,
  numEntidades: number
): Promise<LLMResponse> {
  const client = getClient();
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || "15000", 10);

  const userMessage = promptTemplate
    .replace("{{titulo}}", titulo)
    .replace("{{descricao}}", descricao)
    .replace("{{num_entidades}}", String(numEntidades));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente que extrai entidades e gera scripts a partir de notícias. Responda APENAS com JSON válido.",
          },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal as never }
    );

    clearTimeout(timer);
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as LLMResponse;

    if (!parsed.main_entity || !parsed.script) {
      throw new Error("Resposta LLM incompleta: faltam campos obrigatórios");
    }

    return parsed;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function callLLMWithRetry(
  titulo: string,
  descricao: string,
  promptTemplate: string,
  numEntidades: number,
  onLog?: (msg: string) => void
): Promise<LLMResponse> {
  const maxRetries = parseInt(process.env.LLM_RETRY_ATTEMPTS || "2", 10);

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      onLog?.(`[LLM] tentativa ${attempt}...`);
      const start = Date.now();
      const result = await callLLM(titulo, descricao, promptTemplate, numEntidades);
      onLog?.(`[LLM] sucesso (${Date.now() - start}ms)`);
      return result;
    } catch (err) {
      const isRetryable =
        err instanceof Error &&
        (err.name === "AbortError" ||
          err.message.includes("ECONNREFUSED") ||
          err.message.includes("ETIMEDOUT") ||
          err.message.includes("fetch failed"));

      if (!isRetryable || attempt > maxRetries) {
        onLog?.(`[LLM] falha definitiva: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }

      onLog?.(`[LLM] retry ${attempt}/${maxRetries} - ${err instanceof Error ? err.message : "erro"}`);
    }
  }

  throw new Error("LLM: todas as tentativas falharam");
}
