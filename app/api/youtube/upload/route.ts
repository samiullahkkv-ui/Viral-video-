import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { oauthClient } from "@/lib/youtube/oauth";
import { decryptToken } from "@/lib/youtube/crypto";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("video");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "");
  const tags = String(form.get("tags") || "").split(",").map(v => v.trim()).filter(Boolean).slice(0, 30);
  const privacyStatus = String(form.get("privacyStatus") || "private");
  if (!(file instanceof File) || !file.size || !file.type.startsWith("video/")) return NextResponse.json({ error: "Choose a valid video file." }, { status: 400 });
  if (!title || title.length > 100) return NextResponse.json({ error: "Title is required and must be 100 characters or fewer." }, { status: 400 });
  if (!["private", "unlisted", "public"].includes(privacyStatus)) return NextResponse.json({ error: "Invalid privacy setting." }, { status: 400 });
  if (file.size > 64 * 1024 * 1024) return NextResponse.json({ error: "This first version supports videos up to 64 MB per upload." }, { status: 413 });
  const { data: connection, error } = await supabase.from("youtube_connections").select("encrypted_refresh_token,token_iv,token_tag").eq("user_id", user.id).single();
  if (error || !connection) return NextResponse.json({ error: "Connect your YouTube channel first." }, { status: 400 });
  try {
    const oauth = oauthClient();
    oauth.setCredentials({ refresh_token: decryptToken(connection.encrypted_refresh_token, connection.token_iv, connection.token_tag) });
    const youtube = google.youtube({ version: "v3", auth: oauth });
    const stream = Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream);
    const result = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: { snippet: { title, description, tags, categoryId: "28" }, status: { privacyStatus } },
      media: { body: stream }
    });
    const videoId = result.data.id;
    if (!videoId) throw new Error("YouTube did not return a video ID.");
    const { error: saveError } = await supabase.from("video_uploads").insert({
      user_id: user.id, youtube_video_id: videoId, title, description, privacy_status: privacyStatus, status: "uploaded"
    });
    if (saveError) throw saveError;
    return NextResponse.json({ ok: true, videoId, url: "https://youtube.com/watch?v=" + videoId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}