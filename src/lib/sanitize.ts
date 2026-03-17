export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function generateImageFilename(entity: string, index: number): string {
  const sanitized = sanitizeFilename(entity);
  const padded = String(index).padStart(2, "0");
  return `${sanitized}_${padded}.jpg`;
}
