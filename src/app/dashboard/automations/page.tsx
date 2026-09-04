import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TRIGGER_LABEL: Record<string, string> = {
  dm_keyword: "Palavra-chave na DM",
  comment_keyword: "Palavra-chave no comentário",
  story_reply: "Resposta a story",
  new_dm: "Toda nova DM",
};

export default async function AutomationsPage() {
  const supabase = await createClient();
  const { data: automations } = await supabase
    .from("automations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Automações</h1>
        <Link
          href="/dashboard/automations/new"
          className="rounded-md bg-ink px-4 py-2 text-sm text-paper transition hover:bg-signal"
        >
          Nova automação
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(automations ?? []).map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-md border border-line bg-white p-5"
          >
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="mt-1 text-sm text-ink/60">
                {TRIGGER_LABEL[a.trigger_type]}
                {a.trigger_value ? ` — "${a.trigger_value}"` : ""}
                {a.ai_qualify ? " · qualificação por IA" : ""}
              </p>
            </div>
            <span
              className={`rounded-sm px-2 py-1 text-xs ${
                a.is_active ? "bg-signalSoft text-signal" : "bg-line/40 text-ink/50"
              }`}
            >
              {a.is_active ? "Ativa" : "Pausada"}
            </span>
          </div>
        ))}

        {(!automations || automations.length === 0) && (
          <p className="rounded-md border border-dashed border-line p-10 text-center text-ink/50">
            Nenhuma automação criada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
