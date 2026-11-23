import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const videoId = String(body.videoId || "");
  const title = String(body.title || "").trim();
  const description = String(body.description || "");
  const privacyStatus = String(body.privacyStatus || "private");
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId) || !title) {
    return NextResponse.json({ error: "Invalid completed upload details." }, { status: 400 });
  }
  const { error } = await supabase.from("video_uploads").insert({
    user_id: user.id, youtube_video_id: videoId, title, description, privacy_status: privacyStatus, status: "uploaded"
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, url: "https://youtube.com/watch?v=" + videoId });
}