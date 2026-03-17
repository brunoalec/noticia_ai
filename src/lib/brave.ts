import fs from "fs";
import path from "path";
import { sanitizeFilename } from "./sanitize";

export interface ImageResult {
  url: string;
  width: number;
  height: number;
  title: string;
}

export async function searchImages(query: string): Promise<ImageResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY não configurada");

  const url = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=20`;

  const res = await fetch(url, {
    headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Brave API erro: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results.map((r: Record<string, unknown>) => ({
    url: (r.properties as Record<string, string>)?.url || r.url || "",
    width: (r.properties as Record<string, number>)?.width || 0,
    height: (r.properties as Record<string, number>)?.height || 0,
    title: (r.title as string) || "",
  }));
}

export async function downloadImage(imageUrl: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;
const MAX_IMAGES_PER_ENTITY = 3;

export async function downloadImagesForEntity(
  entity: string,
  downloadPath: string,
  onLog?: (msg: string) => void
): Promise<string[]> {
  const savedPaths: string[] = [];

  try {
    const images = await searchImages(entity);
    onLog?.(`[IMG] ${entity}: ${images.length} encontradas`);

    const valid = images.filter((img) => img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT);
    onLog?.(`[IMG] ${entity}: ${valid.length} válidas (>= ${MIN_WIDTH}x${MIN_HEIGHT})`);

    let index = 1;
    for (const img of valid) {
      if (savedPaths.length >= MAX_IMAGES_PER_ENTITY) break;

      const sanitized = sanitizeFilename(entity);
      let filename = `${sanitized}_${String(index).padStart(2, "0")}.jpg`;
      let fullPath = path.join(downloadPath, filename);

      while (fs.existsSync(fullPath)) {
        index++;
        filename = `${sanitized}_${String(index).padStart(2, "0")}.jpg`;
        fullPath = path.join(downloadPath, filename);
      }

      const ok = await downloadImage(img.url, fullPath);
      if (ok) {
        savedPaths.push(filename);
        onLog?.(`[DOWNLOAD] ${filename} OK`);
        index++;
      }
    }

    if (savedPaths.length === 0) {
      onLog?.(`[IMG] ${entity}: nenhuma imagem válida baixada`);
    }
  } catch (err) {
    onLog?.(`[IMG] ${entity}: erro - ${err instanceof Error ? err.message : String(err)}`);
  }

  return savedPaths;
}
