import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOTICIA_AI",
  description: "Sistema de Geração de Scripts e Imagens a partir de Notícias RSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
