import { createServiceClient } from "./supabase/server";
import { sendDirectMessage, renderTemplate } from "./instagram";
import { qualifyLead } from "./ai";
import type { Automation, IgAccount } from "./types";

interface IncomingEvent {
  igAccount: IgAccount;
  igsid: string; // id do contato no Instagram (IGSID)
  username?: string;
  text: string;
  source: "dm" | "comment" | "story_reply" | "mention";
}

/** Ponto de entrada chamado pelo webhook para cada evento recebido da Meta. */
export async function handleIncomingEvent(event: IncomingEvent) {
  const db = createServiceClient();

  // 1. upsert do contato
  const { data: contact, error: contactErr } = await db
    .from("contacts")
    .upsert(
      {
        ig_account_id: event.igAccount.id,
        ig_scoped_id: event.igsid,
        username: event.username ?? null,
        last_interaction_at: new Date().toISOString(),
      },
      { onConflict: "ig_account_id,ig_scoped_id" }
    )
    .select()
    .single();

  if (contactErr || !contact) {
    console.error("[automation-engine] falha ao salvar contato", contactErr);
    return;
  }

  // 2. registra a mensagem recebida
  await db.from("messages").insert({
    contact_id: contact.id,
    direction: "inbound",
    source: event.source,
    content: event.text,
  });

  // 3. sobe o engagement_score (alimenta o ranking de seguidores)
  await db
    .from("contacts")
    .update({ engagement_score: (contact.engagement_score ?? 0) + 1 })
    .eq("id", contact.id);

  // 4. busca automações ativas dessa conta compatíveis com o tipo de evento
  const { data: automations } = await db
    .from("automations")
    .select("*")
    .eq("ig_account_id", event.igAccount.id)
    .eq("is_active", true);

  const triggerTypeForSource: Record<IncomingEvent["source"], Automation["trigger_type"][]> = {
    dm: ["dm_keyword", "new_dm"],
    comment: ["comment_keyword"],
    story_reply: ["story_reply"],
    mention: ["comment_keyword"],
  };

  const candidates = (automations ?? []).filter((a: Automation) =>
    triggerTypeForSource[event.source].includes(a.trigger_type)
  );

  for (const automation of candidates) {
    const matches =
      automation.trigger_type === "new_dm" ||
      automation.trigger_type === "story_reply" ||
      (automation.trigger_value &&
        event.text.toLowerCase().includes(automation.trigger_value.toLowerCase()));

    if (!matches) continue;

    await runAutomation({ automation, contact, igAccount: event.igAccount });
    // Só a primeira automação compatível dispara, pra evitar spam de múltiplas DMs no mesmo evento.
    break;
  }
}

async function runAutomation(params: {
  automation: Automation;
  contact: { id: string; username: string | null; engagement_score: number };
  igAccount: IgAccount;
}) {
  const db = createServiceClient();
  const { automation, contact, igAccount } = params;

  try {
    const replyText = renderTemplate(automation.reply_template, {
      username: contact.username ?? "",
    });

    await sendDirectMessage({
      pageAccessToken: igAccount.access_token,
      igsid: contact.id,
      text: replyText,
    });

    await db.from("messages").insert({
      contact_id: contact.id,
      direction: "outbound",
      source: "dm",
      content: replyText,
    });

    // Qualificação por IA (opcional, ligada por automação)
    if (automation.ai_qualify) {
      const { data: history } = await db
        .from("messages")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: true });

      const result = await qualifyLead({
        history: history ?? [],
        customInstruction: automation.qualification_prompt,
      });

      await db
        .from("contacts")
        .update({
          lead_status: result.status,
          tags: result.tags,
          engagement_score: contact.engagement_score + result.score_delta,
        })
        .eq("id", contact.id);

      if (result.suggested_reply) {
        await sendDirectMessage({
          pageAccessToken: igAccount.access_token,
          igsid: contact.id,
          text: result.suggested_reply,
        });
        await db.from("messages").insert({
          contact_id: contact.id,
          direction: "outbound",
          source: "dm",
          content: result.suggested_reply,
        });
      }
    }

    await db.from("automation_runs").insert({
      automation_id: automation.id,
      contact_id: contact.id,
      status: "success",
    });
  } catch (err) {
    console.error("[automation-engine] erro ao rodar automação", automation.id, err);
    await db.from("automation_runs").insert({
      automation_id: automation.id,
      contact_id: contact.id,
      status: "failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
