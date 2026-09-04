"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-3xl">Entrar no FJJ-Connect</h1>

      {sent ? (
        <p className="rounded-md bg-signalSoft p-4 text-sm text-signal">
          Te mandamos um link de acesso para {email}. Confira sua caixa de entrada.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-line bg-white px-4 py-3"
          />
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-3 text-paper transition hover:bg-signal"
          >
            Enviar link de acesso
          </button>
          {error && <p className="text-sm text-alert">{error}</p>}
        </form>
      )}
    </main>
  );
}
