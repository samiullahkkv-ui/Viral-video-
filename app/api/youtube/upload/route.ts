import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { oauthClient } from "@/lib/youtube/oauth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "");
  const tags = Array.isArray(body.tags) ? body.tags.map((v: unknown) => String(v).trim()).filter(Boolean).slice(0, 30) : [];
  const contentType = String(body.contentType || "");
  const size = Number(body.size);
  const privacyStatus = String(body.privacyStatus || "private");

  if (!title || title.length > 100) return NextResponse.json({ error: "Title is required and must be 100 characters or fewer." }, { status: 400 });
  if (!contentType.startsWith("video/") || !Number.isSafeInteger(size) || size < 1) return NextResponse.json({ error: "Choose a valid video file." }, { status: 400 });
  if (!["private", "unlisted", "public"].includes(privacyStatus)) return NextResponse.json({ error: "Invalid privacy setting." }, { status: 400 });

  const { data: connection } = await supabase.from("youtube_connections")
    .select("encrypted_refresh_token,token_iv,token_tag").eq("user_id", user.id).single();
  if (!connection) return NextResponse.json({ error: "Connect your YouTube channel first." }, { status: 400 });

  try {
    const oauth = oauthClient();
    const { decryptToken } = await import("@/lib/youtube/crypto");
    oauth.setCredentials({ refresh_token: decryptToken(connection.encrypted_refresh_token, connection.token_iv, connection.token_tag) });
    const { token } = await oauth.getAccessToken();
    if (!token) throw new Error("Google could not issue an access token.");
    const response = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(size)
      },
      body: JSON.stringify({
        snippet: { title, description, tags, categoryId: "28" },
        status: { privacyStatus }
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`YouTube could not start the upload (${response.status}): ${detail.slice(0, 500)}`);
    }
    const uploadUrl = response.headers.get("location");
    if (!uploadUrl || !uploadUrl.startsWith("https://www.googleapis.com/upload/youtube/")) {
      throw new Error("YouTube did not return a valid resumable upload URL.");
    }
    return NextResponse.json({ uploadUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start YouTube upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}