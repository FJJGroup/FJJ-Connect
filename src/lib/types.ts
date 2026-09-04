export type TriggerType = "dm_keyword" | "comment_keyword" | "story_reply" | "new_dm";
export type LeadStatus = "novo" | "qualificando" | "qualificado" | "descartado" | "cliente";

export interface IgAccount {
  id: string;
  owner_id: string;
  ig_business_id: string;
  ig_username: string | null;
  page_id: string;
  access_token: string;
  token_expires_at: string | null;
  is_active: boolean;
}

export interface Contact {
  id: string;
  ig_account_id: string;
  ig_scoped_id: string;
  username: string | null;
  profile_pic_url: string | null;
  last_interaction_at: string;
  engagement_score: number;
  lead_status: LeadStatus;
  tags: string[];
}

export interface Automation {
  id: string;
  ig_account_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_value: string | null;
  reply_template: string;
  ai_qualify: boolean;
  qualification_prompt: string | null;
  is_active: boolean;
}

export interface MessageRecord {
  id: string;
  contact_id: string;
  direction: "inbound" | "outbound";
  source: "dm" | "comment" | "story_reply" | "mention";
  content: string;
  created_at: string;
}

// Formato (simplificado) do payload que a Meta envia no webhook do Instagram Messaging.
export interface InstagramWebhookEntry {
  id: string; // ig_business_id
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: { mid: string; text?: string };
  }>;
  changes?: Array<{
    field: string;
    value: Record<string, unknown>;
  }>;
}

export interface InstagramWebhookPayload {
  object: "instagram";
  entry: InstagramWebhookEntry[];
}
