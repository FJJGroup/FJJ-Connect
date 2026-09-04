import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <span className="text-sm uppercase tracking-wide text-signal">FJJ-Connect</span>
      <h1 className="font-display text-5xl leading-tight">
        Sua conversa no Instagram, respondida antes que o interesse esfrie.
      </h1>
      <p className="max-w-xl text-lg text-ink/70">
        Conecte sua conta Business, defina regras de resposta e deixe a IA separar
        quem está pronto pra comprar de quem só está curioso.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-ink px-5 py-3 text-paper transition hover:bg-signal"
        >
          Entrar
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-line px-5 py-3 transition hover:border-ink"
        >
          Ver dashboard
        </Link>
      </div>
    </main>
  );
}
