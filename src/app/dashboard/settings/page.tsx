import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("ig_accounts").select("*");

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Conexão com o Instagram</h1>

      {connected && (
        <p className="mt-4 rounded-md bg-signalSoft p-4 text-sm text-signal">
          Conta conectada com sucesso.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-alert/10 p-4 text-sm text-alert">
          Não foi possível conectar: {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(accounts ?? []).map((acc) => (
          <div key={acc.id} className="rounded-md border border-line bg-white p-5">
            <p className="font-medium">@{acc.ig_username}</p>
            <p className="mt-1 text-xs text-ink/50">ID: {acc.id}</p>
            <p className="mt-1 text-sm text-ink/60">
              Token expira em{" "}
              {acc.token_expires_at
                ? new Date(acc.token_expires_at).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </div>
        ))}
      </div>

      <a
        href="/api/instagram/oauth"
        className="mt-6 inline-block rounded-md bg-ink px-5 py-3 text-paper transition hover:bg-signal"
      >
        Conectar conta do Instagram
      </a>

      <p className="mt-4 text-sm text-ink/50">
        Pré-requisito: sua conta Instagram precisa ser Business ou Creator e estar
        vinculada a uma Página do Facebook. O app usado aqui precisa ter passado pelo
        App Review da Meta para os escopos de mensagens.
      </p>
    </div>
  );
}
