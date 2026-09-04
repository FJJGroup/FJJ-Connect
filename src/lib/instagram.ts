// Wrapper fino sobre a Meta Graph API para o produto de Instagram Messaging.
// Docs: https://developers.facebook.com/docs/messenger-platform/instagram
//
// Pré-requisitos que o usuário precisa ter feito no painel da Meta antes disso funcionar:
//  1. Criar um App em developers.facebook.com (tipo "Business").
//  2. Adicionar o produto "Instagram" (Messaging) ao app.
//  3. Ter uma Página do Facebook conectada a uma conta Instagram Business/Creator.
//  4. Passar pelo App Review para os escopos: instagram_basic, instagram_manage_messages,
//     pages_messaging, pages_show_list.
//  5. Configurar o webhook (URL: /api/webhooks/instagram) com o campo "messages".

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class InstagramApiError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

async function graphFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${GRAPH_BASE}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new InstagramApiError(
      `Graph API error on ${path}: ${res.status}`,
      res.status,
      body
    );
  }
  return body;
}

/** Troca o "code" do OAuth redirect por um token de curta duração, depois estende para long-lived. */
export async function exchangeCodeForLongLivedToken(code: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/oauth/callback`;

  const shortLived = await graphFetch(
    `/oauth/access_token?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
  );

  const longLived = await graphFetch(
    `/oauth/access_token?grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${shortLived.access_token}`
  );

  return longLived as { access_token: string; expires_in: number };
}

/** Lista as Páginas do Facebook que o usuário administra, com a conta Instagram vinculada. */
export async function listManagedPagesWithInstagram(userAccessToken: string) {
  const data = await graphFetch(
    `/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}` +
      `&access_token=${userAccessToken}`
  );
  return data.data as Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username: string; profile_picture_url?: string };
  }>;
}

/** Envia uma DM para um contato (IGSID) dentro da janela de 24h, usando o token da Página. */
export async function sendDirectMessage(params: {
  pageAccessToken: string;
  igsid: string;
  text: string;
}) {
  return graphFetch(`/me/messages?access_token=${params.pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: params.igsid },
      message: { text: params.text },
    }),
  });
}

/** Responde publicamente a um comentário (usado no trigger comment_keyword antes de mandar a DM). */
export async function replyToComment(params: {
  pageAccessToken: string;
  commentId: string;
  message: string;
}) {
  return graphFetch(
    `/${params.commentId}/replies?access_token=${params.pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: params.message }),
    }
  );
}

/** Registra a assinatura do webhook 'messages' para a página (necessário uma vez por página). */
export async function subscribePageToWebhook(pageId: string, pageAccessToken: string) {
  return graphFetch(
    `/${pageId}/subscribed_apps?subscribed_fields=messages,comments&access_token=${pageAccessToken}`,
    { method: "POST" }
  );
}

/** Aplica variáveis simples ({{username}}) no template de resposta de uma automação. */
export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
