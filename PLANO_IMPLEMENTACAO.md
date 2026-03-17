# Plano de Implementação - NOTICIA_AI

## Fase 1: Setup do Projeto e Infraestrutura Base

### Task 1.1 - Inicializar projeto Next.js
- `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Confirmar que roda com `npm run dev`

### Task 1.2 - Instalar dependências core
- `better-sqlite3` + `@types/better-sqlite3` (SQLite)
- `rss-parser` (parse RSS)
- `openai` (LLM compatível)
- `p-limit` (controle de concorrência)

### Task 1.3 - Criar .env.local com variáveis
- BRAVE_API_KEY, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
- DOWNLOAD_PATH, REQUEST_TIMEOUT_MS, MAX_CONCURRENCY, LLM_RETRY_ATTEMPTS
- Criar `.env.example` como referência

### Task 1.4 - Criar estrutura de pastas
```
src/
  lib/
    db.ts
    llm.ts
    brave.ts
    rss.ts
    pipeline.ts
    sanitize.ts
  app/
    api/
      feeds/route.ts
      noticias/route.ts
      pipeline/route.ts
      prompt/route.ts
    page.tsx
    layout.tsx
```

---

## Fase 2: Banco de Dados (SQLite)

### Task 2.1 - Criar `src/lib/db.ts` com conexão SQLite
- Singleton de conexão
- WAL mode habilitado
- Função `getDb()` exportada

### Task 2.2 - Criar schema: tabela `feeds`
- id INTEGER PRIMARY KEY AUTOINCREMENT
- nome TEXT NOT NULL
- url TEXT NOT NULL UNIQUE
- criado_em DATETIME DEFAULT CURRENT_TIMESTAMP

### Task 2.3 - Criar schema: tabela `noticias`
- id INTEGER PRIMARY KEY AUTOINCREMENT
- feed_id INTEGER REFERENCES feeds(id)
- titulo TEXT
- descricao TEXT
- link TEXT UNIQUE
- fonte TEXT
- data_publicacao TEXT
- status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','processando','processado','erro'))
- criado_em DATETIME DEFAULT CURRENT_TIMESTAMP

### Task 2.4 - Criar schema: tabela `resultados`
- id INTEGER PRIMARY KEY AUTOINCREMENT
- noticia_id INTEGER REFERENCES noticias(id)
- entidade_principal TEXT
- entidades_secundarias TEXT (JSON)
- script TEXT
- imagens TEXT (JSON) ← campo sugerido
- erro TEXT
- data_processamento DATETIME DEFAULT CURRENT_TIMESTAMP

### Task 2.5 - Criar funções CRUD para `feeds`
- insertFeed(nome, url)
- getAllFeeds()
- deleteFeed(id)

### Task 2.6 - Criar funções CRUD para `noticias`
- insertNoticia(dados) com ON CONFLICT(link) DO NOTHING
- getNoticiasByStatus(status)
- getAllNoticias()
- updateNoticiaStatus(id, status)

### Task 2.7 - Criar funções CRUD para `resultados`
- insertResultado(dados)
- getResultadoByNoticiaId(noticiaId)
- getAllResultados()

---

## Fase 3: Módulos de Serviço (lib/)

### Task 3.1 - Criar `src/lib/sanitize.ts`
- Função `sanitizeFilename(name: string): string`
  - lowercase
  - remover caracteres inválidos
  - substituir espaços por `_`
  - limitar a 60 chars
- Função `generateImageFilename(entity: string, index: number): string`
  - Retorna `entity_sanitizada_0X.jpg`

### Task 3.2 - Criar `src/lib/rss.ts`
- Função `fetchFeed(url: string): Promise<NewsItem[]>`
  - Usa rss-parser
  - Retorna array com { titulo, descricao, link, fonte, data_publicacao }
- Função `fetchAllFeeds(feeds: Feed[]): Promise<NewsItem[]>`
  - Itera sobre todos os feeds
  - Consolida resultados

### Task 3.3 - Criar `src/lib/llm.ts`
- Função `callLLM(titulo, descricao, prompt, numEntidades): Promise<LLMResponse>`
  - Usa SDK openai com base_url configurável
  - Timeout via AbortController (REQUEST_TIMEOUT_MS)
  - Parse JSON da resposta
  - Tipagem: { main_entity, secondary_entities, script }

### Task 3.4 - Adicionar retry ao LLM
- Função `callLLMWithRetry(...)` wrapper
  - Retry até LLM_RETRY_ATTEMPTS
  - Só em falha de rede/timeout (não em erro de parsing)
  - Log de cada tentativa

### Task 3.5 - Criar `src/lib/brave.ts`
- Função `searchImages(query: string): Promise<ImageResult[]>`
  - Chamada à Brave Image Search API
  - Retorna lista com { url, width, height, title }
- Função `downloadImage(url: string, destPath: string): Promise<boolean>`
  - Fetch da imagem
  - Validação de content-type
  - Salva no disco
  - Retorna true/false

### Task 3.6 - Criar lógica de seleção e download de imagens
- Função `downloadImagesForEntity(entity, downloadPath): Promise<string[]>`
  - Busca imagens via Brave
  - Filtra por resolução mínima (ex: 200x200)
  - Baixa até 3 válidas
  - Usa sanitizeFilename para nomes
  - Incrementa índice se arquivo já existe
  - Retorna array de caminhos salvos

### Task 3.7 - Criar `src/lib/prompt.ts`
- Função `readPrompt(): string`
  - Lê `prompt.txt` da raiz
  - Fallback para prompt padrão se não existir
- Função `writePrompt(content: string): void`
  - Escreve em `prompt.txt`
- Criar `prompt.txt` com template padrão

---

## Fase 4: Pipeline de Processamento

### Task 4.1 - Criar `src/lib/pipeline.ts` - estrutura base
- Tipo `PipelineLog` para logs estruturados
- Tipo `PipelineResult` para resultado por notícia
- Tipo `PipelineReport` para relatório final

### Task 4.2 - Implementar `processarNoticia(noticia, config)`
- Atualiza status para 'processando'
- Chama LLM com retry
- Para cada entidade: busca e baixa imagens
- Salva resultado no banco
- Atualiza status para 'processado' ou 'erro'
- Retorna logs detalhados com timing

### Task 4.3 - Implementar `executarPipeline(noticiaIds, config)`
- Usa p-limit para concorrência (MAX_CONCURRENCY)
- Processa todas as notícias selecionadas
- Coleta logs e resultados
- Gera relatório final (total, sucesso, erro, detalhes)
- Nunca aborta em falha parcial

---

## Fase 5: API Routes

### Task 5.1 - Criar `api/feeds/route.ts`
- GET: retorna todos os feeds
- POST: cria novo feed (nome, url)
- DELETE: remove feed por id (via searchParams)

### Task 5.2 - Criar `api/noticias/route.ts`
- GET: retorna todas as notícias (com filtro opcional por status)
- POST: trigger fetch de todos os feeds + deduplicação + insert

### Task 5.3 - Criar `api/pipeline/route.ts`
- POST: recebe { noticiaIds, numEntidades }
  - Lê prompt
  - Executa pipeline
  - Retorna relatório final
  - (Versão inicial: resposta síncrona, sem streaming)

### Task 5.4 - Criar `api/prompt/route.ts`
- GET: retorna conteúdo do prompt atual
- PUT: atualiza prompt.txt com novo conteúdo

---

## Fase 6: Frontend - Layout e Componentes Base

### Task 6.1 - Criar layout base (`layout.tsx`)
- Título "NOTICIA_AI"
- Container centralizado
- Estilo limpo com Tailwind

### Task 6.2 - Criar componente `FeedManager`
- Input para nome + URL
- Botão "Adicionar Feed"
- Lista de feeds com botão remover
- Chamadas à API /feeds

### Task 6.3 - Criar componente `NoticiasList`
- Tabela/lista de notícias
- Checkbox para seleção múltipla
- Checkbox "selecionar todos"
- Exibe: título, fonte, data, status
- Botão "Atualizar Notícias" (chama POST /noticias)

---

## Fase 7: Frontend - Pipeline e Interação

### Task 7.1 - Criar componente `PipelineControls`
- Input numérico: quantidade de entidades secundárias
- Botão "Executar Pipeline" (disabled se nenhuma selecionada)
- Botão "Editar Prompt" (abre modal)

### Task 7.2 - Criar componente `PromptModal`
- Modal com textarea
- Carrega prompt atual via GET /prompt
- Salva via PUT /prompt
- Botões: Salvar, Cancelar, Restaurar Padrão

### Task 7.3 - Criar componente `LogPanel`
- Área de logs em tempo real
- Auto-scroll
- Formatação por tipo: info, sucesso, erro, retry
- Cores diferenciadas por status

### Task 7.4 - Criar componente `ReportPanel`
- Exibe relatório final após pipeline
- Total, sucesso, erros
- Lista de erros detalhados
- Colapsável

---

## Fase 8: Integração da Página Principal

### Task 8.1 - Montar `page.tsx` integrando todos os componentes
- State global da página:
  - feeds, noticias, selectedIds, logs, report
  - numEntidades, isRunning, promptModalOpen
- Conectar componentes com handlers
- Fluxo completo funcional

### Task 8.2 - Implementar logs em tempo real no pipeline
- Converter API pipeline para streaming (ReadableStream)
- Frontend consome stream e atualiza LogPanel incrementalmente
- Cada log é uma linha JSON no stream

---

## Fase 9: Polish e Robustez

### Task 9.1 - Tratamento de erros no frontend
- Toast/notificação para erros de API
- Loading states em todos os botões
- Disable de controles durante execução

### Task 9.2 - Validações
- Validar URL de feed antes de salvar
- Validar que pelo menos 1 notícia está selecionada
- Validar numEntidades >= 0

### Task 9.3 - Criar .gitignore adequado
- node_modules, .next, .env.local, *.db, downloads/

### Task 9.4 - Atualizar README.md
- Instruções de setup
- Variáveis de ambiente necessárias
- Como rodar o projeto

---

## Resumo de Dependências entre Tasks

```
1.1 → 1.2 → 1.3 → 1.4
                      ↓
              2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7
                                                      ↓
                              3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7
                                                                      ↓
                                                      4.1 → 4.2 → 4.3
                                                                    ↓
                                              5.1 → 5.2 → 5.3 → 5.4
                                                                    ↓
                                              6.1 → 6.2 → 6.3
                                                              ↓
                                              7.1 → 7.2 → 7.3 → 7.4
                                                                    ↓
                                                      8.1 → 8.2
                                                              ↓
                                              9.1 → 9.2 → 9.3 → 9.4
```

Cada task é pequena o suficiente para ser implementada sem estourar limites e testável isoladamente.
