import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("*")
    .order("engagement_score", { ascending: false })
    .limit(200);

  if (status) query = query.eq("lead_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
