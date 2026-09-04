import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { handleIncomingEvent } from "@/lib/automation-engine";
import type { InstagramWebhookPayload } from "@/lib/types";

// 1. Verificação do webhook (a Meta chama isso uma vez, ao salvar a URL no painel do app).
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// 2. Recebimento de eventos reais (mensagens, comentários) da Meta.
export async function POST(req: NextRequest) {
  const payload = (await req.json()) as InstagramWebhookPayload;

  // Responder rápido (a Meta espera 200 em poucos segundos) e processar em seguida.
  // Em produção, considere mover isso para uma fila (ex: Supabase Queue, Upstash QStash).
  processPayload(payload).catch((err) =>
    console.error("[webhook/instagram] erro no processamento assíncrono", err)
  );

  return NextResponse.json({ received: true });
}

async function processPayload(payload: InstagramWebhookPayload) {
  if (payload.object !== "instagram") return;
  const db = createServiceClient();

  for (const entry of payload.entry) {
    const { data: igAccount } = await db
      .from("ig_accounts")
      .select("*")
      .eq("ig_business_id", entry.id)
      .eq("is_active", true)
      .single();

    if (!igAccount) {
      console.warn("[webhook/instagram] conta não conectada no FJJ-Connect:", entry.id);
      continue;
    }

    // Mensagens diretas
    for (const messaging of entry.messaging ?? []) {
      if (!messaging.message?.text) continue;
      await handleIncomingEvent({
        igAccount,
        igsid: messaging.sender.id,
        text: messaging.message.text,
        source: "dm",
      });
    }

    // Comentários e menções (formato "changes")
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const value = change.value as { from?: { id: string; username?: string }; text?: string };
      if (!value.from || !value.text) continue;

      await handleIncomingEvent({
        igAccount,
        igsid: value.from.id,
        username: value.from.username,
        text: value.text,
        source: "comment",
      });
    }
  }
}
