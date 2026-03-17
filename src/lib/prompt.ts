import fs from "fs";
import path from "path";

const PROMPT_PATH = path.join(process.cwd(), "prompt.txt");

const DEFAULT_PROMPT = `Analise a seguinte notícia e extraia as informações solicitadas.

Título: {{titulo}}
Descrição: {{descricao}}

Extraia:
1. A entidade principal (pessoa, organização ou tema central)
2. {{num_entidades}} entidades secundárias relevantes
3. Um script narrado em português para um vídeo curto sobre esta notícia

Responda APENAS com JSON no formato:
{
  "main_entity": "nome da entidade principal",
  "secondary_entities": ["entidade1", "entidade2"],
  "script": "texto do script narrado"
}`;

export function readPrompt(): string {
  try {
    if (fs.existsSync(PROMPT_PATH)) {
      return fs.readFileSync(PROMPT_PATH, "utf-8");
    }
  } catch {
    // fallback
  }
  return DEFAULT_PROMPT;
}

export function writePrompt(content: string): void {
  fs.writeFileSync(PROMPT_PATH, content, "utf-8");
}

export function getDefaultPrompt(): string {
  return DEFAULT_PROMPT;
}
