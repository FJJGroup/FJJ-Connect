import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FJJ-Connect — Automação de Instagram",
  description: "Responda DMs, qualifique leads e feche vendas automaticamente no Instagram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">{children}</body>
    </html>
  );
}
