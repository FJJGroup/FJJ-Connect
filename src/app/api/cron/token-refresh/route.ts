import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Tokens de página de longa duração da Meta duram ~60 dias. Chame essa rota
// diariamente (ex: Vercel Cron) protegida por CRON_SECRET, e alerte o usuário
// quando um token estiver perto de expirar (a Meta não renova automaticamente
// sem o usuário re-autenticar).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiringSoon } = await db
    .from("ig_accounts")
    .select("id, ig_username, owner_id, token_expires_at")
    .lte("token_expires_at", sevenDaysFromNow)
    .eq("is_active", true);

  // Aqui entraria a lógica de notificação (e-mail/DM interna) avisando o dono
  // da conta que precisa reconectar em /dashboard/settings.
  console.log("[cron/token-refresh] contas com token expirando em breve:", expiringSoon);

  return NextResponse.json({ expiringSoon: expiringSoon?.length ?? 0 });
}
