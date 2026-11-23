import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: connection, error }, { data: uploads }] = await Promise.all([
    supabase.from("youtube_connections").select("channel_id,channel_title,channel_thumbnail,connected_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("video_uploads").select("id,youtube_video_id,title,privacy_status,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8)
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection, uploads: uploads || [] });
}