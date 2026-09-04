import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForLongLivedToken,
  listManagedPagesWithInstagram,
  subscribePageToWebhook,
} from "@/lib/instagram";

// Passo 2 do OAuth: a Meta redireciona pra cá com um "code". Trocamos por token,
// descobrimos a conta Instagram Business vinculada e salvamos no banco.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=missing_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login?redirect=/dashboard/settings`);
  }

  try {
    const longLived = await exchangeCodeForLongLivedToken(code);
    const pages = await listManagedPagesWithInstagram(longLived.access_token);
    const pageWithIg = pages.find((p) => p.instagram_business_account);

    if (!pageWithIg?.instagram_business_account) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/settings?error=no_instagram_business_account`
      );
    }

    await subscribePageToWebhook(pageWithIg.id, pageWithIg.access_token);

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();

    await supabase.from("ig_accounts").upsert(
      {
        owner_id: user.id,
        ig_business_id: pageWithIg.instagram_business_account.id,
        ig_username: pageWithIg.instagram_business_account.username,
        page_id: pageWithIg.id,
        access_token: pageWithIg.access_token,
        token_expires_at: expiresAt,
        is_active: true,
      },
      { onConflict: "ig_business_id" }
    );

    return NextResponse.redirect(`${appUrl}/dashboard/settings?connected=1`);
  } catch (err) {
    console.error("[oauth/callback] falha ao conectar Instagram", err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=oauth_failed`);
  }
}
