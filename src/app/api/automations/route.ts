import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  ig_account_id: z.string().uuid(),
  name: z.string().min(1),
  trigger_type: z.enum(["dm_keyword", "comment_keyword", "story_reply", "new_dm"]),
  trigger_value: z.string().nullable().optional(),
  reply_template: z.string().min(1),
  ai_qualify: z.boolean().default(false),
  qualification_prompt: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automations")
    .select("*, ig_accounts!inner(ig_username)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automations")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
