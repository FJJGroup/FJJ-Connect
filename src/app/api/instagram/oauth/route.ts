import { NextResponse } from "next/server";

// Passo 1 do OAuth: manda o usuário pro diálogo de permissões da Meta.
// Botão "Conectar Instagram" no dashboard aponta pra essa rota.
export async function GET() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/oauth/callback`;
  const scopes = [
    "instagram_basic",
    "instagram_manage_messages",
    "instagram_manage_comments",
    "pages_show_list",
    "pages_messaging",
  ].join(",");

  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code`;

  return NextResponse.redirect(authUrl);
}
