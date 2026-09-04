import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  qualificando: "Qualificando",
  qualificado: "Qualificado",
  descartado: "Descartado",
  cliente: "Cliente",
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .order("engagement_score", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-display text-3xl">Leads</h1>
      <p className="mt-1 text-sm text-ink/60">
        Ranqueados por engajamento — quem mais interagiu aparece primeiro.
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink/50">
            <th className="py-2 font-normal">Contato</th>
            <th className="py-2 font-normal">Status</th>
            <th className="py-2 font-normal">Engajamento</th>
            <th className="py-2 font-normal">Tags</th>
            <th className="py-2 font-normal">Última interação</th>
          </tr>
        </thead>
        <tbody>
          {(contacts ?? []).map((c) => (
            <tr key={c.id} className="border-b border-line/60">
              <td className="py-3">@{c.username ?? c.ig_scoped_id.slice(0, 8)}</td>
              <td className="py-3">
                <span className="rounded-sm bg-signalSoft px-2 py-1 text-signal">
                  {STATUS_LABEL[c.lead_status] ?? c.lead_status}
                </span>
              </td>
              <td className="py-3">{c.engagement_score}</td>
              <td className="py-3 text-ink/60">{(c.tags ?? []).join(", ") || "—"}</td>
              <td className="py-3 text-ink/60">
                {new Date(c.last_interaction_at).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
          {(!contacts || contacts.length === 0) && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-ink/50">
                Nenhum lead ainda. Assim que alguém interagir com sua conta, aparece aqui.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
