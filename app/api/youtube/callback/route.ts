import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { oauthClient } from "@/lib/youtube/oauth";
import { encryptToken } from "@/lib/youtube/crypto";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.split("; ").find(v => v.startsWith("yt_oauth_state="))?.split("=").slice(1).join("=");
  const clear = NextResponse.redirect(new URL("/", url.origin));
  clear.cookies.set("yt_oauth_state", "", { path: "/", maxAge: 0 });
  if (!user || !state || !cookieState || state !== decodeURIComponent(cookieState)) {
    return NextResponse.redirect(new URL("/?youtube_error=OAuth%20session%20expired.%20Please%20try%20again.", url.origin));
  }
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?youtube_error=YouTube%20authorization%20was%20cancelled.", url.origin));
  try {
    const oauth = oauthClient();
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) throw new Error("Google did not return a refresh token. Revoke app access in Google Account and connect again.");
    oauth.setCredentials(tokens);
    const youtube = google.youtube({ version: "v3", auth: oauth });
    const result = await youtube.channels.list({ part: ["snippet"], mine: true });
    const channel = result.data.items?.[0];
    if (!channel?.id) throw new Error("No YouTube channel was found on this Google account.");
    const encrypted = encryptToken(tokens.refresh_token);
    const { error } = await supabase.from("youtube_connections").upsert({
      user_id: user.id, channel_id: channel.id, channel_title: channel.snippet?.title || "YouTube Channel",
      channel_thumbnail: channel.snippet?.thumbnails?.default?.url || null, ...encrypted, updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return clear;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube connection failed.";
    return NextResponse.redirect(new URL("/?youtube_error=" + encodeURIComponent(message), url.origin));
  }
}