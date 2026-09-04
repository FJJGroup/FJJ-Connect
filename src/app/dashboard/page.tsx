import { createClient } from "@/lib/supabase/server";

export default async function DashboardOverview() {
  const supabase = await createClient();

  const [{ count: totalLeads }, { count: qualified }, { count: automations }] =
    await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("lead_status", "qualificado"),
      supabase
        .from("automations")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

  const cards = [
    { label: "Contatos capturados", value: totalLeads ?? 0 },
    { label: "Leads qualificados", value: qualified ?? 0 },
    { label: "Automações ativas", value: automations ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Visão geral</h1>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-md border border-line bg-white p-6">
            <p className="text-sm text-ink/60">{card.label}</p>
            <p className="mt-2 font-display text-4xl">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
