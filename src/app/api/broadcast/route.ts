import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendDirectMessage, renderTemplate } from "@/lib/instagram";
import type { IgAccount } from "@/lib/types";

const bodySchema = z.object({
  ig_account_id: z.string().uuid(),
  message: z.string().min(1),
  // filtro opcional por status de lead (ex: só "qualificado")
  lead_status: z.string().optional(),
});

// Importante: a Meta só permite mensagens fora de templates aprovados dentro da
// janela de 24h após a última interação do usuário (política "24-hour messaging window").
// Por isso filtramos por last_interaction_at aqui — enviar fora da janela derruba a conta.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { ig_account_id, message, lead_status } = parsed.data;

  const supabase = await createClient();

  const { data: igAccount } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("id", ig_account_id)
    .single<IgAccount>();

  if (!igAccount) {
    return NextResponse.json({ error: "Conta do Instagram não encontrada" }, { status: 404 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("ig_account_id", ig_account_id)
    .gte("last_interaction_at", twentyFourHoursAgo)
    .limit(5000); // teto imposto pela própria Meta pra esse tipo de envio

  if (lead_status) query = query.eq("lead_status", lead_status);

  const { data: contacts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const results = { sent: 0, failed: 0 };

  for (const contact of contacts ?? []) {
    try {
      const text = renderTemplate(message, { username: contact.username ?? "" });
      await sendDirectMessage({
        pageAccessToken: igAccount.access_token,
        igsid: contact.ig_scoped_id,
        text,
      });
      await supabase.from("messages").insert({
        contact_id: contact.id,
        direction: "outbound",
        source: "dm",
        content: text,
      });
      results.sent++;
    } catch (err) {
      console.error("[broadcast] falha ao enviar para", contact.id, err);
      results.failed++;
    }
  }

  return NextResponse.json({ ...results, eligible: contacts?.length ?? 0 });
}
